/**
 * Gator Oscillator by Bill M. Williams
 *
 * :param candles: np.ndarray
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: GATOR(upper, lower, upper_change, lower_change)
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, npShift, sliceCandles } from "../candles/helpers.js";
import { numpyEwma } from "../candles/numpy-ewma.js";

export type GatoroscResult = {
  upper: number | Float64Array;
  lower: number | Float64Array;
  upper_change: number | Float64Array;
  lower_change: number | Float64Array;
};

export function gatorosc(
  candles: OhlcvMatrix,
  source_type: string = "close",
  sequential: boolean = false,
): GatoroscResult {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, source_type);
  const jaw = npShift(numpyEwma(source, 13), 8);
  const teeth = npShift(numpyEwma(source, 8), 5);
  const lips = npShift(numpyEwma(source, 5), 3);
  const n = source.length;
  const upper = new Float64Array(n);
  const lower = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    upper[i] = Math.abs(jaw[i]! - teeth[i]!);
    lower[i] = -Math.abs(teeth[i]! - lips[i]!);
  }
  const upperChange = new Float64Array(n);
  const lowerChange = new Float64Array(n);
  upperChange[0] = Number.NaN;
  lowerChange[0] = Number.NaN;
  for (let i = 1; i < n; i += 1) {
    upperChange[i] = upper[i]! - upper[i - 1]!;
    lowerChange[i] = -(lower[i]! - lower[i - 1]!);
  }
  if (sequential) {
    return { upper, lower, upper_change: upperChange, lower_change: lowerChange };
  }
  const li = n - 1;
  return {
    upper: upper[li]!,
    lower: lower[li]!,
    upper_change: upperChange[li]!,
    lower_change: lowerChange[li]!,
  };
}
