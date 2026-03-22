const MINUTE_MS = 60_000;

/**
 * Enforces a minimum gap between calls and a sliding-window cap per minute.
 * CoinGecko (and similar) publish per-minute caps; tune via env in the factory.
 */
export class SlidingWindowRateLimiter {
  private readonly timestamps: number[] = [];
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private readonly maxRequestsPerMinute: number,
    private readonly minIntervalMs: number,
    private readonly now: () => number = Date.now,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((r) => setTimeout(r, ms)),
  ) {}

  /** Runs `fn` after rate limits allow; serializes with other `schedule` calls. */
  schedule<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.chain.then(() => this.acquireThen(fn));
    this.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async acquireThen<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }

  private async acquire(): Promise<void> {
    const minGap = Math.max(0, this.minIntervalMs);
    const cap = Math.max(1, this.maxRequestsPerMinute);

    for (;;) {
      const now = this.now();
      while (this.timestamps.length > 0 && now - this.timestamps[0]! >= MINUTE_MS) {
        this.timestamps.shift();
      }

      if (this.timestamps.length >= cap) {
        const wait = MINUTE_MS - (now - this.timestamps[0]!) + 1;
        await this.sleep(Math.max(1, wait));
        continue;
      }

      const last = this.timestamps[this.timestamps.length - 1];
      if (last !== undefined && now - last < minGap) {
        await this.sleep(minGap - (now - last));
        continue;
      }

      this.timestamps.push(this.now());
      return;
    }
  }
}
