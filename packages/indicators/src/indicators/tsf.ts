/**
 * TSF - Time Series Forecast
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
import { slidingWindowView } from "../np/sliding.js";
import { mean1d } from "../np/sliding.js";

export function tsf(
  candles: IndicatorCandles,
  period: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  if (sequential) {
    const result = new Float64Array(source.length);
    result.fill(Number.NaN);
    if (source.length >= period) {
      let sumX = 0;
      let sumXX = 0;
      for (let j = 0; j < period; j += 1) {
        sumX += j;
        sumXX += j * j;
      }
      const xMean = sumX / period;
      const denominator = sumXX - period * xMean * xMean;
      const wins = slidingWindowView(source, period);
      for (let i = 0; i < wins.length; i += 1) {
        const y = wins[i]!;
        const yMean = mean1d(y);
        let num = 0;
        for (let j = 0; j < period; j += 1) {
          num += (y[j]! - yMean) * (j - xMean);
        }
        const slope = denominator !== 0 ? num / denominator : 0;
        const intercept = yMean - slope * xMean;
        result[period - 1 + i] = intercept + slope * period;
      }
    }
    return result;
  }
  if (source.length < period) {
    return Number.NaN;
  }
  const wins = slidingWindowView(source, period);
  const y = wins[wins.length - 1]!;
  let sumX = 0;
  let sumXX = 0;
  for (let j = 0; j < period; j += 1) {
    sumX += j;
    sumXX += j * j;
  }
  const xMean = sumX / period;
  const denominator = sumXX - period * xMean * xMean;
  const yMean = mean1d(y);
  let num = 0;
  for (let j = 0; j < period; j += 1) {
    num += (y[j]! - yMean) * (j - xMean);
  }
  const slope = denominator !== 0 ? num / denominator : 0;
  const intercept = yMean - slope * xMean;
  return intercept + slope * period;
}
