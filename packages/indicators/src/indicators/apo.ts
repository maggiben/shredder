/**
 * APO - Absolute Price Oscillator
 *
 * :param candles: np.ndarray
 * :param fast_period: int - default: 12
 * :param slow_period: int - default: 26
 * :param matype: int - default: 0
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { ma } from "./ma.js";

export function apo(
  candles: IndicatorCandles,
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  matype: number = 0,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  if (isCandles1D(candles)) {
    const fastSeq = ma(candles, fastPeriod, matype, sourceType, true) as Float64Array;
    const slowSeq = ma(candles, slowPeriod, matype, sourceType, true) as Float64Array;
    const n = candles.length;
    const res = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      res[i] = fastSeq[i]! - slowSeq[i]!;
    }
    return sequential ? res : res[n - 1]!;
  }
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  let res: Float64Array;
  if (matype === 24 || matype === 29) {
    const fastSeq = ma(m, fastPeriod, matype, sourceType, true) as Float64Array;
    const slowSeq = ma(m, slowPeriod, matype, sourceType, true) as Float64Array;
    const n = fastSeq.length;
    res = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      res[i] = fastSeq[i]! - slowSeq[i]!;
    }
  } else {
    const fastSeq = ma(source, fastPeriod, matype, sourceType, true) as Float64Array;
    const slowSeq = ma(source, slowPeriod, matype, sourceType, true) as Float64Array;
    const n = source.length;
    res = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      res[i] = fastSeq[i]! - slowSeq[i]!;
    }
  }
  return sequential ? res : res[res.length - 1]!;
}
