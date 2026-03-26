/*
 BBW - Bollinger Bands Width

 :param candles: np.ndarray
 :param period: int - default: 20
 :param mult: float - default: 2
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { bollingerBandsWidth } from "../series/series.js";

export function bollinger_bands_width(
  candles: IndicatorCandles,
  period: number = 20,
  mult: number = 2,
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
  const result = bollingerBandsWidth(source, period, mult);
  return sequential ? result : result[result.length - 1]!;
}
