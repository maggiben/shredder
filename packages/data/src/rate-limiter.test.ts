import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter } from "./rate-limiter.js";

describe("SlidingWindowRateLimiter", () => {
  it("enforces max requests per minute with injectable clock", async () => {
    let t = 0;
    const sleeps: number[] = [];
    const limiter = new SlidingWindowRateLimiter(
      2,
      0,
      () => t,
      async (ms) => {
        sleeps.push(ms);
        t += ms;
      },
    );

    await limiter.schedule(async () => undefined);
    await limiter.schedule(async () => undefined);
    const third = limiter.schedule(async () => undefined);
    await third;

    expect(sleeps.length).toBeGreaterThanOrEqual(1);
    expect(sleeps[0]).toBeGreaterThan(50_000);
  });

  it("enforces minimum interval", async () => {
    let t = 0;
    const sleeps: number[] = [];
    const limiter = new SlidingWindowRateLimiter(
      100,
      500,
      () => t,
      async (ms) => {
        sleeps.push(ms);
        t += ms;
      },
    );

    await limiter.schedule(async () => undefined);
    await limiter.schedule(async () => undefined);

    expect(sleeps.some((ms) => ms >= 500)).toBe(true);
  });
});
