/*
 RSI - Relative Strength Index

 :param candles: np.ndarray
 :param period: int - default: 14
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { rsi as rsiRust } from "../series/series.js";

export function rsi(
  candles: IndicatorCandles,
  period: number = 14,
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
  const result = rsiRust(source, period);
  return sequential ? result : result[result.length - 1]!;
}
