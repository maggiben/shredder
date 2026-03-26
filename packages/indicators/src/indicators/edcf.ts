/**
 * Ehlers Distance Coefficient Filter
 *
 * :param candles: np.ndarray
 * :param period: int - default: 15
 * :param source_type: str - default: "hl2"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function edcfFast(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const newseries = new Float64Array(n);
  newseries.fill(Number.NaN);
  for (let j = 2 * period; j < n; j += 1) {
    let num = 0;
    let coefSum = 0;
    for (let i = 0; i < period; i += 1) {
      let distance = 0;
      for (let lb = 1; lb < period; lb += 1) {
        const d = source[j - i]! - source[j - i - lb]!;
        distance += d * d;
      }
      num += distance * source[j - i]!;
      coefSum += distance;
    }
    newseries[j] = coefSum !== 0 ? num / coefSum : 0;
  }
  return newseries;
}

export function edcf(
  candles: IndicatorCandles,
  period: number = 15,
  sourceType: string = "hl2",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const res = edcfFast(source, period);
  return sequential ? res : res[res.length - 1]!;
}
