/**
 * MARKETFI - Market Facilitation Index
 * Formula: (High - Low) / Volume
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function marketfi(candles: OhlcvMatrix, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const vol = column(m, 5);
  const n = m.length;
  const res = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    res[i] = vol[i]! !== 0 ? (high[i]! - low[i]!) / vol[i]! : Number.NaN;
  }
  const out = sequential ? sameLength(m, res) : res[n - 1]!;
  return out;
}
