/*
 MWDX Average

 :param candles: np.ndarray
 :param factor: float - default: 0.2
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";

function mwdxFast(source: Float64Array, fac: number): Float64Array {
  const out = new Float64Array(source.length);
  out[0] = source[0]!;
  for (let i = 1; i < source.length; i += 1) {
    out[i] = fac * source[i]! + (1 - fac) * out[i - 1]!;
  }
  return out;
}

export function mwdx(
  candles: IndicatorCandles,
  factor: number = 0.2,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const val2 = 2 / factor - 1;
  const fac = 2 / (val2 + 1);
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const matrix = sliceCandles(candles, sequential);
    source = getCandleSource(matrix, sourceType);
  }
  const res = mwdxFast(source, fac);
  return sequential ? res : res[res.length - 1]!;
}
