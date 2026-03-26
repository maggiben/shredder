/**
 * EMV - Ease of Movement
 *
 * :param candles: np.ndarray
 * :param length: int - default: 14
 * :param div: int - default: 10000
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

function emvInner(high: Float64Array, low: Float64Array, volume: Float64Array, length: number, div: number): Float64Array {
  const n = high.length;
  const hl2 = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    hl2[i] = (high[i]! + low[i]!) / 2;
  }
  const hl2Change = new Float64Array(n);
  for (let i = 1; i < n; i += 1) {
    hl2Change[i] = hl2[i]! - hl2[i - 1]!;
  }
  const emvRaw = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const v = volume[i]!;
    emvRaw[i] = v !== 0 ? (div * hl2Change[i]! * (high[i]! - low[i]!)) / v : 0;
  }
  const result = new Float64Array(n);
  for (let i = length - 1; i < n; i += 1) {
    let s = 0;
    for (let k = i - length + 1; k <= i; k += 1) {
      s += emvRaw[k]!;
    }
    result[i] = s / length;
  }
  return result;
}

export function emv(
  candles: OhlcvMatrix,
  length: number = 14,
  div: number = 10000,
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const volume = column(m, 5);
  const res = emvInner(high, low, volume, length, div);
  if (sequential) {
    return sameLength(m, res);
  }
  return res[res.length - 1]!;
}
