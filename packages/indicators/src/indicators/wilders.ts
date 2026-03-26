/*
 WILDERS - Wilders Smoothing

 :param candles: np.ndarray
 :param period: int - default: 5
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";

function wildersArray(source: Float64Array, period: number): Float64Array {
  const res = new Float64Array(source.length);
  res[0] = source[0]!;
  for (let i = 1; i < source.length; i += 1) {
    res[i] = (res[i - 1]! * (period - 1) + source[i]!) / period;
  }
  return res;
}

export function wilders(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  let bigger: Float64Array | import("../types.js").OhlcvMatrix;
  if (isCandles1D(candles)) {
    source = candles;
    bigger = candles;
  } else {
    bigger = sliceCandles(candles, sequential);
    source = getCandleSource(bigger, sourceType);
  }
  const res = wildersArray(source, period);
  if (sequential) {
    return sameLength(bigger, res);
  }
  return res[res.length - 1]!;
}
