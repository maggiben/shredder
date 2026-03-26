---
name: shredder-app-dashboard
description: >-
  Next.js 16 dashboard for Shredder: App Router, Tailwind, client components for
  simulation/charts, `lib/api.ts` against `NEXT_PUBLIC_API_URL`. Use when building
  UI, auth storage, or API integration from the browser.
---

# Shredder app: `apps/dashboard`

## Role

Next.js front end (`@shredder/dashboard`) for monitoring and interaction. Consumes the Nest API via `fetch` helpers; uses shared packages for **client-side simulation / visualization** (backtest, core types, risk, strategies) where the UI needs deterministic math without calling the API.

## Stack

- Next.js 16, React 19, Tailwind 3, Recharts, TanStack Table.
- App Router: `app/layout.tsx`, `app/page.tsx` → `components/dashboard-app.tsx`.
- Supporting UI: `components/simulation-panel.tsx`, `components/trades-charts-panel.tsx`.
- Lib: `lib/api.ts`, `lib/api-types.ts`, `lib/auth-storage.ts`, `lib/klines-to-candles.ts`, `lib/config.ts`.

## API base URL

`getApiBaseUrl()` in `lib/config.ts` reads `NEXT_PUBLIC_API_URL`; if unset, defaults to `http://localhost:3001` (match API `PORT`).

`lib/api.ts` centralizes JSON requests, optional `Authorization: Bearer`, and `ApiError` for failed responses.

## Workspace packages

`package.json` includes `@shredder/backtest`, `@shredder/core`, `@shredder/risk`, `@shredder/strategies` for in-browser or build-time logic aligned with the worker stack.

## Scripts

From `apps/dashboard`: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`.

## Conventions

- Prefer existing patterns in `lib/api.ts` for new endpoints; extend `api-types.ts` for response shapes.
- Keep **no trade authority** in copy and features: the dashboard reflects API and deterministic packages; it does not replace `@shredder/risk` or exchange execution.
