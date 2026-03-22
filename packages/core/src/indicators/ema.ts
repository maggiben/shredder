/** Exponential moving average over `values` with given `period`. */
export function ema(values: readonly number[], period: number): number | undefined {
  if (period <= 0 || values.length === 0) {
    return undefined;
  }
  const k = 2 / (period + 1);
  const seed = smaSeed(values, period);
  if (seed === undefined) {
    return undefined;
  }
  let prev = seed;
  const start = period;
  for (let i = start; i < values.length; i += 1) {
    prev = values[i]! * k + prev * (1 - k);
  }
  return prev;
}

function smaSeed(values: readonly number[], period: number): number | undefined {
  if (values.length < period) {
    return undefined;
  }
  let sum = 0;
  for (let i = 0; i < period; i += 1) {
    sum += values[i]!;
  }
  return sum / period;
}
