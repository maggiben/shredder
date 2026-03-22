import OpenAI from "openai";
import { aggregateSignals } from "@shredder/backtest";
import { createStrategyById, listRegisteredStrategyIds } from "@shredder/strategies";
import { strategyInputFromCloses } from "./strategy-input.js";

const defaultPortfolio = { cash: 100_000, positions: [] as const };

function parseArgs(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    return JSON.parse(raw) as Record<string, unknown>;
  }
  if (raw && typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return {};
}

function asNumberArray(v: unknown): number[] | undefined {
  if (!Array.isArray(v)) {
    return undefined;
  }
  const out: number[] = [];
  for (const x of v) {
    if (typeof x !== "number" || !Number.isFinite(x)) {
      return undefined;
    }
    out.push(x);
  }
  return out;
}

async function llmSuggest(
  openai: OpenAI | undefined,
  system: string,
  user: string,
  fallback: string,
): Promise<string> {
  if (!openai) {
    return fallback;
  }
  const res = await openai.chat.completions.create({
    model: process.env["OPENAI_SUGGEST_MODEL"] ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    max_tokens: 500,
  });
  const text = res.choices[0]?.message?.content?.trim();
  return text && text.length > 0 ? text : fallback;
}

/** OpenAI Chat Completions tool definitions — all handlers are suggest-only (no trades, no DB). */
export function shredderSuggestOnlyToolDefinitions(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return [
    {
      type: "function",
      function: {
        name: "evaluate_strategy",
        description:
          "Run one registered deterministic strategy on a close-price series. Returns BUY/SELL/HOLD signal JSON only.",
        parameters: {
          type: "object",
          properties: {
            strategy_id: {
              type: "string",
              enum: listRegisteredStrategyIds(),
            },
            symbol: { type: "string", description: "Instrument label, e.g. BTCUSDT" },
            closes: {
              type: "array",
              items: { type: "number" },
              description: "Chronological close prices (oldest first)",
            },
          },
          required: ["strategy_id", "closes"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "aggregate_strategy_signals",
        description:
          "Evaluate multiple strategies on the same closes and aggregate signals (weighted vote). Read-only.",
        parameters: {
          type: "object",
          properties: {
            strategy_ids: {
              type: "array",
              items: { type: "string" },
            },
            symbol: { type: "string" },
            closes: { type: "array", items: { type: "number" } },
          },
          required: ["strategy_ids", "closes"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "list_strategies",
        description: "List registered strategy ids and one-line descriptions.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "analyst_suggest",
        description:
          "Market Analyst agent: prose summary from an indicator/price snapshot (suggest-only).",
        parameters: {
          type: "object",
          properties: {
            snapshot: { type: "string", description: "Structured or free-text market snapshot" },
          },
          required: ["snapshot"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "selector_suggest",
        description:
          "Strategy Selector agent: rank strategies for a described regime (suggest-only, no execution).",
        parameters: {
          type: "object",
          properties: {
            regime: { type: "string" },
            strategy_ids: { type: "array", items: { type: "string" } },
          },
          required: ["regime", "strategy_ids"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "risk_advisor_suggest",
        description:
          "Risk advisor agent: interpret limits and portfolio context in natural language (suggest-only).",
        parameters: {
          type: "object",
          properties: {
            context: { type: "string", description: "JSON or text: equity, peak, limits, proposed notional" },
          },
          required: ["context"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "execution_advisor_suggest",
        description:
          "Execution advisor agent: operational hints (idempotency, retries, rate limits) — suggest-only.",
        parameters: {
          type: "object",
          properties: {
            context: { type: "string" },
          },
          required: ["context"],
        },
      },
    },
  ];
}

export async function invokeShredderSuggestTool(
  name: string,
  argsRaw: unknown,
  openai?: OpenAI,
): Promise<string> {
  const args = parseArgs(argsRaw);
  switch (name) {
    case "evaluate_strategy": {
      const id = args["strategy_id"];
      const closes = asNumberArray(args["closes"]);
      const symbol = typeof args["symbol"] === "string" ? args["symbol"] : "DEMO";
      if (typeof id !== "string" || closes === undefined) {
        return JSON.stringify({ error: "invalid_args" });
      }
      const strategy = createStrategyById(id);
      if (!strategy) {
        return JSON.stringify({ error: "unknown_strategy", strategy_id: id });
      }
      const input = strategyInputFromCloses(symbol, closes, defaultPortfolio);
      return JSON.stringify(strategy.evaluate(input));
    }
    case "aggregate_strategy_signals": {
      const ids = args["strategy_ids"];
      const closes = asNumberArray(args["closes"]);
      const symbol = typeof args["symbol"] === "string" ? args["symbol"] : "DEMO";
      if (!Array.isArray(ids) || closes === undefined) {
        return JSON.stringify({ error: "invalid_args" });
      }
      const strategies = ids
        .filter((x): x is string => typeof x === "string")
        .map((sid) => createStrategyById(sid))
        .filter((s): s is NonNullable<typeof s> => s !== undefined);
      if (strategies.length === 0) {
        return JSON.stringify({ error: "no_valid_strategies" });
      }
      const input = strategyInputFromCloses(symbol, closes, defaultPortfolio);
      const signals = strategies.map((s) => s.evaluate(input));
      return JSON.stringify(aggregateSignals(signals));
    }
    case "list_strategies": {
      const rows = listRegisteredStrategyIds().map((id) => ({
        id,
        note: defaultStrategyBlurb(id),
      }));
      return JSON.stringify(rows);
    }
    case "analyst_suggest": {
      const snapshot = typeof args["snapshot"] === "string" ? args["snapshot"] : "";
      return llmSuggest(
        openai,
        "You are Shredder Market Analyst. Summarize conditions only; no trade orders; no risk override. Short bullets + caveat.",
        snapshot,
        "Set OPENAI_API_KEY for LLM analyst suggestions, or use evaluate_strategy tools for math-only signals.",
      );
    }
    case "selector_suggest": {
      const regime = typeof args["regime"] === "string" ? args["regime"] : "";
      const ids = Array.isArray(args["strategy_ids"])
        ? args["strategy_ids"].filter((x): x is string => typeof x === "string")
        : [];
      return llmSuggest(
        openai,
        "You are Shredder Strategy Selector. Rank the given strategy ids for the regime; JSON array {strategyId,rank,reason}; no execution authority.",
        `Regime: ${regime}\nStrategies: ${ids.join(", ")}`,
        "Configure OPENAI_API_KEY for selector suggestions.",
      );
    }
    case "risk_advisor_suggest": {
      const ctx = typeof args["context"] === "string" ? args["context"] : "";
      return llmSuggest(
        openai,
        "You are Shredder Risk Advisor. Explain limits and posture; never authorize bypassing risk engine; suggest-only.",
        ctx,
        "Configure OPENAI_API_KEY for risk advisor prose.",
      );
    }
    case "execution_advisor_suggest": {
      const ctx = typeof args["context"] === "string" ? args["context"] : "";
      return llmSuggest(
        openai,
        "You are Shredder Execution Advisor. Ops hints only: idempotency, retries, logging; never place orders.",
        ctx,
        "Configure OPENAI_API_KEY for execution advisor prose.",
      );
    }
    default:
      return JSON.stringify({ error: "unknown_tool", name });
  }
}

function defaultStrategyBlurb(id: string): string {
  switch (id) {
    case "ma-crossover":
      return "MA crossover trend entries";
    case "rsi-reversion":
      return "RSI mean reversion";
    case "macd-momentum":
      return "MACD signal cross momentum";
    case "bollinger-mean-reversion":
      return "Bollinger band mean reversion";
    case "adx-trend":
      return "ADX trend filter with DI direction";
    default:
      return "strategy";
  }
}

/**
 * Single user turn with tool loop (max `maxSteps`). All tools are suggest-only / read-only math.
 */
export async function runSuggestOnlyAgentChat(
  openai: OpenAI,
  userMessage: string,
  maxSteps = 6,
): Promise<string> {
  const tools = shredderSuggestOnlyToolDefinitions();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are Shredder orchestration assistant. Use tools for facts and agent-specific suggestions. You cannot place trades or override risk.",
    },
    { role: "user", content: userMessage },
  ];

  for (let step = 0; step < maxSteps; step += 1) {
    const res = await openai.chat.completions.create({
      model: process.env["OPENAI_ORCHESTRATION_MODEL"] ?? "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.3,
    });
    const choice = res.choices[0];
    const msg = choice?.message;
    if (!msg) {
      return "No response from model.";
    }
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push(msg);
      for (const call of msg.tool_calls) {
        if (call.type !== "function") {
          continue;
        }
        const output = await invokeShredderSuggestTool(
          call.function.name,
          call.function.arguments,
          openai,
        );
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: output,
        });
      }
      continue;
    }
    const text = msg.content?.trim();
    return text && text.length > 0 ? text : "(empty)";
  }
  return "Tool loop limit reached.";
}
