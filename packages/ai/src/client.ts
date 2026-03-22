import OpenAI from "openai";

/** Thin wrapper so all LLM traffic is centralized and auditable. */
export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}
