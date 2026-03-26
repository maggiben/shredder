/**
 * TYPPRICE - Typical Price
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function typprice(candles: OhlcvMatrix, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const close = column(m, 2);
  const high = column(m, 3);
  const low = column(m, 4);
  const n = m.length;
  const res = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    res[i] = (close[i]! + high[i]! + low[i]!) / 3;
  }
  return sequential ? res : res[n - 1]!;
}
