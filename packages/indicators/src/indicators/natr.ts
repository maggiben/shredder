/**
 * NATR - Normalized Average True Range
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { atr as atrCore } from "../series/candles.js";
import { column } from "../np/column.js";

export function natr(candles: OhlcvMatrix, period: number = 14, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const atr = atrCore(m, period);
  const close = column(m, 2);
  const n = m.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const c = close[i]!;
    out[i] = c !== 0 && !Number.isNaN(c) ? (atr[i]! / c) * 100 : Number.NaN;
  }
  return sequential ? out : out[n - 1]!;
}
