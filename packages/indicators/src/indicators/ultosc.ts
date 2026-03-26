/**
 * ULTOSC - Ultimate Oscillator
 *
 * :param candles: np.ndarray
 * :param timeperiod1: int - default: 7
 * :param timeperiod2: int - default: 14
 * :param timeperiod3: int - default: 28
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

function rollingSum(data: Float64Array, window: number): Float64Array {
  const n = data.length;
  const out = new Float64Array(n);
  out.fill(Number.NaN);
  if (n < window) {
    return out;
  }
  let s = 0;
  for (let i = 0; i < window; i += 1) {
    s += data[i]!;
  }
  out[window - 1] = s;
  for (let i = window; i < n; i += 1) {
    s += data[i]! - data[i - window]!;
    out[i] = s;
  }
  return out;
}

export function ultosc(
  candles: OhlcvMatrix,
  timeperiod1: number = 7,
  timeperiod2: number = 14,
  timeperiod3: number = 28,
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const n = close.length;
  const bp = new Float64Array(n);
  const tr = new Float64Array(n);
  bp[0] = 0;
  tr[0] = high[0]! - low[0]!;
  for (let i = 1; i < n; i += 1) {
    bp[i] = close[i]! - Math.min(low[i]!, close[i - 1]!);
    tr[i] = Math.max(high[i]!, close[i - 1]!) - Math.min(low[i]!, close[i - 1]!);
  }
  const sumBp1 = rollingSum(bp, timeperiod1);
  const sumTr1 = rollingSum(tr, timeperiod1);
  const sumBp2 = rollingSum(bp, timeperiod2);
  const sumTr2 = rollingSum(tr, timeperiod2);
  const sumBp3 = rollingSum(bp, timeperiod3);
  const sumTr3 = rollingSum(tr, timeperiod3);
  const ult = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const a1 = sumTr1[i]! !== 0 ? sumBp1[i]! / sumTr1[i]! : Number.NaN;
    const a2 = sumTr2[i]! !== 0 ? sumBp2[i]! / sumTr2[i]! : Number.NaN;
    const a3 = sumTr3[i]! !== 0 ? sumBp3[i]! / sumTr3[i]! : Number.NaN;
    ult[i] = Number.isNaN(a1) || Number.isNaN(a2) || Number.isNaN(a3) ? Number.NaN : (100 * (4 * a1 + 2 * a2 + a3)) / 7;
  }
  return sequential ? ult : ult[ult.length - 1]!;
}
