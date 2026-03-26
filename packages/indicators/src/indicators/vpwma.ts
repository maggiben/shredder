/**
 * Variable Power Weighted Moving Average
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param power: float - default: 0.382
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function vpwmaFast(source: Float64Array, period: number, power: number): Float64Array {
  const n = source.length;
  const newseries = source.slice();
  for (let j = period + 1; j < n; j += 1) {
    let mySum = 0;
    let weightSum = 0;
    for (let i = 0; i < period - 1; i += 1) {
      const weight = (period - i) ** power;
      mySum += source[j - i]! * weight;
      weightSum += weight;
    }
    newseries[j] = mySum / weightSum;
  }
  return newseries;
}

export function vpwma(
  candles: IndicatorCandles,
  period: number = 14,
  power: number = 0.382,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const res = vpwmaFast(source, period, power);
  return sequential ? res : res[res.length - 1]!;
}
