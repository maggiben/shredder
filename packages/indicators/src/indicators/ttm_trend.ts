/**
 * TTM Trend
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param source_type: str - default: "hl2"
 * :param sequential: bool - default: False
 *
 * :return: bool | Uint8Array (as 0/1 array for sequential)
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { slidingWindowView } from "../np/sliding.js";
import { mean1d } from "../np/sliding.js";

export function ttm_trend(
  candles: OhlcvMatrix,
  period: number = 5,
  sourceType: string = "hl2",
  sequential: boolean = false,
): boolean | Uint8Array {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  const close = column(m, 2);
  const wins = slidingWindowView(source, period);
  const trendAvgCore = new Float64Array(wins.length);
  for (let i = 0; i < wins.length; i += 1) {
    trendAvgCore[i] = mean1d(wins[i]!);
  }
  const trendAvg = new Float64Array(source.length);
  trendAvg.fill(Number.NaN);
  for (let i = 0; i < trendAvgCore.length; i += 1) {
    trendAvg[period - 1 + i] = trendAvgCore[i]!;
  }
  const taFull = sameLength(m, trendAvg);
  const res = new Uint8Array(close.length);
  for (let i = 0; i < close.length; i += 1) {
    res[i] = close[i]! > taFull[i]! ? 1 : 0;
  }
  if (sequential) {
    return res;
  }
  return res[res.length - 1]! === 1;
}
