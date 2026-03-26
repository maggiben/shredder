/**
 * Ehlers Simple Decycler
 *
 * :param candles: np.ndarray
 * :param hp_period: int - default: 125
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { highPass2Fast } from "../np/ehlers.js";

export function decycler(
  candles: IndicatorCandles,
  hpPeriod: number = 125,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const hp = highPass2Fast(source, hpPeriod);
  const res = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    res[i] = source[i]! - hp[i]!;
  }
  return sequential ? res : res[res.length - 1]!;
}
