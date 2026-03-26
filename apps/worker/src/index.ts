import "@shredder/config/env-bootstrap";
import type { Candle } from "@shredder/core";
import { createOpenAIClient, invokeShredderSuggestTool } from "@shredder/ai";
import { aggregateSignals } from "@shredder/backtest";
import { createMarketDataSourceFromEnv } from "@shredder/data";
import { DefaultRiskEngine } from "@shredder/risk";
import {
  MacdMomentumStrategy,
  MovingAverageCrossoverStrategy,
  RsiReversionStrategy,
} from "@shredder/strategies";

const intervalMs = Number(process.env["WORKER_TICK_MS"] ?? "15000");


const marketDataEnv = createMarketDataSourceFromEnv();
const marketData = marketDataEnv.source;

const strategies = [
  new MovingAverageCrossoverStrategy(5, 20),
  new RsiReversionStrategy(14, 30, 70),
  new MacdMomentumStrategy(12, 26, 9),
];

const risk = new DefaultRiskEngine({
  maxNotionalFractionPerTrade: 0.1,
  maxDrawdownFraction: 0.25,
});

const estimatedTakerFeeRate = Number(process.env["ESTIMATED_TAKER_FEE_RATE"] ?? "0.001");

function envFlag(key: string): boolean {
  const v = process.env[key]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const workerAiAnalyst = envFlag("WORKER_AI_ANALYST");
const workerLogStrategies = envFlag("WORKER_LOG_STRATEGIES");

let openaiClient: ReturnType<typeof createOpenAIClient> | undefined;
function getOpenAI(): ReturnType<typeof createOpenAIClient> | undefined {
  const key = process.env["OPENAI_API_KEY"]?.trim();
  if (!key) {
    return undefined;
  }
  if (!openaiClient) {
    openaiClient = createOpenAIClient(key);
  }
  return openaiClient;
}

/** Advances each time demo data is built so ticks cycle BUY → SELL → HOLD aggregates. */
let demoScenarioRotation = 0;

function candleStepMs(interval: string): number {
  const trimmed = interval.trim().toLowerCase();
  const m = /^(\d+)(m|h|d)$/.exec(trimmed);
  if (!m) {
    return 60 * 60 * 1000;
  }
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) {
    return 60 * 60 * 1000;
  }
  const unit = m[2];
  if (unit === "m") {
    return n * 60 * 1000;
  }
  if (unit === "h") {
    return n * 60 * 60 * 1000;
  }
  return n * 24 * 60 * 60 * 1000;
}

/** 50 closes: golden cross on last bar → MA crossover BUY (other strategies may disagree). */
function coreClosesMaBuy(): number[] {
  const closes: number[] = [];
  for (let i = 0; i < 29; i += 1) {
    closes.push(100 - i * 0.1);
  }
  for (let i = 29; i < 49; i += 1) {
    closes.push(80);
  }
  closes.push(120);
  return closes;
}

/** 50 closes: death cross on last bar → MA crossover SELL. */
function coreClosesMaSell(): number[] {
  const closes: number[] = [];
  for (let i = 0; i < 29; i += 1) {
    closes.push(100 + i * 0.1);
  }
  for (let i = 29; i < 49; i += 1) {
    closes.push(120);
  }
  closes.push(80);
  return closes;
}

/** Mild oscillation: MA / MACD no cross, RSI mid-range → aggregated HOLD. */
function coreClosesRangeHold(length: number): number[] {
  return Array.from({ length }, (_, i) => 100 + Math.sin(i / 2) * 0.5);
}

function extendClosesWithPrefix(plateau: number, core: readonly number[], length: number): number[] {
  if (length <= core.length) {
    return core.slice(core.length - length);
  }
  const pad = length - core.length;
  return [...Array.from({ length: pad }, () => plateau), ...core];
}

function closesForDemoPhase(phase: number, length: number): number[] {
  if (phase === 0) {
    return extendClosesWithPrefix(80, coreClosesMaBuy(), length);
  }
  if (phase === 1) {
    return extendClosesWithPrefix(120, coreClosesMaSell(), length);
  }
  return coreClosesRangeHold(length);
}

