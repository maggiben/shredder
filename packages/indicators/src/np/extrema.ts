/** Local minima indices (scipy `argrelextrema(..., np.less, order)`). */
export function argrelMinIndices(a: Float64Array, order: number): number[] {
  const n = a.length;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const v = a[i]!;
    if (Number.isNaN(v)) {
      continue;
    }
    let ok = true;
    for (let k = 1; k <= order; k += 1) {
      if (i - k >= 0 && (a[i - k]! <= v || Number.isNaN(a[i - k]!))) {
        ok = false;
        break;
      }
      if (i + k < n && (a[i + k]! <= v || Number.isNaN(a[i + k]!))) {
        ok = false;
        break;
      }
    }
    if (ok) {
      out.push(i);
    }
  }
  return out;
}

/** Local maxima indices (scipy `argrelextrema(..., np.greater, order)`). */
export function argrelMaxIndices(a: Float64Array, order: number): number[] {
  const n = a.length;
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const v = a[i]!;
    if (Number.isNaN(v)) {
      continue;
    }
    let ok = true;
    for (let k = 1; k <= order; k += 1) {
      if (i - k >= 0 && (a[i - k]! >= v || Number.isNaN(a[i - k]!))) {
        ok = false;
        break;
      }
      if (i + k < n && (a[i + k]! >= v || Number.isNaN(a[i + k]!))) {
        ok = false;
        break;
      }
    }
    if (ok) {
      out.push(i);
    }
  }
  return out;
}
