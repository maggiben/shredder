/*
 VWMA - Volume Weighted Moving Average

 :param candles: np.ndarray
 :param period: int - default: 20
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { vwma as vwmaCore } from "../series/candles.js";

export function vwma(
  candles: IndicatorCandles,
  period: number = 20,
  _sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("vwma only works with normal candles.");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const res = vwmaCore(m, period);
  return sequential ? res : res[res.length - 1]!;
}
