import type { OhlcvMatrix } from "../types.js";
import { smaArrayInner } from "./internal.js";

export function sma(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  let sum = 0;
  let count = 0;
  for (let i = 0; i < period; i += 1) {
    const v = source[i]!;
    if (!Number.isNaN(v)) {
      sum += v;
      count += 1;
    }
  }
  if (count > 0) {
    result[period - 1] = sum / count;
  }
  for (let i = period; i < n; i += 1) {
    if (!Number.isNaN(source[i - period]!)) {
      sum -= source[i - period]!;
      count -= 1;
    }
    if (!Number.isNaN(source[i]!)) {
      sum += source[i]!;
      count += 1;
    }
    if (count > 0) {
      result[i] = sum / count;
    }
  }
  return result;
}

/** RMA / Wilder-style smoothing: `result[0]=source[0]`, then `α·x + (1-α)·prev` with α = 1/period. */
export function rmaSeries(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  if (n === 0 || period === 0) {
    return result;
  }
  const alpha = 1.0 / period;
  result[0] = source[0]!;
  for (let i = 1; i < n; i += 1) {
    result[i] = alpha * source[i]! + (1.0 - alpha) * result[i - 1]!;
  }
  return result;
}

export function ema(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n === 0) {
    return result;
  }
  if (period > n) {
    return result;
  }
  if (n === 1) {
    result[0] = source[0]!;
    return result;
  }
  const alpha = 2.0 / (period + 1.0);
  const oneMinus = 1.0 - alpha;
  result[0] = source[0]!;
  for (let i = 1; i < n; i += 1) {
    result[i] = alpha * source[i]! + oneMinus * result[i - 1]!;
  }
  return result;
}

export function wma(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period || period === 0) {
    return result;
  }
  const weightSum = (period * (period + 1)) / 2;
  const weightSumF = weightSum;
  for (let i = period - 1; i < n; i += 1) {
    let weightedSum = 0;
    for (let j = 0; j < period; j += 1) {
      const weight = j + 1;
      const idx = i - (period - 1) + j;
      weightedSum += weight * source[idx]!;
    }
    result[i] = weightedSum / weightSumF;
  }
  return result;
}

export function smma(source: Float64Array, length: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < length) {
    return result;
  }
  const alpha = 1.0 / length;
  let total = 0;
  for (let i = 0; i < length; i += 1) {
    total += source[i]!;
  }
  const initVal = total / length;
  result[length - 1] = initVal;
  let prev = initVal;
  for (let i = length; i < n; i += 1) {
    prev = alpha * source[i]! + (1.0 - alpha) * prev;
    result[i] = prev;
  }
  for (let i = 0; i < length - 1; i += 1) {
    result[i] = Number.NaN;
  }
  return result;
}

export function dema(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n === 0) {
    return result;
  }
  if (n === 1) {
    result[0] = source[0]!;
    return result;
  }
  const alpha = 2.0 / (period + 1.0);
  const oneMinus = 1.0 - alpha;
  const ema1 = new Float64Array(n);
  ema1[0] = source[0]!;
  for (let i = 1; i < n; i += 1) {
    ema1[i] = alpha * source[i]! + oneMinus * ema1[i - 1]!;
  }
  const ema2 = new Float64Array(n);
  ema2[0] = ema1[0]!;
  for (let i = 1; i < n; i += 1) {
    ema2[i] = alpha * ema1[i]! + oneMinus * ema2[i - 1]!;
  }
  for (let i = 0; i < n; i += 1) {
    result[i] = 2.0 * ema1[i]! - ema2[i]!;
  }
  return result;
}

export function tema(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  if (n === 0) {
    return result;
  }
  const alpha = 2.0 / (period + 1.0);
  const oneMinus = 1.0 - alpha;
  let ema1 = source[0]!;
  let ema2 = ema1;
  let ema3 = ema2;
  result[0] = 3.0 * ema1 - 3.0 * ema2 + ema3;
  for (let i = 1; i < n; i += 1) {
    ema1 = alpha * source[i]! + oneMinus * ema1;
    ema2 = alpha * ema1 + oneMinus * ema2;
    ema3 = alpha * ema2 + oneMinus * ema3;
    result[i] = 3.0 * ema1 - 3.0 * ema2 + ema3;
  }
  return result;
}

export function shift(source: Float64Array, periods: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (periods === 0) {
    for (let i = 0; i < n; i += 1) {
      result[i] = source[i]!;
    }
  } else if (periods > 0) {
    const sh = periods;
    if (sh < n) {
      for (let i = sh; i < n; i += 1) {
        result[i] = source[i - sh]!;
      }
    }
  } else {
    const sh = -periods;
    if (sh < n) {
      for (let i = 0; i < n - sh; i += 1) {
        result[i] = source[i + sh]!;
      }
    }
  }
  return result;
}

