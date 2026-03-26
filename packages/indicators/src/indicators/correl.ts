/**
 * CORREL - Pearson's Correlation Coefficient (r)
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function correl(candles: OhlcvMatrix, period: number = 5, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const x = column(m, 3);
  const y = column(m, 4);
  const n = x.length;
  const res = new Float64Array(n);
  res.fill(Number.NaN);
  if (n < period) {
    return sequential ? res : res[res.length - 1]!;
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
    let denx = 0;
    let deny = 0;
    for (let j = 0; j < period; j += 1) {
      const dx = x[i - period + 1 + j]! - mx;
      const dy = y[i - period + 1 + j]! - my;
      num += dx * dy;
      denx += dx * dx;
      deny += dy * dy;
    }
    const den = Math.sqrt(denx * deny);
    res[i] = den !== 0 ? num / den : Number.NaN;
  }
  return sequential ? res : res[res.length - 1]!;
}
