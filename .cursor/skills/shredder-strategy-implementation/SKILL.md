---
name: shredder-strategy-implementation
description: >-
  Guides implementation of new deterministic Shredder strategies: StrategyInput,
  StrategySignal, pure evaluate(), tests, and optional StrategyTool wrapping.
  Use when adding strategies under packages/strategies or wiring tools in
  packages/ai for orchestration.
---

# Strategy implementation

## Interface

- Input: `StrategyInput` from `@shredder/core` (`symbol`, `candles`, `indicators`, `portfolio`).
- Output: `StrategySignal` — `action`: `BUY` | `SELL` | `HOLD`, `confidence` 0–1, `reason` string.
- Implement as a **class** with `readonly id` and **`evaluate(input): StrategySignal`** (sync, no I/O).

## Rules

- **Deterministic** for the same candles and portfolio snapshot.
- **No side effects** in `evaluate` (no fetch, no filesystem, no global mutation).
- Use **`@shredder/core`** indicators or derive from `candles` consistently.
- Throw on **invalid constructor params** (e.g. bad periods).

## Registration

- Add exports in `packages/strategies/src/index.ts`.
- Extend `strategyIdSchema` in `packages/config` when the strategy is user-selectable.

## Tests

- Unit tests per strategy: edge cases (thin data), BUY/SELL/HOLD paths, invalid params.
- Optional: backtest integration with `runBacktest` for smoke scenarios.

## AI tool surface

- Wrap with `wrapStrategy(name, s.evaluate.bind(s))` in `packages/ai` for async tool calls; **orchestration still cannot skip risk**.
