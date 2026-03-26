/*
 Hurst Exponent

 :param candles: np.ndarray
 :param min_chunksize: int - default: 8
 :param max_chunksize: int - default: 200
 :param num_chunksize: int - default: 5
 :param method: int - default: 1 - 0: RS | 1: DMA | 2: DSOD
 :param source_type: str - default: "close"

 :return: float
*/
import type { IndicatorCandles } from "../types.js";
import { resolveSourceSeries } from "../candles/helpers.js";
import { lstsq } from "../np/linalg.js";
import { lfilter } from "../np/signal.js";

function nanStd1d(a: Float64Array): number {
  let mean = 0;
  let nc = 0;
  for (let i = 0; i < a.length; i += 1) {
    const v = a[i]!;
    if (!Number.isNaN(v)) {
      mean += v;
      nc += 1;
    }
  }
  if (nc === 0) {
    return Number.NaN;
  }
  mean /= nc;
  let s = 0;
  let c = 0;
  for (let i = 0; i < a.length; i += 1) {
    const v = a[i]!;
    if (!Number.isNaN(v)) {
      const d = v - mean;
      s += d * d;
      c += 1;
    }
  }
  return c === 0 ? Number.NaN : Math.sqrt(s / c);
}

function linspaceIntChunkSizes(minC: number, maxC: number, num: number): Int32Array {
  const maxP1 = maxC + 1;
  const out = new Int32Array(num);
  if (num === 1) {
    out[0] = minC;
    return out;
  }
  for (let i = 0; i < num; i += 1) {
    const t = minC + ((maxP1 - minC) * i) / (num - 1);
    out[i] = Math.floor(t);
  }
  return out;
}

function hurstRs(x: Float64Array, minChunksize: number, maxChunksize: number, numChunksize: number): number {
  const chunkSizeList = linspaceIntChunkSizes(minChunksize, maxChunksize, numChunksize);
  const rsValuesList = new Float64Array(numChunksize);
  const rsTmp = new Float64Array(x.length);
  for (let i = 0; i < numChunksize; i += 1) {
    const chunkSize = chunkSizeList[i]!;
    if (chunkSize <= 0) {
      rsValuesList[i] = Number.NaN;
      continue;
    }
    const numberOfChunks = Math.floor(x.length / chunkSize);
    let lastIdx = 0;
    for (let idx = 0; idx < numberOfChunks; idx += 1) {
      const ini = idx * chunkSize;
      const end = ini + chunkSize;
      const chunk = x.subarray(ini, end);
      let mean = 0;
      for (let j = 0; j < chunk.length; j += 1) {
        mean += chunk[j]!;
      }
      mean /= chunk.length;
      let csum = 0;
      let zmin = Number.POSITIVE_INFINITY;
      let zmax = Number.NEGATIVE_INFINITY;
      for (let j = 0; j < chunk.length; j += 1) {
        csum += chunk[j]! - mean;
        if (csum < zmin) {
          zmin = csum;
        }
        if (csum > zmax) {
          zmax = csum;
        }
      }
      const std = nanStd1d(chunk);
      rsTmp[idx] = std !== 0 && !Number.isNaN(std) ? (zmax - zmin) / std : Number.NaN;
      lastIdx = idx;
    }
    let acc = 0;
    let cnt = 0;
    for (let k = 0; k <= lastIdx; k += 1) {
      if (!Number.isNaN(rsTmp[k]!)) {
        acc += rsTmp[k]!;
        cnt += 1;
      }
    }
    rsValuesList[i] = cnt === 0 ? Number.NaN : acc / cnt;
  }
  const logChunks: number[] = [];
  const logRs: number[] = [];
  for (let i = 0; i < numChunksize; i += 1) {
    const cs = chunkSizeList[i]!;
    const rv = rsValuesList[i]!;
    if (cs > 0 && rv > 0 && !Number.isNaN(rv)) {
      logChunks.push(Math.log(cs));
      logRs.push(Math.log(rv));
    }
  }
  if (logChunks.length < 2) {
    return Number.NaN;
  }
  const aRows = logChunks.map((lc) => [lc, 1] as const);
  const coef = lstsq(aRows, logRs, null);
  return coef[0]!;
}

