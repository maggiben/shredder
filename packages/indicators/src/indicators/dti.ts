/**
 * DTI by William Blau calculated using Rust implementation for better performance.
 *
 * :param candles: np.ndarray of candles data
 * :param r: period for the first EMA smoothing (default 14)
 * :param s: period for the second EMA smoothing (default 10)
 * :param u: period for the third EMA smoothing (default 5)
 * :param sequential: if True, returns the full sequence, otherwise only the last value
 * :return: float or np.ndarray of DTI values
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { dti as dtiCore } from "../series/extra.js";

export function dti(
  candles: OhlcvMatrix,
  r: number = 14,
  s: number = 10,
  u: number = 5,
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const res = dtiCore(m, r, s, u);
  if (sequential) {
    return res;
  }
  const v = res[res.length - 1]!;
  return Number.isNaN(v) ? Number.NaN : v;
}
