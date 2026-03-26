/**
 * STDDEV - Standard Deviation
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param nbdev: float - default: 1
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { movingStd } from "../series/series.js";

export function stddev(
  candles: IndicatorCandles,
  period: number = 5,
  nbdev: number = 1,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const base = movingStd(source, period);
  const out = new Float64Array(base.length);
  for (let i = 0; i < base.length; i += 1) {
    out[i] = base[i]! * nbdev;
  }
  return sequential ? out : out[out.length - 1]!;
}
