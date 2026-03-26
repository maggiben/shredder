/**
 * Moving Average Adaptive Q
 *
 * :param candles: np.ndarray
 * :param period: int - default: 11
 * :param fast_period: int - default: 2
 * :param slow_period: int - default: 30
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, npShift, sameLength, sliceCandles } from "../candles/helpers.js";

function maaqFast(source: Float64Array, temp: Float64Array, period: number): Float64Array {
  const newseries = source.slice();
  for (let i = period; i < source.length; i += 1) {
    newseries[i] = newseries[i - 1]! + temp[i]! * (source[i]! - newseries[i - 1]!);
  }
  return newseries;
}

export function maaq(
  candles: IndicatorCandles,
  period: number = 11,
  fastPeriod: number = 2,
  slowPeriod: number = 30,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let refForLen: OhlcvMatrix | Float64Array;
  let source: Float64Array;
  if (isCandles1D(candles)) {
    refForLen = candles;
    source = candles;
  } else {
    const m = sliceCandles(candles, sequential);
    refForLen = m;
    source = getCandleSource(m, sourceType);
  }
  const clean: number[] = [];
  for (let i = 0; i < source.length; i += 1) {
    if (!Number.isNaN(source[i]!)) {
      clean.push(source[i]!);
    }
  }
  const s = Float64Array.from(clean);
  const shifted1 = npShift(s, 1);
  const shiftedP = npShift(s, period);
  const diff = new Float64Array(s.length);
  const signal = new Float64Array(s.length);
  for (let i = 0; i < s.length; i += 1) {
    diff[i] = Math.abs(s[i]! - shifted1[i]!);
    signal[i] = Math.abs(s[i]! - shiftedP[i]!);
  }
  const noise = new Float64Array(s.length);
  noise.fill(Number.NaN);
  let acc = 0;
  for (let i = 0; i < period; i += 1) {
    acc += diff[i]!;
  }
  noise[period - 1] = acc;
  for (let i = period; i < s.length; i += 1) {
    acc += diff[i]! - diff[i - period]!;
    noise[i] = acc;
  }
  const ratio = new Float64Array(s.length);
  for (let i = 0; i < s.length; i += 1) {
    ratio[i] = noise[i]! !== 0 ? signal[i]! / noise[i]! : 0;
  }
  const fastSc = 2 / (fastPeriod + 1);
  const slowSc = 2 / (slowPeriod + 1);
  const temp = new Float64Array(s.length);
  for (let i = 0; i < s.length; i += 1) {
    temp[i] = (ratio[i]! * fastSc + slowSc) ** 2;
  }
  const resInner = maaqFast(s, temp, period);
  const out = sameLength(refForLen, resInner);
  return sequential ? out : out[out.length - 1]!;
}
