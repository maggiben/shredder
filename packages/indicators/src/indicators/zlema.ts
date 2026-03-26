/*
 Zero-Lag Exponential Moving Average

 :param candles: np.ndarray
 :param period: int - default: 20
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { zlema as zlemaCore } from "../series/series.js";

export function zlema(
  candles: IndicatorCandles,
  period: number = 20,
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
  const result = zlemaCore(source, period);
  return sequential ? result : result[result.length - 1]!;
}
