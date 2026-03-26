/** Convolution with normalized weights over trailing `weights.length` samples. */
export function weightedRollingAverage(source: Float64Array, weights: Float64Array): Float64Array {
  const period = weights.length;
  const n = source.length;
  const out = new Float64Array(n);
  out.fill(Number.NaN);
  if (period < 1) {
    return out;
  }
  for (let i = period - 1; i < n; i += 1) {
    let s = 0;
    for (let j = 0; j < period; j += 1) {
      s += weights[j]! * source[i - period + 1 + j]!;
    }
    out[i] = s;
  }
  return out;
}
