---
name: shredder-app-api
description: >-
  NestJS HTTP API for Shredder: modules for auth, orders (BullMQ), trades, market,
  portfolio, trading-strategies, AI suggest; Prisma; CORS and validation. Use when
  adding REST endpoints, DTOs, guards, or wiring packages/db/exchanges from the API.
---

# Shredder app: `apps/api`

## Role

NestJS backend (`@shredder/api`). Serves REST for operators and the dashboard; persists state via Prisma; queues order work via BullMQ and Redis. **Trading truth stays in packages** (`@shredder/risk`, strategies); the API orchestrates persistence and HTTP, not LLM order placement.

## Stack

- NestJS 11, `class-validator` / `class-transformer`, global `ValidationPipe` (whitelist, forbid unknown, transform).
- `@nestjs/config` with `envFilePath` from `src/env-paths.ts` (`apiEnvFilePaths()`).
- `@nestjs/bullmq` + `ioredis`: default Redis `REDIS_HOST` / `REDIS_PORT` (see `app.module.ts`).
- Workspace: `@shredder/config`, `@shredder/core`, `@shredder/db`, `@shredder/exchanges`, `@shredder/strategies`, `@shredder/ai`.

## Module map

| Area | Path |
|------|------|
| Health | `app.controller.ts` → `GET /health` |
| Auth | `auth/` (JWT, Passport) |
| Prisma | `prisma/` |
| Orders | `orders/` (processor + queue) |
| Trades | `trades/` |
| Market | `market/` (e.g. klines) |
| Portfolio | `portfolio/` |
| Strategy registry / config | `trading-strategies/` |
| LLM suggestions (no trade authority) | `ai-suggest/` |
| Exchange adapters | `exchanges/` |

## Runtime

- **Port**: `PORT` (default `3001` in `main.ts`).
- **CORS**: `FRONTEND_URL` — comma-separated origins, or omit/empty for permissive `true` (dev-friendly).
- Bootstrap imports `@shredder/config/env-bootstrap` before Nest.

## Scripts

From `apps/api`: `pnpm dev` (watch), `pnpm build`, `pnpm start` (runs `dist/main.js`).

## Conventions

- New routes: feature module + controller + service; DTOs with validation decorators.
- Keep risk and execution policy aligned with `@shredder/risk` and exchange adapters; do not bypass them from suggest-only AI routes.
