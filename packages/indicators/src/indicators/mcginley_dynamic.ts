/**
 * McGinley Dynamic
 *
 * :param candles: np.ndarray
 * :param period: int - default: 10
 * :param k: float - default: 0.6
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";

function mdFast(source: Float64Array, k: number, period: number): Float64Array {
  const mg = new Float64Array(source.length);
  mg.fill(Number.NaN);
  for (let i = 0; i < source.length; i += 1) {
    if (i === 0) {
      mg[i] = source[i]!;
    } else {
      const denom = Math.max(k * period * (source[i]! / mg[i - 1]!) ** 4, 1);
      mg[i] = mg[i - 1]! + (source[i]! - mg[i - 1]!) / denom;
    }
  }
  return mg;
}

export function mcginley_dynamic(
  candles: IndicatorCandles,
  period: number = 10,
  k: number = 0.6,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  let source: Float64Array;
  if (isCandles1D(candles)) {
    source = candles;
  } else {
    source = getCandleSource(sliceCandles(candles, sequential), sourceType);
  }
  const mg = mdFast(source, k, period);
  return sequential ? mg : mg[mg.length - 1]!;
}
