/**
 * AROONOSC - Aroon Oscillator
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

export function aroonosc(candles: OhlcvMatrix, period: number = 14, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const n = high.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return sequential ? result : Number.NaN;
  }
  for (let i = 0; i < period - 1; i += 1) {
    result[i] = Number.NaN;
  }
  for (let i = period - 1; i < n; i += 1) {
    const start = i - period + 1;
    let bestVal = high[start]!;
    let bestIdx = 0;
    let worstVal = low[start]!;
    let worstIdx = 0;
    for (let j = 0; j < period; j += 1) {
      const curHigh = high[start + j]!;
      const curLow = low[start + j]!;
      if (curHigh > bestVal) {
        bestVal = curHigh;
        bestIdx = j;
      }
      if (curLow < worstVal) {
        worstVal = curLow;
        worstIdx = j;
      }
    }
    result[i] = (100 * (bestIdx - worstIdx)) / period;
  }
  return sequential ? result : result[n - 1]!;
}
