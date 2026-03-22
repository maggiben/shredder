import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BINANCE_SPOT_MAINNET_BASE_URL,
  BINANCE_SPOT_TESTNET_BASE_URL,
  resolveBinanceSpotBaseUrl,
} from "./binance-defaults.js";

describe("resolveBinanceSpotBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses explicit URL and strips trailing slash", () => {
    expect(resolveBinanceSpotBaseUrl("https://example.com/")).toBe("https://example.com");
  });

  it("defaults to testnet when env is empty", () => {
    vi.stubEnv("BINANCE_BASE_URL", "");
    vi.stubEnv("BINANCE_USE_MAINNET", "");
    expect(resolveBinanceSpotBaseUrl()).toBe(BINANCE_SPOT_TESTNET_BASE_URL);
  });

  it("respects BINANCE_BASE_URL", () => {
    vi.stubEnv("BINANCE_BASE_URL", "https://custom.binance.example/");
    expect(resolveBinanceSpotBaseUrl()).toBe("https://custom.binance.example");
  });

  it("selects mainnet when BINANCE_USE_MAINNET is set", () => {
    vi.stubEnv("BINANCE_USE_MAINNET", "true");
    expect(resolveBinanceSpotBaseUrl()).toBe(BINANCE_SPOT_MAINNET_BASE_URL);
  });

  it("explicit baseUrl wins over env", () => {
    vi.stubEnv("BINANCE_BASE_URL", "https://wrong");
    expect(resolveBinanceSpotBaseUrl("https://right.test")).toBe("https://right.test");
  });
});
