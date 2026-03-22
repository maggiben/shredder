import type { Candle } from "@shredder/core";

export function closesFrom(candles: readonly Candle[]): number[] {
  return candles.map((c) => c.close);
}

export function ohlcFrom(candles: readonly Candle[]): {
  highs: number[];
  lows: number[];
  closes: number[];
} {
  return {
    highs: candles.map((c) => c.high),
    lows: candles.map((c) => c.low),
    closes: candles.map((c) => c.close),
  };
}
