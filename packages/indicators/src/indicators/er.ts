/**
 * ER - The Kaufman Efficiency indicator
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

export function er(
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
  const n = source.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  for (let t = period; t < n; t += 1) {
    const ch = Math.abs(source[t]! - source[t - period]!);
    let vol = 0;
    for (let j = t - period; j < t; j += 1) {
      vol += Math.abs(source[j + 1]! - source[j]!);
    }
    res[t] = vol !== 0 ? ch / vol : Number.NaN;
  }
  if (sequential) {
    return sameLength(ref, res);
  }
  return res[res.length - 1]!;
}
