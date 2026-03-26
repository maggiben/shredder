/*
 RVI - Relative Volatility Index
 :param candles: np.ndarray
 :param period: int - default: 10
 :param ma_len: int - default: 14
 :param matype: int - default: 1
 :param devtype: int - default: 0
 :param source_type: str - default: "close"
 :param sequential: bool - default: False
 :return: float | np.ndarray
*/
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { sameLength } from "../candles/helpers.js";
import { movingStd } from "../series/series.js";
import { ma } from "./ma.js";
import { mean_ad } from "./mean_ad.js";
import { median_ad } from "./median_ad.js";

export function rvi(
  candles: IndicatorCandles,
  period: number = 10,
  maLen: number = 14,
  matype: number = 1,
  devtype: number = 0,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  if (matype === 24 || matype === 29) {
    throw new Error("VWMA (matype 24) and VWAP (matype 29) cannot be used in rvi indicator.");
  }
  const source = resolveSourceSeries(candles, sequential, sourceType);
  let dev: Float64Array;
  if (devtype === 0) {
    dev = movingStd(source, period);
  } else if (devtype === 1) {
    dev = mean_ad(source, period, "hl2", true) as Float64Array;
  } else if (devtype === 2) {
    dev = median_ad(source, period, "hl2", true) as Float64Array;
  } else {
    throw new Error("rvi: devtype must be 0, 1, or 2");
  }
  const diffLen = source.length - 1;
  const diff = new Float64Array(diffLen);
  for (let i = 0; i < diffLen; i += 1) {
    diff[i] = source[i + 1]! - source[i]!;
  }
  const diffPad = sameLength(source, diff);
  const up = new Float64Array(source.length);
  const down = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const d = diffPad[i]!;
    const dv = dev[i]!;
    up[i] = Number.isNaN(d) || d <= 0 ? 0 : Number.isNaN(dv) ? 0 : dv;
    down[i] = Number.isNaN(d) || d > 0 ? 0 : Number.isNaN(dv) ? 0 : dv;
  }
  const upAvg = ma(up, maLen, matype, "close", true) as Float64Array;
  const downAvg = ma(down, maLen, matype, "close", true) as Float64Array;
  const result = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const den = upAvg[i]! + downAvg[i]!;
    result[i] = den !== 0 ? (100 * upAvg[i]!) / den : 50;
  }
  return sequential ? result : result[result.length - 1]!;
}
