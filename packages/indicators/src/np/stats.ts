/** scipy.stats.median_abs_deviation default scale='normal' ≈ 1 / Φ⁻¹(3/4) */
export const MEDIAN_ABS_DEV_SCALE_NORMAL = 1.4826022185056022;

export function median1d(a: Float64Array): number {
  const c = Float64Array.from(a);
  c.sort();
  const m = c.length;
  if (m === 0) {
    return Number.NaN;
  }
  const mid = (m - 1) / 2;
  const lo = Math.floor(mid);
  const hi = Math.ceil(mid);
  return lo === hi ? (c[lo] ?? Number.NaN) : ((c[lo]! + c[hi]!) / 2);
}

/** Median absolute deviation around the median (scipy M AD with normal scale). */
/** Sample skewness (scipy.stats.skew, bias=True): m₃ / m₂^1.5 */
export function skew1d(a: Float64Array): number {
  const n = a.length;
  if (n < 2) {
    return Number.NaN;
  }
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    s += a[i]!;
  }
  const mean = s / n;
  let m2 = 0;
  let m3 = 0;
  for (let i = 0; i < n; i += 1) {
    const d = a[i]! - mean;
    m2 += d * d;
    m3 += d * d * d;
  }
  m2 /= n;
  m3 /= n;
  if (m2 <= 0) {
    return Number.NaN;
  }
  return m3 / m2 ** 1.5;
}

/** Excess kurtosis (scipy.stats.kurtosis, fisher=True, bias=True): m₄/m₂² − 3 */
export function kurtosisFisher1d(a: Float64Array): number {
  const n = a.length;
  if (n < 2) {
    return Number.NaN;
  }
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    s += a[i]!;
  }
  const mean = s / n;
  let m2 = 0;
  let m4 = 0;
  for (let i = 0; i < n; i += 1) {
    const d = a[i]! - mean;
    const d2 = d * d;
    m2 += d2;
    m4 += d2 * d2;
  }
  m2 /= n;
  m4 /= n;
  if (m2 <= 0) {
    return Number.NaN;
  }
  return m4 / (m2 * m2) - 3;
}

export function medianAbsDeviation1d(a: Float64Array): number {
  if (a.length === 0) {
    return Number.NaN;
  }
  const med = median1d(a);
  const dev = new Float64Array(a.length);
  for (let i = 0; i < a.length; i += 1) {
    dev[i] = Math.abs(a[i]! - med);
  }
  return median1d(dev) * MEDIAN_ABS_DEV_SCALE_NORMAL;
}
