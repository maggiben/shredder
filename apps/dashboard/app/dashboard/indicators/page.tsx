"use client";

import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { getIndicatorsCatalog, ApiError, type IndicatorsCatalog } from "../../../lib/api";
import { accessTokenAtom } from "../../../state/dashboard-atoms";

function formatError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export default function IndicatorsPage() {
  const token = useAtomValue(accessTokenAtom);
  const [busy, setBusy] = useState(false);
  const [catalog, setCatalog] = useState<IndicatorsCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-load once after login; no need to force a second click.
    if (!token) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function refresh() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await getIndicatorsCatalog(token);
      setCatalog(res);
    } catch (e) {
      setCatalog(null);
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!token) return null;

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2 className="text-2xl font-semibold text-white mb-2">Indicators</h2>
      <p className="text-sm text-zinc-400 mb-4">
        Catalog from <code className="text-zinc-300">GET /market/indicators</code>. Use it to select IDs
        for compute requests (if/when you wire that UI next).
      </p>

      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="rounded-lg border border-emerald-700/60 px-4 py-2 text-sm text-zinc-100 hover:bg-emerald-950/40 disabled:opacity-50"
        >
          {busy ? "Loading…" : "Refresh catalog"}
        </button>
      </div>

      {error ? (
        <div className="text-rose-300 font-semibold mb-4">{error}</div>
      ) : null}

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-medium text-white mb-2">Catalog</h3>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontSize: 12 }}>
          {catalog === null ? "No data." : JSON.stringify(catalog, null, 2)}
        </pre>
      </div>
    </div>
  );
}

