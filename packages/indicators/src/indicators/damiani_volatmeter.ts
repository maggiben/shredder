/*
 Damiani Volatmeter

 :param candles: np.ndarray
 :param vis_atr: int - default: 13
 :param vis_std: int - default: 20
 :param sed_atr: int - default: 40
 :param sed_std: int - default: 100
 :param threshold: float - default: 1.4
 :param source_type: str - default: "close"
 :param sequential: bool - default: False

 :return: float | np.ndarray
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { getCandleSource, sliceCandles } from "../candles/helpers.js";
import { atr as atrSeries } from "../series/candles.js";
import { lfilter } from "../np/signal.js";
import { slidingWindowView } from "../np/sliding.js";

export type DamianiVolatmeterResult =
  | { readonly vol: number; readonly anti: number }
  | { readonly vol: Float64Array; readonly anti: Float64Array };

function rollingStdPopAtEnd(source: Float64Array, window: number): Float64Array {
  const n = source.length;
  const out = new Float64Array(n);
  out.fill(Number.NaN);
  if (window <= 0 || n < window) {
    return out;
  }
  const views = slidingWindowView(source, window);
  for (let i = 0; i < views.length; i += 1) {
    const w = views[i]!;
    let mean = 0;
    for (let j = 0; j < w.length; j += 1) {
      mean += w[j]!;
    }
    mean /= window;
    let v = 0;
    for (let j = 0; j < w.length; j += 1) {
      const d = w[j]! - mean;
      v += d * d;
    }
    out[window - 1 + i] = Math.sqrt(v / window);
  }
  return out;
}

function damianiVolatmeterFast(
  source: Float64Array,
  sedStd: number,
  atrvis: Float64Array,
  atrsed: Float64Array,
  visStd: number,
  threshold: number,
): { vol: Float64Array; anti: Float64Array } {
  const lagS = 0.5;
  const n = source.length;
  const u = new Float64Array(n);
  for (let i = sedStd; i < n; i += 1) {
    u[i] = atrvis[i]! / atrsed[i]!;
  }
  const vol = lfilter([1.0], [1.0, -lagS, 0.0, lagS], u);
  const t = new Float64Array(n);
  if (n >= sedStd) {
    const stdVis = rollingStdPopAtEnd(source, visStd);
    const stdSed = rollingStdPopAtEnd(source, sedStd);
    for (let j = sedStd; j < n; j += 1) {
      t[j] = threshold - stdVis[j - visStd]! / stdSed[j - sedStd]!;
    }
  }
  return { vol, anti: t };
}

export function damiani_volatmeter(
  candles: IndicatorCandles,
  visAtr: number = 13,
  visStd: number = 20,
  sedAtr: number = 40,
  sedStd: number = 100,
  threshold: number = 1.4,
  sourceType: string = "close",
  sequential: boolean = false,
): DamianiVolatmeterResult {
  if (isCandles1D(candles)) {
    throw new Error("damiani_volatmeter requires OHLCV candle matrix");
  }
  const matrix = sliceCandles(candles, sequential) as OhlcvMatrix;
  const source = getCandleSource(matrix, sourceType);
  const atrvis = atrSeries(matrix, visAtr);
  const atrsed = atrSeries(matrix, sedAtr);
  const { vol, anti } = damianiVolatmeterFast(source, sedStd, atrvis, atrsed, visStd, threshold);
  if (sequential) {
    return { vol, anti };
  }
  const li = vol.length - 1;
  return { vol: vol[li]!, anti: anti[li]! };
}
