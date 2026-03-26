/**
 * Center of Gravity (CG)
 *
 * :param candles: np.ndarray
 * :param period: int - default: 10
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";

function goFast(source: Float64Array, period: number): Float64Array {
  const res = new Float64Array(source.length);
  res.fill(Number.NaN);
  for (let i = 0; i < source.length; i += 1) {
    if (i > period) {
      let num = 0;
      let denom = 0;
      for (let count = 0; count < period - 1; count += 1) {
        const close = source[i - count]!;
        if (!Number.isNaN(close)) {
          num += (1 + count) * close;
          denom += close;
        }
      }
      res[i] = denom !== 0 ? -num / denom : 0;
    }
  }
  return res;
}

export function cg(
  candles: IndicatorCandles,
  period: number = 10,
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
  const res = goFast(source, period);
  if (sequential) {
    return sameLength(ref, res);
  }
  return res[res.length - 1]!;
}
