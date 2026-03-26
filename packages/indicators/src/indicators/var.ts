/**
 * VAR - Variance
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param nbdev: float - default: 1
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { slidingWindowView } from "../np/sliding.js";

export function varIndicator(
  candles: IndicatorCandles,
  period: number = 14,
  nbdev: number = 1,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return sequential ? result : result[result.length - 1]!;
  }
  const wins = slidingWindowView(source, period);
  for (let i = 0; i < wins.length; i += 1) {
    const w = wins[i]!;
    let sumY = 0;
    let sumY2 = 0;
    for (let k = 0; k < w.length; k += 1) {
      const v = w[k]!;
      sumY += v;
      sumY2 += v * v;
    }
    const mean = sumY / period;
    result[period - 1 + i] = (sumY2 / period - mean * mean) * nbdev;
  }
  return sequential ? result : result[result.length - 1]!;
}
