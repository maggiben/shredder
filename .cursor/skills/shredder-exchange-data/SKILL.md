---
name: shredder-exchange-data
description: >-
  Documents Shredder exchange and data configuration: Binance Spot testnet
  default, BINANCE_BASE_URL and BINANCE_USE_MAINNET env vars, BinanceAdapter,
  and MarketDataSource placeholder for Polygon or klines. Use when configuring
  credentials, switching mainnet, or implementing data ingestion.
---

# Exchange and market data

## Binance Spot (`@shredder/exchanges`)

- **Default REST base**: testnet `https://testnet.binance.vision` (via `resolveBinanceSpotBaseUrl`).
- **Override** (precedence): `BinanceAdapterConfig.baseUrl` → `BINANCE_BASE_URL` → `BINANCE_USE_MAINNET=true` → testnet.
- **Constants**: `BINANCE_SPOT_TESTNET_BASE_URL`, `BINANCE_SPOT_MAINNET_BASE_URL` (exported from package).

## Environment variables

| Variable | Effect |
|----------|--------|
| `BINANCE_API_KEY` / `BINANCE_API_SECRET` | **Not read by `@shredder/exchanges`.** Suggested names for the app that constructs `BinanceAdapter`: pass the values as `apiKey` / `apiSecret` in `BinanceAdapterConfig`. |
| `BINANCE_BASE_URL` | Full base URL (trailing slash stripped). |
| `BINANCE_USE_MAINNET` | `1`, `true`, or `yes` selects mainnet if base URL unset. |

## Adapter behavior

- Signed requests for `getBalance` and `placeOrder`; **never** log secrets.
- Symbol format: adapter accepts `BTC/USDT` style and normalizes for REST.

## Market data (`@shredder/data`)

- Implement `MarketDataSource.getCandles(symbol, interval, limit)` for live worker feeds.
- Keep ingestion **separate** from strategy purity (fetch in worker, pass candles into strategies).

## Tuning hooks

- Document Alpaca / IBKR adapters when added beside `Exchange` interface.
- Add data-provider API key env names here as implementations land.
