/**
 * HullSuit - Hull Suit
 *
 * :param candles: np.ndarray
 * :param mode_switch: str - default: 'Hma'
 * :param length: int - default: 55
 * :param length_mult: float - default: 1.0
 * :param source_type: str - default: 'close'
 * :param sequential: bool - default: False
 *
 * :return: HullSuit(s_hull, m_hull, signal)
 */
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { ema } from "./ema.js";
import { wma } from "./wma.js";

export type HullSuit = {
  s_hull: number | Float64Array | null;
  m_hull: number | Float64Array | null;
  signal: string | (string | null)[] | null;
};

export function hull_suit(
  candles: IndicatorCandles,
  modeSwitch: string = "Hma",
  length: number = 55,
  lengthMult: number = 1.0,
  sourceType: string = "close",
  sequential: boolean = false,
): HullSuit {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    source = getCandleSource(sliceCandles(candles, sequential), sourceType);
  }
  const modeLen = Math.trunc(length * lengthMult);
  let mode: Float64Array;
  if (modeSwitch === "Hma") {
    const w1 = wma(source, Math.trunc(modeLen / 2), sourceType, true) as Float64Array;
    const w2 = wma(source, modeLen, sourceType, true) as Float64Array;
    const comb = new Float64Array(source.length);
    for (let i = 0; i < source.length; i += 1) {
      comb[i] = 2 * w1[i]! - w2[i]!;
    }
    mode = wma(comb, Math.round(modeLen ** 0.5), sourceType, true) as Float64Array;
  } else if (modeSwitch === "Ehma") {
    const e1 = ema(source, Math.trunc(modeLen / 2), sourceType, true) as Float64Array;
    const e2 = ema(source, modeLen, sourceType, true) as Float64Array;
    const comb = new Float64Array(source.length);
    for (let i = 0; i < source.length; i += 1) {
      comb[i] = 2 * e1[i]! - e2[i]!;
    }
    mode = ema(comb, Math.round(modeLen ** 0.5), sourceType, true) as Float64Array;
  } else {
    const w1 = wma(source, Math.trunc(modeLen / 6), sourceType, true) as Float64Array;
    const w2 = wma(source, Math.trunc(modeLen / 4), sourceType, true) as Float64Array;
    const w3 = wma(source, Math.trunc(modeLen / 2), sourceType, true) as Float64Array;
    const comb = new Float64Array(source.length);
    for (let i = 0; i < source.length; i += 1) {
      comb[i] = 3 * w1[i]! - w2[i]! - w3[i]!;
    }
    mode = wma(comb, Math.trunc(modeLen / 2), sourceType, true) as Float64Array;
  }
  const n = mode.length;
  const sHull = new Float64Array(n);
  const mHull = new Float64Array(n);
  const sigArr: (string | null)[] = new Array(n).fill(null);
  sHull.fill(Number.NaN);
  mHull.fill(Number.NaN);
  if (n > 2) {
    for (let i = 2; i < n; i += 1) {
      sHull[i] = mode[i - 2]!;
      mHull[i] = mode[i]!;
      sigArr[i] = mode[i - 2]! < mode[i]! ? "buy" : "sell";
    }
  }
  if (sequential) {
    return { s_hull: sHull, m_hull: mHull, signal: sigArr };
  }
  return { s_hull: sHull[n - 1]!, m_hull: mHull[n - 1]!, signal: sigArr[n - 1]! };
}
