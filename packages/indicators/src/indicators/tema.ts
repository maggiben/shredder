/*
 TEMA - Triple Exponential Moving Average

 :param candles: np.ndarray
 :param period: int - default: 9
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { tema as temaCore } from "../series/series.js";

export function tema(
  candles: IndicatorCandles,
  period: number = 9,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const matrix = sliceCandles(candles, sequential);
    source = getCandleSource(matrix, sourceType);
  }
  const result = temaCore(source, period);
  return sequential ? result : result[result.length - 1]!;
}
