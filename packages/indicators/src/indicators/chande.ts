/*
 Chandelier Exits

 :param candles: np.ndarray
 :param period: int - default: 22
 :param mult: float - default: 3.0
 :param direction: str - default: "long"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { chande as chandeRust } from "../series/candles.js";

export function chande(
  candles: IndicatorCandles,
  period: number = 22,
  mult: number = 3,
  direction: string = "long",
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("chande requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const res = chandeRust(m, period, mult, direction);
  return sequential ? res : res[res.length - 1]!;
}
