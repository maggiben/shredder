/** JSON-serialize indicator outputs (Float64Array, plain objects, tuples). */
export function serializeIndicatorResult(value: unknown): unknown {
  if (value instanceof Float64Array) {
    return [...value];
  }
  if (value !== null && typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map((v) => serializeIndicatorResult(v));
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeIndicatorResult(v);
    }
    return out;
  }
  return value;
}
