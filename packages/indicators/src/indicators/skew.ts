/**
 * Skewness
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param source_type: str - default: "hl2"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";
import { slidingWindowView } from "../np/sliding.js";
import { skew1d } from "../np/stats.js";

export function skew(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "hl2",
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
  const wins = slidingWindowView(source, period);
  const core = new Float64Array(wins.length);
  for (let i = 0; i < wins.length; i += 1) {
    core[i] = skew1d(wins[i]!);
  }
  const padded = new Float64Array(source.length);
  padded.fill(Number.NaN);
  for (let i = 0; i < core.length; i += 1) {
    padded[period - 1 + i] = core[i]!;
  }
  const res = sameLength(ref, padded);
  return sequential ? res : res[res.length - 1]!;
}
