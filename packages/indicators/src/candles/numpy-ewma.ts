/**
 * Vectorised EWMA (same recurrence as common SMMA / Risk implementation).
 */
export function numpyEwma(data: Float64Array, window: number): Float64Array {
  const alpha = 1 / window;
  const n = data.length;
  const scaleArr = new Float64Array(n);
  const weights = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    scaleArr[i] = (1 - alpha) ** -i;
    weights[i] = (1 - alpha) ** i;
  }
  const pw0 = (1 - alpha) ** (n - 1);
  const mult = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    mult[i] = data[i]! * pw0 * scaleArr[i]!;
  }
  const cumsums = new Float64Array(n);
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    s += mult[i]!;
    cumsums[i] = s;
  }
  const wc = new Float64Array(n);
  s = 0;
  for (let i = 0; i < n; i += 1) {
    s += weights[i]!;
    wc[i] = s;
  }
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = (cumsums[i]! * scaleArr[n - 1 - i]!) / wc[i]!;
  }
  return out;
}
