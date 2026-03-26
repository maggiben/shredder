import type { IndicatorMetaDto } from "./api";

const SKIP_PARAM_NAMES = new Set(["candles"]);

/**
 * Build params for the Indicators explorer textarea from catalog metadata.
 * Omits candle inputs. When the indicator supports `sequential`, sets it to true so
 * multi-bar charts match POST /market/indicators/compute (sequential API mode).
 */
export function buildDefaultIndicatorParamsForExplorer(meta: IndicatorMetaDto): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let hasSequentialParam = false;

  for (const p of meta.params) {
    if (p.name === "sequential") {
      hasSequentialParam = true;
      continue;
    }
    if (SKIP_PARAM_NAMES.has(p.name)) {
      continue;
    }
    if (p.default !== undefined) {
      out[p.name] = p.default;
    }
  }

  if (hasSequentialParam) {
    out.sequential = true;
  }

  return out;
}

export function formatDefaultIndicatorParamsJson(meta: IndicatorMetaDto): string {
  return `${JSON.stringify(buildDefaultIndicatorParamsForExplorer(meta), null, 2)}\n`;
}
