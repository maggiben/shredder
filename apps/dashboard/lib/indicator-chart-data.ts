export type IndicatorSeriesMap = Record<string, (number | null)[]>;

function isNumericArray(a: unknown): a is (number | null)[] {
  if (!Array.isArray(a)) {
    return false;
  }
  return a.every((x) => x === null || (typeof x === "number" && Number.isFinite(x)));
}

/** Turn serialized indicator API `result` into named series for charting. */
export function extractIndicatorSeries(result: unknown): IndicatorSeriesMap {
  const out: IndicatorSeriesMap = {};
  if (result === null || result === undefined) {
    return out;
  }
  if (typeof result === "number" && Number.isFinite(result)) {
    out.value = [result];
    return out;
  }
  if (Array.isArray(result)) {
    if (isNumericArray(result)) {
      out.value = result;
    }
    return out;
  }
  if (typeof result === "object") {
    for (const [k, v] of Object.entries(result as Record<string, unknown>)) {
      if (isNumericArray(v)) {
        out[k] = v;
      } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
          if (isNumericArray(v2)) {
            out[`${k}.${k2}`] = v2;
          }
        }
      }
    }
  }
  return out;
}

export type IndicatorChartRow = {
  t: number;
  close: number;
} & Record<string, number | null | undefined>;

export function buildIndicatorChartRows(
  candles: Array<{ openTime: number; close: number }>,
  seriesMap: IndicatorSeriesMap,
  candleCount: number,
): { rows: IndicatorChartRow[]; seriesKeys: string[] } {
  const seriesKeys = Object.keys(seriesMap);
  const tail = candles.slice(Math.max(0, candles.length - candleCount));

  let n = tail.length;
  for (const k of seriesKeys) {
    n = Math.min(n, seriesMap[k]!.length);
  }

  if (n <= 0 || seriesKeys.length === 0) {
    return { rows: [], seriesKeys };
  }

  const rows: IndicatorChartRow[] = [];
  for (let i = 0; i < n; i++) {
    const ci = tail.length - n + i;
    const candle = tail[ci]!;
    const row: IndicatorChartRow = { t: candle.openTime, close: candle.close };
    for (const sk of seriesKeys) {
      const arr = seriesMap[sk]!;
      const si = arr.length - n + i;
      const v = arr[si];
      row[sk] = v === null || v === undefined || !Number.isFinite(v) ? null : v;
    }
    rows.push(row);
  }
  return { rows, seriesKeys };
}

/** Split series onto price overlay vs separate pane (e.g. RSI vs BTC close). */
export function partitionSeriesForPriceAxis(
  closes: number[],
  seriesMap: IndicatorSeriesMap,
): { overlay: string[]; separate: string[] } {
  if (closes.length === 0) {
    return { overlay: Object.keys(seriesMap), separate: [] };
  }
  const cMin = Math.min(...closes);
  const cMax = Math.max(...closes);
  const span = Math.max(cMax - cMin, 1e-9);
  const margin = span * 2.5;

  const overlay: string[] = [];
  const separate: string[] = [];

  for (const key of Object.keys(seriesMap)) {
    const arr = seriesMap[key]!.filter((x): x is number => x !== null && Number.isFinite(x));
    if (arr.length === 0) {
      separate.push(key);
      continue;
    }
    const sMin = Math.min(...arr);
    const sMax = Math.max(...arr);
    const fits = sMin >= cMin - margin && sMax <= cMax + margin;
    (fits ? overlay : separate).push(key);
  }
  return { overlay, separate };
}
