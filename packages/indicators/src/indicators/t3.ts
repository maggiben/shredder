/**
 * T3 - Triple Exponential Moving Average (T3)
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param vfactor: float - default: 0
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { t3FromSource } from "../series/extra.js";

export function t3(
  candles: IndicatorCandles,
  period: number = 5,
  vfactor: number = 0,
  _sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, _sourceType);
  const seq = t3FromSource(source, period, vfactor);
  return sequential ? seq : seq[seq.length - 1]!;
}
