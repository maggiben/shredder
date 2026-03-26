/**
 * Perry Kaufman's Stops
 *
 * :param candles: np.ndarray
 * :param period: int - default: 22
 * :param mult: float - default: 2
 * :param direction: str - default: long
 * :param matype: int - default: 0
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { ma } from "./ma.js";

export function kaufmanstop(
  candles: OhlcvMatrix,
  period: number = 22,
  mult: number = 2,
  direction: string = "long",
  matype: number = 0,
  sequential: boolean = false,
): number | Float64Array {
  if (matype === 24 || matype === 29) {
    throw new Error("VWMA (matype 24) and VWAP (matype 29) cannot be used in kaufmanstop indicator.");
  }
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const hlDiff = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    hlDiff[i] = high[i]! - low[i]!;
  }
  const hl_ma = ma(hlDiff, period, matype, "close", true) as Float64Array;
  const res = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    res[i] = direction === "long" ? low[i]! - hl_ma[i]! * mult : high[i]! + hl_ma[i]! * mult;
  }
  return sequential ? res : res[res.length - 1]!;
}
