/** Fibonacci-normalised weights for FWMA-style smoothers. */
export function fibonacciWeights(period: number): Float64Array {
  let n = Math.floor(Math.abs(period));
  if (n < 0) {
    n = 2;
  }
  n -= 1;
  let a = 1;
  let b = 1;
  const seq: number[] = [a];
  for (let k = 0; k < n; k += 1) {
    const next = a + b;
    a = b;
    b = next;
    seq.push(a);
  }
  let sum = 0;
  for (const v of seq) {
    sum += v;
  }
  const w = new Float64Array(seq.length);
  if (sum > 0) {
    for (let i = 0; i < seq.length; i += 1) {
      w[i] = seq[i]! / sum;
    }
  } else {
    for (let i = 0; i < seq.length; i += 1) {
      w[i] = seq[i]!;
    }
  }
  return w;
}
