/*
 Polarized Fractal Efficiency (PFE)

 :param candles: np.ndarray
 :param period: int - default: 10
 :param smoothing: int - default: 5
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries, sameLength } from "../candles/helpers.js";
import { ema } from "./ema.js";

function diffNth(source: Float64Array, n: number): Float64Array {
  let x = source;
  for (let k = 0; k < n; k += 1) {
    const m = x.length - 1;
    if (m <= 0) {
      return new Float64Array(0);
    }
    const y = new Float64Array(m);
    for (let i = 0; i < m; i += 1) {
      y[i] = x[i + 1]! - x[i]!;
    }
    x = y;
  }
  return x;
}

function rollingSum(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const sumResult = new Float64Array(n - window + 1);
  for (let i = 0; i <= n - window; i += 1) {
    let s = 0;
    for (let j = 0; j < window; j += 1) {
      s += arr[i + j]!;
    }
    sumResult[i] = s;
  }
  return sameLength(arr, sumResult);
}

export function pfe(
  candles: IndicatorCandles,
  period: number = 10,
  smoothing: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const ln = period - 1;
  const diff = diffNth(source, ln);
  const a = new Float64Array(diff.length);
  for (let i = 0; i < diff.length; i += 1) {
    a[i] = Math.sqrt(diff[i]! * diff[i]! + period * period);
  }
  const diff1Len = source.length - 1;
  const diff1 = new Float64Array(diff1Len);
  for (let i = 0; i < diff1Len; i += 1) {
    diff1[i] = source[i + 1]! - source[i]!;
  }
  const sqrtTerm = new Float64Array(diff1Len);
  for (let i = 0; i < diff1Len; i += 1) {
    sqrtTerm[i] = Math.sqrt(1 + diff1[i]! * diff1[i]!);
  }
  const b = rollingSum(sqrtTerm, ln);
  const aPad = sameLength(source, a);
  const bPad = sameLength(source, b);
  const pfetmp = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const av = aPad[i]!;
    const bv = bPad[i]!;
    let v = Number.NaN;
    if (!Number.isNaN(av) && !Number.isNaN(bv) && bv !== 0) {
      v = (100 * av) / bv;
    }
    pfetmp[i] = Number.isNaN(v) ? 0 : v;
  }
  const diffPad = sameLength(source, diff);
  const signed = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const d = diffPad[i]!;
    signed[i] = (Number.isNaN(d) ? 0 : d > 0 ? 1 : -1) * pfetmp[i]!;
  }
  return ema(signed, smoothing, "close", sequential);
}
