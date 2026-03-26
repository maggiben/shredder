import { BadGatewayException, BadRequestException, Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Candle } from "@shredder/core";
import { buildSimulationMetrics, runSimulationLedger } from "@shredder/backtest";
import { resolveBinanceSpotBaseUrl, type Exchange } from "@shredder/exchanges";
import {
  INDICATOR_METADATA,
  type IndicatorMeta,
  computeIndicator as computeMigrIndicator,
  coreCandlesToOhlcvMatrix,
  isIndicatorImplemented,
  listIndicatorIds,
  serializeIndicatorResult,
} from "@shredder/indicators";
import { DefaultRiskEngine } from "@shredder/risk";
import { createStrategyById } from "@shredder/strategies";
import { BINANCE_EXCHANGE } from "../exchanges/exchange.tokens";
import type { BinanceKlineInterval } from "./dto/klines-query.dto";
import type { IndicatorComputeBodyDto } from "./dto/indicator-compute-body.dto";
import type { SimulationBodyDto } from "./dto/simulation-body.dto";

export type KlineCandleDto = {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
};

@Injectable()
export class MarketService {
  constructor(
    private readonly config: ConfigService,
    @Optional() @Inject(BINANCE_EXCHANGE) private readonly exchange: Exchange | null,
  ) {}

  private baseUrl(): string {
    const explicit = this.config.get<string>("BINANCE_BASE_URL")?.trim();
    return resolveBinanceSpotBaseUrl(explicit || undefined);
  }

  listIndicatorsCatalog(): { indicators: ({ id: string } & IndicatorMeta)[] } {
    return {
      indicators: listIndicatorIds().map((id) => {
        const meta = INDICATOR_METADATA[id]!;
        return { id, ...meta };
      }),
    };
  }

  private intervalMs(interval: BinanceKlineInterval): number {
    switch (interval) {
      case "1m":
        return 60_000;
      case "3m":
        return 3 * 60_000;
      case "5m":
        return 5 * 60_000;
      case "15m":
        return 15 * 60_000;
      case "30m":
        return 30 * 60_000;
      case "1h":
        return 60 * 60_000;
      case "2h":
        return 2 * 60 * 60_000;
      case "4h":
        return 4 * 60 * 60_000;
      case "6h":
        return 6 * 60 * 60_000;
      case "8h":
        return 8 * 60 * 60_000;
      case "12h":
        return 12 * 60 * 60_000;
      case "1d":
        return 24 * 60 * 60_000;
      case "3d":
        return 3 * 24 * 60 * 60_000;
      case "1w":
        return 7 * 24 * 60 * 60_000;
      case "1M":
        // Binance uses calendar months; approximate for warmup estimation only.
        return 30 * 24 * 60 * 60_000;
      default:
        return 60 * 60_000;
    }
  }

