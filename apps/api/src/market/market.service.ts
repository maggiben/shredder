import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Candle } from "@shredder/core";
import { buildSimulationMetrics, runSimulationLedger } from "@shredder/backtest";
import { resolveBinanceSpotBaseUrl } from "@shredder/exchanges";
import { DefaultRiskEngine } from "@shredder/risk";
import { createStrategyById } from "@shredder/strategies";
import type { BinanceKlineInterval } from "./dto/klines-query.dto";
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
  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    const explicit = this.config.get<string>("BINANCE_BASE_URL")?.trim();
    return resolveBinanceSpotBaseUrl(explicit || undefined);
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
      metrics,
      signalStats: result.signalStats,
      rows: result.rows,
    };
  }
}
