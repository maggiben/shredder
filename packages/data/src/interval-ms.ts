const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

const UNIT_MS: Readonly<Record<string, number>> = {
  m: MINUTE_MS,
  h: HOUR_MS,
  d: DAY_MS,
  w: WEEK_MS,
};

/**
 * Parses compact interval strings used by the worker (`1m`, `15m`, `1h`, `4h`, `1d`, `1w`).
 */
export function parseIntervalToMs(interval: string): number {
  const s = interval.trim().toLowerCase();
  const m = /^(\d+)(m|h|d|w)$/.exec(s);
  if (!m?.[1] || !m[2]) {
    throw new Error(`Unsupported candle interval "${interval}" (expected e.g. 1m, 1h, 1d)`);
  }
  const n = Number(m[1]);
  const unitKey = m[2];
  const unit = UNIT_MS[unitKey];
  if (n < 1 || unit === undefined) {
    throw new Error(`Unsupported candle interval "${interval}"`);
  }
  return n * unit;
}