  private sliceIndicatorTail(raw: unknown, tailLen: number): unknown {
    if (tailLen <= 0) {
      return raw;
    }
    if (raw instanceof Float64Array) {
      return raw.slice(Math.max(0, raw.length - tailLen));
    }
    if (Array.isArray(raw)) {
      return raw.map((v) => this.sliceIndicatorTail(v, tailLen));
    }
    if (raw !== null && typeof raw === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        out[k] = this.sliceIndicatorTail(v, tailLen);
      }
      return out;
    }
    return raw;
  }

  private indicatorWindowHasNaN(raw: unknown): boolean {
    if (raw instanceof Float64Array) {
      for (let i = 0; i < raw.length; i += 1) {
        if (Number.isNaN(raw[i])) return true;
      }
      return false;
    }
    if (Array.isArray(raw)) {
      return raw.some((v) => this.indicatorWindowHasNaN(v));
    }
    if (raw !== null && typeof raw === "object") {
      return Object.values(raw as Record<string, unknown>).some((v) => this.indicatorWindowHasNaN(v));
    }
    return false;
  }

  async computeIndicatorFromMarket(body: IndicatorComputeBodyDto): Promise<{
    baseUrl: string;
    symbol: string;
    interval: string;
    indicatorId: string;
    candleCount: number;
    result: unknown;
  }> {
    if (!isIndicatorImplemented(body.indicatorId)) {
      throw new BadRequestException(`Unknown indicator: ${body.indicatorId}`);
    }
    const limit = body.limit ?? 200;
    const params = body.params ?? {};
    const sequential = Boolean(params["sequential"] ?? true);

    // If the user asks for a single latest value, warmup nulls don't surface in the response.
    // Still, allow start/end to select the market window for "latest".
    if (!sequential) {
      const kl = await this.getKlines({
        symbol: body.symbol,
        interval: body.interval,
        limit,
        ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
        ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
      });
      const candles = this.klinesToCandles(kl.candles);
      const matrix = coreCandlesToOhlcvMatrix(candles);
      const raw = computeMigrIndicator(body.indicatorId, matrix, { ...params, sequential: false });
      return {
        baseUrl: kl.baseUrl,
        symbol: kl.symbol,
        interval: kl.interval,
        indicatorId: body.indicatorId,
        candleCount: candles.length,
        result: serializeIndicatorResult(raw),
      };
    }

    // For sequential outputs: fetch extra warmup candles so the returned window has no NaNs (which stringify to null).
    // Two modes:
    // - No startTime provided: just fetch more history and return the last `limit` bars.
    // - startTime/endTime provided: treat them as the desired output window, but fetch additional history before startTime for warmup.
    const maxTotal = 1000;
    const desiredLen = Math.min(limit, maxTotal);
    const maxWarmup = Math.max(0, maxTotal - desiredLen);
    const step = Math.min(200, Math.max(50, Math.floor(desiredLen / 2)));

    let lastBaseUrl = this.baseUrl();
    let windowCandles: Candle[] = [];
    let rawWindow: unknown = null;

    for (let warmup = 0; warmup <= maxWarmup; warmup += step) {
      let candles: Candle[] = [];
      if (body.startTime !== undefined || body.endTime !== undefined) {
        // Output candles within requested bounds (or by limit + endTime).
        const outKl = await this.getKlines({
          symbol: body.symbol,
          interval: body.interval,
          limit: desiredLen,
          ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
          ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
        });
        lastBaseUrl = outKl.baseUrl;
        const outCandles = this.klinesToCandles(outKl.candles);

        // Warmup candles immediately before the output window.
        let warmCandles: Candle[] = [];
        if (warmup > 0 && outCandles.length > 0) {
          const outStart = outCandles[0]!.timestamp;
          const warmEnd = Math.max(0, outStart - this.intervalMs(body.interval));
          const warmKl = await this.getKlines({
            symbol: body.symbol,
            interval: body.interval,
            limit: warmup,
            endTime: warmEnd,
          });
          lastBaseUrl = warmKl.baseUrl;
          warmCandles = this.klinesToCandles(warmKl.candles);
        }

        candles = [...warmCandles, ...outCandles];
        windowCandles = outCandles;
      } else {
        const fetchLimit = Math.min(maxTotal, desiredLen + warmup);
        const kl = await this.getKlines({
          symbol: body.symbol,
          interval: body.interval,
          limit: fetchLimit,
        });
        lastBaseUrl = kl.baseUrl;
        candles = this.klinesToCandles(kl.candles);
        windowCandles = candles.slice(Math.max(0, candles.length - desiredLen));
      }

      if (candles.length === 0) {
        throw new BadRequestException("No candles returned for indicator compute");
      }

      const matrix = coreCandlesToOhlcvMatrix(candles);
      const rawFull = computeMigrIndicator(body.indicatorId, matrix, { ...params, sequential: true });
      rawWindow = this.sliceIndicatorTail(rawFull, windowCandles.length);

      if (!this.indicatorWindowHasNaN(rawWindow)) {
        break;
      }
    }

    return {
      baseUrl: lastBaseUrl,
      symbol: body.symbol,
      interval: body.interval,
      indicatorId: body.indicatorId,
      candleCount: windowCandles.length,
      result: serializeIndicatorResult(rawWindow),
    };
  }

  private klinesToCandles(candles: readonly KlineCandleDto[]): Candle[] {
    return candles.map((k) => ({
      timestamp: k.openTime,
      open: Number(k.open),
      high: Number(k.high),
      low: Number(k.low),
      close: Number(k.close),
      volume: Number(k.volume),
    }));
  }

  async getKlines(input: {
    symbol: string;
    interval: BinanceKlineInterval;
    limit: number;
    startTime?: number;
    endTime?: number;
  }): Promise<{ baseUrl: string; symbol: string; interval: BinanceKlineInterval; candles: KlineCandleDto[] }> {
    const base = this.baseUrl();
    const params = new URLSearchParams({
      symbol: input.symbol,
      interval: input.interval,
      limit: String(input.limit),
    });
    if (input.startTime !== undefined) {
      params.set("startTime", String(input.startTime));
    }
    if (input.endTime !== undefined) {
      params.set("endTime", String(input.endTime));
    }
    const url = `${base}/api/v3/klines?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400) {
        throw new BadRequestException(text || "Invalid klines request");
      }
      throw new BadGatewayException(`Binance klines failed: ${res.status} ${text}`);
    }
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) {
      throw new BadGatewayException("Binance klines: unexpected response shape");
    }
    const candles: KlineCandleDto[] = raw.map((row) => {
      if (!Array.isArray(row) || row.length < 7) {
        throw new BadGatewayException("Binance klines: malformed row");
      }
      return {
        openTime: Number(row[0]),
        open: String(row[1]),
        high: String(row[2]),
        low: String(row[3]),
        close: String(row[4]),
        volume: String(row[5]),
        closeTime: Number(row[6]),
      };
    });
    return {
      baseUrl: base,
      symbol: input.symbol,
      interval: input.interval,
      candles,
    };
  }

  private async resolveSimulationTakerFee(
    symbol: string,
    override?: number,
  ): Promise<{ takerFeeRate: number; source: "override" | "exchange" | "default" }> {
    if (override !== undefined && Number.isFinite(override)) {
      return { takerFeeRate: Math.max(0, override), source: "override" };
    }
    if (this.exchange) {
      try {
        const tf = await this.exchange.getTradeFee(symbol);
        return { takerFeeRate: tf.takerRate, source: "exchange" };
      } catch (error) {
        console.error("resolveSimulationTakerFee exchange failed", symbol, error);
      }
    }
    const raw = this.config.get<string>("DEFAULT_SIMULATION_TAKER_FEE_RATE")?.trim();
    const parsed = raw !== undefined && raw !== "" ? Number(raw) : NaN;
    const fallback = Number.isFinite(parsed) ? parsed : 0.001;
    return { takerFeeRate: fallback, source: "default" };
  }

  async runSimulation(body: SimulationBodyDto) {
    const limit = body.limit ?? 500;
    const kl = await this.getKlines({
      symbol: body.symbol,
      interval: body.interval,
      limit,
      ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
      ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
    });
    const candles = this.klinesToCandles(kl.candles);
    if (candles.length <= body.warmupBars) {
      throw new BadRequestException(
        `Need more candles than warmup (${body.warmupBars}). Got ${candles.length}. Lower warmup or increase limit.`,
      );
    }
    const strategies = body.strategyIds.map((id) => {
      const s = createStrategyById(id.trim());
      if (!s) {
        throw new BadRequestException(`Unknown strategy: ${id}`);
      }
      return s;
    });
    const feeInfo = await this.resolveSimulationTakerFee(body.symbol, body.takerFeeRate);
    const risk = new DefaultRiskEngine({
      maxNotionalFractionPerTrade: body.maxNotionalFractionPerTrade,
      maxDrawdownFraction: body.maxDrawdownFraction,
    });
    const result = runSimulationLedger({
      symbol: body.symbol,
      candles,
      strategies,
      initialCash: body.initialCash,
      deployFraction: body.deployFraction,
      warmupBars: body.warmupBars,
      risk,
      fee: {
        takerRate: feeInfo.takerFeeRate,
        resolveTakerFeeRate: () => feeInfo.takerFeeRate,
      },
    });
    const metrics = buildSimulationMetrics({
      initialCash: body.initialCash,
      warmupBars: body.warmupBars,
      candles,
      result,
    });
    return {
      baseUrl: kl.baseUrl,
      symbol: kl.symbol,
      interval: kl.interval,
      candleCount: candles.length,
      candles: kl.candles,
      metrics,
      signalStats: result.signalStats,
      rows: result.rows,
      feeModel: {
        takerFeeRate: feeInfo.takerFeeRate,
        source: feeInfo.source,
      },
    };
  }
}
