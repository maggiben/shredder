import type { OhlcvMatrix } from "../types.js";

const C = { ts: 0, open: 1, close: 2, high: 3, low: 4, vol: 5 } as const;

function col(candles: OhlcvMatrix, idx: number): Float64Array {
  const n = candles.length;
  const a = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    a[i] = candles[i]![idx]!;
  }
  return a;
}

export function adx(candles: OhlcvMatrix, period: number): Float64Array {
  const n = candles.length;
  const adxResult = new Float64Array(n);
  adxResult.fill(Number.NaN);
  const requiredLen = 2 * period;
  if (n <= requiredLen) {
    return adxResult;
  }
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const close = col(candles, C.close);
  let trSmooth = 0;
  let plusDmSmooth = 0;
  let minusDmSmooth = 0;
  const dxBuffer: number[] = [];
  for (let i = 1; i < n; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    const currentTr = Math.max(hl, hc, lc);
    const hDiff = high[i]! - high[i - 1]!;
    const lDiff = low[i - 1]! - low[i]!;
    let currentPlusDm = 0.0;
    if (hDiff > lDiff && hDiff > 0.0) {
      currentPlusDm = hDiff;
    }
    let currentMinusDm = 0.0;
    if (lDiff > hDiff && lDiff > 0.0) {
      currentMinusDm = lDiff;
    }
    if (i <= period) {
      trSmooth += currentTr;
      plusDmSmooth += currentPlusDm;
      minusDmSmooth += currentMinusDm;
    } else {
      trSmooth = trSmooth - trSmooth / period + currentTr;
      plusDmSmooth = plusDmSmooth - plusDmSmooth / period + currentPlusDm;
      minusDmSmooth = minusDmSmooth - minusDmSmooth / period + currentMinusDm;
    }
    if (i >= period) {
      let currentDx = 0.0;
      if (trSmooth !== 0.0) {
        const diPlus = (100.0 * plusDmSmooth) / trSmooth;
        const diMinus = (100.0 * minusDmSmooth) / trSmooth;
        const diSum = diPlus + diMinus;
        if (diSum !== 0.0) {
          currentDx = (100.0 * Math.abs(diPlus - diMinus)) / diSum;
        }
      }
      if (i < requiredLen) {
        dxBuffer.push(currentDx);
      } else if (i === requiredLen) {
        let dxSum = 0;
        for (const x of dxBuffer) {
          dxSum += x;
        }
        adxResult[i] = dxSum / period;
      } else if (!Number.isNaN(adxResult[i - 1]!)) {
        adxResult[i] = (adxResult[i - 1]! * (period - 1) + currentDx) / period;
      }
    }
  }
  return adxResult;
}

export function atr(candles: OhlcvMatrix, period: number): Float64Array {
  const n = candles.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  const close = col(candles, C.close);
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  let trSum = high[0]! - low[0]!;
  for (let i = 1; i < period; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    trSum += Math.max(hl, hc, lc);
  }
  result[period - 1] = trSum / period;
  const alpha = 1.0 / period;
  for (let i = period; i < n; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    const tr = Math.max(hl, hc, lc);
    result[i] = result[i - 1]! + alpha * (tr - result[i - 1]!);
  }
  return result;
}

export function adosc(candles: OhlcvMatrix, fastPeriod: number, slowPeriod: number): Float64Array {
  const n = candles.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n === 0) {
    return result;
  }
  if (n === 1) {
    result[0] = 0.0;
    return result;
  }
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const close = col(candles, C.close);
  const volume = col(candles, C.vol);
  const mfVolume = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const priceRange = high[i]! - low[i]!;
    const mult =
      priceRange !== 0.0 ? ((close[i]! - low[i]!) - (high[i]! - close[i]!)) / priceRange : 0.0;
    mfVolume[i] = mult * volume[i]!;
  }
  const adLine = new Float64Array(n);
  adLine[0] = mfVolume[0]!;
  for (let i = 1; i < n; i += 1) {
    adLine[i] = adLine[i - 1]! + mfVolume[i]!;
  }
  const fastAlpha = 2.0 / (fastPeriod + 1.0);
  const slowAlpha = 2.0 / (slowPeriod + 1.0);
  const fastEma = new Float64Array(n);
  const slowEma = new Float64Array(n);
  fastEma[0] = adLine[0]!;
  slowEma[0] = adLine[0]!;
  for (let i = 1; i < n; i += 1) {
    fastEma[i] = fastAlpha * adLine[i]! + (1.0 - fastAlpha) * fastEma[i - 1]!;
    slowEma[i] = slowAlpha * adLine[i]! + (1.0 - slowAlpha) * slowEma[i - 1]!;
  }
  for (let i = 0; i < n; i += 1) {
    result[i] = fastEma[i]! - slowEma[i]!;
  }
  return result;
}

