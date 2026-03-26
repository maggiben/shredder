/**
 * WAD - Williams Accumulation/Distribution
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function wad(candles: OhlcvMatrix, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const n = close.length;
  const ad = new Float64Array(n);
  for (let i = 1; i < n; i += 1) {
    const c = close[i]!;
    const pc = close[i - 1]!;
    if (c > pc) {
      ad[i] = c - Math.min(low[i]!, pc);
    } else if (c < pc) {
      ad[i] = c - Math.max(high[i]!, pc);
    }
  }
  const wadValues = new Float64Array(n);
  let c = 0;
  for (let i = 0; i < n; i += 1) {
    c += ad[i]!;
    wadValues[i] = c;
  }
  return sequential ? sameLength(m, wadValues) : wadValues[wadValues.length - 1]!;
}
