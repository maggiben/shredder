/**
 * TRIX - 1-day Rate-Of-Change (ROC) of a Triple Smooth EMA
 *
 * :param candles: np.ndarray
 * :param period: int - default: 18
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { ema as emaCore } from "../series/index.js";

export function trix(
  candles: IndicatorCandles,
  period: number = 18,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const logSource = new Float64Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    logSource[i] = Math.log(Math.max(source[i]!, 1e-300));
  }
  const ema1 = emaCore(logSource, period);
  const ema2 = emaCore(ema1, period);
  const ema3 = emaCore(ema2, period);
  const result = new Float64Array(source.length);
  result[0] = Number.NaN;
  for (let i = 1; i < source.length; i += 1) {
    result[i] = (ema3[i]! - ema3[i - 1]!) * 10000;
  }
  return sequential ? result : result[result.length - 1]!;
}
