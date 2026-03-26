import type { OhlcvMatrix } from "../types.js";
import { emaForWt, smaForWt } from "./internal.js";
import { getCandleSource, type CandleSourceType } from "../candles/candle-source.js";
const C = { ts: 0, open: 1, close: 2, high: 3, low: 4, vol: 5 } as const;

function col(candles: OhlcvMatrix, idx: number): Float64Array {
  const n = candles.length;
  const a = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    a[i] = candles[i]![idx]!;
  }
  return a;
}

export function dti(candles: OhlcvMatrix, r: number, s: number, u: number): Float64Array {
  const n = candles.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n <= r || n <= s || n <= u) {
    return result;
  }
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const high1 = new Float64Array(n);
  const low1 = new Float64Array(n);
  high1.fill(Number.NaN);
  low1.fill(Number.NaN);
  for (let i = 1; i < n; i += 1) {
    high1[i] = high[i - 1]!;
    low1[i] = low[i - 1]!;
  }
  const xhmu = new Float64Array(n);
  const xlmd = new Float64Array(n);
  for (let i = 1; i < n; i += 1) {
    const highDiff = high[i]! - high1[i]!;
    if (highDiff > 0.0) {
      xhmu[i] = highDiff;
    }
    const lowDiff = low[i]! - low1[i]!;
    if (lowDiff < 0.0) {
      xlmd[i] = -lowDiff;
    }
  }
  const xprice = new Float64Array(n);
  const xpriceAbs = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    xprice[i] = xhmu[i]! - xlmd[i]!;
    xpriceAbs[i] = Math.abs(xprice[i]!);
  }
  const rAlpha = 2.0 / (r + 1.0);
  const sAlpha = 2.0 / (s + 1.0);
  const uAlpha = 2.0 / (u + 1.0);
  const r1 = 1.0 - rAlpha;
  const s1 = 1.0 - sAlpha;
  const u1 = 1.0 - uAlpha;
  const temp = new Float64Array(n);
  temp[0] = xprice[0]!;
  for (let i = 1; i < n; i += 1) {
    temp[i] = rAlpha * xprice[i]! + r1 * temp[i - 1]!;
  }
  const temp2 = new Float64Array(n);
  temp2[0] = temp[0]!;
  for (let i = 1; i < n; i += 1) {
    temp2[i] = sAlpha * temp[i]! + s1 * temp2[i - 1]!;
  }
  const xuXa = new Float64Array(n);
  xuXa[0] = temp2[0]!;
  for (let i = 1; i < n; i += 1) {
    xuXa[i] = uAlpha * temp2[i]! + u1 * xuXa[i - 1]!;
  }
  const tempAbs = new Float64Array(n);
  tempAbs[0] = xpriceAbs[0]!;
  for (let i = 1; i < n; i += 1) {
    tempAbs[i] = rAlpha * xpriceAbs[i]! + r1 * tempAbs[i - 1]!;
  }
  const temp2Abs = new Float64Array(n);
  temp2Abs[0] = tempAbs[0]!;
  for (let i = 1; i < n; i += 1) {
    temp2Abs[i] = sAlpha * tempAbs[i]! + s1 * temp2Abs[i - 1]!;
  }
  const xuXaAbs = new Float64Array(n);
  xuXaAbs[0] = temp2Abs[0]!;
  for (let i = 1; i < n; i += 1) {
    xuXaAbs[i] = uAlpha * temp2Abs[i]! + u1 * xuXaAbs[i - 1]!;
  }
  for (let i = 0; i < n; i += 1) {
    const v1 = xuXa[i]! * 100.0;
    const v2 = xuXaAbs[i]!;
    result[i] = v2 !== 0.0 ? v1 / v2 : 0.0;
  }
  return result;
}

export function wt(
  candles: OhlcvMatrix,
  wtchannellen: number,
  wtaveragelen: number,
  wtmalen: number,
  oblevel: number,
  oslevel: number,
  sourceType: string,
): {
  wt1: Float64Array;
  wt2: Float64Array;
  wtCrossUp: Uint8Array;
  wtCrossDown: Uint8Array;
  wtOversold: Uint8Array;
  wtOverbought: Uint8Array;
  wtVwap: Float64Array;
} {
  const n = candles.length;
  const src = getCandleSource(candles, sourceType as CandleSourceType);
  const esa = emaForWt(src, wtchannellen);
  const absDiff = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    absDiff[i] = Math.abs(src[i]! - esa[i]!);
  }
  const de = emaForWt(absDiff, wtchannellen);
  const ci = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    ci[i] = de[i] === 0.0 ? 0.0 : (src[i]! - esa[i]!) / (0.015 * de[i]!);
  }
  const wt1 = emaForWt(ci, wtaveragelen);
  const wt2 = smaForWt(wt1, wtmalen);
  const wtVwap = new Float64Array(n);
  const wtCrossUp = new Uint8Array(n);
  const wtCrossDown = new Uint8Array(n);
  const wtOversold = new Uint8Array(n);
  const wtOverbought = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    wtVwap[i] = wt1[i]! - wt2[i]!;
    wtCrossUp[i] = wt2[i]! - wt1[i]! <= 0.0 ? 1 : 0;
    wtCrossDown[i] = wt2[i]! - wt1[i]! >= 0.0 ? 1 : 0;
    wtOversold[i] = wt2[i]! <= oslevel ? 1 : 0;
    wtOverbought[i] = wt2[i]! >= oblevel ? 1 : 0;
  }
  return { wt1, wt2, wtCrossUp, wtCrossDown, wtOversold, wtOverbought, wtVwap };
}

