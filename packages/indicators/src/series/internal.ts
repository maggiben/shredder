/** Internal SMA used by stochastic — NaN-aware windows. */
export function smaArrayInner(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  for (let i = period - 1; i < n; i += 1) {
    const start = i + 1 - period;
    const end = i + 1;
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      const v = source[j]!;
      if (!Number.isNaN(v)) {
        sum += v;
        count += 1;
      }
    }
    if (count > 0) {
      result[i] = sum / count;
    }
  }
  return result;
}

/** EWMA variant used by the WT oscillator path. */
export function emaForWt(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  if (n === 0) {
    return result;
  }
  const alpha = 2.0 / (period + 1.0);
  result[0] = source[0]!;
  for (let i = 1; i < n; i += 1) {
    result[i] = alpha * source[i]! + (1.0 - alpha) * result[i - 1]!;
  }
  return result;
}

/** SMA variant used by the WT oscillator path. */
export function smaForWt(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  if (n === 0 || period === 0) {
    return result;
  }
  let cumsum = 0;
  const upto = Math.min(period, n);
  for (let i = 0; i < upto; i += 1) {
    cumsum += source[i]!;
    result[i] = cumsum / (i + 1);
  }
  if (n <= period) {
    return result;
  }
  for (let i = period; i < n; i += 1) {
    result[i] = result[i - 1]! + (source[i]! - source[i - period]!) / period;
  }
  return result;
}
