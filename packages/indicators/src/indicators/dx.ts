/**
 * DX - Directional Movement Index
 *
 * :param candles: np.ndarray
 * :param di_length: int - default: 14
 * :param adx_smoothing: int - default: 14
 * :param sequential: bool - default: False
 *
 * :return: DX(adx, plusDI, minusDI)
 */
import type { OhlcvMatrix } from "../types.js";
import { sliceCandles } from "../candles/helpers.js";
import { column } from "../np/column.js";
import { rmaSeries } from "../series/series.js";

const HIGH = 3;
const LOW = 4;
const CLOSE = 2;

export type DxResult = {
  adx: number | Float64Array;
  plusDI: number | Float64Array;
  minusDI: number | Float64Array;
};

function fastDmTr(high: Float64Array, low: Float64Array, close: Float64Array): {
  plusDM: Float64Array;
  minusDM: Float64Array;
  tr: Float64Array;
} {
  const n = high.length;
  const plusDM = new Float64Array(n);
  const minusDM = new Float64Array(n);
  const tr = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    if (i === 0) {
      plusDM[i] = 0;
      minusDM[i] = 0;
      tr[i] = high[i]! - low[i]!;
    } else {
      const up = high[i]! - high[i - 1]!;
      const down = low[i - 1]! - low[i]!;
      plusDM[i] = up > down && up > 0 ? up : 0;
      minusDM[i] = down > up && down > 0 ? down : 0;
      const a = high[i]! - low[i]!;
      const b = Math.abs(high[i]! - close[i - 1]!);
      const c = Math.abs(low[i]! - close[i - 1]!);
      tr[i] = Math.max(a, b, c);
    }
  }
  return { plusDM, minusDM, tr };
}

export function dx(
  candles: OhlcvMatrix,
  diLength: number = 14,
  adxSmoothing: number = 14,
  sequential: boolean = false,
): DxResult {
  const m = sliceCandles(candles, sequential);
  const high = column(m, HIGH);
  const low = column(m, LOW);
  const close = column(m, CLOSE);
  const { plusDM, minusDM, tr } = fastDmTr(high, low, close);
  const trRma = rmaSeries(tr, diLength);
  const plusRma = rmaSeries(plusDM, diLength);
  const minusRma = rmaSeries(minusDM, diLength);
  const n = high.length;
  const plusDI = new Float64Array(n);
  const minusDI = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const trv = trRma[i]!;
    if (trv === 0) {
      plusDI[i] = 0;
      minusDI[i] = 0;
    } else {
      plusDI[i] = (100 * plusRma[i]!) / trv;
      minusDI[i] = (100 * minusRma[i]!) / trv;
    }
  }
  const dirIndex = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const s = plusDI[i]! + minusDI[i]!;
    const denom = s === 0 ? 1 : s;
    dirIndex[i] = Math.abs(plusDI[i]! - minusDI[i]!) / denom;
  }
  const adxRaw = rmaSeries(dirIndex, adxSmoothing);
  const adx = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    adx[i] = 100 * adxRaw[i]!;
  }
  if (sequential) {
    return { adx, plusDI, minusDI };
  }
  const li = n - 1;
  return { adx: adx[li]!, plusDI: plusDI[li]!, minusDI: minusDI[li]! };
}
