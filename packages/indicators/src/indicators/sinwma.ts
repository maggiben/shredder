/**
 * Sine Weighted Moving Average (SINWMA)
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { resolveSourceSeries, sameLength, sliceCandles } from "../candles/helpers.js";
import { weightedRollingAverage } from "../np/weighted-window.js";
import { npPi } from "../np/core.js";

function sinWeights(period: number): Float64Array {
  const w = new Float64Array(period);
  let sum = 0;
  for (let i = 0; i < period; i += 1) {
    const v = Math.sin(((i + 1) * npPi) / (period + 1));
    w[i] = v;
    sum += v;
  }
  const out = new Float64Array(period);
  for (let i = 0; i < period; i += 1) {
    out[i] = sum > 0 ? w[i]! / sum : w[i]!;
  }
  return out;
}

export function sinwma(
  candles: IndicatorCandles,
  period: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const w = sinWeights(period);
  const res = weightedRollingAverage(source, w);
  if (isCandles1D(candles)) {
    return sequential ? res : res[res.length - 1]!;
  }
  const m = sliceCandles(candles as OhlcvMatrix, sequential);
  const padded = sameLength(m, res);
  return sequential ? padded : padded[res.length - 1]!;
}
