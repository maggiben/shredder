/**
 * MIDPRICE - Midpoint Price over period
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function midprice(candles: OhlcvMatrix, period: number = 14, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const n = m.length;
  if (sequential) {
    if (n < period) {
      const out = new Float64Array(n);
      out.fill(Number.NaN);
      return out;
    }
    const result = new Float64Array(n);
    result.fill(Number.NaN, 0, period - 1);
    for (let i = period - 1; i < n; i += 1) {
      let mx = Number.NEGATIVE_INFINITY;
      let mn = Number.POSITIVE_INFINITY;
      for (let j = i - period + 1; j <= i; j += 1) {
        if (high[j]! > mx) {
          mx = high[j]!;
        }
        if (low[j]! < mn) {
          mn = low[j]!;
        }
      }
      result[i] = (mx + mn) / 2;
    }
    return result;
  }
  if (n < period) {
    return Number.NaN;
  }
  let mx = Number.NEGATIVE_INFINITY;
  let mn = Number.POSITIVE_INFINITY;
  for (let j = n - period; j < n; j += 1) {
    if (high[j]! > mx) {
      mx = high[j]!;
    }
    if (low[j]! < mn) {
      mn = low[j]!;
    }
  }
  return (mx + mn) / 2;
}
