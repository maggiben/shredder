/**
 * BOP - Balance Of Power
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function bop(candles: OhlcvMatrix, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const open_ = column(m, 1);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const n = m.length;
  const res = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const den = high[i]! - low[i]!;
    res[i] = den !== 0 ? (close[i]! - open_[i]!) / den : 0;
  }
  return sequential ? res : res[n - 1]!;
}