export function di(candles: OhlcvMatrix, period: number): { plus: Float64Array; minus: Float64Array } {
  const n = candles.length;
  const plusDi = new Float64Array(n);
  const minusDi = new Float64Array(n);
  plusDi.fill(Number.NaN);
  minusDi.fill(Number.NaN);
  if (n < 2 || n < period + 1) {
    return { plus: plusDi, minus: minusDi };
  }
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const close = col(candles, C.close);
  let trSmooth = 0;
  let plusDmSmooth = 0;
  let minusDmSmooth = 0;
  for (let i = 1; i <= period; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    const currentTr = Math.max(hl, hc, lc);
    const hDiff = high[i]! - high[i - 1]!;
    const lDiff = low[i - 1]! - low[i]!;
    const currentPlusDm = hDiff > lDiff && hDiff > 0.0 ? hDiff : 0.0;
    const currentMinusDm = lDiff > hDiff && lDiff > 0.0 ? lDiff : 0.0;
    trSmooth += currentTr;
    plusDmSmooth += currentPlusDm;
    minusDmSmooth += currentMinusDm;
  }
  if (trSmooth > 0.0) {
    plusDi[period] = (100.0 * plusDmSmooth) / trSmooth;
    minusDi[period] = (100.0 * minusDmSmooth) / trSmooth;
  } else {
    plusDi[period] = 0.0;
    minusDi[period] = 0.0;
  }
  for (let i = period + 1; i < n; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    const currentTr = Math.max(hl, hc, lc);
    const hDiff = high[i]! - high[i - 1]!;
    const lDiff = low[i - 1]! - low[i]!;
    const currentPlusDm = hDiff > lDiff && hDiff > 0.0 ? hDiff : 0.0;
    const currentMinusDm = lDiff > hDiff && lDiff > 0.0 ? lDiff : 0.0;
    trSmooth = (trSmooth * (period - 1) + currentTr) / period;
    plusDmSmooth = (plusDmSmooth * (period - 1) + currentPlusDm) / period;
    minusDmSmooth = (minusDmSmooth * (period - 1) + currentMinusDm) / period;
    if (trSmooth > 0.0) {
      plusDi[i] = (100.0 * plusDmSmooth) / trSmooth;
      minusDi[i] = (100.0 * minusDmSmooth) / trSmooth;
    } else {
      plusDi[i] = 0.0;
      minusDi[i] = 0.0;
    }
  }
  return { plus: plusDi, minus: minusDi };
}

export function dm(candles: OhlcvMatrix, period: number): { plus: Float64Array; minus: Float64Array } {
  const n = candles.length;
  const plusDm = new Float64Array(n);
  const minusDm = new Float64Array(n);
  plusDm.fill(Number.NaN);
  minusDm.fill(Number.NaN);
  if (n <= period) {
    return { plus: plusDm, minus: minusDm };
  }
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const rawPlus = new Float64Array(n);
  const rawMinus = new Float64Array(n);
  rawPlus.fill(Number.NaN);
  rawMinus.fill(Number.NaN);
  for (let i = 1; i < n; i += 1) {
    const upMove = high[i]! - high[i - 1]!;
    const downMove = low[i - 1]! - low[i]!;
    rawPlus[i] = upMove > downMove && upMove > 0.0 ? upMove : 0.0;
    rawMinus[i] = downMove > upMove && downMove > 0.0 ? downMove : 0.0;
  }
  let sumPlus = 0;
  let sumMinus = 0;
  for (let i = 1; i <= period; i += 1) {
    sumPlus += rawPlus[i]!;
    sumMinus += rawMinus[i]!;
  }
  plusDm[period] = sumPlus;
  minusDm[period] = sumMinus;
  for (let i = period + 1; i < n; i += 1) {
    plusDm[i] = plusDm[i - 1]! - plusDm[i - 1]! / period + rawPlus[i]!;
    minusDm[i] = minusDm[i - 1]! - minusDm[i - 1]! / period + rawMinus[i]!;
  }
  return { plus: plusDm, minus: minusDm };
}

type Dq = { idx: number; val: number };

