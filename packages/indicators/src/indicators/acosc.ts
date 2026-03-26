/**
 * Acceleration / Deceleration Oscillator (AC)
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: AC(osc, change)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { mom1, smaConvolveValid } from "../np/rolling.js";

export type AcOscResult = {
  osc: number | Float64Array;
  change: number | Float64Array;
};

export function acosc(candles: OhlcvMatrix, sequential: boolean = false): AcOscResult {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const n = m.length;
  const med = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    med[i] = (high[i]! + low[i]!) / 2;
  }
  const sma5Med = smaConvolveValid(med, 5);
  const sma34Med = smaConvolveValid(med, 34);
  const ao = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    ao[i] = sma5Med[i]! - sma34Med[i]!;
  }
  const sma5Ao = smaConvolveValid(ao, 5);
  const res = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    res[i] = ao[i]! - sma5Ao[i]!;
  }
  const momValue = mom1(res);
  if (sequential) {
    return { osc: res, change: momValue };
  }
  const li = n - 1;
  return { osc: res[li]!, change: momValue[li]! };
}
