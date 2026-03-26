/*
 KAMA - Kaufman Adaptive Moving Average

 :param candles: np.ndarray
 :param period: int - default: 14
 :param fast_length: int - default: 2
 :param slow_length: int - default: 30
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { kama as kamaRust } from "../series/series.js";

export function kama(
  candles: IndicatorCandles,
  period: number = 14,
  fastLength: number = 2,
  slowLength: number = 30,
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
  const result = kamaRust(source, period, fastLength, slowLength);
  return sequential ? result : result[result.length - 1]!;
}
