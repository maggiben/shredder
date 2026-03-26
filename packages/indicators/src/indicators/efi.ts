/**
 * EFI - Elders Force Index
 *
 * :param candles: np.ndarray
 * :param period: int - default: 13
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
function emaOnSeries(data: Float64Array, period: number): Float64Array {
  const n = data.length;
  const out = new Float64Array(n);
  out.fill(Number.NaN);
  if (n < period) {
    return out;
  }
  const alpha = 2.0 / (period + 1);
  let sumValue = 0;
  for (let i = 0; i < period; i += 1) {
    sumValue += data[i]!;
  }
  let emaVal = sumValue / period;
  out[period - 1] = emaVal;
  for (let i = period; i < n; i += 1) {
    emaVal = alpha * data[i]! + (1 - alpha) * emaVal;
    out[i] = emaVal;
  }
  return out;
}

export function efi(
  candles: OhlcvMatrix,
  period: number = 13,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  const volume = column(m, 5);
  const dif = new Float64Array(Math.max(0, source.length - 1));
  for (let i = 1; i < source.length; i += 1) {
    dif[i - 1] = (source[i]! - source[i - 1]!) * volume[i]!;
  }
  const res = emaOnSeries(dif, period);
  const padded = sameLength(m, res);
  return sequential ? padded : padded[padded.length - 1]!;
}
