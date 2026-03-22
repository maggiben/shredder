import { describe, expect, it } from "vitest";
import { createOpenAIClient } from "./client.js";

describe("createOpenAIClient", () => {
  it("returns an OpenAI instance", () => {
    const client = createOpenAIClient("test-key");
    expect(client).toBeDefined();
  });
});
