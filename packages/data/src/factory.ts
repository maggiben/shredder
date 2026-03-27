import type { MarketDataSource } from "./types.js";
import { createBinanceKlinesMarketDataSource } from "./binance-klines-market-data-source.js";
import {
  createCoinGeckoMarketDataSource,
  defaultCoinGeckoMarketDataSourceConfig,
  type CoinGeckoMarketDataSourceConfig,
} from "./coingecko-market-data-source.js";
import { DEFAULT_COINGECKO_SYMBOL_MAP } from "./symbol-map.js";

export type MarketDataProviderKind = "coingecko" | "polygon" | "binance";

export type MarketDataSourceEnvResult =
  | { readonly provider: null; readonly source: null }
  | { readonly provider: MarketDataProviderKind; readonly source: MarketDataSource };

export type MarketDataEnv = Readonly<Record<string, string | undefined>>;

function envString(env: MarketDataEnv, key: string): string | undefined {
  const v = env[key];
  if (v === undefined || v === "") {
    return undefined;
  }
  return v;
}

function envPositiveInt(env: MarketDataEnv, key: string, fallback: number): number {
  const raw = envString(env, key);
  if (raw === undefined) {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid ${key}: expected positive integer, got "${raw}"`);
  }
  return Math.floor(n);
}

function mergeSymbolMap(
  base: Readonly<Record<string, string>>,
  json: string | undefined,
): Record<string, string> {
  const out: Record<string, string> = { ...base };
  if (json === undefined) {
    return out;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new Error("MARKET_DATA_COINGECKO_SYMBOL_MAP must be valid JSON object");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("MARKET_DATA_COINGECKO_SYMBOL_MAP must be a JSON object");
  }
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v !== "string" || v === "") {
      throw new Error(`MARKET_DATA_COINGECKO_SYMBOL_MAP: invalid entry for "${k}"`);
    }
    out[k.trim().toUpperCase()] = v.trim().toLowerCase();
  }
  return out;
}

/**
 * Builds a {@link MarketDataSource} from `process.env`. Import `@shredder/config/env-bootstrap`
 * first in the app entry so repo-root `.env` is loaded before this runs.
 *
 * - `MARKET_DATA_PROVIDER=coingecko` — CoinGecko `market_chart` (rate-limited).
 * - `MARKET_DATA_PROVIDER=binance` — public Spot klines (`BINANCE_BASE_URL` / testnet default).
 * - `MARKET_DATA_PROVIDER=polygon` — reserved; throws until implemented.
 * - unset / `none` / `demo` — returns `{ source: null }` for in-memory/demo feeds.
 */
export function createMarketDataSourceFromEnv(
  env: MarketDataEnv = process.env as MarketDataEnv,
): MarketDataSourceEnvResult {
  const raw = envString(env, "MARKET_DATA_PROVIDER")?.toLowerCase();
  if (raw === undefined || raw === "none" || raw === "demo" || raw === "") {
    return { provider: null, source: null };
  }

  if (raw === "polygon") {
    throw new Error(
      'MARKET_DATA_PROVIDER=polygon is not implemented yet — use "coingecko", "binance", or add a Polygon implementation.',
    );
  }

  if (raw === "binance") {
    const explicit = envString(env, "BINANCE_BASE_URL");
    return {
      provider: "binance",
      source: createBinanceKlinesMarketDataSource(
        explicit !== undefined ? { baseUrl: explicit } : {},
      ),
    };
  }

  if (raw !== "coingecko") {
    throw new Error(
      `Unknown MARKET_DATA_PROVIDER "${raw}" (expected coingecko, binance, polygon, none, or demo)`,
    );
  }

  const baseUrl =
    envString(env, "MARKET_DATA_COINGECKO_BASE_URL") ??
    envString(env, "COINGECKO_BASE_URL") ??
    undefined;

  const apiKey =
    envString(env, "MARKET_DATA_COINGECKO_API_KEY") ?? envString(env, "COINGECKO_API_KEY");

  const vsCurrency =
    envString(env, "MARKET_DATA_COINGECKO_VS_CURRENCY")?.toLowerCase() ?? "usd";

  const maxPerMin = envPositiveInt(env, "MARKET_DATA_MAX_REQUESTS_PER_MINUTE", 25);
  const minGap = envPositiveInt(env, "MARKET_DATA_MIN_REQUEST_INTERVAL_MS", 1500);
  const maxChartDays = envPositiveInt(env, "MARKET_DATA_COINGECKO_MAX_CHART_DAYS", 365);

  const symbolMap = mergeSymbolMap(DEFAULT_COINGECKO_SYMBOL_MAP, envString(env, "MARKET_DATA_COINGECKO_SYMBOL_MAP"));

  const cg: CoinGeckoMarketDataSourceConfig = defaultCoinGeckoMarketDataSourceConfig({
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    ...(apiKey !== undefined ? { apiKey } : {}),
    vsCurrency,
    symbolToCoinId: symbolMap,
    rateLimit: {
      maxRequestsPerMinute: maxPerMin,
      minIntervalMs: minGap,
    },
    maxChartDays,
  });

  return {
    provider: "coingecko",
    source: createCoinGeckoMarketDataSource(cg),
  };
}
