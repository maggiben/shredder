/*
 DM - Directional Movement

 :param candles: np.ndarray
 :param period: int - default: 14
 :param sequential: bool - default: False

 :return: DM(plus, minus)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { dm as dmRust } from "../series/candles.js";

export type DmResult =
  | { readonly plus: number; readonly minus: number }
  | { readonly plus: Float64Array; readonly minus: Float64Array };

export function dm(candles: IndicatorCandles, period: number = 14, sequential: boolean = false): DmResult {
  if (isCandles1D(candles)) {
    throw new Error("dm requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const { plus, minus } = dmRust(m, period);
  if (sequential) {
    return { plus, minus };
  }
  const li = plus.length - 1;
  return { plus: plus[li]!, minus: minus[li]! };
}
