/**
 * minmax - Get extrema
 *
 * :param candles: np.ndarray
 * :param order: int - default = 3
 * :param sequential: bool - default: False
 *
 * :return: EXTREMA(is_min, is_max, last_min, last_max)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { argrelMaxIndices, argrelMinIndices } from "../np/extrema.js";
import { ffil1d } from "../np/ffill.js";

export type MinMax = {
  is_min: number | Float64Array;
  is_max: number | Float64Array;
  last_min: number | Float64Array;
  last_max: number | Float64Array;
};

export function minmax(candles: OhlcvMatrix, order: number = 3, sequential: boolean = false): MinMax {
  const m = sliceCandles(candles, sequential);
  const low = column(m, 4);
  const high = column(m, 3);
  const isMin = new Float64Array(low.length);
  const isMax = new Float64Array(high.length);
  isMin.fill(Number.NaN);
  isMax.fill(Number.NaN);
  for (const ix of argrelMinIndices(low, order)) {
    isMin[ix] = low[ix]!;
  }
  for (const ix of argrelMaxIndices(high, order)) {
    isMax[ix] = high[ix]!;
  }
  const lastMin = ffil1d(isMin);
  const lastMax = ffil1d(isMax);
  if (sequential) {
    return { is_min: isMin, is_max: isMax, last_min: lastMin, last_max: lastMax };
  }
  const li = low.length - 1;
  const idx = Math.max(0, li - (order + 1));
  return {
    is_min: isMin[idx]!,
    is_max: isMax[idx]!,
    last_min: lastMin[li]!,
    last_max: lastMax[li]!,
  };
}