function getPeriodFromTimestamp(timestamp: number, anchor: string): number {
  const seconds = Math.floor(timestamp / 1000.0);
  const a = anchor.toUpperCase();
  switch (a) {
    case "D":
      return Math.floor(seconds / 86400);
    case "H":
      return Math.floor(seconds / 3600);
    case "M":
      return Math.floor(seconds / 60);
    case "4H":
      return Math.floor(seconds / 14400);
    case "12H":
      return Math.floor(seconds / 43200);
    case "W":
      return Math.floor(seconds / 604800);
    case "MN":
      return Math.floor(seconds / 2592000);
    default:
      return Math.floor(seconds / 86400);
  }
}

export function vwap(
  candles: OhlcvMatrix,
  sourceType: string,
  anchor: string,
  sequential: boolean,
): Float64Array {
  const n = candles.length;
  const result = new Float64Array(sequential ? n : 1);
  result.fill(Number.NaN);
  if (n === 0) {
    return result;
  }
  const source = getCandleSource(candles, sourceType.toLowerCase() as CandleSourceType);
  const volume = col(candles, C.vol);
  const timestamps = col(candles, C.ts);
  let cumVol = 0;
  let cumVolPrice = 0;
  let currentPeriod = getPeriodFromTimestamp(timestamps[0]!, anchor);
  const full = new Float64Array(n);
  full.fill(Number.NaN);
  for (let i = 0; i < n; i += 1) {
    const period = getPeriodFromTimestamp(timestamps[i]!, anchor);
    if (period !== currentPeriod) {
      cumVol = 0;
      cumVolPrice = 0;
      currentPeriod = period;
    }
    const volPrice = volume[i]! * source[i]!;
    cumVolPrice += volPrice;
    cumVol += volume[i]!;
    if (cumVol !== 0.0) {
      full[i] = cumVolPrice / cumVol;
    }
  }
  if (sequential) {
    return full;
  }
  result[0] = full[n - 1]!;
  return result;
}

export function t3FromSource(source: Float64Array, period: number, vfactor: number): Float64Array {
  const n = source.length;
  const t3Result = new Float64Array(n);
  if (n === 0) {
    return t3Result;
  }
  const k = 2.0 / (period + 1.0);
  const kRev = 1.0 - k;
  const w1 = -(vfactor ** 3);
  const w2 = 3 * vfactor ** 2 + 3 * vfactor ** 3;
  const w3 = -(6 * vfactor ** 2) - 3 * vfactor - 3 * vfactor ** 3;
  const w4 = 1 + 3 * vfactor + vfactor ** 3 + 3 * vfactor ** 2;
  const e1 = new Float64Array(n);
  const e2 = new Float64Array(n);
  const e3 = new Float64Array(n);
  const e4 = new Float64Array(n);
  const e5 = new Float64Array(n);
  const e6 = new Float64Array(n);
  e1[0] = source[0]!;
  e2[0] = e1[0]!;
  e3[0] = e2[0]!;
  e4[0] = e3[0]!;
  e5[0] = e4[0]!;
  e6[0] = e5[0]!;
  t3Result[0] = w1 * e6[0]! + w2 * e5[0]! + w3 * e4[0]! + w4 * e3[0]!;
  for (let i = 1; i < n; i += 1) {
    e1[i] = k * source[i]! + kRev * e1[i - 1]!;
    e2[i] = k * e1[i]! + kRev * e2[i - 1]!;
    e3[i] = k * e2[i]! + kRev * e3[i - 1]!;
    e4[i] = k * e3[i]! + kRev * e4[i - 1]!;
    e5[i] = k * e4[i]! + kRev * e5[i - 1]!;
    e6[i] = k * e5[i]! + kRev * e6[i - 1]!;
    t3Result[i] = w1 * e6[i]! + w2 * e5[i]! + w3 * e4[i]! + w4 * e3[i]!;
  }
  return t3Result;
}

