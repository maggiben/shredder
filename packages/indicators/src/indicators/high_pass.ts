/**
 * (1 pole) high-pass filter indicator by John F. Ehlers
 *
 * :param candles: np.ndarray
 * :param period: int - default: 48
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { highPass1Fast } from "../np/ehlers.js";

export function high_pass(

  candles: IndicatorCandles,
  period: number = 48,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array | null {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const hpf = highPass1Fast(source, period);
  if (sequential) {
    return hpf;
  }
  const last = hpf[hpf.length - 1]!;
  return Number.isNaN(last) ? null : last;
}
