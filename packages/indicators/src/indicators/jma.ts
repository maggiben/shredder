/**
 * Jurik Moving Average
 * Port of: https://tradingview.com/script/nZuBWW9j-Jurik-Moving-Average/
 */
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";

function jmaHelper(src: Float64Array, phaseRatio: number, beta: number, alpha: number): Float64Array {
  const n = src.length;
  const jmaVal = Float64Array.from(src);
  const e0 = new Float64Array(n);
  const e1 = new Float64Array(n);
  const e2 = new Float64Array(n);
  for (let i = 1; i < n; i += 1) {
    e0[i] = (1 - alpha) * src[i]! + alpha * e0[i - 1]!;
    e1[i] = (src[i]! - e0[i]!) * (1 - beta) + beta * e1[i - 1]!;
    e2[i] =
      (e0[i]! + phaseRatio * e1[i]! - jmaVal[i - 1]!) * (1 - alpha) ** 2 +
      alpha ** 2 * e2[i - 1]!;
    jmaVal[i] = e2[i]! + jmaVal[i - 1]!;
  }
  return jmaVal;
}

export function jma(
  candles: IndicatorCandles,
  period: number = 7,
  phase: number = 50,
  power: number = 2,
  sourceType: string = "close",
  sequential: boolean = false,
): number | Float64Array {
  const source = resolveSourceSeries(candles, sequential, sourceType);
  const phaseRatio = phase < -100 ? 0.5 : phase > 100 ? 2.5 : phase / 100 + 1.5;
  const beta = (0.45 * (period - 1)) / (0.45 * (period - 1) + 2);
  const alpha = beta ** power;
  const res = jmaHelper(source, phaseRatio, beta, alpha);
  return sequential ? res : res[res.length - 1]!;
}
