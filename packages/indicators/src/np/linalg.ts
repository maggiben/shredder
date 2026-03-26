/**
 * Ordinary least squares for A x ≈ b with A shape (m, n), m >= n.
 * Returns x (length n). Uses normal equations for small systems (n ≤ 4).
 */
export function lstsq(a: readonly (readonly number[])[], b: readonly number[], _rcond: number | null = null): Float64Array {
  const m = a.length;
  if (m === 0) {
    return new Float64Array(0);
  }
  const n = a[0]!.length;
  const ata: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const atb: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      let s = 0;
      for (let k = 0; k < m; k += 1) {
        s += a[k]![i]! * a[k]![j]!;
      }
      ata[i]![j] = s;
    }
    let sb = 0;
    for (let k = 0; k < m; k += 1) {
      sb += a[k]![i]! * b[k]!;
    }
    atb[i] = sb;
  }
  return solveSymmetric(ata, atb);
}

function solveSymmetric(a: number[][], b: number[]): Float64Array {
  const n = b.length;
  const m = a.map((row) => [...row]);
  const x = [...b];
  for (let k = 0; k < n; k += 1) {
    let piv = k;
    let max = Math.abs(m[k]![k]!);
    for (let i = k + 1; i < n; i += 1) {
      const v = Math.abs(m[i]![k]!);
      if (v > max) {
        max = v;
        piv = i;
      }
    }
    if (max < 1e-15) {
      x[k] = 0;
      continue;
    }
    if (piv !== k) {
      [m[k], m[piv]] = [m[piv]!, m[k]!];
      [x[k], x[piv]] = [x[piv]!, x[k]!];
    }
    const mkk = m[k]![k]!;
    for (let j = k; j < n; j += 1) {
      m[k]![j]! /= mkk;
    }
    x[k]! /= mkk;
    for (let i = 0; i < n; i += 1) {
      if (i === k) {
        continue;
      }
      const f = m[i]![k]!;
      if (f === 0) {
        continue;
      }
      for (let j = k; j < n; j += 1) {
        m[i]![j]! -= f * m[k]![j]!;
      }
      x[i]! -= f * x[k]!;
    }
  }
  return Float64Array.from(x);
}

/** 2×2 matrix inverse times vector (for TSF-style regression). */
export function inv2x2TimesVec(a: readonly number[][], b: readonly number[]): Float64Array {
  const d = a[0]![0]! * a[1]![1]! - a[0]![1]! * a[1]![0]!;
  if (Math.abs(d) < 1e-15) {
    return new Float64Array([Number.NaN, Number.NaN]);
  }
  const inv: number[][] = [
    [a[1]![1]! / d, -a[0]![1]! / d],
    [-a[1]![0]! / d, a[0]![0]! / d],
  ];
  return new Float64Array([inv[0]![0]! * b[0]! + inv[0]![1]! * b[1]!, inv[1]![0]! * b[0]! + inv[1]![1]! * b[1]!]);
}
