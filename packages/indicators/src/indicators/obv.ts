/**
 * OBV - On Balance Volume
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function obv(candles: OhlcvMatrix, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const close = column(m, 2);
  const volume = column(m, 5);
  const n = m.length;
  const obvArr = new Float64Array(n);
  if (n === 0) {
    return sequential ? obvArr : Number.NaN;
  }
  obvArr[0] = volume[0]!;
  for (let i = 1; i < n; i += 1) {
    let delta = 0;
    if (close[i]! > close[i - 1]!) {
      delta = volume[i]!;
    } else if (close[i]! < close[i - 1]!) {
      delta = -volume[i]!;
    }
    obvArr[i] = obvArr[i - 1]! + delta;
  }
  return sequential ? obvArr : obvArr[n - 1]!;
}
