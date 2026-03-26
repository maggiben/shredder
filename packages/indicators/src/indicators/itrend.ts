/**
 * Instantaneous Trendline
 *
 * :param candles: np.ndarray
 * :param alpha: float - default: 0.07
 * :param source_type: str - default: "hl2"
 * :param sequential: bool - default: False
 *
 * :return: ITREND(signal, it, trigger)
 */
import type { IndicatorCandles } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { isCandles1D } from "../types.js";

export type ITrend = { signal: number | Float64Array; it: number | Float64Array; trigger: number | Float64Array };

function itrendFast(source: Float64Array, alpha: number): { signal: Float64Array; it: Float64Array; trigger: Float64Array } {
  const it = source.slice();
  for (let i = 2; i < 7 && i < source.length; i += 1) {
    it[i] = (source[i]! + 2 * source[i - 1]! + source[i - 2]!) / 4;
  }
  for (let i = 7; i < source.length; i += 1) {
    it[i] =
      (alpha - (alpha * alpha) / 4) * source[i]! +
      ((alpha * alpha) / 2) * source[i - 1]! -
      (alpha - (alpha * alpha * 3) / 4) * source[i - 2]! +
      2 * (1 - alpha) * it[i - 1]! -
      (1 - alpha) ** 2 * it[i - 2]!;
  }
  const lag2 = new Float64Array(it.length);
  for (let i = 0; i < it.length; i += 1) {
    if (i < 20) {
      lag2[i] = it[i]!;
    } else {
      lag2[i] = it[i - 20]!;
    }
  }
  const trigger = new Float64Array(it.length);
  for (let i = 0; i < it.length; i += 1) {
    trigger[i] = 2 * it[i]! - lag2[i]!;
  }
  const signal = new Float64Array(it.length);
  for (let i = 0; i < it.length; i += 1) {
    signal[i] = (trigger[i]! > it[i]! ? 1 : 0) - (trigger[i]! < it[i]! ? 1 : 0);
  }
  return { signal, it, trigger };
}

export function itrend(
  candles: IndicatorCandles,
  alpha: number = 0.07,
  sourceType: string = "hl2",
  sequential: boolean = false,
): ITrend {
  const source = isCandles1D(candles)
    ? candles
    : getCandleSource(sliceCandles(candles, sequential), sourceType);
  const { signal, it, trigger } = itrendFast(source, alpha);
  if (sequential) {
    return { signal, it, trigger };
  }
  const li = source.length - 1;
  return { signal: signal[li]!, it: it[li]!, trigger: trigger[li]! };
}
