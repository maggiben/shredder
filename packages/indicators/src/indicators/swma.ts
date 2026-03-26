/**
 * Symmetric Weighted Moving Average (SWMA)
 *
 * :param candles: np.ndarray
 * :param period: int - default: 5
 * :param source_type: str - default: "close"
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { resolveSourceSeries, sameLength, sliceCandles } from "../candles/helpers.js";
import { symmetricTriangleNormalized } from "../np/pascal-swma-weights.js";
import { weightedRollingAverage } from "../np/weighted-window.js";

export function swma(
  candles: IndicatorCandles,
  period: number = 5,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const tri = symmetricTriangleNormalized(period);
  const res = weightedRollingAverage(source, tri);
  if (isCandles1D(candles)) {
    return sequential ? res : res[res.length - 1]!;
  }
  const m = sliceCandles(candles as OhlcvMatrix, sequential);
  const padded = sameLength(m, res);
  return sequential ? padded : padded[res.length - 1]!;
}
