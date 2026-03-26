/*
 RSMK - Relative Strength

 :param candles: np.ndarray
 :param candles_compare: np.ndarray
 :param lookback: int - default: 90
 :param period: int - default: 3
 :param signal_period: int - default: 20
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";

export type RsmkResult =
  | { readonly indicator: number; readonly signal: number }
  | { readonly indicator: Float64Array; readonly signal: Float64Array };

function emaThroughLeadingNaN(series: Float64Array, periodVal: number): Float64Array {
  const alpha = 2.0 / (Math.max(1.0, periodVal) + 1.0);
  const n = series.length;
  const out = new Float64Array(n);
  out.fill(Number.NaN);
  let startIdx = -1;
  for (let i = 0; i < n; i += 1) {
    if (!Number.isNaN(series[i])) {
      startIdx = i;
      break;
    }
  }
  if (startIdx < 0) {
    return out;
  }
  out[startIdx] = series[startIdx]!;
  for (let i = startIdx + 1; i < n; i += 1) {
    const v = series[i]!;
    const prev = out[i - 1]!;
    if (Number.isNaN(v)) {
      out[i] = prev;
    } else if (Number.isNaN(prev)) {
      out[i] = v;
    } else {
      out[i] = alpha * v + (1 - alpha) * prev;
    }
  }
  return out;
}

export function rsmk(
  candles: IndicatorCandles,
  candlesCompare: IndicatorCandles,
  lookback: number = 90,
  period: number = 3,
  signalPeriod: number = 20,
  sourceType: string = "close",
  sequential: boolean = false,
): RsmkResult {
  if (isCandles1D(candles) || isCandles1D(candlesCompare)) {
    throw new Error("rsmk requires OHLCV candle matrices for both series");
  }
  let m1 = sliceCandles(candles, sequential) as OhlcvMatrix;
  let m2 = sliceCandles(candlesCompare, sequential) as OhlcvMatrix;
  if (!sequential && m1.length > 240) {
    m1 = m1.slice(-240);
    m2 = m2.slice(-240);
  }
  const source = getCandleSource(m1, sourceType);
  const sourceCompare = getCandleSource(m2, sourceType);
  const logRatio = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    logRatio[i] = Math.log(source[i]! / sourceCompare[i]!);
  }
  const mom = new Float64Array(source.length);
  mom.fill(Number.NaN);
  if (logRatio.length > lookback) {
    for (let i = lookback; i < logRatio.length; i += 1) {
      mom[i] = logRatio[i]! - logRatio[i - lookback]!;
    }
  }
  const rsmkIndicator = emaThroughLeadingNaN(mom, period);
  for (let i = 0; i < rsmkIndicator.length; i += 1) {
    if (!Number.isNaN(rsmkIndicator[i])) {
      rsmkIndicator[i] = rsmkIndicator[i]! * 100.0;
    }
  }
  const rsmkSignal = emaThroughLeadingNaN(rsmkIndicator, signalPeriod);
  if (sequential) {
    return { indicator: rsmkIndicator, signal: rsmkSignal };
  }
  const li = rsmkIndicator.length - 1;
  return { indicator: rsmkIndicator[li]!, signal: rsmkSignal[li]! };
}
