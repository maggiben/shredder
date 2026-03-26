/**
 * VOSC - Volume Oscillator
 *
 * :param candles: np.ndarray
 * :param short_period: int - default: 2
 * :param long_period: int - default: 5
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { sma } from "./sma.js";

export function vosc(
  candles: OhlcvMatrix,
  shortPeriod: number = 2,
  longPeriod: number = 5,
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const volume = column(m, 5);
  const shortSma = sma(volume, shortPeriod, "close", true) as Float64Array;
  const longSma = sma(volume, longPeriod, "close", true) as Float64Array;
  const voscValues = new Float64Array(volume.length);
  for (let i = 0; i < volume.length; i += 1) {
    const l = longSma[i]!;
    voscValues[i] = l !== 0 ? ((shortSma[i]! - l) / l) * 100 : Number.NaN;
  }
  const out = sameLength(m, voscValues);
  return sequential ? out : out[out.length - 1]!;
}
