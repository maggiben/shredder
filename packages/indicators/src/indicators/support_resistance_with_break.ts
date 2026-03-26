/*
 support_resistance_with_breaks

 @author LuxAlgo
 credits: https://www.tradingview.com/script/JDFoWQbL-Support-and-Resistance-Levels-with-Breaks-LuxAlgo

 :param candles: np.ndarray
 :param left_bars: int - default: 15
 :param right_bars: int - default: 15
 :param vol_threshold: int - default: 20
 :return: SupportResistanceWithBreaks(support, resistance, red_break, green_break, bear_wick, bull_wick)
*/
import type { IndicatorCandles, OhlcvMatrix } from "../types.js";
import { isCandles1D } from "../types.js";
import { column } from "../np/column.js";
import { ema } from "./ema.js";

export type SupportResistanceWithBreakResult = {
  readonly support: number;
  readonly resistance: number;
  readonly red_break: boolean;
  readonly green_break: boolean;
  readonly bear_wick: boolean;
  readonly bull_wick: boolean;
};

type PivotCell = number | boolean | null;

function resistanceLevel(source: Float64Array, leftBars: number, rightBars: number): number {
  const pivotHighs: PivotCell[] = new Array(source.length).fill(null);
  for (let i = leftBars; i < source.length - rightBars; i += 1) {
    let isPivotHigh = true;
    for (let j = 1; j <= leftBars; j += 1) {
      if (source[i]! <= source[i - j]!) {
        isPivotHigh = false;
        break;
      }
    }
    if (isPivotHigh) {
      for (let j = 1; j <= rightBars; j += 1) {
        if (source[i]! <= source[i + j]!) {
          isPivotHigh = false;
          break;
        }
      }
    }
    pivotHighs[i] = isPivotHigh ? source[i]! : false;
  }
  let nextValid: number | null = null;
  let firstValue: number | null = null;
  for (let i = 0; i < pivotHighs.length; i += 1) {
    if (pivotHighs[i] === false) {
      pivotHighs[i] = nextValid;
    } else if (pivotHighs[i] !== null && pivotHighs[i] !== false) {
      nextValid = pivotHighs[i] as number;
      firstValue = firstValue === null ? i : firstValue;
    }
  }
  if (firstValue === null || firstValue < 1) {
    return Number.NaN;
  }
  const fillStart = pivotHighs[firstValue] as number;
  for (let i = 0; i < firstValue - 1; i += 1) {
    pivotHighs[i] = fillStart;
  }
  const tailFill = pivotHighs[pivotHighs.length - rightBars - 1] as number;
  for (let i = pivotHighs.length - rightBars; i < pivotHighs.length; i += 1) {
    pivotHighs[i] = tailFill;
  }
  return pivotHighs[pivotHighs.length - 1] as number;
}

function supportLevel(source: Float64Array, leftBars: number, rightBars: number): number {
  const pivotLows: PivotCell[] = new Array(source.length).fill(null);
  for (let i = leftBars; i < source.length - rightBars; i += 1) {
    let isPivotLow = true;
    for (let j = 1; j <= leftBars; j += 1) {
      if (source[i]! >= source[i - j]!) {
        isPivotLow = false;
        break;
      }
    }
    if (isPivotLow) {
      for (let j = 1; j <= rightBars; j += 1) {
        if (source[i]! >= source[i + j]!) {
          isPivotLow = false;
          break;
        }
      }
    }
    pivotLows[i] = isPivotLow ? source[i]! : false;
  }
  let nextValid: number | null = null;
  let firstValue: number | null = null;
  for (let i = 0; i < pivotLows.length; i += 1) {
    if (pivotLows[i] === false) {
      pivotLows[i] = nextValid;
    } else if (pivotLows[i] !== null && pivotLows[i] !== false) {
      nextValid = pivotLows[i] as number;
      firstValue = firstValue === null ? i : firstValue;
    }
  }
  if (firstValue === null || firstValue < 1) {
    return Number.NaN;
  }
  const fillStart = pivotLows[firstValue] as number;
  for (let i = 0; i < firstValue - 1; i += 1) {
    pivotLows[i] = fillStart;
  }
  const tailFill = pivotLows[pivotLows.length - rightBars - 1] as number;
  for (let i = pivotLows.length - rightBars; i < pivotLows.length; i += 1) {
    pivotLows[i] = tailFill;
  }
  return pivotLows[pivotLows.length - 1] as number;
}

export function support_resistance_with_break(
  candles: IndicatorCandles,
  leftBars: number = 15,
  rightBars: number = 15,
  volThreshold: number = 20,
): SupportResistanceWithBreakResult {
  if (isCandles1D(candles)) {
    throw new Error("support_resistance_with_break requires OHLCV candle matrix");
  }
  const m = candles as OhlcvMatrix;
  const resistance = resistanceLevel(column(m, 3), leftBars, rightBars);
  const support = supportLevel(column(m, 4), leftBars, rightBars);
  const vol = column(m, 5);
  const short = ema(vol, 5, "close", false) as number;
  const long = ema(vol, 10, "close", false) as number;
  const osc = 100 * (short - long) / long;
  const lastCandles = m[0]!;
  const o = lastCandles[1]!;
  const c = lastCandles[2]!;
  const h = lastCandles[3]!;
  const l = lastCandles[4]!;
  const redBreak =
    c < support && !(Math.abs(o - c) < Math.abs(o - h)) && osc > volThreshold;
  const greenBreak =
    c > resistance && Math.abs(o - l) > Math.abs(o - c) && osc > volThreshold;
  const bullWick = c > resistance && Math.abs(o - l) > Math.abs(o - c);
  const bearWick = c < support && Math.abs(o - c) < Math.abs(o - h);
  return {
    support,
    resistance,
    red_break: redBreak,
    green_break: greenBreak,
    bear_wick: bearWick,
    bull_wick: bullWick,
  };
}
