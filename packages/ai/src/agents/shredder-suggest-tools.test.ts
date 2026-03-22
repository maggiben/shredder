import { describe, expect, it } from "vitest";
import { invokeShredderSuggestTool } from "./shredder-suggest-tools.js";

describe("invokeShredderSuggestTool", () => {
  it("evaluates a registered strategy from closes", async () => {
    const closes = Array.from({ length: 40 }, (_, i) => 100 + i * 0.1);
    const out = await invokeShredderSuggestTool(
      "evaluate_strategy",
      JSON.stringify({ strategy_id: "rsi-reversion", closes, symbol: "TEST" }),
      undefined,
    );
    const parsed = JSON.parse(out) as { action: string };
    expect(["BUY", "SELL", "HOLD"]).toContain(parsed.action);
  });

  it("lists strategies", async () => {
    const out = await invokeShredderSuggestTool("list_strategies", "{}", undefined);
    const parsed = JSON.parse(out) as { id: string }[];
    expect(parsed.length).toBeGreaterThanOrEqual(5);
    expect(parsed.map((p) => p.id)).toContain("adx-trend");
  });
});
