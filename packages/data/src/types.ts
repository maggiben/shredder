import type { Candle } from "@shredder/core";

/** Pluggable market data source (Polygon, Alpha Vantage, exchange REST, etc.). */
export interface MarketDataSource {
  getCandles(symbol: string, interval: string, limit: number): Promise<readonly Candle[]>;
}
