---
name: shredder-package-indicators
description: >-
  @shredder/indicators: OHLCV matrix layout, ~174 migrated indicators from
  indicators_to_be_ported, shared `series` primitives, registry/computeIndicator,
  API and dashboard wiring. Use when adding or fixing indicators, metadata, or
  matrix helpers.
---

# Package: `@shredder/indicators`

## Role

Deterministic technical indicators ported from the `indicators_to_be_ported` Python collection. Prefer **JSDoc** in each `src/indicators/*.ts` header (`@param`, `@returns`, optional `@see`). Catalog strings for the API/UI live in `src/registry-metadata.json` with the same shape: `description`, optional `returns`, and `params[]` entries that may include `description` and `type` (JSDoc-friendly).

## Reference-only assets

`reference/indicators.rs` is an upstream Rust/PyO3 numpy binding snapshot for manual parity checks — **not** compiled by this package. See `reference/README.md`.

## Candle layout

Row shape: `[timestamp, open, close, high, low, volume]` (indices 0–5). This matches the extracted Python indicators, **not** raw Shredder `Candle` field order.

Convert Shredder candles:

```typescript
import { coreCandlesToOhlcvMatrix } from "@shredder/indicators";
```

## Public API

- **Functions**: `src/indicators/*.ts` — one file per indicator stem (e.g. `rsi.ts` → `rsi()`).
- **Registry**: `listIndicatorIds()`, `INDICATOR_METADATA`, `computeIndicator(id, matrix, params)` in `src/registry.ts`.
- **Serialization** (JSON API): `serializeIndicatorResult()` turns `Float64Array` and nested objects into plain JSON.
- **Shared primitives**: `export * as series from "./series/index.js"` (OHLCV / 1D helpers such as ema, vwma, atr).

## Pluggability

- Add a new `src/indicators/<id>.ts`, export the function, re-export from `src/indicators/index.ts` (or follow `scripts/emit_indicator_stubs.py` patterns).
- Run `scripts/extract_registry_metadata.py` if metadata should be refreshed from Python sources.
- Extend the `computeIndicator` `switch` in `registry.ts` for new ids (or keep cases grouped consistently).

## Tests / build

From repo root: `pnpm --filter @shredder/indicators test`, `pnpm --filter @shredder/indicators build`.

## Consumption

- **API**: `GET /market/indicators`, `POST /market/indicators/compute` (JWT) — see `apps/api/src/market/`.
- **Dashboard**: `/indicators` page.
- **Strategies**: depend on `@shredder/indicators`; use `coreCandlesToOhlcvMatrix(input.candles)` before matrix-only indicators.

## Rules

- **AI suggests. Math decides.** Indicators are pure functions: no I/O, no `fetch`, no ordering.
- Invalid `ma` matypes `7`, `8`, `19` throw, matching Python `ma.py`.
