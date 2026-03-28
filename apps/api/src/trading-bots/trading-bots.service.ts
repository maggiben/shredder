import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, type TradingBot, TradingBotStatus } from "@shredder/db";
import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import * as readline from "readline";
import { join } from "path";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateTradingBotDto } from "./dto/create-trading-bot.dto";
import type { TradingBotTickPayload } from "./trading-bot-tick-payload";
import type { UpdateTradingBotDto } from "./dto/update-trading-bot.dto";
import {
  applyTradingBotConfigPatch,
  normalizeTradingBotConfig,
  parseTradingBotConfig,
  type TradingBotConfigJson,
} from "./trading-bot-config";

const MAX_LOG_LINES = 500;

type RuntimeEntry = {
  readonly proc: ChildProcess;
  readonly lines: string[];
};

type CandleTrailRow = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type PaperTrailRow = {
  kind: "buy" | "sell";
  timestamp: number;
  price: number;
  quantity: number;
  fee: number;
  feeRate: number;
  tradeValue: number;
  cashAfter: number;
  positionQtyAfter: number;
  equityAfter: number;
};

type PrismaKnownRequestErrorLike = {
  code?: unknown;
  meta?: {
    modelName?: unknown;
    table?: unknown;
  };
};

@Injectable()
export class TradingBotsService implements OnModuleInit, OnModuleDestroy {
  private readonly runtime = new Map<string, RuntimeEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private isMissingTrailTablesError(error: unknown): boolean {
    if (typeof error !== "object" || error === null) {
      return false;
    }
    const e = error as PrismaKnownRequestErrorLike;
    if (e.code !== "P2021") {
      return false;
    }
    const table = typeof e.meta?.table === "string" ? e.meta.table : "";
    const modelName = typeof e.meta?.modelName === "string" ? e.meta.modelName : "";
    return (
      table.includes("trading_bot_candles") ||
      table.includes("trading_bot_paper_trades") ||
      modelName === "TradingBotCandle" ||
      modelName === "TradingBotPaperTrade"
    );
  }

  async onModuleInit(): Promise<void> {
    await this.prisma.tradingBot.updateMany({
      where: { status: { in: [TradingBotStatus.RUNNING, TradingBotStatus.STARTING] } },
      data: {
        status: TradingBotStatus.STOPPED,
        processPid: null,
        lastError: "API restarted; start bots again from the dashboard.",
      },
    });
  }

  async onModuleDestroy(): Promise<void> {
    for (const entry of this.runtime.values()) {
      entry.proc.kill("SIGTERM");
    }
    this.runtime.clear();
  }

  private workerEntryPath(): string {
    const explicit = this.config.get<string>("SHREDDER_WORKER_ENTRY")?.trim();
    if (explicit !== undefined && explicit !== "" && existsSync(explicit)) {
      return explicit;
    }
    const candidates = [
      join(process.cwd(), "apps/worker/dist/index.js"),
      join(process.cwd(), "worker/dist/index.js"),
      join(__dirname, "..", "..", "..", "worker", "dist", "index.js"),
    ];
    for (const p of candidates) {
      if (existsSync(p)) {
        return p;
      }
    }
    return candidates[0]!;
  }

