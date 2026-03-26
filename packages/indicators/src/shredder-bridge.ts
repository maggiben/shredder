import type { Candle } from "@shredder/core";
import type { OhlcvMatrix, OhlcvRow } from "./types.js";

/**
 * Maps Shredder {@link Candle} bars to the package OHLCV matrix layout:
 * each row is `[timestamp, open, close, high, low, volume]` (indices 0–5).
 */
export function coreCandlesToOhlcvMatrix(candles: readonly Candle[]): OhlcvMatrix {
  const out: OhlcvRow[] = new Array(candles.length);
  for (let i = 0; i < candles.length; i += 1) {
    const c = candles[i]!;
    out[i] = new Float64Array([c.timestamp, c.open, c.close, c.high, c.low, c.volume]);
  }
  return out;
}