function donchianDeque(
  candles: OhlcvMatrix,
  period: number,
): { upper: Float64Array; middle: Float64Array; lower: Float64Array } {
  const n = candles.length;
  const upper = new Float64Array(n);
  const middle = new Float64Array(n);
  const lower = new Float64Array(n);
  upper.fill(Number.NaN);
  middle.fill(Number.NaN);
  lower.fill(Number.NaN);
  if (n < period) {
    return { upper, middle, lower };
  }
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const maxDeque: Dq[] = [];
  const minDeque: Dq[] = [];
  for (let i = 0; i < Math.min(period, n); i += 1) {
    const hv = high[i]!;
    while (maxDeque.length > 0 && maxDeque[maxDeque.length - 1]!.val <= hv) {
      maxDeque.pop();
    }
    maxDeque.push({ idx: i, val: hv });
    const lv = low[i]!;
    while (minDeque.length > 0 && minDeque[minDeque.length - 1]!.val >= lv) {
      minDeque.pop();
    }
    minDeque.push({ idx: i, val: lv });
  }
  if (period <= n) {
    const maxHigh = maxDeque[0]!.val;
    const minLow = minDeque[0]!.val;
    upper[period - 1] = maxHigh;
    lower[period - 1] = minLow;
    middle[period - 1] = (maxHigh + minLow) * 0.5;
  }
  for (let i = period; i < n; i += 1) {
    while (maxDeque.length > 0 && maxDeque[0]!.idx <= i - period) {
      maxDeque.shift();
    }
    while (minDeque.length > 0 && minDeque[0]!.idx <= i - period) {
      minDeque.shift();
    }
    const hv = high[i]!;
    while (maxDeque.length > 0 && maxDeque[maxDeque.length - 1]!.val <= hv) {
      maxDeque.pop();
    }
    maxDeque.push({ idx: i, val: hv });
    const lv = low[i]!;
    while (minDeque.length > 0 && minDeque[minDeque.length - 1]!.val >= lv) {
      minDeque.pop();
    }
    minDeque.push({ idx: i, val: lv });
    const maxHigh = maxDeque[0]!.val;
    const minLow = minDeque[0]!.val;
    upper[i] = maxHigh;
    lower[i] = minLow;
    middle[i] = (maxHigh + minLow) * 0.5;
  }
  return { upper, middle, lower };
}

export function donchian(
  candles: OhlcvMatrix,
  period: number,
): { upperband: Float64Array; middleband: Float64Array; lowerband: Float64Array } {
  const { upper, middle, lower } = donchianDeque(candles, period);
  return { upperband: upper, middleband: middle, lowerband: lower };
}

export function willr(candles: OhlcvMatrix, period: number): Float64Array {
  const n = candles.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  const close = col(candles, C.close);
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  for (let i = period - 1; i < n; i += 1) {
    const start = i + 1 - period;
    let maxHigh = -Infinity;
    let minLow = Infinity;
    for (let j = start; j <= i; j += 1) {
      maxHigh = Math.max(maxHigh, high[j]!);
      minLow = Math.min(minLow, low[j]!);
    }
    const denom = maxHigh - minLow;
    if (denom !== 0.0) {
      result[i] = ((maxHigh - close[i]!) / denom) * -100.0;
    }
  }
  return result;
}

export function vwma(candles: OhlcvMatrix, period: number): Float64Array {
  const n = candles.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n === 0) {
    return result;
  }
  const close = col(candles, C.close);
  const volume = col(candles, C.vol);
  const weightedPrices = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    weightedPrices[i] = close[i]! * volume[i]!;
  }
  const cumW = new Float64Array(n);
  const cumV = new Float64Array(n);
  cumW[0] = weightedPrices[0]!;
  cumV[0] = volume[0]!;
  for (let i = 1; i < n; i += 1) {
    cumW[i] = cumW[i - 1]! + weightedPrices[i]!;
    cumV[i] = cumV[i - 1]! + volume[i]!;
  }
  for (let i = 0; i < n; i += 1) {
    const startIdx = i >= period ? i - period + 1 : 0;
    const endIdx = i;
    const sumWeighted = startIdx === 0 ? cumW[endIdx]! : cumW[endIdx]! - cumW[startIdx - 1]!;
    const sumVolume = startIdx === 0 ? cumV[endIdx]! : cumV[endIdx]! - cumV[startIdx - 1]!;
    result[i] = sumVolume === 0.0 ? Number.NaN : sumWeighted / sumVolume;
  }
  return result;
}

