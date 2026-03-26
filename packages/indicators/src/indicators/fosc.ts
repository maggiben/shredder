/**
 * FOSC - Forecast Oscillator
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
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";

function linearRegressionPredicted(y: Float64Array): Float64Array {
  const n = y.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += y[i]!;
    sumXY += i * y[i]!;
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const pred = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    pred[i] = slope * i + intercept;
  }
  return pred;
}

export function fosc(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let ref: OhlcvMatrix | Float64Array;
  let source: Float64Array;
  if (isCandles1D(candles)) {
    ref = candles;
    source = candles;
  } else {
    ref = sliceCandles(candles, sequential);
    source = getCandleSource(ref, sourceType);
  }
  const res = new Float64Array(source.length);
  for (let i = period - 1; i < source.length; i += 1) {
    const window = source.subarray(i - period + 1, i + 1);
    const predicted = linearRegressionPredicted(window);
    const last = window[period - 1]!;
    res[i] = last !== 0 ? (100 * (last - predicted[period - 1]!)) / last : 0;
  }
  return sequential ? sameLength(ref, res) : res[res.length - 1]!;
}
