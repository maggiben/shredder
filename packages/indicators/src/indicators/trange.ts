/**
 * TRANGE - True Range
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function trange(candles: OhlcvMatrix, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const n = m.length;
  const res = new Float64Array(n);
  if (n === 0) {
    return sequential ? res : Number.NaN;
  }
  res[0] = high[0]! - low[0]!;
  for (let i = 1; i < n; i += 1) {
    const dhl = high[i]! - low[i]!;
    const dhc = Math.abs(high[i]! - close[i - 1]!);
    const dlc = Math.abs(low[i]! - close[i - 1]!);
    res[i] = Math.max(dhl, dhc, dlc);
  }
  return sequential ? res : res[n - 1]!;
}