export function movingStd(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  for (let i = period - 1; i < n; i += 1) {
    const start = i + 1 - period;
    let mean = 0;
    for (let j = start; j <= i; j += 1) {
      mean += source[j]!;
    }
    mean /= period;
    let variance = 0;
    for (let j = start; j <= i; j += 1) {
      const d = source[j]! - mean;
      variance += d * d;
    }
    variance /= period;
    result[i] = Math.sqrt(variance);
  }
  return result;
}

export function bollingerBands(
  source: Float64Array,
  period: number,
  devup: number,
  devdn: number,
): { upperband: Float64Array; middleband: Float64Array; lowerband: Float64Array } {
  const n = source.length;
  const upper = new Float64Array(n);
  const middle = new Float64Array(n);
  const lower = new Float64Array(n);
  upper.fill(Number.NaN);
  middle.fill(Number.NaN);
  lower.fill(Number.NaN);
  if (n < period) {
    return { upperband: upper, middleband: middle, lowerband: lower };
  }
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < period; i += 1) {
    const v = source[i]!;
    sum += v;
    sumSq += v * v;
  }
  let sma0 = sum / period;
  let var0 = sumSq / period - sma0 * sma0;
  let std0 = Math.sqrt(Math.max(var0, 0));
  middle[period - 1] = sma0;
  upper[period - 1] = sma0 + devup * std0;
  lower[period - 1] = sma0 - devdn * std0;
  for (let i = period; i < n; i += 1) {
    const oldV = source[i - period]!;
    const newV = source[i]!;
    sum = sum - oldV + newV;
    sumSq = sumSq - oldV * oldV + newV * newV;
    const smaI = sum / period;
    const varI = sumSq / period - smaI * smaI;
    const stdI = Math.sqrt(Math.max(varI, 0));
    middle[i] = smaI;
    upper[i] = smaI + devup * stdI;
    lower[i] = smaI - devdn * stdI;
  }
  return { upperband: upper, middleband: middle, lowerband: lower };
}

export function bollingerBandsWidth(source: Float64Array, period: number, mult: number): Float64Array {
  const { upperband, middleband, lowerband } = bollingerBands(source, period, mult, mult);
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  for (let i = 0; i < n; i += 1) {
    const mid = middleband[i]!;
    if (mid !== 0 && !Number.isNaN(mid)) {
      result[i] = (upperband[i]! - lowerband[i]!) / mid;
    }
  }
  return result;
}

export function rsi(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n <= period) {
    return result;
  }
  let sumGain = 0;
  let sumLoss = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = source[i]! - source[i - 1]!;
    if (change > 0) {
      sumGain += change;
    } else {
      sumLoss += Math.abs(change);
    }
  }
  let avgGain = sumGain / period;
  let avgLoss = sumLoss / period;
  if (avgLoss === 0) {
    result[period] = 100.0;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100.0 - 100.0 / (1.0 + rs);
  }
  for (let i = period + 1; i < n; i += 1) {
    const change = source[i]! - source[i - 1]!;
    const currentGain = change > 0 ? change : 0.0;
    const currentLoss = change > 0 ? 0.0 : Math.abs(change);
    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    if (avgLoss === 0) {
      result[i] = 100.0;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100.0 - 100.0 / (1.0 + rs);
    }
  }
  return result;
}

export function macd(
  source: Float64Array,
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number,
): { macd: Float64Array; signal: Float64Array; hist: Float64Array } {
  const n = source.length;
  const macdLine = new Float64Array(n);
  const signalLine = new Float64Array(n);
  const hist = new Float64Array(n);
  if (n === 0) {
    return { macd: macdLine, signal: signalLine, hist };
  }
  const af = 2.0 / (fastPeriod + 1.0);
  const as = 2.0 / (slowPeriod + 1.0);
  const sig = 2.0 / (signalPeriod + 1.0);
  let emaFast = source[0]!;
  let emaSlow = source[0]!;
  let macdVal = emaFast - emaSlow;
  let macdCleaned = Number.isNaN(macdVal) ? 0.0 : macdVal;
  let signalEma = macdCleaned;
  macdLine[0] = macdCleaned;
  signalLine[0] = signalEma;
  hist[0] = macdVal - signalEma;
  for (let i = 1; i < n; i += 1) {
    emaFast = af * source[i]! + (1.0 - af) * emaFast;
    emaSlow = as * source[i]! + (1.0 - as) * emaSlow;
    macdVal = emaFast - emaSlow;
    macdCleaned = Number.isNaN(macdVal) ? 0.0 : macdVal;
    signalEma = sig * macdCleaned + (1.0 - sig) * signalEma;
    macdLine[i] = macdCleaned;
    signalLine[i] = signalEma;
    hist[i] = macdVal - signalEma;
  }
  return { macd: macdLine, signal: signalLine, hist };
}

