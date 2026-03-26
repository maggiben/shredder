/*
 ATR - Average True Range using optimized Rust implementation

 :param candles: np.ndarray
 :param period: int - default: 14
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { atr as atrCore } from "../series/candles.js";

export function atr(
  candles: IndicatorCandles,
  period: number = 14,
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("atr requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const res = atrCore(m, period);
  return sequential ? res : res[res.length - 1]!;
}
