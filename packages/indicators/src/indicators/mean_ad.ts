/*
 Mean Absolute Deviation

 :param candles: np.ndarray
 :param period: int - default: 5
 :param source_type: str - default: "hl2"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";
import { slidingWindowView, nanMeanLastAxis } from "../np/sliding.js";

export function mean_ad(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "hl2",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const m = sliceCandles(candles, sequential);
    source = getCandleSource(m, sourceType);
  }
  const swv = slidingWindowView(source, period);
  const winMeans = nanMeanLastAxis(swv);
  const paddedMean = sameLength(source, winMeans);
  const absDiff = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    absDiff[i] = Math.abs(source[i]! - paddedMean[i]!);
  }
  const smvAbs = slidingWindowView(absDiff, period);
  const mad = nanMeanLastAxis(smvAbs);
  const res = sameLength(source, mad);
  return sequential ? res : res[res.length - 1]!;
}