export function ichimokuCloud(
  candles: OhlcvMatrix,
  conversionLinePeriod: number,
  baseLinePeriod: number,
  laggingLinePeriod: number,
  displacement: number,
): { conversion_line: number; base_line: number; span_a: number; span_b: number } {
  const high = col(candles, C.high);
  const low = col(candles, C.low);
  const n = high.length;
  const drop = displacement - 1;
  if (drop < 0 || n <= drop) {
    return {
      conversion_line: Number.NaN,
      base_line: Number.NaN,
      span_a: Number.NaN,
      span_b: Number.NaN,
    };
  }
  const eh = high.subarray(0, n - drop);
  const el = low.subarray(0, n - drop);
  const getPeriodHl = (highs: Float64Array, lows: Float64Array, period: number): [number, number] => {
    const m = highs.length;
    if (m < period) {
      return [Number.NaN, Number.NaN];
    }
    let periodHigh = -Infinity;
    let periodLow = Infinity;
    for (let i = m - period; i < m; i += 1) {
      periodHigh = Math.max(periodHigh, highs[i]!);
      periodLow = Math.min(periodLow, lows[i]!);
    }
    return [periodHigh, periodLow];
  };
  const [smallPh, smallPl] = getPeriodHl(eh, el, conversionLinePeriod);
  const [midPh, midPl] = getPeriodHl(eh, el, baseLinePeriod);
  const [longPh, longPl] = getPeriodHl(eh, el, laggingLinePeriod);
  const earlyConversionLine = (smallPh + smallPl) / 2.0;
  const earlyBaseLine = (midPh + midPl) / 2.0;
  const spanA = (earlyConversionLine + earlyBaseLine) / 2.0;
  const spanB = (longPh + longPl) / 2.0;
  const [curSmallPh, curSmallPl] = getPeriodHl(high, low, conversionLinePeriod);
  const [curMidPh, curMidPl] = getPeriodHl(high, low, baseLinePeriod);
  const currentConversionLine = (curSmallPh + curSmallPl) / 2.0;
  const currentBaseLine = (curMidPh + curMidPl) / 2.0;
  return {
    conversion_line: currentConversionLine,
    base_line: currentBaseLine,
    span_a: spanA,
    span_b: spanB,
  };
}

export function alligatorFromSource(source: Float64Array): {
  jaw: Float64Array;
  teeth: Float64Array;
  lips: Float64Array;
} {
  const jawPeriod = 13;
  const teethPeriod = 8;
  const lipsPeriod = 5;
  const n = source.length;
  const jaw = new Float64Array(n);
  const teeth = new Float64Array(n);
  const lips = new Float64Array(n);
  jaw.fill(Number.NaN);
  teeth.fill(Number.NaN);
  lips.fill(Number.NaN);
  if (n < 13) {
    return { jaw, teeth, lips };
  }
  const jawAlpha = 1.0 / jawPeriod;
  const teethAlpha = 1.0 / teethPeriod;
  const lipsAlpha = 1.0 / lipsPeriod;
  let jawSum = 0;
  let teethSum = 0;
  let lipsSum = 0;
  for (let i = 0; i < jawPeriod; i += 1) {
    jawSum += source[i]!;
    if (i < teethPeriod) {
      teethSum += source[i]!;
    }
    if (i < lipsPeriod) {
      lipsSum += source[i]!;
    }
  }
  let jawSmma = jawSum / jawPeriod;
  let teethSmma = teethSum / teethPeriod;
  let lipsSmma = lipsSum / lipsPeriod;
  const jawUn = new Float64Array(n);
  const teethUn = new Float64Array(n);
  const lipsUn = new Float64Array(n);
  jawUn.fill(Number.NaN);
  teethUn.fill(Number.NaN);
  lipsUn.fill(Number.NaN);
  jawUn[jawPeriod - 1] = jawSmma;
  teethUn[teethPeriod - 1] = teethSmma;
  lipsUn[lipsPeriod - 1] = lipsSmma;
  for (let i = jawPeriod; i < n; i += 1) {
    jawSmma = jawAlpha * source[i]! + (1.0 - jawAlpha) * jawSmma;
    jawUn[i] = jawSmma;
    if (i >= teethPeriod) {
      teethSmma = teethAlpha * source[i]! + (1.0 - teethAlpha) * teethSmma;
      teethUn[i] = teethSmma;
    }
    if (i >= lipsPeriod) {
      lipsSmma = lipsAlpha * source[i]! + (1.0 - lipsAlpha) * lipsSmma;
      lipsUn[i] = lipsSmma;
    }
  }
  for (let i = 0; i < n - 8; i += 1) {
    if (i + 8 < n && !Number.isNaN(jawUn[i]!)) {
      jaw[i + 8] = jawUn[i]!;
    }
  }
  for (let i = 0; i < n - 5; i += 1) {
    if (i + 5 < n && !Number.isNaN(teethUn[i]!)) {
      teeth[i + 5] = teethUn[i]!;
    }
  }
  for (let i = 0; i < n - 3; i += 1) {
    if (i + 3 < n && !Number.isNaN(lipsUn[i]!)) {
      lips[i + 3] = lipsUn[i]!;
    }
  }
  return { jaw, teeth, lips };
}
