/*
 ADX - Average Directional Movement Index

 :param candles: np.ndarray
 :param period: int - default: 14
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { adx as adxRust } from "../series/candles.js";

export function adx(
  candles: IndicatorCandles,
  period: number = 14,
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("adx requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const res = adxRust(m, period);
  return sequential ? res : res[res.length - 1]!;
}
