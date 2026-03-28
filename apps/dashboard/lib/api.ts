import { getApiBaseUrl } from "./config";
import type { OrderRow, PortfolioSnapshot, StrategyRow, TradeRow } from "./api-types";
import type { SimulationLedgerRow, SimulationMetrics, SimulationSignalStats } from "@shredder/backtest";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export class ApiError extends Error {
  status: number;
  body: JsonValue | string;

  constructor(message: string, status: number, body: JsonValue | string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: JsonValue;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", token = null, body, signal, headers = {} } = options;
  const urlBase = getApiBaseUrl();
  const url = `${urlBase}${path.startsWith("/") ? path : `/${path}`}`;

  const requestHeaders: Record<string, string> = { ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let requestBody: BodyInit | undefined;
  if (body !== undefined && method !== "GET") {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] ?? "application/json";
    requestBody = JSON.stringify(body);
  }

  const init: RequestInit = {
    method,
    headers: requestHeaders,
  };
  if (requestBody !== undefined) init.body = requestBody;
  if (signal !== undefined) init.signal = signal;

  const res = await fetch(url, init);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let parsed: JsonValue | string = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // ignore parse failures; we keep the raw text
    }
    throw new ApiError(`Request failed (${res.status})`, res.status, parsed);
  }

  const text = await res.text().catch(() => "");
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

// Keep in sync with backend `BINANCE_KLINE_INTERVALS`.
export const KLINE_INTERVAL_OPTIONS = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
] as const;

export type KlineInterval = (typeof KLINE_INTERVAL_OPTIONS)[number];

export async function getHealth(): Promise<{ status: string }> {
  return apiFetch("/health");
}

export async function login(email: string, password: string): Promise<{ access_token: string }> {
  return apiFetch("/auth/login", { method: "POST", body: { email, password } });
}

export async function register(email: string, password: string): Promise<{ access_token: string }> {
  return apiFetch("/auth/register", { method: "POST", body: { email, password } });
}

export async function aiSuggest(token: string, message: string): Promise<{ reply: string }> {
  return apiFetch("/ai/suggest", { method: "POST", token, body: { message } });
}

export async function createOrder(
  token: string,
  dto: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT";
    quantity: number;
    limitPrice?: number;
    clientOrderId?: string;
  },
): Promise<OrderRow> {
  return apiFetch("/orders", { method: "POST", token, body: dto });
}

export async function getPortfolio(token: string): Promise<PortfolioSnapshot> {
  return apiFetch("/portfolio", { token });
}

export async function listOrders(token: string): Promise<OrderRow[]> {
  return apiFetch("/orders", { token });
}

export async function listTrades(token: string): Promise<TradeRow[]> {
  return apiFetch("/trades", { token });
}

export async function listStrategies(token: string): Promise<StrategyRow[]> {
  return apiFetch("/strategies", { token });
}

export type KlineCandle = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

type KlineCandleDto = {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
};

export type KlinesQuery = {
  symbol: string;
  interval: KlineInterval;
  limit?: number;
  startTime?: number;
  endTime?: number;
};

export async function getKlines(
  token: string,
  query: KlinesQuery,
): Promise<{ baseUrl: string; symbol: string; interval: KlineInterval; candles: KlineCandle[] }> {
  const qp = new URLSearchParams();
  qp.set("symbol", query.symbol);
  qp.set("interval", query.interval);
  if (query.limit !== undefined) qp.set("limit", String(query.limit));
  if (query.startTime !== undefined) qp.set("startTime", String(query.startTime));
  if (query.endTime !== undefined) qp.set("endTime", String(query.endTime));

  const raw = await apiFetch<{
    baseUrl: string;
    symbol: string;
    interval: KlineInterval;
    candles: KlineCandleDto[];
  }>(`/market/klines?${qp.toString()}`, { token });

  return {
    baseUrl: raw.baseUrl,
    symbol: raw.symbol,
    interval: raw.interval,
    candles: raw.candles.map((c) => ({
      openTime: c.openTime,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume),
      closeTime: c.closeTime,
    })),
  };
}

export type SimulationFeeModel = {
  takerFeeRate: number;
  source: "override" | "exchange" | "default";
};

export type SimulationBody = {
  symbol: string;
  interval: KlineInterval;
  limit?: number;
  startTime?: number;
  endTime?: number;
  initialCash: number;
  deployFraction: number;
  warmupBars: number;
  maxNotionalFractionPerTrade: number;
  maxDrawdownFraction: number;
  takerFeeRate?: number;
  strategyIds: string[];
};

export type SimulationRunResponse = {
  baseUrl: string;
  symbol: string;
  interval: KlineInterval;
  candleCount: number;
  metrics: SimulationMetrics;
  signalStats: SimulationSignalStats;
  rows: SimulationLedgerRow[];
  feeModel: SimulationFeeModel;
};

