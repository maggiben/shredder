/**
 * MIDPOINT - MidPoint over period
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";

export function midpoint(
  candles: OhlcvMatrix,
  period: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  const n = source.length;
  if (n < period) {
    if (sequential) {
      const out = new Float64Array(n);
      out.fill(Number.NaN);
      return out;
    }
    return Number.NaN;
  }
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  for (let i = period - 1; i < n; i += 1) {
    let mn = Number.POSITIVE_INFINITY;
    let mx = Number.NEGATIVE_INFINITY;
    for (let j = i - period + 1; j <= i; j += 1) {
      const v = source[j]!;
      if (v < mn) {
        mn = v;
      }
      if (v > mx) {
        mx = v;
      }
    }
    result[i] = (mx + mn) / 2;
  }
  return sequential ? result : result[n - 1]!;
}
