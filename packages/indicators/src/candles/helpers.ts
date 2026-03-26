import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource as getCandleSourceInner, type CandleSourceType } from "./candle-source.js";
import { shift } from "../series/series.js";

/** Default recent-bar window when `sequential` is false (warmup trim). */
export const DEFAULT_WARMUP_CANDLES = 240;

export function getCandleSource(candles: OhlcvMatrix, sourceType: string = "close"): Float64Array {
  return getCandleSourceInner(candles, sourceType as CandleSourceType);
}

export function sliceCandles(candles: OhlcvMatrix, sequential: boolean): OhlcvMatrix {
  if (!sequential && candles.length > DEFAULT_WARMUP_CANDLES) {
    return candles.slice(-DEFAULT_WARMUP_CANDLES);
  }
  return candles;
}

/**
 * Pads a shorter series with leading NaNs so it matches a longer reference length.
 */
export function sameLength(bigger: OhlcvMatrix | Float64Array, shorter: Float64Array): Float64Array {
  const targetLen = bigger instanceof Float64Array ? bigger.length : bigger.length;
  const pad = targetLen - shorter.length;
  if (pad <= 0) {
    return shorter;
  }
  const out = new Float64Array(targetLen);
  out.fill(Number.NaN, 0, pad);
  out.set(shorter, pad);
  return out;
}

export function lenShape(candles: IndicatorCandles): number {
  return candles.length;
}

/** Positive `periods` lags the series (earlier indices become NaN). */
export function npShift(source: Float64Array, periods: number, _fillValue: number = Number.NaN): Float64Array {
  return shift(source, periods);
}

/**
 * Resolves price/source series: 1D arrays pass through; 2D candles are sliced then sourced by column.
 */
export function resolveSourceSeries(
  candles: IndicatorCandles,
  sequential: boolean,
  sourceType: string = "close",
): Float64Array {
  if (isCandles1D(candles)) {
    return candles;
  }
  const m = sliceCandles(candles, sequential);
  return getCandleSource(m, sourceType);
}
