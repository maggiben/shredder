/** Shared OHLCV / 1D series primitives (ema, vwma, atr, …) used by several indicators. */
export * as series from "./series/index.js";
export * from "./indicators/index.js";
export * from "./registry.js";
export * from "./types.js";
export { coreCandlesToOhlcvMatrix } from "./shredder-bridge.js";
export { serializeIndicatorResult } from "./serialize.js";