export function cvi(candles: OhlcvMatrix, period: number): Float64Array {
  const n = candles.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n <= period) {
    return result;
  }
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const hlDiff = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    hlDiff[i] = high[i]! - low[i]!;
  }
  const alpha = 2.0 / (period + 1.0);
  const emaDiff = new Float64Array(n);
  emaDiff[0] = hlDiff[0]!;
  for (let i = 1; i < n; i += 1) {
    emaDiff[i] = alpha * hlDiff[i]! + (1.0 - alpha) * emaDiff[i - 1]!;
  }
  for (let i = period; i < n; i += 1) {
    if (emaDiff[i - period]! !== 0.0) {
      result[i] = ((emaDiff[i]! - emaDiff[i - period]!) / emaDiff[i - period]!) * 100.0;
    } else {
      result[i] = 0.0;
    }
  }
  return result;
}

export function vi(
  candles: OhlcvMatrix,
  period: number,
  sequential: boolean,
): { viPlus: Float64Array; viMinus: Float64Array } {
  const n = candles.length;
  const viPlus = new Float64Array(sequential ? n : 1);
  const viMinus = new Float64Array(sequential ? n : 1);
  viPlus.fill(Number.NaN);
  viMinus.fill(Number.NaN);
  if (n <= period) {
    return { viPlus, viMinus };
  }
  const close = col(candles, C.close);
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const tr = new Float64Array(n);
  const vp = new Float64Array(n);
  const vm = new Float64Array(n);
  tr[0] = high[0]! - low[0]!;
  for (let i = 1; i < n; i += 1) {
    const hl = high[i]! - low[i]!;
    const hpc = Math.abs(high[i]! - close[i - 1]!);
    const lpc = Math.abs(low[i]! - close[i - 1]!);
    tr[i] = Math.max(hl, hpc, lpc);
    vp[i] = Math.abs(high[i]! - low[i - 1]!);
    vm[i] = Math.abs(low[i]! - high[i - 1]!);
  }
  const outPlus = new Float64Array(n);
  const outMinus = new Float64Array(n);
  outPlus.fill(Number.NaN);
  outMinus.fill(Number.NaN);
  for (let i = period; i < n; i += 1) {
    const startIdx = i + 1 - period;
    let sumTr = 0;
    let sumVp = 0;
    let sumVm = 0;
    for (let j = startIdx; j <= i; j += 1) {
      sumTr += tr[j]!;
      sumVp += vp[j]!;
      sumVm += vm[j]!;
    }
    if (sumTr !== 0.0) {
      outPlus[i] = sumVp / sumTr;
      outMinus[i] = sumVm / sumTr;
    }
  }
  if (sequential) {
    for (let i = 0; i < n; i += 1) {
      viPlus[i] = outPlus[i]!;
      viMinus[i] = outMinus[i]!;
    }
    return { viPlus, viMinus };
  }
  viPlus[0] = outPlus[n - 1]!;
  viMinus[0] = outMinus[n - 1]!;
  return { viPlus, viMinus };
}

