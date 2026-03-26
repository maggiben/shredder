/**
 * AD - Chaikin A/D Line
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function ad(candles: OhlcvMatrix, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const volume = column(m, 5);
  const n = m.length;
  const mfv = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const h = high[i]!;
    const l = low[i]!;
    const c = close[i]!;
    const mfm = h !== l ? ((c - l) - (h - c)) / (h - l) : 0;
    mfv[i] = mfm * volume[i]!;
  }
  const adLine = new Float64Array(n);
  adLine[0] = mfv[0]!;
  for (let i = 1; i < n; i += 1) {
    adLine[i] = adLine[i - 1]! + mfv[i]!;
  }
  return sequential ? adLine : adLine[n - 1]!;
}
