/*
 MACD - Moving Average Convergence/Divergence

 :param candles: np.ndarray
 :param fast_period: int - default: 12
 :param slow_period: int - default: 26
 :param signal_period: int - default: 9
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: MACD(macd, signal, hist)
*/
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { macd as macdRust } from "../series/series.js";

export type MacdResult =
  | { readonly macd: number; readonly signal: number; readonly hist: number }
  | { readonly macd: Float64Array; readonly signal: Float64Array; readonly hist: Float64Array };

export function macd(
  candles: IndicatorCandles,
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
  sourceType: string = "close",
  sequential: boolean = false,
): MacdResult {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    const matrix = sliceCandles(candles, sequential);
    source = getCandleSource(matrix, sourceType);
  }
  if (source.length === 0) {
    if (!sequential) {
      return { macd: Number.NaN, signal: Number.NaN, hist: Number.NaN };
    }
    return { macd: new Float64Array(), signal: new Float64Array(), hist: new Float64Array() };
  }
  const { macd: macdLine, signal: signalLine, hist } = macdRust(source, fastPeriod, slowPeriod, signalPeriod);
  if (sequential) {
    return { macd: macdLine, signal: signalLine, hist };
  }
  const li = macdLine.length - 1;
  return {
    macd: macdLine[li]!,
    signal: signalLine[li]!,
    hist: hist[li]!,
  };
}