export function chop(
  candles: OhlcvMatrix,
  period: number,
  scalar: number,
  drift: number,
): Float64Array {
  const n = candles.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  const close = col(candles, C.close);
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const tr = new Float64Array(n);
  tr[0] = high[0]! - low[0]!;
  for (let i = 1; i < n; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    tr[i] = Math.max(hl, hc, lc);
  }
  const atr = new Float64Array(n);
  atr.fill(Number.NaN);
  if (drift === 1) {
    for (let i = 0; i < n; i += 1) {
      atr[i] = tr[i]!;
    }
  } else {
    let sum = 0;
    for (let i = 0; i < drift; i += 1) {
      sum += tr[i]!;
    }
    atr[drift - 1] = sum / drift;
    const alpha = 1.0 / drift;
    for (let i = drift; i < n; i += 1) {
      atr[i] = alpha * tr[i]! + (1.0 - alpha) * atr[i - 1]!;
    }
  }
  const logPeriod = Math.log10(period);
  const maxDeque: Dq[] = [];
  const minDeque: Dq[] = [];
  let atrSum = 0;
  let highest = -Infinity;
  let lowest = Infinity;
  for (let i = 0; i < period; i += 1) {
    if (!Number.isNaN(atr[i]!)) {
      atrSum += atr[i]!;
    }
    if (high[i]! > highest) {
      highest = high[i]!;
    }
    if (low[i]! < lowest) {
      lowest = low[i]!;
    }
  }
  for (let i = 0; i < period; i += 1) {
    const hi = high[i]!;
    while (maxDeque.length > 0 && maxDeque[maxDeque.length - 1]!.val <= hi) {
      maxDeque.pop();
    }
    maxDeque.push({ idx: i, val: hi });
    const lo = low[i]!;
    while (minDeque.length > 0 && minDeque[minDeque.length - 1]!.val >= lo) {
      minDeque.pop();
    }
    minDeque.push({ idx: i, val: lo });
  }
  if (atrSum > 0.0) {
    const range = highest - lowest;
    if (range > 0.0) {
      result[period - 1] = (scalar * (Math.log10(atrSum) - Math.log10(range))) / logPeriod;
    }
  }
  for (let i = period; i < n; i += 1) {
    if (!Number.isNaN(atr[i]!)) {
      atrSum += atr[i]!;
    }
    if (!Number.isNaN(atr[i - period]!)) {
      atrSum -= atr[i - period]!;
    }
    while (maxDeque.length > 0 && maxDeque[0]!.idx <= i - period) {
      maxDeque.shift();
    }
    while (minDeque.length > 0 && minDeque[0]!.idx <= i - period) {
      minDeque.shift();
    }
    const hi = high[i]!;
    while (maxDeque.length > 0 && maxDeque[maxDeque.length - 1]!.val <= hi) {
      maxDeque.pop();
    }
    maxDeque.push({ idx: i, val: hi });
    const lo = low[i]!;
    while (minDeque.length > 0 && minDeque[minDeque.length - 1]!.val >= lo) {
      minDeque.pop();
    }
    minDeque.push({ idx: i, val: lo });
    const currentHighest = maxDeque[0]!.val;
    const currentLowest = minDeque[0]!.val;
    if (atrSum > 0.0) {
      const range = currentHighest - currentLowest;
      if (range > 0.0) {
        result[i] = (scalar * (Math.log10(atrSum) - Math.log10(range))) / logPeriod;
      }
    }
  }
  return result;
}

export function chande(
  candles: OhlcvMatrix,
  period: number,
  mult: number,
  direction: string,
): Float64Array {
  const n = candles.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  const close = col(candles, C.close);
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const atr = new Float64Array(n);
  atr.fill(Number.NaN);
  let trSum = high[0]! - low[0]!;
  for (let i = 1; i < period; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    trSum += Math.max(hl, hc, lc);
  }
  atr[period - 1] = trSum / period;
  const alpha = 1.0 / period;
  for (let i = period; i < n; i += 1) {
    const hl = high[i]! - low[i]!;
    const hc = Math.abs(high[i]! - close[i - 1]!);
    const lc = Math.abs(low[i]! - close[i - 1]!);
    const tr = Math.max(hl, hc, lc);
    atr[i] = atr[i - 1]! + alpha * (tr - atr[i - 1]!);
  }
  if (direction === "long") {
    const maxDeque: Dq[] = [];
    for (let i = 0; i < Math.min(period, n); i += 1) {
      const hv = high[i]!;
      while (maxDeque.length > 0 && maxDeque[maxDeque.length - 1]!.val <= hv) {
        maxDeque.pop();
      }
      maxDeque.push({ idx: i, val: hv });
    }
    if (period <= n) {
      result[period - 1] = maxDeque[0]!.val - atr[period - 1]! * mult;
    }
    for (let i = period; i < n; i += 1) {
      while (maxDeque.length > 0 && maxDeque[0]!.idx <= i - period) {
        maxDeque.shift();
      }
      const hv = high[i]!;
      while (maxDeque.length > 0 && maxDeque[maxDeque.length - 1]!.val <= hv) {
        maxDeque.pop();
      }
      maxDeque.push({ idx: i, val: hv });
      result[i] = maxDeque[0]!.val - atr[i]! * mult;
    }
  } else if (direction === "short") {
    const minDeque: Dq[] = [];
    for (let i = 0; i < Math.min(period, n); i += 1) {
      const lv = low[i]!;
      while (minDeque.length > 0 && minDeque[minDeque.length - 1]!.val >= lv) {
        minDeque.pop();
      }
      minDeque.push({ idx: i, val: lv });
    }
    if (period <= n) {
      result[period - 1] = minDeque[0]!.val + atr[period - 1]! * mult;
    }
    for (let i = period; i < n; i += 1) {
      while (minDeque.length > 0 && minDeque[0]!.idx <= i - period) {
        minDeque.shift();
      }
      const lv = low[i]!;
      while (minDeque.length > 0 && minDeque[minDeque.length - 1]!.val >= lv) {
        minDeque.pop();
      }
      minDeque.push({ idx: i, val: lv });
      result[i] = minDeque[0]!.val + atr[i]! * mult;
    }
  }
  return result;
}
