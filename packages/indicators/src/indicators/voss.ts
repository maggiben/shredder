/*
 Voss indicator by John F. Ehlers

 :param candles: np.ndarray
 :param period: int - default: 20
 :param predict: int - default: 3
 :param bandwith: float - default: 0.25
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { isCandles1D } from "../types.js";

export type VossResult =
  | { readonly voss: number; readonly filt: number }
  | { readonly voss: Float64Array; readonly filt: Float64Array };

function vossFast(source: Float64Array, period: number, predict: number, bandwith: number): {
  voss: Float64Array;
  filt: Float64Array;
} {
  const voss = new Float64Array(source.length);
  const filt = new Float64Array(source.length);
  const pi = Math.PI;
  const order = 3 * predict;
  const f1 = Math.cos((2 * pi) / period);
  const g1 = Math.cos((bandwith * 2 * pi) / period);
  const s1 = 1 / g1 - Math.sqrt(1 / (g1 * g1) - 1);

  for (let i = 0; i < source.length; i += 1) {
    if (i > period && i > 5 && i > order) {
      filt[i] =
        0.5 * (1 - s1) * (source[i]! - source[i - 2]!) +
        f1 * (1 + s1) * filt[i - 1]! -
        s1 * filt[i - 2]!;
    }
  }
  for (let i = 0; i < source.length; i += 1) {
    if (!(i <= period || i <= 5 || i <= order)) {
      let sumc = 0;
      for (let count = 0; count < order; count += 1) {
        sumc += ((count + 1) / order) * voss[i - (order - count)]!;
      }
      voss[i] = ((3 + order) / 2) * filt[i]! - sumc;
    }
  }
  return { voss, filt };
}

export function voss(
  candles: IndicatorCandles,
  period: number = 20,
  predict: number = 3,
  bandwith: number = 0.25,
  sourceType: string = "close",
  sequential: boolean = false,
): VossResult {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const matrix = sliceCandles(candles, sequential);
    source = getCandleSource(matrix, sourceType);
  }
  if (source.length === 0) {
    if (!sequential) {
      return { voss: Number.NaN, filt: Number.NaN };
    }
    return { voss: new Float64Array(), filt: new Float64Array() };
  }
  const { voss: vossArr, filt: filtArr } = vossFast(source, period, predict, bandwith);
  if (sequential) {
    return { voss: vossArr, filt: filtArr };
  }
  const li = vossArr.length - 1;
  return { voss: vossArr[li]!, filt: filtArr[li]! };
}
