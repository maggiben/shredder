/**
 * Kase Dev Stops
 *
 * :param candles: np.ndarray
 * :param period: int - default: 20
 * :param mult: float - default: 0
 * :param devtype: int - default: 0
 * :param direction: str - default: long
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { slidingWindowView } from "../np/sliding.js";
import { mean_ad } from "./mean_ad.js";
import { median_ad } from "./median_ad.js";

function rollingMaxArr(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  if (n < window) {
    return res;
  }
  const wins = slidingWindowView(arr, window);
  for (let i = 0; i < wins.length; i += 1) {
    let m = wins[i]![0]!;
    for (let k = 1; k < window; k += 1) {
      m = Math.max(m, wins[i]![k]!);
    }
    res[window - 1 + i] = m;
  }
  return res;
}

function rollingMinArr(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  if (n < window) {
    return res;
  }
  const wins = slidingWindowView(arr, window);
  for (let i = 0; i < wins.length; i += 1) {
    let m = wins[i]![0]!;
    for (let k = 1; k < window; k += 1) {
      m = Math.min(m, wins[i]![k]!);
    }
    res[window - 1 + i] = m;
  }
  return res;
}

function rollingMeanArr(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  if (n < window) {
    return res;
  }
  const wins = slidingWindowView(arr, window);
  for (let i = 0; i < wins.length; i += 1) {
    let s = 0;
    for (let k = 0; k < window; k += 1) {
      s += wins[i]![k]!;
    }
    res[window - 1 + i] = s / window;
  }
  return res;
}

function rollingStdArr(arr: Float64Array, window: number): Float64Array {
  const n = arr.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  if (n < window) {
    return res;
  }
  const wins = slidingWindowView(arr, window);
  for (let i = 0; i < wins.length; i += 1) {
    let s = 0;
    for (let k = 0; k < window; k += 1) {
      s += wins[i]![k]!;
    }
    const mean = s / window;
    let v = 0;
    for (let k = 0; k < window; k += 1) {
      const d = wins[i]![k]! - mean;
      v += d * d;
    }
    res[window - 1 + i] = Math.sqrt(v / window);
  }
  return res;
}

export function devstop(
  candles: OhlcvMatrix,
  period: number = 20,
  mult: number = 0,
  devtype: number = 0,
  direction: string = "long",
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const rmaxH = rollingMaxArr(high, 2);
  const rminL = rollingMinArr(low, 2);
  const hlPair = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    hlPair[i] = rmaxH[i]! - rminL[i]!;
  }
  const AVTR = rollingMeanArr(hlPair, period);
  let SD: Float64Array;
  if (devtype === 0) {
    SD = rollingStdArr(hlPair, period);
  } else if (devtype === 1) {
    SD = mean_ad(hlPair, period, "close", true) as Float64Array;
  } else {
    SD = median_ad(hlPair, period, "close", true) as Float64Array;
  }
  const inner = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    if (direction === "long") {
      inner[i] = high[i]! - AVTR[i]! - mult * SD[i]!;
    } else {
      inner[i] = low[i]! + AVTR[i]! + mult * SD[i]!;
    }
  }
  const res = direction === "long" ? rollingMaxArr(inner, period) : rollingMinArr(inner, period);
  return sequential ? res : res[res.length - 1]!;
}
