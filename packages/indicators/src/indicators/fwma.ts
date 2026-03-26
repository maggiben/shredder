/**
 * Fibonacci's Weighted Moving Average (FWMA)
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { resolveSourceSeries, sameLength, sliceCandles } from "../candles/helpers.js";
import { fibonacciWeights } from "../np/fibonacci-weights.js";

export function fwma(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const fibs = fibonacciWeights(period);
  const L = fibs.length;
  const n = source.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  for (let i = L - 1; i < n; i += 1) {
    let num = 0;
    for (let j = 0; j < L; j += 1) {
      num += fibs[j]! * source[i - L + 1 + j]!;
    }
    res[i] = num;
  }
  if (isCandles1D(candles)) {
    return sequential ? res : res[n - 1]!;
  }
  const m = sliceCandles(candles as OhlcvMatrix, sequential);
  const padded = sameLength(m, res);
  return sequential ? padded : padded[n - 1]!;
}
