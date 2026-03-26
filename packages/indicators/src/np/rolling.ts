/**
 * Simple moving average via valid convolution (distinct from NaN-aware SMA used elsewhere).
 */
export function smaConvolveValid(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  if (n < period) {
    const out = new Float64Array(n);
    out.fill(Number.NaN);
    return out;
  }
  const outLen = n - period + 1;
  const conv = new Float64Array(outLen);
  let s = 0;
  for (let i = 0; i < period; i += 1) {
    s += source[i]!;
  }
  conv[0] = s / period;
  for (let i = period; i < n; i += 1) {
    s += source[i]!;
    s -= source[i - period]!;
    conv[i - period + 1] = s / period;
  }
  const padded = new Float64Array(n);
  padded.fill(Number.NaN, 0, period - 1);
  padded.set(conv, period - 1);
  return padded;
}

export function mom1(source: Float64Array): Float64Array {
  const n = source.length;
  const out = new Float64Array(n);
  out[0] = Number.NaN;
  for (let i = 1; i < n; i += 1) {
    out[i] = source[i]! - source[i - 1]!;
  }
  return out;
}
