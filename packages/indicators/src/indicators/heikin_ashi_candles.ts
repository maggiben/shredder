/**
 * Heikin Ashi Candles
 *
 * :param candles: np.ndarray
 * :param sequential: bool - default: False
 *
 * :return: HA(open, close, high, low)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { selectCols } from "../np/column.js";

export type HeikinAshi = { open: number | Float64Array; close: number | Float64Array; high: number | Float64Array; low: number | Float64Array };

const O = 0;
const C = 1;
const H = 2;
const L = 3;

export function heikin_ashi_candles(candles: OhlcvMatrix, sequential: boolean = false): HeikinAshi {
  const m = sliceCandles(candles, sequential);
  const rows = selectCols(m, [1, 2, 3, 4]);
  const n = rows.length;
  const haO = new Float64Array(n);
  const haC = new Float64Array(n);
  const haH = new Float64Array(n);
  const haL = new Float64Array(n);
  haO.fill(Number.NaN);
  haC.fill(Number.NaN);
  haH.fill(Number.NaN);
  haL.fill(Number.NaN);
  for (let i = 1; i < n; i += 1) {
    const src = rows[i]!;
    const prev = rows[i - 1]!;
    const ho = (prev[O]! + prev[C]!) / 2;
    const hc = (src[O]! + src[C]! + src[H]! + src[L]!) / 4;
    haO[i] = ho;
    haC[i] = hc;
    haH[i] = Math.max(src[H]!, ho, hc);
    haL[i] = Math.min(src[L]!, ho, hc);
  }
  if (sequential) {
    return { open: haO, close: haC, high: haH, low: haL };
  }
  const li = n - 1;
  return { open: haO[li]!, close: haC[li]!, high: haH[li]!, low: haL[li]! };
}
