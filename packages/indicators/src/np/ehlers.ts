/**
 * Ehlers filter internals (ported from reference Ehlers / DSP indicator sources).
 */

export function highPass1Fast(source: Float64Array, period: number): Float64Array {
  const k = 1;
  const alpha = 1 + (Math.sin((2 * Math.PI * k) / period) - 1) / Math.cos((2 * Math.PI * k) / period);
  const n = source.length;
  const out = new Float64Array(n);
  out[0] = source[0]!;
  for (let i = 1; i < n; i += 1) {
    out[i] =
      (1 - alpha / 2) * source[i]! -
      (1 - alpha / 2) * source[i - 1]! +
      (1 - alpha) * out[i - 1]!;
  }
  return out;
}

export function highPass2Fast(source: Float64Array, period: number, K = 0.707): Float64Array {
  const alpha = 1 + (Math.sin((2 * Math.PI * K) / period) - 1) / Math.cos((2 * Math.PI * K) / period);
  const n = source.length;
  const out = new Float64Array(n);
  out[0] = source[0]!;
  if (n > 1) {
    out[1] = source[1]!;
  }
  const c = (1 - alpha / 2) ** 2;
  const d = 2 * (1 - alpha);
  const e = (1 - alpha) ** 2;
  for (let i = 2; i < n; i += 1) {
    out[i] =
      c * source[i]! - 2 * c * source[i - 1]! + c * source[i - 2]! + d * out[i - 1]! - e * out[i - 2]!;
  }
  return out;
}

export function superSmoother2Fast(source: Float64Array, period: number): Float64Array {
  const a = Math.exp((-1.414 * Math.PI) / period);
  const b = 2 * a * Math.cos((1.414 * Math.PI) / period);
  const coef = (1 + a * a - b) / 2;
  const n = source.length;
  const out = source.slice();
  for (let i = 2; i < n; i += 1) {
    out[i] = coef * (source[i]! + source[i - 1]!) + b * out[i - 1]! - a * a * out[i - 2]!;
  }
  return out;
}

export function superSmoother3Fast(source: Float64Array, period: number): Float64Array {
  const a = Math.exp(-Math.PI / period);
  const b = 2 * a * Math.cos((1.738 * Math.PI) / period);
  const c = a * a;
  const c0 = 1 - c * c - b + b * c;
  const c1 = b + c;
  const c2 = -c - b * c;
  const c3 = c * c;
  const n = source.length;
  const out = source.slice();
  for (let i = 3; i < n; i += 1) {
    out[i] = c0 * source[i]! + c1 * out[i - 1]! + c2 * out[i - 2]! + c3 * out[i - 3]!;
  }
  return out;
}
