/** Simple moving average of the last `period` values (inclusive). */
export function sma(values: readonly number[], period: number): number | undefined {
  if (period <= 0 || values.length < period) {
    return undefined;
  }
  let sum = 0;
  const start = values.length - period;
  for (let i = start; i < values.length; i += 1) {
    sum += values[i]!;
  }
  return sum / period;
}
