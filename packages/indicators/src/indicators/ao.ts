/**
 * Awesome Oscillator
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: AO(osc, change)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { smaConvolveValid } from "../np/rolling.js";
import { mom1 } from "../np/rolling.js";

export type AoResult = {
  osc: number | Float64Array;
  change: number | Float64Array;
};

export function ao(candles: OhlcvMatrix, sequential: boolean = false): AoResult {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const n = m.length;
  const hl2 = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    hl2[i] = (high[i]! + low[i]!) / 2;
  }
  const sma5 = smaConvolveValid(hl2, 5);
  const sma34 = smaConvolveValid(hl2, 34);
  const osc = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    osc[i] = sma5[i]! - sma34[i]!;
  }
  const change = mom1(osc);
  if (sequential) {
    return { osc, change };
  }
  const li = n - 1;
  return { osc: osc[li]!, change: change[li]! };
}
