/** Binance Spot REST API — production. */
export const BINANCE_SPOT_MAINNET_BASE_URL = "https://api.binance.com";

/** Binance Spot REST API — public testnet. */
export const BINANCE_SPOT_TESTNET_BASE_URL = "https://testnet.binance.vision";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Resolves the Spot REST base URL. Shredder defaults to **testnet** unless overridden.
 *
 * Precedence:
 * 1. `explicitBaseUrl` (constructor / config)
 * 2. `BINANCE_BASE_URL` environment variable
 * 3. `BINANCE_USE_MAINNET` = `1` | `true` | `yes` → mainnet
 * 4. Testnet (`BINANCE_SPOT_TESTNET_BASE_URL`)
 */
export function resolveBinanceSpotBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl !== undefined && explicitBaseUrl !== "") {
    return stripTrailingSlash(explicitBaseUrl);
  }
  if (typeof process !== "undefined" && process.env) {
    const fromEnv = process.env["BINANCE_BASE_URL"]?.trim();
    if (fromEnv) {
      return stripTrailingSlash(fromEnv);
    }
    const useMainnet = process.env["BINANCE_USE_MAINNET"];
    if (useMainnet === "1" || useMainnet === "true" || useMainnet === "yes") {
      return BINANCE_SPOT_MAINNET_BASE_URL;
    }
  }
  return BINANCE_SPOT_TESTNET_BASE_URL;
}
