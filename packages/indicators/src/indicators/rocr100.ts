/**
 * ROCR100 - Rate of change ratio 100 scale: (price/prevPrice)*100
 *
 * :param candles: np.ndarray
 * :param period: int - default: 10
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

export function rocr100(
  candles: IndicatorCandles,
  period: number = 10,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const res = new Float64Array(source.length);
  res.fill(Number.NaN);
  if (source.length > period) {
    for (let i = period; i < source.length; i += 1) {
      const prev = source[i - period]!;
      res[i] = prev !== 0 ? (source[i]! / prev) * 100 : Number.NaN;
    }
  }
  return sequential ? res : res[res.length - 1]!;
}
