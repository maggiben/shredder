/**
 * The KDJ Oscillator
 *
 * :param candles: np.ndarray
 * :param fastk_period: int - default: 9
 * :param slowk_period: int - default: 3
 * :param slowk_matype: int - default: 0
 * :param slowd_period: int - default: 3
 * :param slowd_matype: int - default: 0
 * :param sequential: bool - default: False
 *
 * :return: KDJ(k, d, j)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { ma } from "./ma.js";

export type KDJ = { k: number | Float64Array; d: number | Float64Array; j: number | Float64Array };

function rollingMaxKdj(a: Float64Array, window: number): Float64Array {
  const n = a.length;
  const result = new Float64Array(n);
  if (n < window) {
    let acc = a[0]!;
    for (let i = 0; i < n; i += 1) {
      acc = Math.max(acc, a[i]!);
      result[i] = acc;
    }
    return result;
  }
  for (let i = 0; i < window - 1; i += 1) {
    let m = a[0]!;
    for (let k = 0; k <= i; k += 1) {
      m = Math.max(m, a[k]!);
    }
    result[i] = m;
  }
  for (let i = window - 1; i < n; i += 1) {
    let m = a[i - window + 1]!;
    for (let k = i - window + 2; k <= i; k += 1) {
      m = Math.max(m, a[k]!);
    }
    result[i] = m;
  }
  return result;
}

function rollingMinKdj(a: Float64Array, window: number): Float64Array {
  const n = a.length;
  const result = new Float64Array(n);
  if (n < window) {
    let acc = a[0]!;
    for (let i = 0; i < n; i += 1) {
      acc = Math.min(acc, a[i]!);
      result[i] = acc;
    }
    return result;
  }
  for (let i = 0; i < window - 1; i += 1) {
    let m = a[0]!;
    for (let k = 0; k <= i; k += 1) {
      m = Math.min(m, a[k]!);
    }
    result[i] = m;
  }
  for (let i = window - 1; i < n; i += 1) {
    let m = a[i - window + 1]!;
    for (let k = i - window + 2; k <= i; k += 1) {
      m = Math.min(m, a[k]!);
    }
    result[i] = m;
  }
  return result;
}

export function kdj(
  candles: OhlcvMatrix,
  fastkPeriod: number = 9,
  slowkPeriod: number = 3,
  slowkMatype: number = 0,
  slowdPeriod: number = 3,
  slowdMatype: number = 0,
  sequential: boolean = false,
): KDJ {
  if (slowkMatype === 24 || slowkMatype === 29 || slowdMatype === 24 || slowdMatype === 29) {
    throw new Error("VWMA (matype 24) and VWAP (matype 29) cannot be used in kdj indicator.");
  }
  const m = sliceCandles(candles, sequential);
  const candlesClose = column(m, 2);
  const candlesHigh = column(m, 3);
  const candlesLow = column(m, 4);
  const hh = rollingMaxKdj(candlesHigh, fastkPeriod);
  const ll = rollingMinKdj(candlesLow, fastkPeriod);
  const stoch = new Float64Array(candlesClose.length);
  for (let i = 0; i < candlesClose.length; i += 1) {
    const den = hh[i]! - ll[i]!;
    stoch[i] = den !== 0 ? (100 * (candlesClose[i]! - ll[i]!)) / den : 0;
  }
  const k = ma(stoch, slowkPeriod, slowkMatype, "close", true) as Float64Array;
  const d = ma(k, slowdPeriod, slowdMatype, "close", true) as Float64Array;
  const j = new Float64Array(k.length);
  for (let i = 0; i < k.length; i += 1) {
    j[i] = 3 * k[i]! - 2 * d[i]!;
  }
  if (sequential) {
    return { k, d, j };
  }
  const li = k.length - 1;
  return { k: k[li]!, d: d[li]!, j: j[li]! };
}
