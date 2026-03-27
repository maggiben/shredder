import type { Candle } from "@shredder/core";
import { resolveBinanceSpotBaseUrl } from "@shredder/exchanges";
import type { MarketDataSource } from "./types.js";

export type BinanceKlinesMarketDataSourceConfig = {
  /** When omitted, uses {@link resolveBinanceSpotBaseUrl} (env / testnet default). */
  readonly baseUrl?: string;
};

function mapRowsToCandles(raw: unknown): Candle[] {
  if (!Array.isArray(raw)) {
    throw new Error("Binance klines: unexpected response shape");
  }
  return raw.map((row) => {
    if (!Array.isArray(row) || row.length < 7) {
      throw new Error("Binance klines: malformed row");
    }
    return {
      timestamp: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    };
  });
}

/**
 * Public Spot klines (`GET /api/v3/klines`). No API key required.
 */
export function createBinanceKlinesMarketDataSource(
  config: BinanceKlinesMarketDataSourceConfig = {},
): MarketDataSource {
  const base = resolveBinanceSpotBaseUrl(config.baseUrl);
  return {
    async getCandles(symbol: string, interval: string, limit: number): Promise<readonly Candle[]> {
      const params = new URLSearchParams({
        symbol: symbol.trim().toUpperCase(),
        interval: interval.trim(),
        limit: String(Math.max(1, Math.floor(limit))),
      });
      const url = `${base}/api/v3/klines?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Binance klines failed: ${res.status} ${text}`);
      }
      const raw = (await res.json()) as unknown;
      return mapRowsToCandles(raw);
    },
  };
}