function hurstDma(prices: Float64Array, minChunksize: number, maxChunksize: number, numChunksizeStep: number): number {
  const maxP1 = maxChunksize + 1;
  const N = prices.length;
  const nList: number[] = [];
  for (let n = minChunksize; n < maxP1; n += numChunksizeStep) {
    nList.push(n);
  }
  if (nList.length < 2 || N <= maxP1) {
    return Number.NaN;
  }
  const dmaList = new Float64Array(nList.length);
  const factor = 1 / (N - maxP1);
  for (let i = 0; i < nList.length; i += 1) {
    const n = nList[i]!;
    const b = new Float64Array(n);
    b[0] = (n - 1) / n;
    const invn = -1 / n;
    for (let j = 1; j < n; j += 1) {
      b[j] = invn;
    }
    const filt = lfilter(Array.from(b), [1], prices);
    let sumNoise = 0;
    for (let k = maxP1; k < N; k += 1) {
      const v = filt[k]!;
      sumNoise += v * v;
    }
    dmaList[i] = Math.sqrt(factor * sumNoise);
  }
  const logN: number[] = [];
  const logD: number[] = [];
  for (let i = 0; i < nList.length; i += 1) {
    const d = dmaList[i]!;
    if (d > 0 && !Number.isNaN(d)) {
      logN.push(Math.log10(nList[i]!));
      logD.push(Math.log10(d));
    }
  }
  if (logN.length < 2) {
    return Number.NaN;
  }
  const aRows = logN.map((lnv, j) => [lnv, 1] as const);
  const coef = lstsq(aRows, logD, null);
  return coef[0]!;
}

function hurstDsod(x: Float64Array): number {
  if (x.length < 5) {
    return Number.NaN;
  }
  const diff1 = new Float64Array(x.length - 1);
  for (let i = 0; i < diff1.length; i += 1) {
    diff1[i] = x[i + 1]! - x[i]!;
  }
  const y = new Float64Array(diff1.length);
  y[0] = diff1[0]!;
  for (let i = 1; i < diff1.length; i += 1) {
    y[i] = y[i - 1]! + diff1[i]!;
  }
  const b1 = [1, -2, 1];
  const y1f = lfilter(b1, [1], y);
  const y1 = y1f.subarray(b1.length - 1);
  const b2 = [1, 0, -2, 0, 1];
  const y2f = lfilter(b2, [1], y);
  const y2 = y2f.subarray(b2.length - 1);
  const len = Math.min(y1.length, y2.length);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < len; i += 1) {
    s1 += y1[i]! * y1[i]!;
    s2 += y2[i]! * y2[i]!;
  }
  s1 /= len;
  s2 /= len;
  if (s1 <= 0 || s2 <= 0) {
    return Number.NaN;
  }
  return 0.5 * (Math.log(s2 / s1) / Math.LN2);
}

export function hurst_exponent(
  candles: IndicatorCandles,
  minChunksize: number = 8,
  maxChunksize: number = 200,
  numChunksize: number = 5,
  method: number = 1,
  sourceType: string = "close",
): number | null {
  const source = resolveSourceSeries(candles, false, sourceType);
  let h: number;
  if (method === 0) {
    const xd = new Float64Array(Math.max(0, source.length - 1));
    for (let i = 0; i < xd.length; i += 1) {
      xd[i] = source[i + 1]! - source[i]!;
    }
    h = hurstRs(xd, minChunksize, maxChunksize, numChunksize);
  } else if (method === 1) {
    h = hurstDma(source, minChunksize, maxChunksize, numChunksize);
  } else if (method === 2) {
    h = hurstDsod(source);
  } else {
    throw new Error("hurst_exponent: method must be 0 (RS), 1 (DMA), or 2 (DSOD)");
  }
  return Number.isNaN(h) ? null : h;
}
