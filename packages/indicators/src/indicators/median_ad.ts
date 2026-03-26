/*
 Median Absolute Deviation

 :param candles: np.ndarray
 :param period: int - default: 5
 :param source_type: str - default: "hl2"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";
import { slidingWindowView } from "../np/sliding.js";
import { medianAbsDeviation1d } from "../np/stats.js";

export function median_ad(
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
  const windows = slidingWindowView(source, period);
  const madShort = new Float64Array(windows.length);
  for (let i = 0; i < windows.length; i += 1) {
    madShort[i] = medianAbsDeviation1d(windows[i]!);
  }
  const res = sameLength(source, madShort);
  return sequential ? res : res[res.length - 1]!;
}
