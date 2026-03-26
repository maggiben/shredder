/**
 * Super Smoother Filter 2pole Butterworth
 * This indicator was described by John F. Ehlers
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { superSmoother2Fast } from "../np/ehlers.js";

export function supersmoother(
  candles: IndicatorCandles,
  period: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const res = superSmoother2Fast(source, period);
  return sequential ? res : res[res.length - 1]!;
}
