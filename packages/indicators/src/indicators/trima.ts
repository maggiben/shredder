/*
 TRIMA - Triangular Moving Average

 :param candles: np.ndarray
 :param period: int - default: 30
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";

function trimaWeights(period: number): Float64Array {
  const weights: number[] = [];
  if (period % 2 !== 0) {
    const mid = Math.floor(period / 2);
    for (let i = 1; i <= mid + 1; i += 1) {
      weights.push(i);
    }
    for (let i = mid; i >= 1; i -= 1) {
      weights.push(i);
    }
  } else {
    const mid = period / 2;
    for (let i = 1; i <= mid; i += 1) {
      weights.push(i);
    }
    for (let i = mid; i >= 1; i -= 1) {
      weights.push(i);
    }
  }
  let s = 0;
  for (const w of weights) {
    s += w;
  }
  const out = new Float64Array(weights.length);
  for (let i = 0; i < weights.length; i += 1) {
    out[i] = weights[i]! / s;
  }
  return out;
}

export function trimaArray(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  if (n < period) {
    return res;
  }
  const wn = trimaWeights(period);
  for (let i = period - 1; i < n; i += 1) {
    let acc = 0;
    for (let j = 0; j < period; j += 1) {
      acc += source[i - period + 1 + j]! * wn[j]!;
    }
    res[i] = acc;
  }
  return res;
}

export function trima(
  candles: IndicatorCandles,
  period: number = 30,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const matrix = sliceCandles(candles, sequential);
    source = getCandleSource(matrix, sourceType);
  }
  const res = trimaArray(source, period);
  return sequential ? res : res[res.length - 1]!;
}
