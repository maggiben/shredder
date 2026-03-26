/**
 * CCI - Commodity Channel Index
 *
 * :param candles: np.ndarray
 * :param period: int - default: 14
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { cciFromTypicalPrice } from "../np/cci.js";

export function cci(candles: OhlcvMatrix, period: number = 14, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const n = m.length;
  const tp = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    tp[i] = (high[i]! + low[i]! + close[i]!) / 3;
  }
  const result = cciFromTypicalPrice(tp, period);
  return sequential ? result : result[n - 1]!;
}
