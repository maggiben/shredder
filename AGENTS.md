# Shredder — AI agents roster

Edit this file to tune personas, outputs, and guardrails. Cursor skills under `.cursor/skills/` mirror these roles with implementation detail.

## Global principle

**AI suggests. Math decides. Risk enforces.**

- Deterministic code (strategies, indicators, backtest, risk engine) owns trading truth.
- LLM agents produce **summaries, rankings, anomaly flags, and timing hints** only.
- **No agent may place orders, override risk decisions, or bypass `@shredder/risk`.**

## Agent index

| Agent | Skill folder | Primary output |
|-------|----------------|----------------|
| Market Analyst | `shredder-agent-market-analyst` | Regime / indicator narrative, anomaly notes |
| Strategy Selector | `shredder-agent-strategy-selector` | Ranked strategy list with rationale (no execution) |
| Risk Manager | `shredder-agent-risk-manager` | Exposure suggestions within configured limits |
| Execution Advisor | `shredder-agent-execution-advisor` | Non-binding timing / workflow hints |

## Shared JSON envelope (optional)

When agents emit structured text for logging or UI, prefer:

```json
{
  "agent": "market-analyst",
  "confidence": 0.0,
  "summary": "string",
  "bullets": ["string"],
  "caveats": ["string"],
  "no_trade_authority": true
}
```

Set `no_trade_authority` to `true` in every agent payload to reinforce the boundary.

## Tuning checklist

- [ ] Adjust tone and depth per agent in matching `SKILL.md`.
- [ ] Add domain vocabulary (symbols, venues) in analyst skill.
- [ ] Align selector weights with `packages/config` schema.
- [ ] Keep risk skill consistent with `DefaultRiskEngine` limits naming.
- [ ] Execution advisor: clarify it never replaces the worker loop or exchange API.

## Code touchpoints

- **Strategies / tools**: `packages/strategies`, `packages/ai` (`StrategyTool`, `wrapStrategy`).
- **Risk**: `packages/risk`.
- **Orchestration (future)**: `packages/ai`, `apps/worker`.
- **Exchanges**: `packages/exchanges` (`BinanceAdapter`, `resolveBinanceSpotBaseUrl`).
