import { describe, expect, it } from "vitest";
import { signQuery } from "./binance-signing.js";

describe("signQuery", () => {
  it("produces deterministic hex signatures", () => {
    const secret = "test-secret";
    const query = "symbol=BTCUSDT&side=BUY";
    const sig = signQuery(secret, query);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(signQuery(secret, query)).toBe(sig);
    expect(signQuery(secret, `${query}&extra=1`)).not.toBe(sig);
  });
});
