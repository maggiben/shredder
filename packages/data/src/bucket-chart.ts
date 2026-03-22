import type { Candle } from "@shredder/core";

function sortPairs(pairs: readonly [number, number][]): [number, number][] {
  return [...pairs].sort((a, b) => a[0] - b[0]);
}

/**
 * Aggregates CoinGecko `market_chart` price points into OHLCV buckets.
 * Volume uses `total_volumes` points summed into the same bucket (by timestamp).
 */
export function bucketChartToCandles(
  prices: readonly [number, number][],
  volumes: readonly [number, number][],
  intervalMs: number,
  limit: number,
): Candle[] {
  if (limit < 1) {
    return [];
  }
  if (prices.length === 0) {
    return [];
  }

  const sortedP = sortPairs(prices);
  const sortedV = sortPairs(volumes);

  type Agg = { open: number; high: number; low: number; close: number; vol: number };
  const buckets = new Map<number, Agg>();

  for (const [ts, price] of sortedP) {
    const start = Math.floor(ts / intervalMs) * intervalMs;
    const cur = buckets.get(start);
    if (!cur) {
      buckets.set(start, {
        open: price,
        high: price,
        low: price,
        close: price,
        vol: 0,
      });
    } else {
      cur.high = Math.max(cur.high, price);
      cur.low = Math.min(cur.low, price);
      cur.close = price;
    }
  }

  for (const [ts, vol] of sortedV) {
    const start = Math.floor(ts / intervalMs) * intervalMs;
    const agg = buckets.get(start);
    if (agg) {
      agg.vol += vol;
    }
  }

  const ordered = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  const candles: Candle[] = ordered.map(([timestamp, a]) => ({
    timestamp,
    open: a.open,
    high: a.high,
    low: a.low,
    close: a.close,
    volume: a.vol,
  }));

  if (candles.length <= limit) {
    return candles;
  }
  return candles.slice(-limit);
}
