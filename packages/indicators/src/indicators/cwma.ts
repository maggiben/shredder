/**
 * Cubed Weighted Moving Average
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

function cwmaFast(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const newseries = source.slice();
  for (let j = period + 1; j < n; j += 1) {
    let mySum = 0;
    let weightSum = 0;
    for (let i = 0; i < period - 1; i += 1) {
      const weight = (period - i) ** 3;
      mySum += source[j - i]! * weight;
      weightSum += weight;
    }
    newseries[j] = mySum / weightSum;
  }
  return newseries;
}

export function cwma(
  candles: IndicatorCandles,
  period: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const res = cwmaFast(source, period);
  return sequential ? res : res[res.length - 1]!;
}
