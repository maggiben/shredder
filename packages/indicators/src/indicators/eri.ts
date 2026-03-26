/**
 * Elder Ray Index (ERI)
 *
 * :param candles: np.ndarray
 * :param period: int - default: 13
 * :param matype: int - default: 1
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: ERI(bull, bear)
 */
import type { OhlcvMatrix } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { ma } from "./ma.js";

export type ERI = { bull: number | Float64Array; bear: number | Float64Array };

export function eri(
  candles: OhlcvMatrix,
  period: number = 13,
  matype: number = 1,
  sourceType: string = "close",
  sequential: boolean = false,
): ERI {
  const m = sliceCandles(candles, sequential);
  const source = getCandleSource(m, sourceType);
  let emaSeries: Float64Array;
  if (matype === 24 || matype === 29) {
    emaSeries = ma(m, period, matype, sourceType, true) as Float64Array;
  } else {
    emaSeries = ma(source, period, matype, sourceType, true) as Float64Array;
  }
  const high = column(m, 3);
  const low = column(m, 4);
  const bull = new Float64Array(high.length);
  const bear = new Float64Array(high.length);
  for (let i = 0; i < high.length; i += 1) {
    bull[i] = high[i]! - emaSeries[i]!;
    bear[i] = low[i]! - emaSeries[i]!;
  }
  if (sequential) {
    return { bull, bear };
  }
  const li = high.length - 1;
  return { bull: bull[li]!, bear: bear[li]! };
}
