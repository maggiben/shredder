/*
 SuperTrend indicator optimized with numba and loop-based calculations.
 :param candles: np.ndarray - candle data
 :param period: period for ATR calculation
 :param factor: multiplier for the bands
 :param sequential: if True, returns full arrays; else, returns last value
 :return: SuperTrend named tuple with trend and changed arrays/values
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";

export type SupertrendResult =
  | { readonly trend: number; readonly changed: number }
  | { readonly trend: Float64Array; readonly changed: Float64Array };

function atrLoop(high: Float64Array, low: Float64Array, close: Float64Array, period: number): Float64Array {
  const n = close.length;
  const tr = new Float64Array(n);
  tr[0] = high[0]! - low[0]!;
  for (let i = 1; i < n; i += 1) {
    const diff1 = high[i]! - low[i]!;
    const diff2 = Math.abs(high[i]! - close[i - 1]!);
    const diff3 = Math.abs(low[i]! - close[i - 1]!);
    tr[i] = Math.max(diff1, diff2, diff3);
  }
  const atr = new Float64Array(n);
  atr.fill(Number.NaN);
  if (n < period) {
    return atr;
  }
  let sumInit = 0;
  for (let i = 0; i < period; i += 1) {
    sumInit += tr[i]!;
  }
  atr[period - 1] = sumInit / period;
  for (let i = period; i < n; i += 1) {
    atr[i] = (atr[i - 1]! * (period - 1) + tr[i]!) / period;
  }
  return atr;
}

function supertrendFast(
  candles: OhlcvMatrix,
  atrArr: Float64Array,
  factor: number,
  period: number,
): { trend: Float64Array; changed: Float64Array } {
  const n = candles.length;
  const superTrend = new Float64Array(n);
  const changed = new Float64Array(n);
  const upperBasic = new Float64Array(n);
  const lowerBasic = new Float64Array(n);
  const upperBand = new Float64Array(n);
  const lowerBand = new Float64Array(n);

  for (let i = 0; i < n; i += 1) {
    const row = candles[i]!;
    const mid = (row[3]! + row[4]!) / 2.0;
    upperBasic[i] = mid + factor * atrArr[i]!;
    lowerBasic[i] = mid - factor * atrArr[i]!;
    upperBand[i] = upperBasic[i]!;
    lowerBand[i] = lowerBasic[i]!;
  }

  const idx = period - 1;
  if (n <= idx) {
    return { trend: superTrend, changed };
  }
  if (candles[idx]![2]! <= upperBand[idx]!) {
    superTrend[idx] = upperBand[idx]!;
  } else {
    superTrend[idx] = lowerBand[idx]!;
  }
  changed[idx] = 0;

  for (let i = period; i < n; i += 1) {
    const p = i - 1;
    const prevClose = candles[p]![2]!;
    if (prevClose <= upperBand[p]!) {
      if (upperBasic[i]! < upperBand[p]!) {
        upperBand[i] = upperBasic[i]!;
      } else {
        upperBand[i] = upperBand[p]!;
      }
    } else {
      upperBand[i] = upperBasic[i]!;
    }
    if (prevClose >= lowerBand[p]!) {
      if (lowerBasic[i]! > lowerBand[p]!) {
        lowerBand[i] = lowerBasic[i]!;
      } else {
        lowerBand[i] = lowerBand[p]!;
      }
    } else {
      lowerBand[i] = lowerBasic[i]!;
    }

    if (superTrend[p]! === upperBand[p]!) {
      if (candles[i]![2]! <= upperBand[i]!) {
        superTrend[i] = upperBand[i]!;
        changed[i] = 0;
      } else {
        superTrend[i] = lowerBand[i]!;
        changed[i] = 1;
      }
    } else {
      if (candles[i]![2]! >= lowerBand[i]!) {
        superTrend[i] = lowerBand[i]!;
        changed[i] = 0;
      } else {
        superTrend[i] = upperBand[i]!;
        changed[i] = 1;
      }
    }
  }
  return { trend: superTrend, changed };
}

export function supertrend(
  candles: IndicatorCandles,
  period: number = 10,
  factor: number = 3,
  sequential: boolean = false,
): SupertrendResult {
  if (isCandles1D(candles)) {
    throw new Error("supertrend requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const high = new Float64Array(m.length);
  const low = new Float64Array(m.length);
  const close = new Float64Array(m.length);
  for (let i = 0; i < m.length; i += 1) {
    high[i] = m[i]![3]!;
    low[i] = m[i]![4]!;
    close[i] = m[i]![2]!;
  }
  const atrArr = atrLoop(high, low, close, period);
  const { trend, changed } = supertrendFast(m, atrArr, factor, period);
  if (sequential) {
    return { trend, changed };
  }
  const li = trend.length - 1;
  return { trend: trend[li]!, changed: changed[li]! };
}
