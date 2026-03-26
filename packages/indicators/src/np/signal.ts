/**
 * 1D IIR/FIR filter: y = lfilter(b, a, x) with `a[0] === 1` (scipy-compatible subset).
 */
export function lfilter(b: readonly number[], a: readonly number[], x: Float64Array): Float64Array {
  if (a.length === 0 || Math.abs(a[0]! - 1) > 1e-12) {
    throw new Error("lfilter: only a[0]=1 supported");
  }
  const nb = b.length;
  const na = a.length;
  const n = x.length;
  const y = new Float64Array(n);
  for (let t = 0; t < n; t += 1) {
    let acc = 0;
    for (let j = 0; j < nb; j += 1) {
      const idx = t - j;
      if (idx >= 0) {
        acc += b[j]! * x[idx]!;
      }
    }
    for (let j = 1; j < na; j += 1) {
      const idx = t - j;
      if (idx >= 0) {
        acc -= a[j]! * y[idx]!;
      }
    }
    y[t] = acc;
  }
  return y;
}
