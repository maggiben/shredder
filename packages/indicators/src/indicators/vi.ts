/*
 Vortex Indicator (VI)

 :param candles: np.ndarray
 :param period: int - default: 14
 :param sequential: bool - default: False

 :return: VI(plus, minus)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { vi as viRust } from "../series/candles.js";

export type ViResult =
  | { readonly plus: number; readonly minus: number }
  | { readonly plus: Float64Array; readonly minus: Float64Array };

export function vi(candles: IndicatorCandles, period: number = 14, sequential: boolean = false): ViResult {
  if (isCandles1D(candles)) {
    throw new Error("vi requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const { viPlus, viMinus } = viRust(m, period, sequential);
  if (sequential) {
    return { plus: viPlus, minus: viMinus };
  }
  return { plus: viPlus[0]!, minus: viMinus[0]! };
}
