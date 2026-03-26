/*
 Choppiness Index (CHOP)

 :param candles: np.ndarray
 :param period: int - default: 14
 :param scalar: float - default: 100
 :param drift: int - default: 1
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { chop as chopRust } from "../series/candles.js";

export function chop(
  candles: IndicatorCandles,
  period: number = 14,
  scalar: number = 100,
  drift: number = 1,
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("chop requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const res = chopRust(m, period, scalar, drift);
  return sequential ? res : res[res.length - 1]!;
}
