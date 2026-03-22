import type { Candle } from "@shredder/core";
import type { MarketDataSource } from "./types.js";
import { bucketChartToCandles } from "./bucket-chart.js";
import { parseIntervalToMs } from "./interval-ms.js";
import { SlidingWindowRateLimiter } from "./rate-limiter.js";
import { DEFAULT_COINGECKO_SYMBOL_MAP } from "./symbol-map.js";

const DEFAULT_BASE_URL = "https://api.coingecko.com/api/v3";
const DEFAULT_USER_AGENT = "ShredderBot/0.1 (market data; +https://github.com/)";

export interface CoinGeckoMarketDataSourceConfig {
  /** REST root, e.g. `https://api.coingecko.com/api/v3` or CoinGecko Pro host. */
  readonly baseUrl: string;
  readonly vsCurrency: string;
  /** Pro / Demo API key; sent as `x-cg-pro-api-key` when set. */
  readonly apiKey?: string;
  /** Uppercase keys like `BTCUSDT` → CoinGecko coin id. */
  readonly symbolToCoinId: Readonly<Record<string, string>>;
  readonly rateLimit: {
    readonly maxRequestsPerMinute: number;
    readonly minIntervalMs: number;
  };
  /** Max `days` query passed to market_chart (API accepts up to `max`). */
  readonly maxChartDays: number;
  readonly fetchFn?: (input: string | URL, init?: RequestInit) => Promise<Response>;
}

interface MarketChartJson {
  readonly prices?: unknown;
  readonly total_volumes?: unknown;
}

function isPair(x: unknown): x is [number, number] {
  return (
    Array.isArray(x) &&
    x.length === 2 &&
    typeof x[0] === "number" &&
    typeof x[1] === "number"
  );
}

function asPairArray(raw: unknown, label: string): [number, number][] {
  if (!Array.isArray(raw)) {
    throw new Error(`CoinGecko response: expected array for ${label}`);
  }
  const out: [number, number][] = [];
  for (const row of raw) {
    if (!isPair(row)) {
      throw new Error(`CoinGecko response: invalid ${label} row`);
    }
    out.push(row);
  }
  return out;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveCoinId(symbol: string, map: Readonly<Record<string, string>>): string {
  const raw = symbol.trim().toUpperCase();
  const variants = [raw, raw.replace("/", "")];
  for (const v of variants) {
    const id = map[v];
    if (id) {
      return id;
    }
  }
  const lower = symbol.trim().toLowerCase();
  if (/^[a-z0-9-]+$/.test(lower)) {
    return lower;
  }
  throw new Error(
    `Unknown symbol "${symbol}" for CoinGecko — extend MARKET_DATA_COINGECKO_SYMBOL_MAP or pass a coin id (e.g. bitcoin).`,
  );
}

function chartDaysForSpan(intervalMs: number, limit: number, maxDays: number): number {
  const spanMs = intervalMs * Math.max(1, limit);
  const days = Math.ceil((spanMs / 86_400_000) * 1.15);
  return Math.min(Math.max(1, days), Math.max(1, maxDays));
}

function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) {
    return undefined;
  }
  const sec = Number(header);
  if (Number.isFinite(sec) && sec >= 0) {
    return sec * 1000;
  }
  const when = Date.parse(header);
  if (!Number.isNaN(when)) {
    return Math.max(0, when - Date.now());
  }
  return undefined;
}

export function createCoinGeckoMarketDataSource(
  config: CoinGeckoMarketDataSourceConfig,
): MarketDataSource {
  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const fetchFn = config.fetchFn ?? ((input, init) => fetch(input, init));
  const limiter = new SlidingWindowRateLimiter(
    config.rateLimit.maxRequestsPerMinute,
    config.rateLimit.minIntervalMs,
  );

  async function fetchChart(
    coinId: string,
    days: number,
    attempt: number,
  ): Promise<MarketChartJson> {
    const url = new URL(`${baseUrl}/coins/${encodeURIComponent(coinId)}/market_chart`);
    url.searchParams.set("vs_currency", config.vsCurrency);
    url.searchParams.set("days", String(days));

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": DEFAULT_USER_AGENT,
    };
    if (config.apiKey !== undefined && config.apiKey !== "") {
      headers["x-cg-pro-api-key"] = config.apiKey;
    }

    const res = await fetchFn(url.toString(), { headers });
    if (res.status === 429 && attempt < 3) {
      const ra = parseRetryAfterMs(res.headers.get("retry-after"));
      await new Promise((r) => setTimeout(r, ra ?? 2000 * (attempt + 1)));
      return fetchChart(coinId, days, attempt + 1);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`CoinGecko HTTP ${res.status} for ${url.pathname}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as MarketChartJson;
  }

  return {
    getCandles(symbol: string, interval: string, limit: number): Promise<readonly Candle[]> {
      return limiter.schedule(async () => {
        const coinId = resolveCoinId(symbol, config.symbolToCoinId);
        const intervalMs = parseIntervalToMs(interval);
        const days = chartDaysForSpan(intervalMs, limit, config.maxChartDays);
        const json = await fetchChart(coinId, days, 0);
        const prices = asPairArray(json.prices, "prices");
        const volumes = asPairArray(json.total_volumes ?? [], "total_volumes");
        return bucketChartToCandles(prices, volumes, intervalMs, limit);
      });
    },
  };
}

export function defaultCoinGeckoMarketDataSourceConfig(
  overrides: Partial<CoinGeckoMarketDataSourceConfig> = {},
): CoinGeckoMarketDataSourceConfig {
  const base: CoinGeckoMarketDataSourceConfig = {
    baseUrl: DEFAULT_BASE_URL,
    vsCurrency: "usd",
    symbolToCoinId: { ...DEFAULT_COINGECKO_SYMBOL_MAP },
    rateLimit: {
      maxRequestsPerMinute: 25,
      minIntervalMs: 1500,
    },
    maxChartDays: 365,
  };
  return {
    ...base,
    ...overrides,
    symbolToCoinId: { ...base.symbolToCoinId, ...(overrides.symbolToCoinId ?? {}) },
    rateLimit: { ...base.rateLimit, ...(overrides.rateLimit ?? {}) },
  };
}
