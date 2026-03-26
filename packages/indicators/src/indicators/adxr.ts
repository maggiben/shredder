/**
 * ADXR — Average Directional Movement Index Rating.
 *
 * @author KivancOzbilgic
 * @see https://www.tradingview.com/v/9f5zDi3r/
 *
 * @param candles - OHLCV matrix; column indices: close 2, high 3, low 4.
 * @param period - Smoothing / moving-average period.
 * @param sequential - When true, return the full series; otherwise the last value.
 * @returns ADXR as a number, or a `Float64Array` when `sequential` is true.
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";

function adxrKernel(high: Float64Array, low: Float64Array, close: Float64Array, period: number): Float64Array {
  const n = high.length;
  const tr = new Float64Array(n);
  const dmp = new Float64Array(n);
  const dmm = new Float64Array(n);
  tr[0] = high[0]! - low[0]!;
  for (let i = 1; i < n; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    tr[i] = Math.max(hl, hc, lc);
    const upMove = high[i]! - high[i - 1]!;
    const downMove = low[i - 1]! - low[i]!;
    dmp[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    dmm[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }
  const str = new Float64Array(n);
  const sDmp = new Float64Array(n);
  const sDmm = new Float64Array(n);
  str[0] = tr[0]!;
  sDmp[0] = dmp[0]!;
  sDmm[0] = dmm[0]!;
  for (let i = 1; i < n; i += 1) {
    str[i] = str[i - 1]! - str[i - 1]! / period + tr[i]!;
    sDmp[i] = sDmp[i - 1]! - sDmp[i - 1]! / period + dmp[i]!;
    sDmm[i] = sDmm[i - 1]! - sDmm[i - 1]! / period + dmm[i]!;
  }
  const diPlus = new Float64Array(n);
  const diMinus = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    if (str[i]! !== 0) {
      diPlus[i] = (sDmp[i]! / str[i]!) * 100;
      diMinus[i] = (sDmm[i]! / str[i]!) * 100;
    }
  }
  const dx = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const denom = diPlus[i]! + diMinus[i]!;
    if (denom !== 0) {
      dx[i] = (Math.abs(diPlus[i]! - diMinus[i]!) / denom) * 100;
    }
  }
  const adx = new Float64Array(n);
  adx.fill(Number.NaN);
  if (n >= period) {
    for (let i = period - 1; i < n; i += 1) {
      let sumDx = 0;
      for (let j = 0; j < period; j += 1) {
        sumDx += dx[i - j]!;
      }
      adx[i] = sumDx / period;
    }
  }
  const adxrOut = new Float64Array(n);
  adxrOut.fill(Number.NaN);
  if (n > period) {
    for (let i = period; i < n; i += 1) {
      adxrOut[i] = (adx[i]! + adx[i - period]!) / 2;
    }
  }
  return adxrOut;
}

export function adxr(candles: OhlcvMatrix, period: number = 14, sequential: boolean = false): number | Float64Array {
  const m = sliceCandles(candles, sequential);
  const high = column(m, 3);
  const low = column(m, 4);
  const close = column(m, 2);
  const out = adxrKernel(high, low, close, period);
  return sequential ? out : out[out.length - 1]!;
}
