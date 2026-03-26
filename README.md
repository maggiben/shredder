
<div align="center">
<br>
<p align="center">
<img src="docs/banner.jpg" alt="Jesse" height="240" />
</p>

<p align="center">
Algo trading bot 🤖
</p>
</div>

# Shredder

[![Test](https://github.com/maggiben/shredder/actions/workflows/test.yml/badge.svg)](https://github.com/maggiben/shredder/actions/workflows/test.yml)
[![Build](https://github.com/maggiben/shredder/actions/workflows/build.yml/badge.svg)](https://github.com/maggiben/shredder/actions/workflows/build.yml)
[![Release](https://github.com/maggiben/shredder/actions/workflows/release.yml/badge.svg)](https://github.com/maggiben/shredder/actions/workflows/release.yml)

---
Shredder is an advanced AI trading framework that aims to **simplify** **researching** and defining **YOUR OWN trading strategies** for backtesting, optimizing, and live trading.


## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io) 9
- Docker (optional, for local Postgres and Redis)

## Install

```bash
pnpm install
```

## Local Postgres and Redis

From the repo root:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

This starts Postgres on port `5432` and Redis on `6379` with credentials matching the sample `DATABASE_URL` in [`.env.example`](./.env.example).

## Environment variables

Copy the example file and point the API at it. Nest loads `.env` from the **current working directory**, so place the file next to the API when you run it:

```bash
cp .env.example apps/api/.env
```

Adjust values as needed. All variables are summarized below; [`.env.example`](./.env.example) contains the same keys with defaults.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Prisma (`@shredder/db`), API | PostgreSQL connection string |
| `REDIS_HOST`, `REDIS_PORT` | API (BullMQ) | Redis for job queues |
| `JWT_SECRET` | API | Access token signing secret |
| `JWT_EXPIRES_IN` | API | JWT lifetime (e.g. `7d`, `24h`) |
| `PORT` | API | HTTP port (default `3001`) |
| `FRONTEND_URL` | API | CORS allowed origins, comma-separated; omit in dev to allow any origin |
| `OPENAI_API_KEY` | API (`POST /ai/suggest`), `@shredder/ai` | LLM-backed suggestions |
| `OPENAI_SUGGEST_MODEL` | `@shredder/ai` | Model for per-tool analyst-style calls (default `gpt-4o-mini`) |
| `OPENAI_ORCHESTRATION_MODEL` | `@shredder/ai` | Model for the suggest chat loop (default `gpt-4o-mini`) |
| `BINANCE_API_KEY` | API (`ExchangesModule`) | Binance API key; with `BINANCE_API_SECRET`, enables `BinanceAdapter` |
| `BINANCE_API_SECRET` | API (`ExchangesModule`) | HMAC signing secret; treat like a password |
| `BINANCE_USE_MAINNET` | API → `@shredder/exchanges` | `1`, `true`, or `yes` for Spot **mainnet** when `BINANCE_BASE_URL` is unset; otherwise **testnet** (default) |
| `BINANCE_BASE_URL` | API → `@shredder/exchanges` | Optional full Spot REST base URL; when set, overrides `BINANCE_USE_MAINNET` |

### Exchange adapters (Binance)

The API loads **`BINANCE_API_KEY`** and **`BINANCE_API_SECRET`** from env and constructs `BinanceAdapter` when both are set. Other apps (for example `apps/worker`) should pass credentials from env or a secret store into `new BinanceAdapter({ apiKey, apiSecret, ... })` the same way — the `@shredder/exchanges` package does not read API keys from `process.env` by itself.

**Testnet vs mainnet** is controlled by env vars read inside `resolveBinanceSpotBaseUrl()` when the adapter is built **without** an explicit `baseUrl`: precedence is `BINANCE_BASE_URL` (full URL) → `BINANCE_USE_MAINNET` (`1`, `true`, or `yes` → mainnet) → default **Spot testnet** (`https://testnet.binance.vision`). Use API keys issued for the same environment you select.

## Database migrations

With `DATABASE_URL` set (same value as in `apps/api/.env` is fine):

```bash
pnpm --filter @shredder/db db:deploy
```

For iterative local schema work you can use `pnpm --filter @shredder/db db:migrate` instead.

## Build and test

```bash
pnpm build
pnpm test
```

## Run the API

Ensure Postgres and Redis are reachable, migrations are applied, and `apps/api/.env` exists.

```bash
pnpm --filter @shredder/api dev
```

Health check: `GET http://localhost:3001/health` (or your `PORT`).

### Main HTTP routes (JWT on protected routes)

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `POST` | `/auth/register` | Create user |
| `POST` | `/auth/login` | Returns JWT |
| `GET` | `/orders` | Bearer auth |
| `POST` | `/orders` | Bearer auth; enqueues BullMQ job |
| `GET` | `/trades` | Bearer auth |
| `GET` | `/portfolio` | Bearer auth |
| `GET` | `/strategies` | Registered strategy IDs |
| `POST` | `/ai/suggest` | Bearer auth; body `{ "message": "..." }`; needs `OPENAI_API_KEY` for LLM path |

Send `Authorization: Bearer <token>` for protected endpoints.

## Workspace layout

- `apps/api` — NestJS API
- `apps/dashboard`, `apps/worker` — other app entrypoints
- `packages/core` — indicators and shared types
- `packages/strategies` — strategy implementations and registry
- `packages/db` — Prisma schema and client
- `packages/ai` — OpenAI client and suggest-only agent tools
- `packages/backtest`, `packages/config`, `packages/risk`, … — supporting libraries

## Security notes

- Replace `JWT_SECRET` and database credentials for any shared or production deployment.
- Never commit real `BINANCE_API_SECRET` (or other exchange secrets); restrict API key permissions on the exchange side.
- The demo order processor is not a real exchange integration; treat fills as placeholders.
