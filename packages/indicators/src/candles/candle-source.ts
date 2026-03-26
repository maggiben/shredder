import type { OhlcvMatrix } from "../types.js";
import { column } from "../np/column.js";

/** Supported `source_type` strings for OHLCV column selection. */
export type CandleSourceType =
  | "close"
  | "open"
  | "high"
  | "low"
  | "volume"
  | "hl2"
  | "hlc3"
  | "ohlc4"
  | "idx";

const IDX = 0;
const OPEN = 1;
const CLOSE = 2;
const HIGH = 3;
const LOW = 4;
const VOLUME = 5;

/**
 * Returns the price (or volume) series for the selected source type.
 * Throws if `source_type` is unknown.
 */
export function getCandleSource(candles: OhlcvMatrix, sourceType: string = "close"): Float64Array {
  switch (sourceType) {
    case "close":
      return column(candles, CLOSE);
    case "open":
      return column(candles, OPEN);
    case "high":
      return column(candles, HIGH);
    case "low":
      return column(candles, LOW);
    case "volume":
      return column(candles, VOLUME);
    case "hl2":
      return hl2(candles);
    case "hlc3":
      return hlc3(candles);
    case "ohlc4":
      return ohlc4(candles);
    case "idx":
      return column(candles, IDX);
    default:
      throw new Error(`Source type '${sourceType}' not recognised`);
  }
}

function hl2(candles: OhlcvMatrix): Float64Array {
  const n = candles.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const row = candles[i]!;
    out[i] = (row[HIGH]! + row[LOW]!) / 2;
  }
  return out;
}

function hlc3(candles: OhlcvMatrix): Float64Array {
  const n = candles.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const row = candles[i]!;
    out[i] = (row[HIGH]! + row[LOW]! + row[CLOSE]!) / 3;
  }
  return out;
}

function ohlc4(candles: OhlcvMatrix): Float64Array {
  const n = candles.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const row = candles[i]!;
    out[i] = (row[OPEN]! + row[HIGH]! + row[LOW]! + row[CLOSE]!) / 4;
  }
  return out;
}
