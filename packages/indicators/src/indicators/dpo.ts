/**
 * DPO - Detrended Price Oscillator
 *
 * Formula: Price {X/2 + 1} periods ago less the X-period simple moving average
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";
import { sma } from "./sma.js";

export function dpo(
  candles: OhlcvMatrix,
  period: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  const tSma = sma(m, period, sourceType, true) as Float64Array;
  const shift = Math.floor(period / 2) + 1;
  const n = source.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  const invalidThrough = period - 1 + shift;
  for (let i = 0; i < Math.min(invalidThrough, n); i += 1) {
    res[i] = Number.NaN;
  }
  for (let i = shift; i < n; i += 1) {
    res[i] = source[i - shift]! - tSma[i]!;
  }
  if (sequential) {
    return sameLength(m, res);
  }
  return res[n - 1]!;
}