export async function runSimulation(token: string, body: SimulationBody): Promise<SimulationRunResponse> {
  // Backend returns a superset of these fields (it also includes raw candles).
  // This UI only relies on metrics/signalStats/rows + a few identifiers.
  return apiFetch("/market/simulation", { method: "POST", token, body });
}

export type IndicatorParamMeta = {
  name: string;
  type?: string;
  default?: JsonValue;
  description?: string;
};

export type IndicatorMetaDto = {
  description: string;
  params: IndicatorParamMeta[];
  returns?: string;
};

export type IndicatorsCatalog = {
  indicators: Array<{ id: string } & IndicatorMetaDto>;
};

export async function getIndicatorsCatalog(token: string): Promise<IndicatorsCatalog> {
  return apiFetch("/market/indicators", { token });
}

export type IndicatorComputeBody = {
  indicatorId: string;
  symbol: string;
  interval: KlineInterval;
  limit?: number;
  startTime?: number;
  endTime?: number;
  params?: Record<string, JsonValue>;
};

export type IndicatorComputeResponse = {
  baseUrl: string;
  symbol: string;
  interval: string;
  indicatorId: string;
  candleCount: number;
  result: JsonValue;
};

export async function computeIndicator(token: string, body: IndicatorComputeBody): Promise<IndicatorComputeResponse> {
  return apiFetch("/market/indicators/compute", { method: "POST", token, body });
}

export type TradingBotStatus = "STOPPED" | "STARTING" | "RUNNING" | "ERROR";

export type TradingBotWorkerCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TradingBotPaperTrade = {
  kind: "buy" | "sell";
  timestamp: number;
  price: number;
  quantity: number;
  fee: number;
  feeRate: number;
  tradeValue: number;
  cashAfter: number;
  positionQtyAfter: number;
  equityAfter: number;
};

/**
 * Worker tick payload persisted by API as `lastOutput`.
 * API stores webhook `payload` directly, so this mirrors `apps/worker/src/index.ts`.
 */
export type TradingBotLastOutput = {
  t?: string;
  botId?: string;
  exchangeId?: string;
  paperTrading?: boolean;
  symbol?: string;
  candleCount?: number;
  marketDataProvider?: string;
  candleInterval?: string;
  candleLimit?: number;
  aggregated?: JsonValue;
  risk?: JsonValue;
  strategies?: JsonValue[];
  ai?: JsonValue;
  demoScenario?: string;
  paperTradeEvent?: TradingBotPaperTrade;
};

export type TradingBotConfig = {
  symbol: string;
  tickMs: number;
  candleInterval: string;
  candleLimit: number;
  marketDataProvider: "demo" | "coingecko" | "binance";
  exchangeId: "binance" | "none";
  paperTrading: boolean;
  binanceBaseUrl?: string;
  logStrategies: boolean;
  aiAnalyst: boolean;
  estimatedTakerFeeRate: number;
  extraEnv: Record<string, string>;
};

export type TradingBotRow = {
  id: string;
  name: string;
  status: TradingBotStatus;
  config: TradingBotConfig;
  processPid: number | null;
  lastTickAt: string | null;
  lastOutput: TradingBotLastOutput | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  runtime: { alive: boolean; logTail: string[] };
};

export type TradingBotTrails = {
  marketTrail: TradingBotWorkerCandle[];
  paperTrail: TradingBotPaperTrade[];
};

export type CreateTradingBotBody = {
  name: string;
  symbol?: string;
  tickMs?: number;
  candleInterval?: string;
  candleLimit?: number;
  marketDataProvider?: "demo" | "coingecko" | "binance";
  exchangeId?: "binance" | "none";
  paperTrading?: boolean;
  binanceBaseUrl?: string;
  logStrategies?: boolean;
  aiAnalyst?: boolean;
  estimatedTakerFeeRate?: number;
  extraEnv?: Record<string, string>;
};

export async function listTradingBots(token: string): Promise<TradingBotRow[]> {
  return apiFetch("/trading-bots", { token });
}

export async function createTradingBot(token: string, body: CreateTradingBotBody): Promise<TradingBotRow> {
  return apiFetch("/trading-bots", { method: "POST", token, body });
}

export async function startTradingBot(token: string, id: string): Promise<TradingBotRow> {
  return apiFetch(`/trading-bots/${id}/start`, { method: "POST", token });
}

export async function stopTradingBot(token: string, id: string): Promise<TradingBotRow> {
  return apiFetch(`/trading-bots/${id}/stop`, { method: "POST", token });
}

export async function deleteTradingBot(token: string, id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/trading-bots/${id}`, { method: "DELETE", token });
}

export async function getTradingBotLogs(token: string, id: string): Promise<{ lines: string[] }> {
  return apiFetch(`/trading-bots/${id}/logs`, { token });
}

export async function getTradingBotTrails(token: string, id: string): Promise<TradingBotTrails> {
  return apiFetch(`/trading-bots/${id}/trails`, { token });
}

