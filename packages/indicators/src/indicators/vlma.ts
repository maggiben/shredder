/*
 Variable Length Moving Average

 :param candles: np.ndarray
 :param min_period: int - default: 5
 :param max_period: int - default: 50
 :param matype: int - default: 0
 :param devtype: int - default: 0
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { ma } from "./ma.js";
import { mean_ad } from "./mean_ad.js";
import { median_ad } from "./median_ad.js";

function movingStdVlma(source: Float64Array, window: number): Float64Array {
  const n = source.length;
  const stdArr = new Float64Array(n);
  if (n < window) {
    let cumsum = 0;
    let cumsum2 = 0;
    for (let i = 0; i < n; i += 1) {
      cumsum += source[i]!;
      cumsum2 += source[i]! * source[i]!;
      const counts = i + 1;
      const means = cumsum / counts;
      const variances = cumsum2 / counts - means * means;
      stdArr[i] = Math.sqrt(Math.max(variances, 0));
    }
    return stdArr;
  }
  for (let i = 0; i < window - 1; i += 1) {
    let cumsum = 0;
    let cumsum2 = 0;
    for (let j = 0; j <= i; j += 1) {
      cumsum += source[j]!;
      cumsum2 += source[j]! * source[j]!;
    }
    const counts = i + 1;
    const means = cumsum / counts;
    const variances = cumsum2 / counts - means * means;
    stdArr[i] = Math.sqrt(Math.max(variances, 0));
  }
  for (let i = window - 1; i < n; i += 1) {
    let mean = 0;
    for (let j = i + 1 - window; j <= i; j += 1) {
      mean += source[j]!;
    }
    mean /= window;
    let variance = 0;
    for (let j = i + 1 - window; j <= i; j += 1) {
      const d = source[j]! - mean;
      variance += d * d;
    }
    stdArr[i] = Math.sqrt(variance / window);
  }
  return stdArr;
}

function vlmaFast(
  source: Float64Array,
  a: Float64Array,
  b: Float64Array,
  c: Float64Array,
  d: Float64Array,
  minPeriod: number,
  maxPeriod: number,
): Float64Array {
  const newseries = new Float64Array(source.length);
  newseries.set(source);
  const period = new Float64Array(source.length);
  for (let i = 1; i < source.length; i += 1) {
    const nzPeriod = period[i - 1]! !== 0 ? period[i - 1]! : maxPeriod;
    let pnext: number;
    if (b[i]! <= source[i]! && source[i]! <= c[i]!) {
      pnext = nzPeriod + 1;
    } else if (source[i]! < a[i]! || source[i]! > d[i]!) {
      pnext = nzPeriod - 1;
    } else {
      pnext = nzPeriod;
    }
    period[i] = Math.max(Math.min(pnext, maxPeriod), minPeriod);
    const sc = 2 / (period[i]! + 1);
    newseries[i] = source[i]! * sc + (1 - sc) * newseries[i - 1]!;
  }
  return newseries;
}

export function vlma(
  candles: IndicatorCandles,
  minPeriod: number = 5,
  maxPeriod: number = 50,
  matype: number = 0,
  devtype: number = 0,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  let matrix: OhlcvMatrix | null = null;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    matrix = sliceCandles(candles, sequential) as OhlcvMatrix;
    source = getCandleSource(matrix, sourceType);
  }
  let mean: Float64Array;
  if (matrix !== null && (matype === 24 || matype === 29)) {
    mean = ma(matrix, maxPeriod, matype, sourceType, true) as Float64Array;
  } else {
    mean = ma(source, maxPeriod, matype, "close", true) as Float64Array;
  }
  let stdDev: Float64Array;
  if (devtype === 0) {
    stdDev = movingStdVlma(source, maxPeriod);
  } else if (devtype === 1) {
    stdDev = mean_ad(source, maxPeriod, "hl2", true) as Float64Array;
  } else if (devtype === 2) {
    stdDev = median_ad(source, maxPeriod, "hl2", true) as Float64Array;
  } else {
    throw new Error("vlma: devtype must be 0, 1, or 2");
  }
  const a = new Float64Array(source.length);
  const b = new Float64Array(source.length);
  const c = new Float64Array(source.length);
  const d = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const m = mean[i]!;
    const s = stdDev[i]!;
    a[i] = m - 1.75 * s;
    b[i] = m - 0.25 * s;
    c[i] = m + 0.25 * s;
    d[i] = m + 1.75 * s;
  }
  const res = vlmaFast(source, a, b, c, d, minPeriod, maxPeriod);
  return sequential ? res : res[res.length - 1]!;
}
