/**
 * Moving average used in RSI. It is the exponentially weighted moving average with alpha = 1 / length.
 * RETURNS Exponential moving average of x with alpha = 1 / y.
 * https://www.tradingview.com/pine-script-reference/#fun_rma
 *
 * :param candles: np.ndarray
 * :param length: int - default: 14
 * :param source_type: str - default: close
 * :param sequential: bool - default: False
 * :return: Union[float, np.ndarray]
 */
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { rmaSeries } from "../series/series.js";

export function rma(
  candles: IndicatorCandles,
  length: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  if (length < 1) {
    throw new Error("Bad parameters.");
  }
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const m = sliceCandles(candles, sequential);
    source = getCandleSource(m, sourceType);
  }
  const res = rmaSeries(source, length);
  return sequential ? res : res[res.length - 1]!;
}
