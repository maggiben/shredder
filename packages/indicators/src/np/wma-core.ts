/** Weighted MA with weights 1..period (HMA building block). */
export function wmaWeighted1ToN(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const out = new Float64Array(n);
  out.fill(Number.NaN);
  if (period < 1) {
    return out;
  }
  const weightSum = (period * (period + 1)) / 2;
  for (let i = period - 1; i < n; i += 1) {
    let s = 0;
    for (let j = 0; j < period; j += 1) {
      s += (j + 1) * source[i - period + 1 + j]!;
    }
    out[i] = s / weightSum;
  }
  return out;
}