export function kama(
  source: Float64Array,
  period: number,
  fastLength: number,
  slowLength: number,
): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  if (n <= period) {
    for (let i = 0; i < n; i += 1) {
      result[i] = source[i]!;
    }
    return result;
  }
  const fastAlpha = 2.0 / (fastLength + 1.0);
  const slowAlpha = 2.0 / (slowLength + 1.0);
  const alphaDiff = fastAlpha - slowAlpha;
  const priceDiffs = new Float64Array(Math.max(0, n - 1));
  for (let i = 1; i < n; i += 1) {
    priceDiffs[i - 1] = Math.abs(source[i]! - source[i - 1]!);
  }
  for (let i = 0; i < period; i += 1) {
    result[i] = source[i]!;
  }
  let volatilitySum = 0;
  for (let i = 0; i < period - 1; i += 1) {
    volatilitySum += priceDiffs[i] ?? 0;
  }
  for (let i = period; i < n; i += 1) {
    const change = Math.abs(source[i]! - source[i - period]!);
    volatilitySum += priceDiffs[i - 1]!;
    if (i > period) {
      volatilitySum -= priceDiffs[i - period - 1]!;
    }
    const er = volatilitySum !== 0 ? change / volatilitySum : 0.0;
    const sc = (er * alphaDiff + slowAlpha) ** 2;
    result[i] = result[i - 1]! + sc * (source[i]! - result[i - 1]!);
  }
  return result;
}

export function zlema(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n <= period) {
    return result;
  }
  const lag = Math.floor((period - 1) / 2);
  const alpha = 2.0 / (period + 1.0);
  const emaData = new Float64Array(n);
  for (let i = lag; i < n; i += 1) {
    emaData[i] = source[i]! + (source[i]! - source[i - lag]!);
  }
  result[lag] = emaData[lag]!;
  for (let i = lag + 1; i < n; i += 1) {
    result[i] = alpha * emaData[i]! + (1.0 - alpha) * result[i - 1]!;
  }
  return result;
}

export function srsi(
  source: Float64Array,
  period: number,
  periodStoch: number,
  kPeriod: number,
  dPeriod: number,
): { k: Float64Array; d: Float64Array } {
  const n = source.length;
  const kValues = new Float64Array(n);
  const dValues = new Float64Array(n);
  kValues.fill(Number.NaN);
  dValues.fill(Number.NaN);
  if (n <= period) {
    return { k: kValues, d: dValues };
  }
  let sumGain = 0;
  let sumLoss = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = source[i]! - source[i - 1]!;
    if (change > 0) {
      sumGain += change;
    } else {
      sumLoss += Math.abs(change);
    }
  }
  let avgGain = sumGain / period;
  let avgLoss = sumLoss / period;
  const rsiBuffer: number[] = [];
  const kBuffer: number[] = [];
  for (let i = period; i < n; i += 1) {
    let rsiVal: number;
    if (i === period) {
      rsiVal = avgLoss === 0 ? 100.0 : 100.0 - 100.0 / (1.0 + avgGain / avgLoss);
    } else {
      const change = source[i]! - source[i - 1]!;
      const currentGain = change > 0 ? change : 0.0;
      const currentLoss = change > 0 ? 0.0 : Math.abs(change);
      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
      rsiVal = avgLoss === 0 ? 100.0 : 100.0 - 100.0 / (1.0 + avgGain / avgLoss);
    }
    rsiBuffer.push(rsiVal);
    if (rsiBuffer.length > periodStoch) {
      rsiBuffer.shift();
    }
    if (rsiBuffer.length === periodStoch) {
      let rsiMin = Infinity;
      let rsiMax = -Infinity;
      for (const r of rsiBuffer) {
        rsiMin = Math.min(rsiMin, r);
        rsiMax = Math.max(rsiMax, r);
      }
      let kVal = rsiMax !== rsiMin ? (100.0 * (rsiVal - rsiMin)) / (rsiMax - rsiMin) : Number.NaN;
      if (kPeriod > 1) {
        kBuffer.push(kVal);
        if (kBuffer.length > kPeriod) {
          kBuffer.shift();
        }
        if (kBuffer.length === kPeriod && kBuffer.every((x) => !Number.isNaN(x))) {
          let s = 0;
          for (const x of kBuffer) {
            s += x;
          }
          kValues[i] = s / kPeriod;
        }
      } else {
        kValues[i] = kVal;
      }
    }
  }
  if (dPeriod > 0) {
    const dBuf: number[] = [];
    for (let i = 0; i < n; i += 1) {
      if (!Number.isNaN(kValues[i])) {
        dBuf.push(kValues[i]!);
        if (dBuf.length > dPeriod) {
          dBuf.shift();
        }
        if (dBuf.length === dPeriod) {
          let s = 0;
          for (const x of dBuf) {
            s += x;
          }
          dValues[i] = s / dPeriod;
        }
      }
    }
  }
  return { k: kValues, d: dValues };
}

