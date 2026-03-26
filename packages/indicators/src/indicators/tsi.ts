/**
 * True strength index (TSI)
 *
 * :param candles: np.ndarray
 * :param long_period: int - default: 25
 * :param short_period: int - default: 13
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function emaTsi(series: Float64Array, period: number): Float64Array {
  const alpha = 2 / (period + 1);
  const out = new Float64Array(series.length);
  out[0] = series[0]!;
  for (let i = 1; i < series.length; i += 1) {
    out[i] = alpha * series[i]! + (1 - alpha) * out[i - 1]!;
  }
  return out;
}

export function tsi(
  candles: IndicatorCandles,
  longPeriod: number = 25,
  shortPeriod: number = 13,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const mom = new Float64Array(source.length);
  mom[0] = 0;
  for (let i = 1; i < source.length; i += 1) {
    mom[i] = source[i]! - source[i - 1]!;
  }
  const emaMom = emaTsi(mom, longPeriod);
  const doubleEmaMom = emaTsi(emaMom, shortPeriod);
  const absMom = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    absMom[i] = Math.abs(mom[i]!);
  }
  const emaAbsMom = emaTsi(absMom, longPeriod);
  const doubleEmaAbsMom = emaTsi(emaAbsMom, shortPeriod);
  const r = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    const den = doubleEmaAbsMom[i]!;
    const v = den !== 0 ? (100 * doubleEmaMom[i]!) / den : 0;
    r[i] = Number.isFinite(v) ? v : 0;
  }
  return sequential ? r : r[r.length - 1]!;
}
