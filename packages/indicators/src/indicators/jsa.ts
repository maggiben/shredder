/**
 * Jsa Moving Average
 *
 * :param candles: np.ndarray
 * :param period: int - default: 30
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { npShift, resolveSourceSeries } from "../candles/helpers.js";

export function jsa(
  candles: IndicatorCandles,
  period: number = 30,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const shifted = npShift(source, period);
  const res = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    res[i] = (source[i]! + shifted[i]!) / 2;
  }
  return sequential ? res : res[res.length - 1]!;
}
