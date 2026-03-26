/**
 * Ichimoku Cloud (sequential components)
 *
 * :param candles: np.ndarray
 * :param conversion_line_period: int - default: 9
 * :param base_line_period: int - default: 26
 * :param lagging_line_period: int - default: 52
 * :param displacement: int - default: 26
 * :param sequential: bool - default: False
 *
 * :return: IchimokuCloud
 */
import type { OhlcvMatrix } from "../types.js";
import { npShift, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { slidingWindowView } from "../np/sliding.js";

export type IchimokuCloudSeq = {
  conversion_line: number | Float64Array;
  base_line: number | Float64Array;
  span_a: number | Float64Array;
  span_b: number | Float64Array;
  lagging_line: number | Float64Array;
  future_span_a: number | Float64Array;
  future_span_b: number | Float64Array;
};

function rollMax(a: Float64Array, period: number): Float64Array {
  const n = a.length;
  const r = new Float64Array(n);
  r.fill(Number.NaN);
  if (n < period) {
    return r;
  }
  const wins = slidingWindowView(a, period);
  for (let i = 0; i < wins.length; i += 1) {
    let m = wins[i]![0]!;
    for (let k = 1; k < period; k += 1) {
      m = Math.max(m, wins[i]![k]!);
    }
    r[period - 1 + i] = m;
  }
  return r;
}

function rollMin(a: Float64Array, period: number): Float64Array {
  const n = a.length;
  const r = new Float64Array(n);
  r.fill(Number.NaN);
  if (n < period) {
    return r;
  }
  const wins = slidingWindowView(a, period);
  for (let i = 0; i < wins.length; i += 1) {
    let m = wins[i]![0]!;
    for (let k = 1; k < period; k += 1) {
      m = Math.min(m, wins[i]![k]!);
    }
    r[period - 1 + i] = m;
  }
  return r;
}

function lineHelper(candles: OhlcvMatrix, period: number): Float64Array {
  const hi = column(candles, 3);
  const lo = column(candles, 4);
  const rh = rollMax(hi, period);
  const rl = rollMin(lo, period);
  const out = new Float64Array(hi.length);
  for (let i = 0; i < hi.length; i += 1) {
    out[i] = (rh[i]! + rl[i]!) / 2;
  }
  return out;
}

export function ichimoku_cloud_seq(
  candles: OhlcvMatrix,
  conversionLinePeriod: number = 9,
  baseLinePeriod: number = 26,
  laggingLinePeriod: number = 52,
  displacement: number = 26,
  sequential: boolean = false,
): IchimokuCloudSeq {
  if (candles.length < laggingLinePeriod + displacement) {
    throw new Error("Too few candles available for lagging_line_period + displacement.");
  }
  const m = sliceCandles(candles, sequential);
  const conversionLine = lineHelper(m, conversionLinePeriod);
  const baseLine = lineHelper(m, baseLinePeriod);
  const spanBPre = lineHelper(m, laggingLinePeriod);
  const spanB = npShift(spanBPre, displacement);
  const spanAPre = new Float64Array(conversionLine.length);
  for (let i = 0; i < conversionLine.length; i += 1) {
    spanAPre[i] = (conversionLine[i]! + baseLine[i]!) / 2;
  }
  const spanA = npShift(spanAPre, displacement);
  const close = column(m, 2);
  const laggingLine = npShift(close, displacement - 1);
  if (sequential) {
    return {
      conversion_line: conversionLine,
      base_line: baseLine,
      span_a: spanA,
      span_b: spanB,
      lagging_line: laggingLine,
      future_span_a: spanAPre,
      future_span_b: spanBPre,
    };
  }
  const li = conversionLine.length - 1;
  return {
    conversion_line: conversionLine[li]!,
    base_line: baseLine[li]!,
    span_a: spanA[li]!,
    span_b: spanB[li]!,
    lagging_line: laggingLine[li]!,
    future_span_a: spanAPre[li]!,
    future_span_b: spanBPre[li]!,
  };
}
