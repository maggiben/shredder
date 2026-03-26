/**
 * Ehlers Decycler Oscillator
 *
 * :param candles: np.ndarray
 * :param hp_period: int - default: 125
 * :param k: float - default: 1
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { highPass2Fast } from "../np/ehlers.js";

export function dec_osc(
  candles: IndicatorCandles,
  hpPeriod: number = 125,
  k: number = 1,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const hp = highPass2Fast(source, hpPeriod);
  const dec = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    dec[i] = source[i]! - hp[i]!;
  }
  const decosc = highPass2Fast(dec, 0.5 * hpPeriod);
  const res = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const s = source[i]!;
    res[i] = s !== 0 ? (100 * k * decosc[i]!) / s : Number.NaN;
  }
  return sequential ? res : res[res.length - 1]!;
}
