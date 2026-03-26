/**
 * MFI - Money Flow Index
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

export function mfi(candles: OhlcvMatrix, period: number = 14, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const volume = column(m, 5);
  const n = m.length;
  const tp = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    tp[i] = (high[i]! + low[i]! + close[i]!) / 3;
  }
  const rawMf = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    rawMf[i] = tp[i]! * volume[i]!;
  }
  const posFlow = new Float64Array(n);
  const negFlow = new Float64Array(n);
  for (let i = 1; i < n; i += 1) {
    if (tp[i]! > tp[i - 1]!) {
      posFlow[i] = rawMf[i]!;
    } else if (tp[i]! < tp[i - 1]!) {
      negFlow[i] = rawMf[i]!;
    }
  }
  const mfiVals = new Float64Array(n);
  mfiVals.fill(Number.NaN);
  for (let i = period - 1; i < n; i += 1) {
    let rp = 0;
    let rn = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      rp += posFlow[j]!;
      rn += negFlow[j]!;
    }
    const ratio = rn !== 0 ? rp / rn : Number.POSITIVE_INFINITY;
    mfiVals[i] = 100 - 100 / (1 + ratio);
  }
  return sequential ? mfiVals : mfiVals[n - 1]!;
}
