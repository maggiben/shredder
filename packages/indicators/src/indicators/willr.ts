/*
 WILLR - Williams' %R

 :param candles: np.ndarray
 :param period: int - default: 14
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { willr as willrRust } from "../series/candles.js";

export function willr(
  candles: IndicatorCandles,
  period: number = 14,
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("willr requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const res = willrRust(m, period);
  return sequential ? res : res[res.length - 1]!;
}
