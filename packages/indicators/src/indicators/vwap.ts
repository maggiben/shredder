/**
 * VWAP
 *
 * :param candles: np.ndarray
 * :param source_type: str - default: "hlc3"
 * :param anchor: str - default: "D"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { vwap as vwapCore } from "../series/extra.js";

export function vwap(
  candles: OhlcvMatrix,
  sourceType: string = "hlc3",
  anchor: string = "D",
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const full = vwapCore(m, sourceType, anchor, true);
  if (sequential) {
    return full;
  }
  const v = full[full.length - 1]!;
  return Number.isNaN(v) ? Number.NaN : v;
}
