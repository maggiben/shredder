/**
 * Roofing Filter indicator by John F. Ehlers
 *
 * :param candles: np.ndarray
 * :param hp_period: int - default: 48
 * :param lp_period: int - default: 10
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { highPass2Fast, superSmoother2Fast } from "../np/ehlers.js";

export function roofing(
  candles: IndicatorCandles,
  hpPeriod: number = 48,
  lpPeriod: number = 10,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const hpf = highPass2Fast(source, hpPeriod);
  const res = superSmoother2Fast(hpf, lpPeriod);
  return sequential ? res : res[res.length - 1]!;
}
