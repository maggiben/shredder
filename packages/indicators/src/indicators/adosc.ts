/*
 ADOSC - Chaikin A/D Oscillator (Rust accelerated version)

 :param candles: np.ndarray
 :param fast_period: int - default: 3
 :param slow_period: int - default: 10
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { adosc as adoscRust } from "../series/candles.js";

export function adosc(
  candles: IndicatorCandles,
  fastPeriod: number = 3,
  slowPeriod: number = 10,
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    throw new Error("adosc requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const res = adoscRust(m, fastPeriod, slowPeriod);
  return sequential ? res : res[res.length - 1]!;
}
