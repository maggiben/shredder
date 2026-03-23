---
name: shredder-app-worker
description: >-
  Shredder tick worker: ESM Node process that pulls candles from @shredder/data (or
  demo series), runs registered strategies, aggregates signals, runs DefaultRiskEngine,
  logs JSON; optional OpenAI analyst via WORKER_AI_ANALYST. Use when changing the
  live loop, env flags, or wiring data/strategies/risk.
---

# Shredder app: `apps/worker`

## Role

Long-running **tick loop** (`@shredder/worker`, `src/index.ts`): market data → strategy evaluation → `aggregateSignals` → `DefaultRiskEngine.evaluate` → structured `console.log` JSON. **Does not place orders** in the current flow; it demonstrates the deterministic pipeline and optional LLM commentary.

## Flow

1. `createMarketDataSourceFromEnv()` from `@shredder/data` — if no source, builds rotating **demo** candles (MA buy / MA sell / range hold) for predictable signals.
2. Fixed strategy set: `MovingAverageCrossoverStrategy`, `RsiReversionStrategy`, `MacdMomentumStrategy`.
3. `aggregateSignals` from `@shredder/backtest` on per-strategy outputs.
4. `DefaultRiskEngine` with demo equity / proposed notional for BUY checks.
5. Optional: `WORKER_AI_ANALYST` + `OPENAI_API_KEY` → `invokeShredderSuggestTool("analyst_suggest", …)` from `@shredder/ai` (narrative only).

## Environment

| Variable | Purpose |
|----------|---------|
| `WORKER_TICK_MS` | Interval between ticks (default `5000`) |
| `WORKER_SYMBOL` | Symbol (default `BTCUSDT`) |
| `WORKER_CANDLE_INTERVAL` | e.g. `1h` (default `1h`) |
| `WORKER_CANDLE_LIMIT` | Bar count (default `50`) |
| `WORKER_LOG_STRATEGIES` | `1` / `true` — include per-strategy signals in log payload |
| `WORKER_AI_ANALYST` | `1` / `true` — call OpenAI suggest tool when key present |
| `OPENAI_API_KEY` | Required for analyst branch |

Market data provider selection is owned by `@shredder/data` / env (see `shredder-exchange-data` skill).

## Bootstrap

Imports `@shredder/config/env-bootstrap` first. Package is `"type": "module"`; build outputs `dist/index.js`.

## Scripts

From `apps/worker`: `pnpm build`, `pnpm dev` (watch `dist` with `node --watch`), `pnpm start`.

## Conventions

- Register new strategies in the `strategies` array and ensure IDs match `@shredder/config` / tooling expectations.
- Any new side effects (e.g. future order submission) must go through exchange adapters and **must respect** `@shredder/risk` — never bypass from AI tools.
