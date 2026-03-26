/**
 * CMO - Chande Momentum Oscillator
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function cmoNumba(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n <= 1) {
    return result;
  }
  if (n - 1 < period) {
    return result;
  }
  for (let i = period; i < n; i += 1) {
    let posSum = 0;
    let negSum = 0;
    for (let j = i - period; j < i; j += 1) {
      const d = source[j + 1]! - source[j]!;
      if (d > 0) {
        posSum += d;
      } else if (d < 0) {
        negSum += -d;
      }
    }
    const denom = posSum + negSum;
    result[i] = denom === 0 ? 0 : (100 * (posSum - negSum)) / denom;
  }
  return result;
}

export function cmo(
  candles: IndicatorCandles,
  period: number = 14,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const result = cmoNumba(source, period);
  return sequential ? result : result[result.length - 1]!;
}
