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

const intervalMs = Number(process.env["WORKER_TICK_MS"] ?? "5000");

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

function demoCandles(): Candle[] {
  const out: Candle[] = [];
  let price = 100;
  const start = Date.now() - 50 * 60_000;
  for (let i = 0; i < 50; i += 1) {
    price += Math.sin(i / 3) * 0.8;
    const ts = start + i * 60_000;
    out.push({
      timestamp: ts,
      open: price,
      high: price + 0.5,
      low: price - 0.5,
      close: price,
      volume: 1000 + i,
    });
  }
  return out;
}

async function tick(): Promise<void> {
  const symbol = process.env["WORKER_SYMBOL"] ?? "BTCUSDT";
  const candleInterval = process.env["WORKER_CANDLE_INTERVAL"] ?? "1h";
  const rawLimit = Number(process.env["WORKER_CANDLE_LIMIT"] ?? "50");
  const candleLimit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 50;
  const candles = marketData
    ? await marketData.getCandles(symbol, candleInterval, candleLimit)
    : demoCandles();
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
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

setInterval(() => {
  void tick().catch((err: unknown) => {
    console.error(err);
  });
}, intervalMs);

void tick();
