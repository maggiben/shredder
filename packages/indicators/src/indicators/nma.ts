/**
 * Natural Moving Average
 *
 * :param candles: np.ndarray
 * :param period: int - default: 40
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function nmaFast(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const clipped = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    clipped[i] = Math.max(source[i]!, 1e-10);
  }
  const ln = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    ln[i] = Math.log(clipped[i]!) * 1000;
  }
  const newseries = new Float64Array(n);
  newseries.fill(Number.NaN);
  for (let j = period + 1; j < n; j += 1) {
    let num = 0;
    let denom = 0;
    for (let i = 0; i < period; i += 1) {
      const oi = Math.abs(ln[j - i]! - ln[j - i - 1]!);
      num += oi * (Math.sqrt(i + 1) - Math.sqrt(i));
      denom += oi;
    }
    const ratio = denom !== 0 ? num / denom : 0;
    const ii = period - 1;
    newseries[j] = clipped[j - ii]! * ratio + clipped[j - ii - 1]! * (1 - ratio);
  }
  return newseries;
}

export function nma(
  candles: IndicatorCandles,
  period: number = 40,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const res = nmaFast(source, period);
  return sequential ? res : res[res.length - 1]!;
}
