/**
 * BETA - compares the given candles close price to its benchmark (should be in the same time frame)
 *
 * :param candles: np.ndarray
 * :param benchmark_candles: np.ndarray
 * :param period: int - default: 5
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function beta(
  candles: OhlcvMatrix,
  benchmarkCandles: OhlcvMatrix,
  period: number = 5,
  sequential: boolean = false,
): number | Float64Array {
  const c = sliceCandles(candles, sequential);
  const b = sliceCandles(benchmarkCandles, sequential);
  const x = column(c, 2);
  const y = column(b, 2);
  const n = x.length;
  const out = new Float64Array(n);
  out.fill(Number.NaN);
  if (n < period) {
    return sequential ? out : Number.NaN;
  }
  for (let i = period - 1; i < n; i += 1) {
    let mx = 0;
    let my = 0;
    for (let j = 0; j < period; j += 1) {
      mx += x[i - period + 1 + j]!;
      my += y[i - period + 1 + j]!;
    }
    mx /= period;
    my /= period;
    let num = 0;
    let deny = 0;
    for (let j = 0; j < period; j += 1) {
      const dx = x[i - period + 1 + j]! - mx;
      const dy = y[i - period + 1 + j]! - my;
      num += dx * dy;
      deny += dy * dy;
    }
    out[i] = deny !== 0 ? num / deny : Number.NaN;
  }
  return sequential ? out : out[out.length - 1]!;
}
