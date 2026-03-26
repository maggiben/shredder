import type { ReadonlyURLSearchParams } from "next/navigation";

export type QueryRecord = Record<string, string>;

export function searchParamsToQueryRecord(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
): QueryRecord {
  const out: QueryRecord = {};
  for (const [k, v] of searchParams.entries()) {
    out[k] = v;
  }
  return out;
}

export function withoutKeys(query: QueryRecord, keys: readonly string[]): QueryRecord {
  const out: QueryRecord = { ...query };
  for (const k of keys) {
    delete out[k];
  }
  return out;
}