interface DemoCandlesResult {
  readonly candles: Candle[];
  readonly scenario: "ma-buy" | "ma-sell" | "range-hold";
}

function nextDemoCandles(limit: number, interval: string): DemoCandlesResult {
  const phase = demoScenarioRotation % 3;
  demoScenarioRotation += 1;
  const n = Math.max(50, Math.floor(limit));
  const closes = closesForDemoPhase(phase, n);
  const stepMs = candleStepMs(interval);
  const start = Date.now() - (n - 1) * stepMs;
  const candles: Candle[] = closes.map((close, i) => ({
    timestamp: start + i * stepMs,
    open: close,
    high: close + 0.5,
    low: close - 0.5,
    close,
    volume: 1000 + i,
  }));
  const scenario = phase === 0 ? "ma-buy" : phase === 1 ? "ma-sell" : "range-hold";
  return { candles, scenario };
}

async function tick(): Promise<void> {
  const symbol = process.env["WORKER_SYMBOL"] ?? "BTCUSDT";
  const candleInterval = process.env["WORKER_CANDLE_INTERVAL"] ?? "15m";
  const rawLimit = Number(process.env["WORKER_CANDLE_LIMIT"] ?? "50");
  const candleLimit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 50;
  let demoScenario: string | undefined;
  const candles = marketData
    ? await marketData.getCandles(symbol, candleInterval, candleLimit)
    : (() => {
        const r = nextDemoCandles(candleLimit, candleInterval);
        demoScenario = r.scenario;
        return r.candles;
      })();
  const window = candles;
  const portfolio = { cash: 10_000, positions: [] as const };
  const input = {
    symbol,
    candles: window,
    indicators: {},
    portfolio,
  };
  const perStrategy = strategies.map((s) => ({
    strategyId: s.id,
    signal: s.evaluate(input),
  }));
  const agg = aggregateSignals(perStrategy.map((p) => p.signal));

  let ai: { analyst?: string; skipped?: string } | undefined;
  if (workerAiAnalyst) {
    const client = getOpenAI();
    if (!client) {
      ai = { skipped: "OPENAI_API_KEY not set" };
    } else {
      const snapshot = JSON.stringify({
        symbol,
        candleCount: window.length,
        lastClose: window.at(-1)?.close,
        aggregated: agg,
        strategies: perStrategy.map((p) => ({
          id: p.strategyId,
          action: p.signal.action,
          confidence: p.signal.confidence,
          reason: p.signal.reason,
        })),
      });
      const analyst = await invokeShredderSuggestTool(
        "analyst_suggest",
        { snapshot },
        client,
      );
      ai = { analyst };
    }
  }

  const equity = portfolio.cash;
  const peak = equity;
  const proposed = equity * 0.1;
  const decision = risk.evaluate(agg.action, {
    equity,
    peakEquity: peak,
    proposedBuyNotional: agg.action === "BUY" ? proposed : 0,
    ...(agg.action === "BUY"
      ? {
          estimatedTakerFeeRate: Number.isFinite(estimatedTakerFeeRate) ? estimatedTakerFeeRate : 0.001,
        }
      : {}),
  });
  const payload: Record<string, unknown> = {
    t: new Date().toISOString(),
    symbol,
    candleCount: window.length,
    aggregated: agg,
    risk: decision,
    marketDataProvider: marketDataEnv.provider ?? "demo",
    candleInterval,
    candleLimit,
  };
  if (workerLogStrategies) {
    payload["strategies"] = perStrategy.map((p) => ({
      id: p.strategyId,
      ...p.signal,
    }));
  }
  if (ai !== undefined) {
    payload["ai"] = ai;
  }
  if (demoScenario !== undefined) {
    payload["demoScenario"] = demoScenario;
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

setInterval(() => {
  void tick().catch((err: unknown) => {
    console.error(err);
  });
}, intervalMs);

void tick();