  private buildChildEnv(botId: string, cfg: TradingBotConfigJson): NodeJS.ProcessEnv {
    const port = this.config.get<string>("PORT") ?? process.env["PORT"] ?? "3001";
    const publicHost =
      this.config.get<string>("TRADING_BOTS_API_PUBLIC_HOST")?.trim() ?? "127.0.0.1";
    const webhookBase = `http://${publicHost}:${port}`;
    const secret =
      this.config.get<string>("TRADING_BOTS_WEBHOOK_SECRET")?.trim() ??
      "development-only-shredder-bots-webhook";

    const record: Record<string, string> = {
      ...(process.env as Record<string, string>),
      WORKER_BOT_ID: botId,
      WORKER_OUTPUT_WEBHOOK_URL: `${webhookBase}/trading-bots/internal/tick`,
      WORKER_WEBHOOK_SECRET: secret,
      WORKER_SYMBOL: cfg.symbol,
      WORKER_TICK_MS: String(cfg.tickMs),
      WORKER_CANDLE_INTERVAL: cfg.candleInterval,
      WORKER_CANDLE_LIMIT: String(cfg.candleLimit),
      MARKET_DATA_PROVIDER: cfg.marketDataProvider,
      WORKER_EXCHANGE_ID: cfg.exchangeId,
      WORKER_PAPER_TRADING: cfg.paperTrading ? "1" : "0",
      WORKER_LOG_STRATEGIES: cfg.logStrategies ? "1" : "0",
      WORKER_AI_ANALYST: cfg.aiAnalyst ? "1" : "0",
      ESTIMATED_TAKER_FEE_RATE: String(cfg.estimatedTakerFeeRate),
    };

    if (cfg.binanceBaseUrl !== undefined && cfg.binanceBaseUrl !== "") {
      record["BINANCE_BASE_URL"] = cfg.binanceBaseUrl;
    }

    for (const [k, v] of Object.entries(cfg.extraEnv)) {
      record[k] = v;
    }

    return record as NodeJS.ProcessEnv;
  }

  private pushLine(botId: string, line: string, stream: "stdout" | "stderr"): void {
    const entry = this.runtime.get(botId);
    if (entry === undefined) {
      return;
    }
    const prefix = stream === "stderr" ? "[err] " : "";
    entry.lines.push(`${prefix}${line}`);
    if (entry.lines.length > MAX_LOG_LINES) {
      entry.lines.splice(0, entry.lines.length - MAX_LOG_LINES);
    }
  }

  private attachProcess(botId: string, proc: ChildProcess): void {
    this.runtime.set(botId, { proc, lines: [] });

    const out = proc.stdout;
    const err = proc.stderr;
    if (out !== null) {
      const rl = readline.createInterface({ input: out });
      rl.on("line", (line) => {
        this.pushLine(botId, line, "stdout");
      });
    }
    if (err !== null) {
      const rlErr = readline.createInterface({ input: err });
      rlErr.on("line", (line) => {
        this.pushLine(botId, line, "stderr");
      });
    }

    proc.on("exit", (code, signal) => {
      this.runtime.delete(botId);
      const tail =
        code !== null && code !== 0
          ? `Process exited with code ${code}`
          : signal !== null
            ? `Process killed (${signal})`
            : "Process exited";
      void this.prisma.tradingBot
        .update({
          where: { id: botId },
          data: {
            status: TradingBotStatus.STOPPED,
            processPid: null,
            lastError: tail,
          },
        })
        .catch(() => undefined);
    });

    proc.on("error", (e) => {
      this.pushLine(botId, String(e), "stderr");
      this.runtime.delete(botId);
      void this.prisma.tradingBot
        .update({
          where: { id: botId },
          data: {
            status: TradingBotStatus.ERROR,
            processPid: null,
            lastError: String(e),
          },
        })
        .catch(() => undefined);
    });
  }

  private async stopProcess(botId: string, reason?: string): Promise<void> {
    const entry = this.runtime.get(botId);
    if (entry !== undefined) {
      entry.proc.kill("SIGTERM");
      this.runtime.delete(botId);
    }
    await this.prisma.tradingBot.update({
      where: { id: botId },
      data: {
        status: TradingBotStatus.STOPPED,
        processPid: null,
        ...(reason !== undefined ? { lastError: reason } : {}),
      },
    });
  }

  private async ensureOwner(userId: string, botId: string): Promise<TradingBot> {
    const bot = await this.prisma.tradingBot.findFirst({ where: { id: botId, userId } });
    if (bot === null) {
      throw new NotFoundException("Trading bot not found");
    }
    return bot;
  }

  private marketTrailLimit(): number | null {
    const raw = Number(this.config.get<string>("TRADING_BOT_MARKET_TRAIL_LIMIT") ?? "");
    if (!Number.isFinite(raw) || raw <= 0) {
      return null;
    }
    return Math.floor(raw);
  }

