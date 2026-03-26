export const npNan = Number.NaN;
export const npInf = Number.POSITIVE_INFINITY;
export const npPi = Math.PI;

export type ArrayLike = Float64Array | readonly number[];

export function zerosLike(source: ArrayLike): Float64Array {
  return new Float64Array(source.length);
}

export function emptyLike(source: ArrayLike): Float64Array {
  return new Float64Array(source.length);
}

export function fullLike(source: ArrayLike, fill: number): Float64Array {
  const out = new Float64Array(source.length);
  out.fill(fill);
  return out;
}

export function full(n: number, fill: number): Float64Array {
  const out = new Float64Array(n);
  out.fill(fill);
  return out;
}

export function zeros(n: number): Float64Array {
  return new Float64Array(n);
}

export function ones(n: number): Float64Array {
  const out = new Float64Array(n);
  out.fill(1);
  return out;
}

export function empty(n: number): Float64Array {
  return new Float64Array(n);
}

export function copy(a: Float64Array): Float64Array {
  return Float64Array.from(a);
}

export function asarray(source: ArrayLike, _dtype?: string): Float64Array {
  return source instanceof Float64Array ? copy(source) : Float64Array.from(source);
}

export function float64ArrayFrom(arr: readonly number[]): Float64Array {
  return Float64Array.from(arr);
}

export function cumsum(source: Float64Array): Float64Array {
  const n = source.length;
  const out = new Float64Array(n);
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    s += source[i]!;
    out[i] = s;
  }
  return out;
}

export function diff(source: Float64Array, n = 1): Float64Array {
  if (n !== 1) {
    throw new Error("diff: only n=1 supported");
  }
  if (source.length === 0) {
    return new Float64Array(0);
  }
  const out = new Float64Array(source.length - 1);
  for (let i = 1; i < source.length; i += 1) {
    out[i - 1] = source[i]! - source[i - 1]!;
  }
  return out;
}

export function where(
  cond: Float64Array | readonly boolean[],
  x: number | Float64Array,
  y: number | Float64Array,
): Float64Array {
  const n = cond instanceof Float64Array ? cond.length : cond.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const c = cond instanceof Float64Array ? cond[i]! !== 0 : Boolean(cond[i]);
    const xv = typeof x === "number" ? x : x[i]!;
    const yv = typeof y === "number" ? y : y[i]!;
    out[i] = c ? xv : yv;
  }
  return out;
}
