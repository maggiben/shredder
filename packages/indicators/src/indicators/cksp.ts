/**
 * Chande Kroll Stop (CKSP)
 *
 * :param candles: np.ndarray
 * :param p: int - default: 10 (ATR period)
 * :param x: float - default: 1.0 (ATR multiplier)
 * :param q: int - default: 9 (rolling window period)
 * :param sequential: bool - default: False
 *
 * :return: CKSP namedtuple containing long and short values
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export type CKSP = { long: number | Float64Array; short: number | Float64Array };

function atrCksp(high: Float64Array, low: Float64Array, close: Float64Array, timeperiod: number): Float64Array {
  const n = close.length;
  const tr = new Float64Array(n);
  tr[0] = high[0]! - low[0]!;
  for (let i = 1; i < n; i += 1) {
    const diff1 = high[i]! - low[i]!;
    const diff2 = Math.abs(high[i]! - close[i - 1]!);
    const diff3 = Math.abs(low[i]! - close[i - 1]!);
    tr[i] = Math.max(diff1, diff2, diff3);
  }
  const atrVals = new Float64Array(n);
  if (n < timeperiod) {
    atrVals.fill(Number.NaN);
    return atrVals;
  }
  for (let i = 0; i < timeperiod - 1; i += 1) {
    atrVals[i] = Number.NaN;
  }
  let sumInit = 0;
  for (let i = 0; i < timeperiod; i += 1) {
    sumInit += tr[i]!;
  }
  atrVals[timeperiod - 1] = sumInit / timeperiod;
  for (let i = timeperiod; i < n; i += 1) {
    atrVals[i] = (atrVals[i - 1]! * (timeperiod - 1) + tr[i]!) / timeperiod;
  }
  return atrVals;
}

function rollingMaxCksp(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const result = new Float64Array(n);
  if (window <= 1) {
    return arr.slice();
  }
  for (let i = 0; i < window - 1; i += 1) {
    let m = arr[0]!;
    for (let k = 0; k <= i; k += 1) {
      m = Math.max(m, arr[k]!);
    }
    result[i] = m;
  }
  for (let i = window - 1; i < n; i += 1) {
    let m = arr[i - window + 1]!;
    for (let k = i - window + 2; k <= i; k += 1) {
      m = Math.max(m, arr[k]!);
    }
    result[i] = m;
  }
  return result;
}

function rollingMinCksp(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const result = new Float64Array(n);
  if (window <= 1) {
    return arr.slice();
  }
  for (let i = 0; i < window - 1; i += 1) {
    let m = arr[0]!;
    for (let k = 0; k <= i; k += 1) {
      m = Math.min(m, arr[k]!);
    }
    result[i] = m;
  }
  for (let i = window - 1; i < n; i += 1) {
    let m = arr[i - window + 1]!;
    for (let k = i - window + 2; k <= i; k += 1) {
      m = Math.min(m, arr[k]!);
    }
    result[i] = m;
  }
  return result;
}

export function cksp(
  candles: OhlcvMatrix,
  p: number = 10,
  x: number = 1.0,
  q: number = 9,
  sequential: boolean = false,
): CKSP {
  const m = sliceCandles(candles, sequential);
  const close = column(m, 2);
  const high = column(m, 3);
  const low = column(m, 4);
  const atrVals = atrCksp(high, low, close, p);
  const LS0 = new Float64Array(close.length);
  const rMaxH = rollingMaxCksp(high, q);
  for (let i = 0; i < close.length; i += 1) {
    LS0[i] = rMaxH[i]! - x * atrVals[i]!;
  }
  const LS = rollingMaxCksp(LS0, q);
  const SS0 = new Float64Array(close.length);
  const rMinL = rollingMinCksp(low, q);
  for (let i = 0; i < close.length; i += 1) {
    SS0[i] = rMinL[i]! + x * atrVals[i]!;
  }
  const SS = rollingMinCksp(SS0, q);
  if (sequential) {
    return { long: LS, short: SS };
  }
  const li = close.length - 1;
  return { long: LS[li]!, short: SS[li]! };
}
