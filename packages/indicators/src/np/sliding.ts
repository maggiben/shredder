/** View of consecutive windows (NumPy `sliding_window_view` for 1D). */
export function slidingWindowView(source: Float64Array, windowShape: number): Float64Array[] {
  const n = source.length;
  const outLen = n - windowShape + 1;
  if (outLen <= 0) {
    return [];
  }
  const rows: Float64Array[] = new Array(outLen);
  for (let i = 0; i < outLen; i += 1) {
    rows[i] = source.subarray(i, i + windowShape);
  }
  return rows;
}

export function meanLastAxis(windows: Float64Array[]): Float64Array {
  const out = new Float64Array(windows.length);
  for (let i = 0; i < windows.length; i += 1) {
    out[i] = mean1d(windows[i]!);
  }
  return out;
}

export function nanMeanLastAxis(windows: Float64Array[]): Float64Array {
  const out = new Float64Array(windows.length);
  for (let i = 0; i < windows.length; i += 1) {
    out[i] = nanMean1d(windows[i]!);
  }
  return out;
}

export function mean1d(a: Float64Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) {
    s += a[i]!;
  }
  return s / a.length;
}

export function nanMean1d(a: Float64Array): number {
  let s = 0;
  let c = 0;
  for (let i = 0; i < a.length; i += 1) {
    const v = a[i]!;
    if (!Number.isNaN(v)) {
      s += v;
      c += 1;
    }
  }
  return c === 0 ? Number.NaN : s / c;
}