  private paperTrailLimit(): number | null {
    const raw = Number(this.config.get<string>("TRADING_BOT_PAPER_TRAIL_LIMIT") ?? "");
    if (!Number.isFinite(raw) || raw <= 0) {
      return null;
    }
    return Math.floor(raw);
  }

  /** Hard cap for `/trading-bots/:id/trails` so the API never loads unbounded history into memory. */
  private trailsApiMaxCandles(): number {
    const raw = Number(this.config.get<string>("TRADING_BOT_TRAILS_API_MAX_CANDLES") ?? "4000");
    if (!Number.isFinite(raw) || raw <= 0) {
      return 4000;
    }
    return Math.min(100_000, Math.floor(raw));
  }

  private trailsApiMaxPaperTrades(): number {
    const raw = Number(this.config.get<string>("TRADING_BOT_TRAILS_API_MAX_PAPER_TRADES") ?? "8000");
    if (!Number.isFinite(raw) || raw <= 0) {
      return 8000;
    }
    return Math.min(200_000, Math.floor(raw));
  }

  private extractCandles(payload: TradingBotTickPayload): CandleTrailRow[] {
    return payload.candles
      .filter(
        (c) =>
          Number.isFinite(c.timestamp) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close) &&
          Number.isFinite(c.volume),
      )
      .map((c) => ({
        timestamp: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
  }

  private extractPaperEvents(payload: TradingBotTickPayload): PaperTrailRow[] {
    const ev = payload.paperTradeEvent;
    if (
      ev === undefined ||
      !Number.isFinite(ev.timestamp) ||
      !Number.isFinite(ev.price) ||
      !Number.isFinite(ev.quantity) ||
      !Number.isFinite(ev.fee) ||
      !Number.isFinite(ev.feeRate) ||
      !Number.isFinite(ev.tradeValue) ||
      !Number.isFinite(ev.cashAfter) ||
      !Number.isFinite(ev.positionQtyAfter) ||
      !Number.isFinite(ev.equityAfter) ||
      (ev.kind !== "buy" && ev.kind !== "sell")
    ) {
      return [];
    }
    return [
      {
        kind: ev.kind,
        timestamp: ev.timestamp,
        price: ev.price,
        quantity: ev.quantity,
        fee: ev.fee,
        feeRate: ev.feeRate,
        tradeValue: ev.tradeValue,
        cashAfter: ev.cashAfter,
        positionQtyAfter: ev.positionQtyAfter,
        equityAfter: ev.equityAfter,
      },
    ];
  }

  private async pruneMarketTrail(botId: string): Promise<void> {
    const limit = this.marketTrailLimit();
    if (limit === null) {
      return;
    }
    const stale = await this.prisma.tradingBotCandle.findMany({
      where: { botId },
      orderBy: [{ timestamp: "desc" }, { createdAt: "desc" }],
      skip: limit,
      take: 5000,
      select: { id: true },
    });
    if (stale.length === 0) {
      return;
    }
    await this.prisma.tradingBotCandle.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
    });
  }

