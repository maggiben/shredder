/*
 CVI - Chaikins Volatility

 :param candles: np.ndarray
 :param period: int - default: 5
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { cvi as cviRust } from "../series/candles.js";

export function cvi(
  candles: IndicatorCandles,
  period: number = 5,
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("cvi requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const res = cviRust(m, period);
  return sequential ? res : res[res.length - 1]!;
}
