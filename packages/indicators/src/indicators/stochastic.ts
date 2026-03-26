/*
 The Stochastic Oscillator

 :param candles: np.ndarray
 :param fastk_period: int - default: 14
 :param slowk_period: int - default: 3
 :param slowk_matype: int - default: 0
 :param slowd_period: int - default: 3
 :param slowd_matype: int - default: 0
 :param sequential: bool - default: False

 :return: Stochastic(k, d)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { stoch as stochRust } from "../series/series.js";

export type StochasticResult =
  | { readonly k: number; readonly d: number }
  | { readonly k: Float64Array; readonly d: Float64Array };

export function stochastic(
  candles: IndicatorCandles,
  fastkPeriod: number = 14,
  slowkPeriod: number = 3,
  slowkMatype: number = 0,
  slowdPeriod: number = 3,
  slowdMatype: number = 0,
  sequential: boolean = false,
): StochasticResult {
  if (slowkMatype === 24 || slowkMatype === 29 || slowdMatype === 24 || slowdMatype === 29) {
    throw new Error("VWMA (matype 24) and VWAP (matype 29) cannot be used in stochastic indicator.");
  }
  if (isCandles1D(candles)) {
    throw new Error("stochastic requires OHLCV candle matrix");
  }
  const m = sliceCandles(candles, sequential) as OhlcvMatrix;
  const { k, d } = stochRust(m, fastkPeriod, slowkPeriod, slowkMatype, slowdPeriod, slowdMatype);
  if (sequential) {
    return { k, d };
  }
  const li = k.length - 1;
  return { k: k[li]!, d: d[li]! };
}
