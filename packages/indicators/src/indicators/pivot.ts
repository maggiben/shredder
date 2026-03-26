/*
 Pivot Points

 :param candles: np.ndarray
 :param mode: int - default = 0
 :param sequential: bool - default: False

 :return: PIVOT(r4, r3, r2, r1, pp, s1, s2, s3, s4)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";

export type PivotResult =
  | {
      readonly r4: number;
      readonly r3: number;
      readonly r2: number;
      readonly r1: number;
      readonly pp: number;
      readonly s1: number;
      readonly s2: number;
      readonly s3: number;
      readonly s4: number;
    }
  | {
      readonly r4: Float64Array;
      readonly r3: Float64Array;
      readonly r2: Float64Array;
      readonly r1: Float64Array;
      readonly pp: Float64Array;
      readonly s1: Float64Array;
      readonly s2: Float64Array;
      readonly s3: Float64Array;
      readonly s4: Float64Array;
    };

function nanArray(n: number): Float64Array {
  const a = new Float64Array(n);
  a.fill(Number.NaN);
  return a;
}

export function pivot(candles: IndicatorCandles, mode: number = 0, sequential: boolean = false): PivotResult {
  if (isCandles1D(candles)) {
    throw new Error("pivot requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const len = m.length;
  const high = new Float64Array(len);
  const low = new Float64Array(len);
  const close = new Float64Array(len);
  const open = new Float64Array(len);
  for (let i = 0; i < len; i += 1) {
    high[i] = m[i]![3]!;
    low[i] = m[i]![4]!;
    close[i] = m[i]![2]!;
    open[i] = m[i]![1]!;
  }
  const s1 = nanArray(len);
  const s2 = nanArray(len);
  const s3 = nanArray(len);
  const s4 = nanArray(len);
  const p = nanArray(len);
  const r1 = nanArray(len);
  const r2 = nanArray(len);
  const r3 = nanArray(len);
  const r4 = nanArray(len);

  if (mode === 0) {
    for (let i = 0; i < len; i += 1) {
      p[i] = (high[i]! + low[i]! + close[i]!) / 3;
      s1[i] = 2 * p[i]! - high[i]!;
      s2[i] = p[i]! - (high[i]! - low[i]!);
      r1[i] = 2 * p[i]! - low[i]!;
      r2[i] = p[i]! + (high[i]! - low[i]!);
    }
  } else if (mode === 1) {
    for (let i = 0; i < len; i += 1) {
      p[i] = (high[i]! + low[i]! + close[i]!) / 3;
      const rng = high[i]! - low[i]!;
      s1[i] = p[i]! - 0.382 * rng;
      s2[i] = p[i]! - 0.618 * rng;
      s3[i] = p[i]! - 1 * rng;
      r1[i] = p[i]! + 0.382 * rng;
      r2[i] = p[i]! + 0.618 * rng;
      r3[i] = p[i]! + 1 * rng;
    }
  } else if (mode === 2) {
    for (let i = 0; i < len; i += 1) {
      const h = high[i]!;
      const l = low[i]!;
      const c = close[i]!;
      const o = open[i]!;
      if (c < o) {
        p[i] = (h + 2 * l + c) / 4;
        s1[i] = (h + 2 * l + c) / 2 - h;
        r1[i] = (h + 2 * l + c) / 2 - l;
      } else if (c > o) {
        p[i] = (2 * h + l + c) / 4;
        s1[i] = (2 * h + l + c) / 2 - h;
        r1[i] = (2 * h + l + c) / 2 - l;
      } else if (c === o) {
        p[i] = (h + l + 2 * c) / 4;
        s1[i] = (h + l + 2 * c) / 2 - h;
        r1[i] = (h + l + 2 * c) / 2 - l;
      } else {
        p[i] = Number.NaN;
        s1[i] = Number.NaN;
        r1[i] = Number.NaN;
      }
    }
  } else if (mode === 3) {
    for (let i = 0; i < len; i += 1) {
      p[i] = (high[i]! + low[i]! + close[i]!) / 3;
      const rng = high[i]! - low[i]!;
      r4[i] = 0.55 * rng + close[i]!;
      r3[i] = 0.275 * rng + close[i]!;
      r2[i] = 0.183 * rng + close[i]!;
      r1[i] = 0.0916 * rng + close[i]!;
      s1[i] = close[i]! - 0.0916 * rng;
      s2[i] = close[i]! - 0.183 * rng;
      s3[i] = close[i]! - 0.275 * rng;
      s4[i] = close[i]! - 0.55 * rng;
    }
  } else if (mode === 4) {
    for (let i = 0; i < len; i += 1) {
      p[i] = (high[i]! + low[i]! + 2 * open[i]!) / 4;
      r3[i] = high[i]! + 2 * (p[i]! - low[i]!);
      r4[i] = r3[i]! + (high[i]! - low[i]!);
      r2[i] = p[i]! + (high[i]! - low[i]!);
      r1[i] = 2 * p[i]! - low[i]!;
      s1[i] = 2 * p[i]! - high[i]!;
      s2[i] = p[i]! - (high[i]! - low[i]!);
      s3[i] = low[i]! - 2 * (high[i]! - p[i]!);
      s4[i] = s3[i]! - (high[i]! - low[i]!);
    }
  }

  if (sequential) {
    return { r4, r3, r2, r1, pp: p, s1, s2, s3, s4 };
  }
  const li = len - 1;
  return {
    r4: r4[li]!,
    r3: r3[li]!,
    r2: r2[li]!,
    r1: r1[li]!,
    pp: p[li]!,
    s1: s1[li]!,
    s2: s2[li]!,
    s3: s3[li]!,
    s4: s4[li]!,
  };
}
