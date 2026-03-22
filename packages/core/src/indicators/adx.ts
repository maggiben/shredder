/**
 * ADX, +DI, −DI (Wilder smoothing). Requires highs, lows, closes of equal length.
 */
export interface AdxResult {
  readonly adx: number;
  readonly plusDi: number;
  readonly minusDi: number;
}

function wilderSmooth(values: readonly number[], period: number): number[] {
  if (values.length < period) {
    return [];
  }
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < period; i += 1) {
    sum += values[i]!;
  }
  let prev = sum / period;
  out.push(prev);
  for (let i = period; i < values.length; i += 1) {
    prev = (prev * (period - 1) + values[i]!) / period;
    out.push(prev);
  }
  return out;
}

export function adx(
  highs: readonly number[],
  lows: readonly number[],
  closes: readonly number[],
  period: number,
): AdxResult | undefined {
  if (period <= 0 || highs.length !== lows.length || highs.length !== closes.length) {
    return undefined;
  }
  const n = highs.length;
  if (n < period + 2) {
    return undefined;
  }

  const tr: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];

  for (let i = 1; i < n; i += 1) {
    const high = highs[i]!;
    const low = lows[i]!;
    const prevHigh = highs[i - 1]!;
    const prevLow = lows[i - 1]!;
    const prevClose = closes[i - 1]!;

    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    const plus = upMove > downMove && upMove > 0 ? upMove : 0;
    const minus = downMove > upMove && downMove > 0 ? downMove : 0;
    plusDm.push(plus);
    minusDm.push(minus);

    const hl = high - low;
    const hc = Math.abs(high - prevClose);
    const lc = Math.abs(low - prevClose);
    tr.push(Math.max(hl, hc, lc));
  }

  const trS = wilderSmooth(tr, period);
  const pDmS = wilderSmooth(plusDm, period);
  const mDmS = wilderSmooth(minusDm, period);
  if (trS.length === 0) {
    return undefined;
  }

  const dx: number[] = [];
  for (let j = 0; j < trS.length; j += 1) {
    const atr = trS[j]!;
    const pdi = atr === 0 ? 0 : (100 * pDmS[j]!) / atr;
    const mdi = atr === 0 ? 0 : (100 * mDmS[j]!) / atr;
    const denom = pdi + mdi;
    const dxVal = denom === 0 ? 0 : (100 * Math.abs(pdi - mdi)) / denom;
    dx.push(dxVal);
  }

  const adxSeries = wilderSmooth(dx, period);
  if (adxSeries.length === 0) {
    return undefined;
  }

  const last = adxSeries.length - 1;
  const atrLast = trS[last]!;
  const plusDiLast = atrLast === 0 ? 0 : (100 * pDmS[last]!) / atrLast;
  const minusDiLast = atrLast === 0 ? 0 : (100 * mDmS[last]!) / atrLast;

  return {
    adx: adxSeries[last]!,
    plusDi: plusDiLast,
    minusDi: minusDiLast,
  };
}
