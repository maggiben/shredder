/** Commodity channel index on typical price (windowed loop). */
export function cciFromTypicalPrice(tp: Float64Array, period: number): Float64Array {
  const n = tp.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  for (let i = period - 1; i < n; i += 1) {
    let sumTp = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      sumTp += tp[j]!;
    }
    const sma = sumTp / period;
    let sumDiff = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      sumDiff += Math.abs(tp[j]! - sma);
    }
    const md = sumDiff / period;
    if (md === 0) {
      result[i] = 0;
    } else {
      result[i] = (tp[i]! - sma) / (0.015 * md);
    }
  }
  return result;
}
