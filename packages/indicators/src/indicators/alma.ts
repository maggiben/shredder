/**
 * ALMA - Arnaud Legoux Moving Average
 *
 * :param candles: np.ndarray
 * :param period: int - default: 9
 * :param sigma: float - default: 6.0
 * :param distribution_offset: float - default: 0.85
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { weightedRollingAverage } from "../np/weighted-window.js";

function almaWeights(period: number, sigma: number, distributionOffset: number): Float64Array {
  const asize = period - 1;
  const m = distributionOffset * asize;
  const s = period / sigma;
  const dss = 2 * s * s;
  const w = new Float64Array(period);
  let sum = 0;
  for (let i = 0; i < period; i += 1) {
    const v = Math.exp(-((i - m) * (i - m)) / dss);
    w[i] = v;
    sum += v;
  }
  for (let i = 0; i < period; i += 1) {
    w[i] = sum > 0 ? w[i]! / sum : w[i]!;
  }
  return w;
}

export function alma(
  candles: IndicatorCandles,
  period: number = 9,
  sigma: number = 6.0,
  distributionOffset: number = 0.85,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const wtds = almaWeights(period, sigma, distributionOffset);
  const res = weightedRollingAverage(source, wtds);
  for (let i = 0; i < res.length; i += 1) {
    if (res[i]! === 0) {
      res[i] = Number.NaN;
    }
  }
  return sequential ? res : res[res.length - 1]!;
}
