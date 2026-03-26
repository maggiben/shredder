/**
 * CC - Coppock Curve
 *
 * :param candles: np.ndarray
 * :param wma_period: int - default: 10
 * :param roc_short_period: int - default: 11
 * :param roc_long_period: int - default: 14
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { isCandles1D } from "../types.js";
import { getCandleSource } from "../candles/helpers.js";
import { roc } from "./roc.js";
import { wma } from "./wma.js";

export function cc(
  candles: IndicatorCandles,
  wmaPeriod: number = 10,
  rocShortPeriod: number = 11,
  rocLongPeriod: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const m = sliceCandles(candles, sequential);
    source = getCandleSource(m, sourceType);
  }
  const rocLong = roc(source, rocLongPeriod, sourceType, true) as Float64Array;
  const rocShort = roc(source, rocShortPeriod, sourceType, true) as Float64Array;
  const rocSum = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    rocSum[i] = rocLong[i]! + rocShort[i]!;
  }
  const res = wma(rocSum, wmaPeriod, sourceType, true) as Float64Array;
  return sequential ? res : res[res.length - 1]!;
}
