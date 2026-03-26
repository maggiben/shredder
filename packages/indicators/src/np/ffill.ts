/** Forward-fill NaNs with last valid value. */
export function ffil1d(a: Float64Array): Float64Array {
  const out = a.slice();
  let last = Number.NaN;
  for (let i = 0; i < out.length; i += 1) {
    const v = out[i]!;
    if (!Number.isNaN(v)) {
      last = v;
    } else if (!Number.isNaN(last)) {
      out[i] = last;
    }
  }
  return out;
}
