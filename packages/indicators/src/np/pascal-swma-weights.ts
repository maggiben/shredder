function combination(nc: number, r: number): number {
  let n = Math.floor(Math.abs(nc));
  const rr = Math.min(Math.floor(Math.abs(r)), n - Math.floor(Math.abs(r)));
  if (rr === 0) {
    return 1;
  }
  let num = 1;
  let den = 1;
  for (let i = 0; i < rr; i += 1) {
    num *= n - i;
    den *= i + 1;
  }
  return Math.floor(num / den);
}

/** Pascal row `n` normalised (PWMA). */
export function pascalsTriangleRowNormalized(nRaw: number | undefined): Float64Array {
  const n = nRaw === undefined ? 0 : Math.floor(Math.abs(nRaw));
  const row: number[] = [];
  for (let i = 0; i <= n; i += 1) {
    row.push(combination(n, i));
  }
  let sum = 0;
  for (const v of row) {
    sum += v;
  }
  const w = new Float64Array(row.length);
  if (sum > 0) {
    for (let i = 0; i < row.length; i += 1) {
      w[i] = row[i]! / sum;
    }
  }
  return w;
}

/** Symmetric triangle weights (SWMA). */
export function symmetricTriangleNormalized(nRaw: number | undefined): Float64Array {
  let n = nRaw === undefined ? 2 : Math.floor(Math.abs(nRaw));
  if (n < 2) {
    n = 2;
  }
  let triangle: number[];
  if (n === 2) {
    triangle = [1, 1];
  } else if (n % 2 === 0) {
    const front: number[] = [];
    for (let i = 0; i < Math.floor(n / 2); i += 1) {
      front.push(i + 1);
    }
    triangle = front.concat(front.slice().reverse());
  } else {
    const front: number[] = [];
    for (let i = 0; i < Math.floor(0.5 * (n + 1)); i += 1) {
      front.push(i + 1);
    }
    triangle = front.concat(front.slice(0, -1).reverse());
  }
  let sum = 0;
  for (const v of triangle) {
    sum += v;
  }
  const w = new Float64Array(triangle.length);
  for (let i = 0; i < triangle.length; i += 1) {
    w[i] = triangle[i]! / sum;
  }
  return w;
}
