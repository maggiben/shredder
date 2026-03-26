/**
 * PPO - Percentage Price Oscillator
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

export function ppo(
  candles: IndicatorCandles,
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  matype: number = 0,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let fastMa: Float64Array;
  let slowMa: Float64Array;
  if (!isCandles1D(candles) && (matype === 24 || matype === 29)) {
    const m = sliceCandles(candles, sequential) as OhlcvMatrix;
    fastMa = ma(m, fastPeriod, matype, sourceType, true) as Float64Array;
    slowMa = ma(m, slowPeriod, matype, sourceType, true) as Float64Array;
  } else {
    const source = isCandles1D(candles)
      ? candles
      : getCandleSource(sliceCandles(candles, sequential), sourceType);
    fastMa = ma(source, fastPeriod, matype, sourceType, true) as Float64Array;
    slowMa = ma(source, slowPeriod, matype, sourceType, true) as Float64Array;
  }
  const res = new Float64Array(fastMa.length);
  for (let i = 0; i < fastMa.length; i += 1) {
    const s = slowMa[i]!;
    res[i] = s !== 0 ? (100 * (fastMa[i]! - s)) / s : Number.NaN;
  }
  return sequential ? res : res[res.length - 1]!;
}
