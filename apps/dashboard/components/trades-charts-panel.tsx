"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApiError, getKlines, KLINE_INTERVAL_OPTIONS, type KlineInterval } from "../lib/api";
import type { OrderRow, PortfolioSnapshot, TradeRow } from "../lib/api-types";

const WIDGET_STORAGE_KEY = "shredder-dashboard-chart-widgets-v1";

const EXTRA_SYMBOL_SUGGESTIONS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "LINKUSDT",
  "AVAXUSDT",
] as const;

export type ChartWidgetModel = {
  id: string;
  symbol: string;
  interval: KlineInterval;
};

type CandleRow = { t: number; close: number };

type TradeMarker = {
  id: string;
  t: number;
  price: number;
  side: "BUY" | "SELL";
};

function parseSymbol(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,32}$/.test(s)) {
    return null;
  }
  return s;
}

function loadWidgetsFromStorage(): ChartWidgetModel[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const out: ChartWidgetModel[] = [];
    for (const item of parsed) {
      if (item === null || typeof item !== "object") {
        continue;
      }
      const rec = item as Record<string, unknown>;
      const id = typeof rec["id"] === "string" ? rec["id"] : "";
      const symbol = typeof rec["symbol"] === "string" ? parseSymbol(rec["symbol"]) : null;
      const interval = rec["interval"];
      if (
        !id ||
        !symbol ||
        typeof interval !== "string" ||
        !KLINE_INTERVAL_OPTIONS.includes(interval as KlineInterval)
      ) {
        continue;
      }
      out.push({ id, symbol, interval: interval as KlineInterval });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

function defaultWidgets(suggested: string[]): ChartWidgetModel[] {
  const sym = suggested[0] ?? "BTCUSDT";
  return [{ id: crypto.randomUUID(), symbol: sym, interval: "1h" }];
}

function formatError(e: unknown): string {
  if (e instanceof ApiError) {
    return e.message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return "Failed to load chart";
}

type SymbolChartCardProps = {
  token: string;
  widget: ChartWidgetModel;
  tradeMarkers: TradeMarker[];
  suggestedSymbols: string[];
  onChange: (next: ChartWidgetModel) => void;
  onRemove: () => void;
};

function SymbolChartCard({
  token,
  widget,
  tradeMarkers,
  suggestedSymbols,
  onChange,
  onRemove,
}: SymbolChartCardProps) {
  const [rows, setRows] = useState<CandleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await getKlines(token, {
          symbol: widget.symbol,
          interval: widget.interval,
          limit: 500,
        });
        if (cancelled) {
          return;
        }
        setRows(
          res.candles.map((c) => ({
            t: c.openTime,
            close: Number(c.close),
          })),
        );
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(formatError(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, widget.symbol, widget.interval]);

  const tMin = rows[0]?.t;
  const tMax = rows[rows.length - 1]?.t;
  const visibleMarkers =
    tMin !== undefined && tMax !== undefined
      ? tradeMarkers.filter((m) => m.t >= tMin && m.t <= tMax)
      : [];

  const symbolListId = `sym-${widget.id}`;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 shadow-sm min-h-[320px]">
      <div className="flex flex-wrap items-end gap-2 border-b border-zinc-800/80 pb-3">
        <label className="flex min-w-[7rem] flex-1 flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">Symbol</span>
          <input
            list={symbolListId}
            value={widget.symbol}
            onChange={(e) =>
              onChange({ ...widget, symbol: e.target.value.trim().toUpperCase() })
            }
            onBlur={(e) => {
              const p = parseSymbol(e.target.value);
              if (p) {
                onChange({ ...widget, symbol: p });
              }
            }}
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-600"
          />
          <datalist id={symbolListId}>
            {suggestedSymbols.map((s) => (
              <option key={s} value={s} />
            ))}
            {EXTRA_SYMBOL_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">Interval</span>
          <select
            value={widget.interval}
            onChange={(e) =>
              onChange({ ...widget, interval: e.target.value as KlineInterval })
            }
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-600"
          >
            {KLINE_INTERVAL_OPTIONS.map((iv) => (
              <option key={iv} value={iv}>
                {iv}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded border border-zinc-700 px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          title="Remove chart"
        >
          Remove
        </button>
      </div>
      <div className="mt-2 flex flex-1 flex-col">
        <p className="mb-1 text-[10px] text-zinc-500">
          Green dots: BUY fills (entries). Red dots: SELL fills (exits). Data from Binance klines
          (same base URL as the API exchange config).
        </p>
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Loading…
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center px-2 text-center text-xs text-red-400">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            No candles.
          </div>
        ) : (
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  type="number"
                  dataKey="t"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 9 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 9 }}
                  width={52}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v) => new Date(v as number).toLocaleString()}
                  formatter={(value) => {
                    const vNum = typeof value === "number" ? value : Number(value);
                    const text = Number.isFinite(vNum) ? vNum.toFixed(6) : String(value ?? "");
                    return [text, "Close"];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#34d399"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                {visibleMarkers.map((m) => (
                  <ReferenceDot
                    key={m.id}
                    x={m.t}
                    y={m.price}
                    r={5}
                    fill={m.side === "BUY" ? "#22c55e" : "#ef4444"}
                    stroke="#fafafa"
                    strokeWidth={1}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export type TradesChartsPanelProps = {
  token: string;
  trades: TradeRow[] | null;
  orders: OrderRow[] | null;
  portfolio: PortfolioSnapshot | null;
};

export function TradesChartsPanel({ token, trades, orders, portfolio }: TradesChartsPanelProps) {
  const [tradeFilter, setTradeFilter] = useState("");
  const [widgets, setWidgets] = useState<ChartWidgetModel[]>([]);
  const [widgetsReady, setWidgetsReady] = useState(false);

  const suggestedSymbols = useMemo(() => {
    const s = new Set<string>();
    portfolio?.positions.forEach((p) => s.add(p.symbol));
    orders?.forEach((o) => s.add(o.symbol));
    trades?.forEach((t) => s.add(t.symbol));
    return [...s].sort();
  }, [portfolio?.positions, orders, trades]);

  useEffect(() => {
    void (async () => {
      const stored = loadWidgetsFromStorage();
      setWidgets(stored ?? defaultWidgets([]));
      setWidgetsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!widgetsReady) {
      return;
    }
    try {
      window.localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgets));
    } catch {
      /* ignore quota */
    }
  }, [widgets, widgetsReady]);

  const addWidget = useCallback(() => {
    const sym = parseSymbol(suggestedSymbols[0] ?? "BTCUSDT") ?? "BTCUSDT";
    setWidgets((prev) => [...prev, { id: crypto.randomUUID(), symbol: sym, interval: "1h" }]);
  }, [suggestedSymbols]);

  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets(suggestedSymbols));
  }, [suggestedSymbols]);

  const filteredTrades = useMemo(() => {
    const list = trades ?? [];
    const q = tradeFilter.trim().toUpperCase();
    if (!q) {
      return list;
    }
    return list.filter((t) => t.symbol.toUpperCase().includes(q));
  }, [trades, tradeFilter]);

  const markersBySymbol = useCallback(
    (symbol: string): TradeMarker[] => {
      const sym = symbol.trim().toUpperCase();
      const list = trades ?? [];
      return list
        .filter((t) => t.symbol.toUpperCase() === sym)
        .map((t) => {
          const side: "BUY" | "SELL" =
            t.side === "BUY" ? "BUY" : t.side === "SELL" ? "SELL" : "BUY";
          return {
            id: t.id,
            t: new Date(t.executedAt).getTime(),
            price: Number(t.price),
            side,
          };
        })
        .filter((m) => Number.isFinite(m.t) && Number.isFinite(m.price));
    },
    [trades],
  );

  if (!widgetsReady) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
        Loading layout…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <aside className="order-2 w-full shrink-0 space-y-3 xl:order-1 xl:sticky xl:top-4 xl:w-80">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-sm font-medium text-white">Trades</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Fills from your account (newest first). Filter to focus one symbol; markers on charts use
            exact symbol match.
          </p>
          <input
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            placeholder="Filter by symbol…"
            className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
          />
          <div className="mt-3 max-h-[min(55vh,28rem)] overflow-auto rounded-lg border border-zinc-800">
            {filteredTrades.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">No trades to show.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-zinc-950/95 text-zinc-400">
                  <tr>
                    <th className="px-2 py-2 font-medium">Time</th>
                    <th className="px-2 py-2 font-medium">Sym</th>
                    <th className="px-2 py-2 font-medium">Side</th>
                    <th className="px-2 py-2 font-medium">Px</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((t) => (
                    <tr key={t.id} className="border-t border-zinc-800">
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-500">
                        {new Date(t.executedAt).toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-zinc-200">{t.symbol}</td>
                      <td
                        className={`px-2 py-1.5 ${
                          t.side === "BUY" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {t.side === "BUY" ? "Entry" : t.side === "SELL" ? "Exit" : t.side}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-zinc-300">{t.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </aside>

      <section className="order-1 min-w-0 flex-1 space-y-4 xl:order-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="w-full text-lg font-medium text-white sm:w-auto">Chart widgets</h2>
          <p className="w-full text-xs text-zinc-500 sm:ml-2 sm:w-auto">
            Up to four columns on wide screens; stacks on smaller viewports. Add any Binance Spot
            symbol for visualization.
          </p>
          <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
            <button
              type="button"
              onClick={addWidget}
              className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-900/50"
            >
              Add widget
            </button>
            <button
              type="button"
              onClick={resetLayout}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Reset layout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-1 xl:grid-cols-2">
          {widgets.map((w) => (
            <SymbolChartCard
              key={w.id}
              token={token}
              widget={w}
              tradeMarkers={markersBySymbol(w.symbol)}
              suggestedSymbols={suggestedSymbols}
              onChange={(next) =>
                setWidgets((prev) => prev.map((x) => (x.id === w.id ? next : x)))
              }
              onRemove={() => setWidgets((prev) => prev.filter((x) => x.id !== w.id))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
