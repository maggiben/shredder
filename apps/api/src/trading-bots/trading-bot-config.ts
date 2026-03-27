import type { CreateTradingBotDto } from "./dto/create-trading-bot.dto";
import type { UpdateTradingBotDto } from "./dto/update-trading-bot.dto";
import type { Prisma } from "@shredder/db";

export type TradingBotConfigJson = {
  readonly symbol: string;
  readonly tickMs: number;
  readonly candleInterval: string;
  readonly candleLimit: number;
  readonly marketDataProvider: "demo" | "coingecko" | "binance";
  readonly exchangeId: "binance" | "none";
  readonly paperTrading: boolean;
  readonly binanceBaseUrl?: string;
  readonly logStrategies: boolean;
  readonly aiAnalyst: boolean;
  readonly estimatedTakerFeeRate: number;
  readonly extraEnv: Record<string, string>;
};

type CoerceInput = {
  symbol?: string;
  tickMs?: number;
  candleInterval?: string;
  candleLimit?: number;
  marketDataProvider?: "demo" | "coingecko" | "binance";
  exchangeId?: "binance" | "none";
  paperTrading?: boolean;
  binanceBaseUrl?: string;
  logStrategies?: boolean;
  aiAnalyst?: boolean;
  estimatedTakerFeeRate?: number;
  extraEnv?: Record<string, string>;
};

export function coerceTradingBotConfig(input: CoerceInput): TradingBotConfigJson {
  return {
    symbol: (input.symbol ?? "BTCUSDT").trim().toUpperCase(),
    tickMs: input.tickMs ?? 15_000,
    candleInterval: (input.candleInterval ?? "15m").trim(),
    candleLimit: input.candleLimit ?? 50,
    marketDataProvider: input.marketDataProvider ?? "demo",
    exchangeId: input.exchangeId ?? "binance",
    paperTrading: input.paperTrading ?? true,
    ...(input.binanceBaseUrl !== undefined && input.binanceBaseUrl !== ""
      ? { binanceBaseUrl: input.binanceBaseUrl.trim() }
      : {}),
    logStrategies: input.logStrategies ?? false,
    aiAnalyst: input.aiAnalyst ?? false,
    estimatedTakerFeeRate:
      input.estimatedTakerFeeRate !== undefined && Number.isFinite(input.estimatedTakerFeeRate)
        ? input.estimatedTakerFeeRate
        : 0.001,
    extraEnv: input.extraEnv ?? {},
  };
}

export function normalizeTradingBotConfig(dto: CreateTradingBotDto): TradingBotConfigJson {
  return coerceTradingBotConfig(dto);
}

export function applyTradingBotConfigPatch(
  current: TradingBotConfigJson,
  patch: UpdateTradingBotDto,
): TradingBotConfigJson {
  const input: CoerceInput = {
    symbol: patch.symbol ?? current.symbol,
    tickMs: patch.tickMs ?? current.tickMs,
    candleInterval: patch.candleInterval ?? current.candleInterval,
    candleLimit: patch.candleLimit ?? current.candleLimit,
    marketDataProvider: patch.marketDataProvider ?? current.marketDataProvider,
    exchangeId: patch.exchangeId ?? current.exchangeId,
    paperTrading: patch.paperTrading ?? current.paperTrading,
    logStrategies: patch.logStrategies ?? current.logStrategies,
    aiAnalyst: patch.aiAnalyst ?? current.aiAnalyst,
    estimatedTakerFeeRate: patch.estimatedTakerFeeRate ?? current.estimatedTakerFeeRate,
    extraEnv: patch.extraEnv ?? current.extraEnv,
  };
  if (patch.binanceBaseUrl !== undefined) {
    if (patch.binanceBaseUrl !== "") {
      input.binanceBaseUrl = patch.binanceBaseUrl;
    }
  } else if (current.binanceBaseUrl !== undefined) {
    input.binanceBaseUrl = current.binanceBaseUrl;
  }
  return coerceTradingBotConfig(input);
}

export function parseTradingBotConfig(raw: Prisma.JsonValue): TradingBotConfigJson {
  if (raw === null || Array.isArray(raw) || typeof raw !== "object") {
    throw new Error("Invalid bot config in database");
  }
  const o = raw as Prisma.JsonObject;
  const input: CoerceInput = {};
  if (typeof o["symbol"] === "string") {
    input.symbol = o["symbol"];
  }
  if (typeof o["tickMs"] === "number") {
    input.tickMs = o["tickMs"];
  }
  if (typeof o["candleInterval"] === "string") {
    input.candleInterval = o["candleInterval"];
  }
  if (typeof o["candleLimit"] === "number") {
    input.candleLimit = o["candleLimit"];
  }
  if (
    o["marketDataProvider"] === "demo" ||
    o["marketDataProvider"] === "coingecko" ||
    o["marketDataProvider"] === "binance"
  ) {
    input.marketDataProvider = o["marketDataProvider"];
  }
  if (o["exchangeId"] === "binance" || o["exchangeId"] === "none") {
    input.exchangeId = o["exchangeId"];
  }
  if (typeof o["paperTrading"] === "boolean") {
    input.paperTrading = o["paperTrading"];
  }
  if (typeof o["binanceBaseUrl"] === "string") {
    input.binanceBaseUrl = o["binanceBaseUrl"];
  }
  if (typeof o["logStrategies"] === "boolean") {
    input.logStrategies = o["logStrategies"];
  }
  if (typeof o["aiAnalyst"] === "boolean") {
    input.aiAnalyst = o["aiAnalyst"];
  }
  if (typeof o["estimatedTakerFeeRate"] === "number") {
    input.estimatedTakerFeeRate = o["estimatedTakerFeeRate"];
  }
  if (o["extraEnv"] !== null && typeof o["extraEnv"] === "object" && !Array.isArray(o["extraEnv"])) {
    const extraEnvObject = o["extraEnv"] as Prisma.JsonObject;
    const parsedExtraEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(extraEnvObject)) {
      if (typeof value === "string") {
        parsedExtraEnv[key] = value;
      }
    }
    input.extraEnv = parsedExtraEnv;
  }
  return coerceTradingBotConfig(input);
}