  private async prunePaperTrail(botId: string): Promise<void> {
    const limit = this.paperTrailLimit();
    if (limit === null) {
      return;
    }
    const stale = await this.prisma.tradingBotPaperTrade.findMany({
      where: { botId },
      orderBy: [{ timestamp: "desc" }, { createdAt: "desc" }],
      skip: limit,
      take: 5000,
      select: { id: true },
    });
    if (stale.length === 0) {
      return;
    }
    await this.prisma.tradingBotPaperTrade.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
    });
  }

  async listForUser(userId: string) {
    const rows = await this.prisma.tradingBot.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => this.present(r));
  }

  async getForUser(userId: string, botId: string) {
    const bot = await this.ensureOwner(userId, botId);
    return this.present(bot);
  }

  private present(bot: TradingBot) {
    const cfg = parseTradingBotConfig(bot.config);
    const rt = this.runtime.get(bot.id);
    return {
      id: bot.id,
      name: bot.name,
      status: bot.status,
      config: cfg,
      processPid: bot.processPid,
      lastTickAt: bot.lastTickAt,
      lastOutput: bot.lastOutput,
      lastError: bot.lastError,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
      runtime: {
        alive: rt !== undefined,
        logTail: rt !== undefined ? rt.lines.slice(-80) : [],
      },
    };
  }

  async createForUser(userId: string, dto: CreateTradingBotDto) {
    const config = normalizeTradingBotConfig(dto);
    const bot = await this.prisma.tradingBot.create({
      data: {
        userId,
        name: dto.name.trim(),
        status: TradingBotStatus.STOPPED,
        config: config as Prisma.InputJsonValue,
      },
    });
    return this.present(bot);
  }

  async updateForUser(userId: string, botId: string, dto: UpdateTradingBotDto) {
    const bot = await this.ensureOwner(userId, botId);
    if (bot.status === TradingBotStatus.RUNNING || bot.status === TradingBotStatus.STARTING) {
      throw new BadRequestException("Stop the bot before updating configuration");
    }
    const current = parseTradingBotConfig(bot.config);
    const nextConfig = applyTradingBotConfigPatch(current, dto);
    const name = dto.name !== undefined && dto.name.trim() !== "" ? dto.name.trim() : bot.name;
    const updated = await this.prisma.tradingBot.update({
      where: { id: botId },
      data: {
        name,
        config: nextConfig as Prisma.InputJsonValue,
      },
    });
    return this.present(updated);
  }

  async deleteForUser(userId: string, botId: string) {
    await this.ensureOwner(userId, botId);
    await this.stopProcess(botId).catch(() => undefined);
    await this.prisma.tradingBot.delete({ where: { id: botId } });
    return { ok: true as const };
  }

  async startForUser(userId: string, botId: string) {
    const bot = await this.ensureOwner(userId, botId);
    if (this.runtime.has(bot.id)) {
      return this.present(bot);
    }

    const entryPath = this.workerEntryPath();
    if (!existsSync(entryPath)) {
      throw new BadRequestException(
        `Worker bundle not found at ${entryPath}. Build @shredder/worker or set SHREDDER_WORKER_ENTRY.`,
      );
    }

    const cfg = parseTradingBotConfig(bot.config);
    const env = this.buildChildEnv(bot.id, cfg);

    await this.prisma.tradingBot.update({
      where: { id: botId },
      data: { status: TradingBotStatus.STARTING, lastError: null },
    });

    try {
      const proc = spawn(process.execPath, [entryPath], {
        env,
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
      });
      this.attachProcess(bot.id, proc);
      await this.prisma.tradingBot.update({
        where: { id: botId },
        data: {
          status: TradingBotStatus.RUNNING,
          processPid: proc.pid ?? null,
          lastError: null,
        },
      });
      const refreshed = await this.prisma.tradingBot.findFirstOrThrow({ where: { id: botId } });
      return this.present(refreshed);
    } catch (e) {
      await this.prisma.tradingBot.update({
        where: { id: botId },
        data: {
          status: TradingBotStatus.ERROR,
          processPid: null,
          lastError: String(e),
        },
      });
      throw e;
    }
  }

  async stopForUser(userId: string, botId: string) {
    await this.ensureOwner(userId, botId);
    await this.stopProcess(botId);
    const refreshed = await this.prisma.tradingBot.findFirstOrThrow({ where: { id: botId } });
    return this.present(refreshed);
  }

  async logsForUser(userId: string, botId: string) {
    await this.ensureOwner(userId, botId);
    const rt = this.runtime.get(botId);
    return { lines: rt !== undefined ? rt.lines : [] };
  }

  async trailsForUser(userId: string, botId: string) {
    await this.ensureOwner(userId, botId);
    const maxCandles = this.trailsApiMaxCandles();
    const maxPaper = this.trailsApiMaxPaperTrades();
    let candles: Awaited<ReturnType<typeof this.prisma.tradingBotCandle.findMany>>;
    let paperTrades: Awaited<ReturnType<typeof this.prisma.tradingBotPaperTrade.findMany>>;
    try {
      [candles, paperTrades] = await Promise.all([
        this.prisma.tradingBotCandle.findMany({
          where: { botId },
          orderBy: { timestamp: "desc" },
          take: maxCandles,
        }),
        this.prisma.tradingBotPaperTrade.findMany({
          where: { botId },
          orderBy: { timestamp: "desc" },
          take: maxPaper,
        }),
      ]);
    } catch (error) {
      if (this.isMissingTrailTablesError(error)) {
        return { marketTrail: [], paperTrail: [] };
      }
      throw error;
    }
    candles.reverse();
    paperTrades.reverse();
    return {
      marketTrail: candles.map((c) => ({
        timestamp: Number(c.timestamp),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume),
      })),
      paperTrail: paperTrades.map((t) => ({
        kind: t.kind.toLowerCase() === "sell" ? "sell" : "buy",
        timestamp: Number(t.timestamp),
        price: Number(t.price),
        quantity: Number(t.quantity ?? 0),
        fee: Number(t.fee ?? 0),
        feeRate: Number(t.feeRate ?? 0),
        tradeValue: Number(t.tradeValue ?? 0),
        cashAfter: Number(t.cashAfter ?? 0),
        positionQtyAfter: Number(t.positionQtyAfter ?? 0),
        equityAfter: Number(t.equityAfter ?? 0),
      })),
    };
  }

  async handleTickReport(botId: string, payload: TradingBotTickPayload): Promise<void> {
    const row = await this.prisma.tradingBot.findUnique({ where: { id: botId } });
    if (row === null) {
      return;
    }
    const candleTrail = this.extractCandles(payload);
    const paperTrail = this.extractPaperEvents(payload);
    const { candles: _candles, ...lastOutput } = payload;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.tradingBot.update({
          where: { id: botId },
          data: {
            lastTickAt: new Date(),
            lastOutput: lastOutput as Prisma.InputJsonValue,
            lastError: null,
            status: TradingBotStatus.RUNNING,
          },
        });

        if (candleTrail.length > 0) {
          await tx.tradingBotCandle.createMany({
            data: candleTrail.map((c) => ({
              botId,
              timestamp: BigInt(Math.round(c.timestamp)),
              open: new Prisma.Decimal(c.open),
              high: new Prisma.Decimal(c.high),
              low: new Prisma.Decimal(c.low),
              close: new Prisma.Decimal(c.close),
              volume: new Prisma.Decimal(c.volume),
            })),
            skipDuplicates: true,
          });
        }

        if (paperTrail.length > 0) {
          await tx.tradingBotPaperTrade.createMany({
            data: paperTrail.map((t) => ({
              botId,
              kind: t.kind,
              timestamp: BigInt(Math.round(t.timestamp)),
              price: new Prisma.Decimal(t.price),
              quantity: new Prisma.Decimal(t.quantity),
              fee: new Prisma.Decimal(t.fee),
              feeRate: new Prisma.Decimal(t.feeRate),
              tradeValue: new Prisma.Decimal(t.tradeValue),
              cashAfter: new Prisma.Decimal(t.cashAfter),
              positionQtyAfter: new Prisma.Decimal(t.positionQtyAfter),
              equityAfter: new Prisma.Decimal(t.equityAfter),
            })),
          });
        }
      });

      await Promise.all([this.pruneMarketTrail(botId), this.prunePaperTrail(botId)]);
    } catch (error) {
      if (!this.isMissingTrailTablesError(error)) {
        throw error;
      }

      await this.prisma.tradingBot.update({
        where: { id: botId },
        data: {
          lastTickAt: new Date(),
          lastOutput: lastOutput as Prisma.InputJsonValue,
          lastError: null,
          status: TradingBotStatus.RUNNING,
        },
      });
    }
  }
}
