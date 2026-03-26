/**
 * PVI - Positive Volume Index
 *
 * :param candles: np.ndarray
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, sameLength, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

export function pvi(candles: OhlcvMatrix, sourceType: string = "close", sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  const volume = column(m, 5);
  const res = new Float64Array(source.length);
  res[0] = 1000;
  for (let i = 1; i < source.length; i += 1) {
    if (volume[i]! > volume[i - 1]!) {
      const prev = source[i - 1]!;
      res[i] = prev !== 0 ? res[i - 1]! * (1 + (source[i]! - prev) / prev) : res[i - 1]!;
    } else {
      res[i] = res[i - 1]!;
    }
  }
  return sequential ? sameLength(m, res) : res[res.length - 1]!;
}
