import type { OhlcvMatrix } from "../types.js";

export function column(candles: OhlcvMatrix, col: number): Float64Array {
  const n = candles.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = candles[i]![col]!;
  }
  return out;
}

/**
 * Selects columns from each row (NumPy-style `candles[:, [a,b,...]]`).
 */
export function selectCols(candles: OhlcvMatrix, cols: readonly number[]): Float64Array[] {
  const n = candles.length;
  const w = cols.length;
  const rows: Float64Array[] = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const row = new Float64Array(w);
    for (let j = 0; j < w; j += 1) {
      row[j] = candles[i]![cols[j]!]!;
    }
    rows[i] = row;
  }
  return rows;
}
