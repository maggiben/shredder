/**
 * QStick - Moving average of the difference between closing and opening prices
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function qstick(
  candles: OhlcvMatrix,
  period: number = 5,
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const open_ = column(m, 1);
  const close = column(m, 2);
  const n = m.length;
  const raw = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    raw[i] = close[i]! - open_[i]!;
  }
  const qstickValues = new Float64Array(n);
  qstickValues.fill(0);
  for (let i = period - 1; i < n; i += 1) {
    let s = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      s += raw[j]!;
    }
    qstickValues[i] = s / period;
  }
  const out = sequential ? sameLength(m, qstickValues) : qstickValues[n - 1]!;
  return out;
}
