/**
 * MASS - Mass Index
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

function calcEma(data: Float64Array, n: number): Float64Array {
  const alpha = 2.0 / (n + 1);
  const result = new Float64Array(data.length);
  result[0] = data[0]!;
  for (let i = 1; i < data.length; i += 1) {
    result[i] = alpha * data[i]! + (1 - alpha) * result[i - 1]!;
  }
  return result;
}

function massSum(ratio: Float64Array, period: number): Float64Array {
  const result = new Float64Array(ratio.length);
  for (let i = period - 1; i < ratio.length; i += 1) {
    let s = 0;
    for (let k = i - period + 1; k <= i; k += 1) {
      s += ratio[k]!;
    }
    result[i] = s;
  }
  return result;
}

export function mass(candles: OhlcvMatrix, period: number = 5, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const hl = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    hl[i] = high[i]! - low[i]!;
  }
  const ema1 = calcEma(hl, 9);
  const ema2 = calcEma(ema1, 9);
  const ratio = new Float64Array(hl.length);
  for (let i = 0; i < hl.length; i += 1) {
    ratio[i] = ema2[i]! !== 0 ? ema1[i]! / ema2[i]! : 0;
  }
  const res = massSum(ratio, period);
  return sequential ? sameLength(m, res) : res[res.length - 1]!;
}
