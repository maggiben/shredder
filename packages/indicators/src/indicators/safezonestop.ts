/*
 Safezone Stops - Numba optimized version

 :param candles: np.ndarray
 :param period: int - default: 22
 :param mult: float - default: 2.5
 :param max_lookback: int - default: 3
 :param direction: str - default: long
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { npShift, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

function wilderSmoothing(raw: Float64Array, period: number): Float64Array {
  const smoothed = new Float64Array(raw.length);
  const alpha = 1 - 1 / period;
  smoothed[0] = raw[0]!;
  for (let i = 1; i < raw.length; i += 1) {
    smoothed[i] = alpha * smoothed[i - 1]! + raw[i]!;
  }
  return smoothed;
}

function rollingMax(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const result = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    if (i < window - 1) {
      let mx = arr[0]!;
      for (let j = 1; j <= i; j += 1) {
        mx = Math.max(mx, arr[j]!);
      }
      result[i] = mx;
    } else {
      let mx = arr[i - window + 1]!;
      for (let j = i - window + 2; j <= i; j += 1) {
        mx = Math.max(mx, arr[j]!);
      }
      result[i] = mx;
    }
  }
  return result;
}

function rollingMin(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const result = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    if (i < window - 1) {
      let mn = arr[0]!;
      for (let j = 1; j <= i; j += 1) {
        mn = Math.min(mn, arr[j]!);
      }
      result[i] = mn;
    } else {
      let mn = arr[i - window + 1]!;
      for (let j = i - window + 2; j <= i; j += 1) {
        mn = Math.min(mn, arr[j]!);
      }
      result[i] = mn;
    }
  }
  return result;
}

export function safezonestop(
  candles: IndicatorCandles,
  period: number = 22,
  mult: number = 2.5,
  maxLookback: number = 3,
  direction: string = "long",
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("safezonestop requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const high = column(m, 3);
  const low = column(m, 4);
  const lastHigh = npShift(high, 1);
  const lastLow = npShift(low, 1);
  const diffHigh = new Float64Array(high.length);
  const diffLow = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    const dh = high[i]! - lastHigh[i]!;
    const dl = lastLow[i]! - low[i]!;
    diffHigh[i] = Number.isNaN(dh) ? 0 : dh;
    diffLow[i] = Number.isNaN(dl) ? 0 : dl;
  }
  const rawPlusDm = new Float64Array(high.length);
  const rawMinusDm = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    rawPlusDm[i] = diffHigh[i]! > diffLow[i]! && diffHigh[i]! > 0 ? diffHigh[i]! : 0;
    rawMinusDm[i] = diffLow[i]! > diffHigh[i]! && diffLow[i]! > 0 ? diffLow[i]! : 0;
  }
  const plusDm = wilderSmoothing(rawPlusDm, period);
  const minusDm = wilderSmoothing(rawMinusDm, period);
  let res: Float64Array;
  if (direction === "long") {
    const intermediate = new Float64Array(high.length);
    for (let i = 0; i < high.length; i += 1) {
      intermediate[i] = lastLow[i]! - mult * minusDm[i]!;
    }
    res = rollingMax(intermediate, maxLookback);
  } else {
    const intermediate = new Float64Array(high.length);
    for (let i = 0; i < high.length; i += 1) {
      intermediate[i] = lastHigh[i]! + mult * plusDm[i]!;
    }
    res = rollingMin(intermediate, maxLookback);
  }
  return sequential ? res : res[res.length - 1]!;
}
