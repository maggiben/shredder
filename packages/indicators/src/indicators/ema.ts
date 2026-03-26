/*
 EMA - Exponential Moving Average using Numba for optimization

 :param candles: np.ndarray
 :param period: int - default: 5
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { ema as emaCore } from "../series/index.js";

export function ema(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const c = sliceCandles(candles, sequential);
    source = getCandleSource(c, sourceType);
  }
  const result = emaCore(source, period);
  return sequential ? result : result[result.length - 1]!;
}
