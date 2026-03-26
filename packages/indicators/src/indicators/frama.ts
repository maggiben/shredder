/**
 * Fractal Adaptive Moving Average (FRAMA)
 *
 * :param candles: np.ndarray
 * :param window: int - default: 10
 * :param FC: int - default: 1
 * :param SC: int - default: 300
 * :param sequential: bool - default: False
 *
 * :return: float | np.ndarray
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

function frameFast(candles: OhlcvMatrix, n: number, SC: number, FC: number): Float64Array {
  const rows = candles.length;
  const w = Math.log(2.0 / (SC + 1));
  const D = new Float64Array(rows);
  D.fill(Number.NaN);
  const alphas = new Float64Array(rows);
  alphas.fill(Number.NaN);
  const close = column(candles, 2);
  const half = n / 2;
  for (let i = n; i < rows; i += 1) {
    let maxV1 = -Infinity;
    let minV1 = Infinity;
    let maxV2 = -Infinity;
    let minV2 = Infinity;
    let maxPer = -Infinity;
    let minPer = Infinity;
    for (let k = 0; k < n; k += 1) {
      const row = candles[i - n + k]!;
      const hi = row[3]!;
      const lo = row[4]!;
      if (k >= half) {
        maxV1 = Math.max(maxV1, hi);
        minV1 = Math.min(minV1, lo);
      } else {
        maxV2 = Math.max(maxV2, hi);
        minV2 = Math.min(minV2, lo);
      }
      maxPer = Math.max(maxPer, hi);
      minPer = Math.min(minPer, lo);
    }
    const N1 = (maxV1 - minV1) / half;
    const N2 = (maxV2 - minV2) / half;
    const N3 = (maxPer - minPer) / n;
    if (N1 > 0 && N2 > 0 && N3 > 0) {
      D[i] = (Math.log(N1 + N2) - Math.log(N3)) / Math.log(2);
    } else {
      D[i] = D[i - 1]!;
    }
    let oldalpha = Math.exp(w * (D[i]! - 1));
    oldalpha = Math.max(oldalpha, 0.1);
    oldalpha = Math.min(oldalpha, 1);
    const oldN = (2 - oldalpha) / oldalpha;
    const NN = ((SC - FC) * ((oldN - 1) / (SC - 1))) + FC;
    let alpha_ = 2 / (NN + 1);
    if (alpha_ < 2 / (SC + 1)) {
      alphas[i] = 2 / (SC + 1);
    } else if (alpha_ > 1) {
      alphas[i] = 1;
    } else {
      alphas[i] = alpha_;
    }
  }
  const framaVal = new Float64Array(rows);
  framaVal.fill(Number.NaN);
  let mean0 = 0;
  for (let k = 0; k < n; k += 1) {
    mean0 += close[k]!;
  }
  framaVal[n - 1] = mean0 / n;
  for (let i = n; i < rows; i += 1) {
    framaVal[i] = alphas[i]! * close[i]! + (1 - alphas[i]!) * framaVal[i - 1]!;
  }
  return framaVal;
}

export function frama(
  candles: OhlcvMatrix,
  window: number = 10,
  FC: number = 1,
  SC: number = 300,
  sequential: boolean = false,
): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  let n = window;
  if (n % 2 === 1) {
    n += 1;
  }
  const res = frameFast(m, n, SC, FC);
  return sequential ? res : res[res.length - 1]!;
}
