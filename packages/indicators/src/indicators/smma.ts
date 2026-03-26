/*
 SMMA - Smoothed Moving Average

 :param candles: np.ndarray
 :param period: int - default: 5
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { numpyEwma } from "../candles/numpy-ewma.js";

export function smma(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const m = sliceCandles(candles, sequential);
    source = getCandleSource(m, sourceType);
  }
  const res = numpyEwma(source, period);
  return sequential ? res : res[res.length - 1]!;
}