export function stoch(
  candles: OhlcvMatrix,
  fastkPeriod: number,
  slowkPeriod: number,
  _slowkMatype: number,
  slowdPeriod: number,
  _slowdMatype: number,
): { k: Float64Array; d: Float64Array } {
  const n = candles.length;
  const kSmoothed = new Float64Array(n);
  const dSmoothed = new Float64Array(n);
  kSmoothed.fill(Number.NaN);
  dSmoothed.fill(Number.NaN);
  if (n < fastkPeriod) {
    return { k: kSmoothed, d: dSmoothed };
  }
  const closeIdx = 2;
  const highIdx = 3;
  const lowIdx = 4;
  const hh = new Float64Array(n);
  const ll = new Float64Array(n);
  hh.fill(Number.NaN);
  ll.fill(Number.NaN);
  for (let i = fastkPeriod - 1; i < n; i += 1) {
    const start = i + 1 - fastkPeriod;
    let maxH = -Infinity;
    let minL = Infinity;
    for (let j = start; j <= i; j += 1) {
      maxH = Math.max(maxH, candles[j]![highIdx]!);
      minL = Math.min(minL, candles[j]![lowIdx]!);
    }
    hh[i] = maxH;
    ll[i] = minL;
  }
  const rawK = new Float64Array(n);
  rawK.fill(Number.NaN);
  for (let i = fastkPeriod - 1; i < n; i += 1) {
    const hhVal = hh[i]!;
    const llVal = ll[i]!;
    const closeVal = candles[i]![closeIdx]!;
    if (hhVal > llVal) {
      rawK[i] = (100.0 * (closeVal - llVal)) / (hhVal - llVal);
    }
  }
  const sk = smaArrayInner(rawK, slowkPeriod);
  const sd = smaArrayInner(sk, slowdPeriod);
  return { k: sk, d: sd };
}

export function stochf(
  candles: OhlcvMatrix,
  fastkPeriod: number,
  fastdPeriod: number,
  _fastdMatype: number,
): { k: Float64Array; d: Float64Array } {
  const n = candles.length;
  const kValues = new Float64Array(n);
  const dValues = new Float64Array(n);
  kValues.fill(Number.NaN);
  dValues.fill(Number.NaN);
  if (n < fastkPeriod) {
    return { k: kValues, d: dValues };
  }
  const closeIdx = 2;
  const highIdx = 3;
  const lowIdx = 4;
  type DqEl = { idx: number; val: number };
  const maxDeque: DqEl[] = [];
  const minDeque: DqEl[] = [];
  const pushMax = (i: number, highVal: number) => {
    while (maxDeque.length > 0 && maxDeque[maxDeque.length - 1]!.val <= highVal) {
      maxDeque.pop();
    }
    maxDeque.push({ idx: i, val: highVal });
  };
  const pushMin = (i: number, lowVal: number) => {
    while (minDeque.length > 0 && minDeque[minDeque.length - 1]!.val >= lowVal) {
      minDeque.pop();
    }
    minDeque.push({ idx: i, val: lowVal });
  };
  for (let i = 0; i < Math.min(fastkPeriod, n); i += 1) {
    pushMax(i, candles[i]![highIdx]!);
    pushMin(i, candles[i]![lowIdx]!);
  }
  if (n >= fastkPeriod) {
    const hh = maxDeque[0]!.val;
    const ll = minDeque[0]!.val;
    const c = candles[fastkPeriod - 1]![closeIdx]!;
    kValues[fastkPeriod - 1] = hh > ll ? (100.0 * (c - ll)) / (hh - ll) : 50.0;
  }
  for (let i = fastkPeriod; i < n; i += 1) {
    while (maxDeque.length > 0 && maxDeque[0]!.idx <= i - fastkPeriod) {
      maxDeque.shift();
    }
    while (minDeque.length > 0 && minDeque[0]!.idx <= i - fastkPeriod) {
      minDeque.shift();
    }
    pushMax(i, candles[i]![highIdx]!);
    pushMin(i, candles[i]![lowIdx]!);
    const hh = maxDeque[0]!.val;
    const ll = minDeque[0]!.val;
    const c = candles[i]![closeIdx]!;
    kValues[i] = hh > ll ? (100.0 * (c - ll)) / (hh - ll) : 50.0;
  }
  const smoothedD = smaArrayInner(kValues, fastdPeriod);
  for (let i = 0; i < n; i += 1) {
    dValues[i] = smoothedD[i]!;
  }
  return { k: kValues, d: dValues };
}
