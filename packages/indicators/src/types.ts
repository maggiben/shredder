/**
 * OHLCV candle matrix: each row is [timestamp, open, close, high, low, volume].
 * Column order is fixed for compatibility with migrated indicator definitions.
 */
export type OhlcvRow = Float64Array;

export type OhlcvMatrix = readonly OhlcvRow[];

/** Single-series input (1D) or full OHLCV matrix (2D). */
export type IndicatorCandles = OhlcvMatrix | Float64Array;

export function isCandles1D(candles: IndicatorCandles): candles is Float64Array {
  return candles instanceof Float64Array;
}

export function candleRowCount(candles: IndicatorCandles): number {
  return candles.length;
}
