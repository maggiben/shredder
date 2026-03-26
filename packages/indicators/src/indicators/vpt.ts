/**
 * Volume Price Trend (VPT)
 *
 * :param candles: np.ndarray
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, npShift, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function vpt(
  candles: OhlcvMatrix,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  const vol = column(m, 5);
  const shifted = npShift(source, 1);
  const n = source.length;
  const vptVal = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const prev = shifted[i]!;
    vptVal[i] = prev !== 0 && !Number.isNaN(prev) ? vol[i]! * ((source[i]! - prev) / prev) : Number.NaN;
  }
  const shiftedVpt = npShift(vptVal, 1);
  const res = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const a = shiftedVpt[i]!;
    const b = vptVal[i]!;
    res[i] = (Number.isNaN(a) ? 0 : a) + (Number.isNaN(b) ? 0 : b);
  }
  return sequential ? res : res[n - 1]!;
}
