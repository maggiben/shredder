/**
 * CFO - Chande Forcast Oscillator
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param scalar: float - default: 100
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function computeCfo(source: Float64Array, period: number, scalar: number): Float64Array {
  const n = source.length;
  const res = new Float64Array(n);
  for (let i = 0; i < period - 1; i += 1) {
    res[i] = Number.NaN;
  }
  let Sx = 0;
  let Sxx = 0;
  for (let j = 0; j < period; j += 1) {
    Sx += j;
    Sxx += j * j;
  }
  const denom = period * Sxx - Sx * Sx;
  for (let i = period - 1; i < n; i += 1) {
    let sumY = 0;
    let sumXY = 0;
    for (let j = 0; j < period; j += 1) {
      const yVal = source[i - period + 1 + j]!;
      sumY += yVal;
      sumXY += yVal * j;
    }
    const slope = (period * sumXY - Sx * sumY) / denom;
    const intercept = (sumY - slope * Sx) / period;
    const regVal = intercept + slope * (period - 1);
    const cur = source[i]!;
    res[i] = cur !== 0 ? (scalar * (cur - regVal)) / cur : Number.NaN;
  }
  return res;
}

export function cfo(
  candles: IndicatorCandles,
  period: number = 14,
  scalar: number = 100,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array | null {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const res = computeCfo(source, period, scalar);
  if (sequential) {
    return res;
  }
  const last = res[res.length - 1]!;
  return Number.isNaN(last) ? null : last;
}
