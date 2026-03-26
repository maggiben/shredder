---
name: shredder-architecture
description: >-
  Describes the Shredder monorepo layout (Turborepo, apps/api, apps/dashboard,
  apps/worker,   packages/core, strategies, indicators, exchanges, risk, backtest, ai, config,
  data). Use when navigating the codebase, adding features across packages, or
  explaining how worker, API, and dashboard fit together.
---

# Shredder architecture

## Layout

- **`apps/api`**: NestJS backend; health and future REST for portfolio, orders, auth.
- **`apps/dashboard`**: Next.js UI; consumes API when wired.
- **`apps/worker`**: Tick loop: data → strategies → aggregate → risk → (future) exchange.
- **`packages/core`**: Shared types (`Candle`, `Order`, `StrategyInput`, `StrategySignal`) and small built-in indicators (SMA, EMA, RSI, MACD, etc.).
- **`packages/indicators`**: Full indicator library (`coreCandlesToOhlcvMatrix`, `computeIndicator`, per-stem modules under `src/indicators/`).
- **`packages/strategies`**: Deterministic strategy classes implementing sync `evaluate`.
- **`packages/exchanges`**: `Exchange` interface; `BinanceAdapter`; Binance URL resolution (testnet default).
- **`packages/risk`**: `DefaultRiskEngine` — notional caps, drawdown, optional equity floor.
- **`packages/backtest`**: `runBacktest`, `aggregateSignals`.
- **`packages/config`**: Zod schemas for portfolio weights and strategy ids.
- **`packages/ai`**: OpenAI client wrapper, `StrategyTool`, `wrapStrategy`.
- **`packages/data`**: `MarketDataSource` interface (implement Polygon, klines, etc.).

## Data flow (target)

1. Ingest candles → compute indicators (worker or backtest).
2. Run strategies → aggregate signals (math).
3. Risk engine evaluates BUY proposals only for limits (code).
4. Exchange adapter executes after risk approval (never from LLM directly).

## TypeScript

Root `tsconfig.base.json`: `strict`, `noImplicitAny`, `exactOptionalPropertyTypes`. Match these in new packages.

## Tests

Packages use Vitest; run `pnpm test` from repo root. Prefer unit tests per strategy and integration tests for backtest paths.
