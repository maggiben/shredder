/**
 * End Point Moving Average
 *
 * :param candles: np.ndarray
 * :param period: int - default: 11
 * :param offset: int - default: 4
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function epmaFast(source: Float64Array, period: number, offset: number): Float64Array {
  const n = source.length;
  const newseries = source.slice();
  for (let j = period + offset + 1; j < n; j += 1) {
    let mySum = 0;
    let weightSum = 0;
    for (let i = 0; i < period - 1; i += 1) {
      const weight = period - i - offset;
      mySum += source[j - i]! * weight;
      weightSum += weight;
    }
    newseries[j] = (1 / weightSum) * mySum;
  }
  return newseries;
}

export function epma(
  candles: IndicatorCandles,
  period: number = 11,
  offset: number = 4,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const res = epmaFast(source, period, offset);
  return sequential ? res : res[res.length - 1]!;
}
