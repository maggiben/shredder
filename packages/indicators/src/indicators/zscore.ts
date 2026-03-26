/**
 * zScore
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param matype: int - default: 0
 * :param nbdev: float - default: 1
 * :param devtype: int - default: 0
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { slidingWindowView } from "../np/sliding.js";
import { mean1d } from "../np/sliding.js";
import { ma } from "./ma.js";
import { mean_ad } from "./mean_ad.js";
import { median_ad } from "./median_ad.js";

export function zscore(
  candles: IndicatorCandles,
  period: number = 14,
  matype: number = 0,
  nbdev: number = 1,
  devtype: number = 0,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = isCandles1D(candles)
    ? candles
    : getCandleSource(sliceCandles(candles, sequential), sourceType);
  let means: Float64Array;
  if (!isCandles1D(candles) && (matype === 24 || matype === 29)) {
    means = ma(sliceCandles(candles as OhlcvMatrix, sequential), period, matype, sourceType, true) as Float64Array;
  } else {
    means = ma(source, period, matype, sourceType, true) as Float64Array;
  }
  let sigmas: Float64Array;
  if (devtype === 0) {
    sigmas = new Float64Array(source.length);
    sigmas.fill(Number.NaN);
    if (source.length >= period) {
      const wins = slidingWindowView(source, period);
      for (let i = 0; i < wins.length; i += 1) {
        const w = wins[i]!;
        const mu = mean1d(w);
        let v = 0;
        for (let k = 0; k < w.length; k += 1) {
          const d = w[k]! - mu;
          v += d * d;
        }
        sigmas[period - 1 + i] = Math.sqrt(v / period) * nbdev;
      }
    }
  } else if (devtype === 1) {
    sigmas = mean_ad(source, period, "close", true) as Float64Array;
    for (let i = 0; i < sigmas.length; i += 1) {
      sigmas[i] = sigmas[i]! * nbdev;
    }
  } else {
    sigmas = median_ad(source, period, "close", true) as Float64Array;
    for (let i = 0; i < sigmas.length; i += 1) {
      sigmas[i] = sigmas[i]! * nbdev;
    }
  }
  const zScores = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const s = sigmas[i]!;
    zScores[i] = s !== 0 ? (source[i]! - means[i]!) / s : Number.NaN;
  }
  return sequential ? zScores : zScores[zScores.length - 1]!;
}
