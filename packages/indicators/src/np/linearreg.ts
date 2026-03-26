/**
 * Linear regression endpoint per window (NumPy stride pattern): value at end of window on the line.
 * `result[i + period - 1] = mean_y + ((period - 1) / 2) * (S_xy / S_xx)`
 */
export function linearRegEndpointSeries(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  const meanX = (period - 1) / 2;
  let sXx = 0;
  for (let k = 0; k < period; k += 1) {
    const x = k - meanX;
    sXx += x * x;
  }
  for (let i = 0; i <= n - period; i += 1) {
    let meanY = 0;
    for (let k = 0; k < period; k += 1) {
      meanY += source[i + k]!;
    }
    meanY /= period;
    let sXy = 0;
    for (let k = 0; k < period; k += 1) {
      const x = k - meanX;
      sXy += (source[i + k]! - meanY) * x;
    }
    result[i + period - 1] = meanY + ((period - 1) / 2) * (sXy / sXx);
  }
  return result;
}

/** Linear regression slope (dv/dt) over each window. */
export function linearRegSlopeSeries(source: Float64Array, period: number): Float64Array {
  const n = source.length;
  const result = new Float64Array(n);
  result.fill(Number.NaN);
  if (n < period) {
    return result;
  }
  const xs = new Float64Array(period);
  for (let k = 0; k < period; k += 1) {
    xs[k] = k;
  }
  let sumX = 0;
  let sumXX = 0;
  for (let k = 0; k < period; k += 1) {
    sumX += xs[k]!;
    sumXX += xs[k]! * xs[k]!;
  }
  const denom = period * sumXX - sumX * sumX;
  for (let i = 0; i <= n - period; i += 1) {
    let sumY = 0;
    let sumXY = 0;
    for (let k = 0; k < period; k += 1) {
      const y = source[i + k]!;
      sumY += y;
      sumXY += xs[k]! * y;
    }
    if (denom !== 0) {
      result[i + period - 1] = (period * sumXY - sumX * sumY) / denom;
    }
  }
  return result;
}

/** Intercept at t=0 of the regression line for each window. */
export function linearRegInterceptSeries(source: Float64Array, period: number): Float64Array {
  const slope = linearRegSlopeSeries(source, period);
  const endpoint = linearRegEndpointSeries(source, period);
  const n = source.length;
  const out = new Float64Array(n);
  out.fill(Number.NaN);
  for (let i = period - 1; i < n; i += 1) {
    out[i] = endpoint[i]! - slope[i]! * (period - 1);
  }
  return out;
}

/** `atan(slope)` in degrees for each window. */
export function linearRegAngleSeries(source: Float64Array, period: number): Float64Array {
  const slope = linearRegSlopeSeries(source, period);
  const n = source.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = Number.isNaN(slope[i]!) ? Number.NaN : Math.atan(slope[i]!) * (180 / Math.PI);
  }
  return out;
}
