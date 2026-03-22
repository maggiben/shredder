import type { MarketDataSource } from "./types.js";

export function isMarketDataSource(value: unknown): value is MarketDataSource {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("getCandles" in value)) {
    return false;
  }
  return typeof (value as MarketDataSource).getCandles === "function";
}
