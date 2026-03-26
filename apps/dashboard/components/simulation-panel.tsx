"use client";

import type { SimulationLedgerRow } from "@shredder/backtest";
import { listRegisteredStrategyIds } from "@shredder/strategies";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
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
import {
  ApiError,
  KLINE_INTERVAL_OPTIONS,
  runSimulation,
  type KlineInterval,
  type SimulationRunResponse,
} from "../lib/api";

const DEFAULT_STRATEGY_IDS = ["ma-crossover", "rsi-reversion", "macd-momentum"] as const;

type SimChartRow = { t: number; close: number; equity: number };
type SimTradeMarker = { id: string; t: number; price: number; side: "BUY" | "SELL" };

function formatError(e: unknown): string {
  if (e instanceof ApiError) {
    return e.message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return "Something went wrong";
}

function parseSymbol(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,32}$/.test(s)) {
    return null;
  }
  return s;
}

function actionClass(a: string): string {
  if (a === "BUY") {
    return "text-emerald-400 font-medium";
  }
  if (a === "SELL") {
    return "text-rose-400 font-medium";
  }
  return "text-zinc-500";
}

function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "—";
  }
  const s = Math.round(ms / 1000);
  if (s < 120) {
    return `${s}s`;
  }
  const m = Math.floor(s / 60);
  if (m < 120) {
    return `${m}m`;
  }
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function fmtPct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function fmtPlain(n: number, digits = 2): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  return n.toFixed(digits);
}

function fmtSigned(n: number, digits = 2): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}`;
}

function fmtMaybeNumber(n: number | null, digits = 2): string {
  if (n === null || !Number.isFinite(n)) {
    return "—";
  }
  return n.toFixed(digits);
}

function SimulationCharts({ rows }: { rows: SimulationLedgerRow[] }) {
  const chartRows = useMemo<SimChartRow[]>(
    () =>
      rows
        .map((r) => ({
          t: r.timestamp,
          close: Number(r.close),
          equity: Number(r.equityAfter),
        }))
        .filter((r) => Number.isFinite(r.t) && Number.isFinite(r.close) && Number.isFinite(r.equity)),
    [rows],
  );

  const tradeMarkers = useMemo<SimTradeMarker[]>(
    () =>
      rows
        .filter((r) => r.tradePrice !== null && (r.executedAction === "BUY" || r.executedAction === "SELL"))
        .map((r) => ({
          id: `${r.barIndex}-${r.timestamp}-${r.executedAction}`,
          t: r.timestamp,
          price: Number(r.tradePrice),
          side: (r.executedAction === "SELL" ? "SELL" : "BUY") as SimTradeMarker["side"],
        }))
        .filter((m) => Number.isFinite(m.t) && Number.isFinite(m.price)),
    [rows],
  );

  if (chartRows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
      <div>
        <h3 className="text-md font-medium text-white">Simulation charts</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Price chart shows executed entries/exits (BUY/SELL fills). Equity curve is account equity after each
          bar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-medium text-zinc-300">Entries &amp; exits</p>
            <p className="text-[10px] text-zinc-500">
              <span className="text-emerald-300">●</span> BUY{" "}
              <span className="text-rose-300">●</span> SELL
            </p>
          </div>
          <div className="mt-2 h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
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
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                  width={56}
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
                {tradeMarkers.map((m) => (
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
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <p className="text-xs font-medium text-zinc-300">Equity curve</p>
          <div className="mt-2 h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  type="number"
                  dataKey="t"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                  width={64}
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
                    const text = Number.isFinite(vNum) ? vNum.toFixed(2) : String(value ?? "");
                    return [text, "Equity"];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#a78bfa"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="mt-0.5 font-mono text-sm text-zinc-200">{children}</div>
    </div>
  );
}

function simulationGlobalFilter(row: { original: SimulationLedgerRow }, _columnId: string, filter: unknown): boolean {
  const q = String(filter ?? "")
    .trim()
    .toLowerCase();
  if (!q) {
    return true;
  }
  const r = row.original;
  const blob = [
    r.barIndex,
    new Date(r.timestamp).toLocaleString(),
    r.signalAction,
    r.executedAction,
    r.close,
    r.tradeQuantity ?? "",
    r.tradePrice ?? "",
    r.tradeValue ?? "",
    r.tradeFee ?? "",
    r.cashAfter,
    r.positionQtyAfter,
    r.equityAfter,
    r.signalReason,
    r.notes,
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
}

export function SimulationPanel({ token }: { token: string }) {
  const allStrategyIds = useMemo(() => listRegisteredStrategyIds(), []);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState<KlineInterval>("1h");
  const [limit, setLimit] = useState("500");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [useRange, setUseRange] = useState(false);
  const [initialCash, setInitialCash] = useState("10000");
  const [deployFraction, setDeployFraction] = useState("0.1");
  const [warmupBars, setWarmupBars] = useState("50");
  const [maxNotionalFraction, setMaxNotionalFraction] = useState("0.1");
  const [maxDrawdownFraction, setMaxDrawdownFraction] = useState("0.25");
  const [selectedStrategies, setSelectedStrategies] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const id of allStrategyIds) {
      m[id] = DEFAULT_STRATEGY_IDS.includes(id as (typeof DEFAULT_STRATEGY_IDS)[number]);
    }
    return m;
  });

  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [rows, setRows] = useState<SimulationLedgerRow[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationRunResponse | null>(null);

  const [sorting, setSorting] = useState<SortingState>([{ id: "timestamp", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<SimulationLedgerRow>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: "Time",
        cell: (ctx) => (
          <span className="whitespace-nowrap text-zinc-300">
            {new Date(ctx.getValue() as number).toLocaleString()}
          </span>
        ),
        sortingFn: "basic",
      },
      {
        accessorKey: "signalAction",
        header: "Signal",
        cell: (ctx) => <span className={actionClass(String(ctx.getValue()))}>{String(ctx.getValue())}</span>,
      },
      {
        accessorKey: "executedAction",
        header: "Action",
        cell: (ctx) => <span className={actionClass(String(ctx.getValue()))}>{String(ctx.getValue())}</span>,
      },
      {
        accessorKey: "close",
        header: "Close",
        cell: (ctx) => <span className="font-mono text-zinc-300">{(ctx.getValue() as number).toFixed(4)}</span>,
      },
      {
        accessorKey: "tradeQuantity",
        header: "Qty",
        cell: (ctx) => {
          const v = ctx.getValue() as number | null;
          return <span className="font-mono text-zinc-400">{v === null ? "—" : v.toFixed(6)}</span>;
        },
      },
      {
        accessorKey: "tradeValue",
        header: "Value",
        cell: (ctx) => {
          const v = ctx.getValue() as number | null;
          return <span className="font-mono text-zinc-400">{v === null ? "—" : v.toFixed(2)}</span>;
        },
      },
      {
        accessorKey: "tradeFee",
        header: "Fee (quote)",
        cell: (ctx) => {
          const v = ctx.getValue() as number | null;
          return <span className="font-mono text-amber-200/80">{v === null ? "—" : v.toFixed(4)}</span>;
        },
      },
      {
        accessorKey: "cashAfter",
        header: "Cash",
        cell: (ctx) => (
          <span className="font-mono text-zinc-300">{(ctx.getValue() as number).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "positionQtyAfter",
        header: "Position",
        cell: (ctx) => (
          <span className="font-mono text-zinc-300">{(ctx.getValue() as number).toFixed(6)}</span>
        ),
      },
      {
        accessorKey: "equityAfter",
        header: "Equity",
        cell: (ctx) => (
          <span className="font-mono text-emerald-300/90">{(ctx.getValue() as number).toFixed(2)}</span>
        ),
      },
      {
        accessorKey: "signalReason",
        header: "Signal reason",
        cell: (ctx) => (
          <span className="max-w-[220px] truncate text-xs text-zinc-500" title={String(ctx.getValue())}>
            {String(ctx.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: (ctx) => (
          <span className="max-w-[200px] truncate text-xs text-amber-200/80" title={String(ctx.getValue())}>
            {String(ctx.getValue()) || "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: simulationGlobalFilter,
    initialState: { pagination: { pageSize: 25, pageIndex: 0 } },
  });

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const sym = parseSymbol(symbol);
    if (!sym) {
      setBanner("Symbol must be 4–32 alphanumeric characters (e.g. BTCUSDT).");
      return;
    }
    const cash = Number(initialCash);
    if (!Number.isFinite(cash) || cash <= 0) {
      setBanner("Starting cash must be a positive number.");
      return;
    }
    const deploy = Number(deployFraction);
    if (!Number.isFinite(deploy) || deploy <= 0 || deploy > 1) {
      setBanner("Deploy fraction must be between 0 and 1 (e.g. 0.1 for 10% of equity per entry).");
      return;
    }
    const warmup = Math.floor(Number(warmupBars));
    if (!Number.isFinite(warmup) || warmup < 1) {
      setBanner("Warmup bars must be a positive integer.");
      return;
    }
    const maxNot = Number(maxNotionalFraction);
    const maxDd = Number(maxDrawdownFraction);
    if (!Number.isFinite(maxNot) || maxNot <= 0 || maxNot > 1) {
      setBanner("Max notional fraction per trade must be in (0,1].");
      return;
    }
    if (!Number.isFinite(maxDd) || maxDd <= 0 || maxDd > 1) {
      setBanner("Max drawdown fraction must be in (0,1].");
      return;
    }

    const strategyIds = allStrategyIds.filter((id) => selectedStrategies[id]);
    if (strategyIds.length === 0) {
      setBanner("Select at least one strategy.");
      return;
    }

    let limitNum = Math.min(1000, Math.max(1, Math.floor(Number(limit))));
    if (!Number.isFinite(limitNum)) {
      limitNum = 500;
    }

    setBusy(true);
    try {
      const startMs =
        useRange && startTime.trim() !== "" ? new Date(startTime).getTime() : undefined;
      const endMs = useRange && endTime.trim() !== "" ? new Date(endTime).getTime() : undefined;
      if (useRange && startTime.trim() !== "" && !Number.isFinite(startMs)) {
        setBanner("Invalid start time.");
        return;
      }
      if (useRange && endTime.trim() !== "" && !Number.isFinite(endMs)) {
        setBanner("Invalid end time.");
        return;
      }

      const data = await runSimulation(token, {
        symbol: sym,
        interval,
        limit: limitNum,
        ...(startMs !== undefined && Number.isFinite(startMs) ? { startTime: startMs } : {}),
        ...(endMs !== undefined && Number.isFinite(endMs) ? { endTime: endMs } : {}),
        initialCash: cash,
        deployFraction: deploy,
        warmupBars: warmup,
        maxNotionalFractionPerTrade: maxNot,
        maxDrawdownFraction: maxDd,
        strategyIds,
      });

      setRows([...data.rows]);
      setSimulationResult(data);
    } catch (err) {
      setBanner(formatError(err));
      setRows([]);
      setSimulationResult(null);
    } finally {
      setBusy(false);
    }
  }

  function toggleStrategy(id: string) {
    setSelectedStrategies((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-lg font-medium text-white">Simulation testbed</h2>
        <p className="mt-1 text-sm text-zinc-400">
          The API loads Binance klines and runs the aggregate-signal ledger from{" "}
          <code className="text-zinc-500">@shredder/backtest</code> server-side. Results include full performance
          metrics plus a per-bar ledger (signal vs executed action, fills, equity).
        </p>

        <form onSubmit={(e) => void handleRun(e)} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Symbol</span>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-emerald-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Interval</span>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as KlineInterval)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
              >
                {KLINE_INTERVAL_OPTIONS.map((iv) => (
                  <option key={iv} value={iv}>
                    {iv}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Candle limit (max 1000)</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                disabled={useRange}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-emerald-600 disabled:opacity-50"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Starting cash (quote)</span>
              <input
                type="number"
                min={0}
                step="any"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-emerald-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Deploy fraction of equity (per BUY)</span>
              <input
                type="number"
                min={0.01}
                max={1}
                step={0.01}
                value={deployFraction}
                onChange={(e) => setDeployFraction(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-emerald-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Warmup bars (indicators)</span>
              <input
                type="number"
                min={1}
                max={999}
                value={warmupBars}
                onChange={(e) => setWarmupBars(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-emerald-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Risk: max notional / trade (fraction of equity)</span>
              <input
                type="number"
                min={0.01}
                max={1}
                step={0.01}
                value={maxNotionalFraction}
                onChange={(e) => setMaxNotionalFraction(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-emerald-600"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Risk: max drawdown halt</span>
              <input
                type="number"
                min={0.01}
                max={1}
                step={0.01}
                value={maxDrawdownFraction}
                onChange={(e) => setMaxDrawdownFraction(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-mono text-white outline-none focus:border-emerald-600"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={useRange}
              onChange={(e) => setUseRange(e.target.checked)}
              className="rounded border-zinc-600"
            />
            Use start / end time (Binance <code className="text-zinc-500">startTime</code> /{" "}
            <code className="text-zinc-500">endTime</code>)
          </label>
          {useRange ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">Start (local)</span>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">End (local)</span>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
                />
              </label>
            </div>
          ) : null}

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Strategies</p>
            <div className="flex flex-wrap gap-3">
              {allStrategyIds.map((id) => (
                <label key={id} className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedStrategies[id])}
                    onChange={() => toggleStrategy(id)}
                    className="rounded border-zinc-600"
                  />
                  <span className="font-mono text-emerald-400/90">{id}</span>
                </label>
              ))}
            </div>
          </div>

          {banner ? (
            <div className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              {banner}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "Running simulation…" : "Run simulation"}
          </button>
        </form>
      </section>

      {simulationResult ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
          <div>
            <h3 className="text-md font-medium text-white">Results</h3>
            <p className="mt-1 text-xs text-zinc-500">
              <span className="font-mono text-zinc-400">
                {simulationResult.symbol} · {simulationResult.interval}
              </span>
              {" · "}
              {simulationResult.candleCount} candles · Binance{" "}
              <span className="font-mono text-zinc-500">{simulationResult.baseUrl}</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Taker fee model:{" "}
              <span className="font-mono text-zinc-300">
                {(simulationResult.feeModel.takerFeeRate * 100).toFixed(4)}%
              </span>{" "}
              <span className="text-zinc-600">({simulationResult.feeModel.source})</span>
            </p>
          </div>

          {(() => {
            const m = simulationResult.metrics;
            const sig = simulationResult.signalStats;
            return (
              <>
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Period</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricTile label="From (first bar after warmup)">
                      {new Date(m.periodFrom).toLocaleString()}
                    </MetricTile>
                    <MetricTile label="To (last bar)">{new Date(m.periodTo).toLocaleString()}</MetricTile>
                    <MetricTile label="Calendar days (span)">{m.calendarDaysInPeriod.toFixed(2)}</MetricTile>
                    <MetricTile label="Market change % (buy &amp; hold, same window)">
                      {fmtPct(m.marketChangePercent)}
                    </MetricTile>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Balance &amp; return</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricTile label="Starting balance">{fmtPlain(m.startingBalance)}</MetricTile>
                    <MetricTile label="Final balance (mark to last close)">
                      <span className="text-emerald-300/90">{fmtPlain(m.finalBalance)}</span>
                    </MetricTile>
                    <MetricTile label="Absolute profit">
                      <span className={m.absoluteProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {fmtSigned(m.absoluteProfit)}
                      </span>
                    </MetricTile>
                    <MetricTile label="Total profit %">{fmtPct(m.totalProfitPercent)}</MetricTile>
                    <MetricTile label="CAGR %">{fmtPct(m.cagrPercent)}</MetricTile>
                    <MetricTile label="Min balance">{fmtPlain(m.minBalance)}</MetricTile>
                    <MetricTile label="Max balance">{fmtPlain(m.maxBalance)}</MetricTile>
                    <MetricTile label="Avg daily profit % (calendar days)">{fmtPct(m.avgDailyProfitPercent)}</MetricTile>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Fees &amp; commissions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricTile label="Total fees paid (quote)">{fmtPlain(m.totalFeesPaid)}</MetricTile>
                    <MetricTile label="Avg fee per leg (quote)">{fmtPlain(m.avgFeePerLeg)}</MetricTile>
                    <MetricTile label="Avg effective fee (bps of volume)">
                      {fmtPlain(m.avgEffectiveFeeRateBps, 4)}
                    </MetricTile>
                    <MetricTile label="Net profit ÷ fees (×)">
                      {m.profitToFeesRatio === null ? "—" : fmtPlain(m.profitToFeesRatio, 4)}
                    </MetricTile>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Trades &amp; activity</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricTile label="Max open positions (concurrent)">{m.maxOpenTrades}</MetricTile>
                    <MetricTile label="Peak position size (base qty)">{m.maxPositionQty.toFixed(6)}</MetricTile>
                    <MetricTile label="Closed round trips">{m.closedTradeCount}</MetricTile>
                    <MetricTile label="Executed legs (BUY+SELL)">{m.totalLegCount}</MetricTile>
                    <MetricTile label="Avg trades / day (round trips)">{m.avgTradesPerDay.toFixed(4)}</MetricTile>
                    <MetricTile label="Total trade volume (quote)">{fmtPlain(m.totalTradeVolume)}</MetricTile>
                    <MetricTile label="Avg stake (avg position notional when long)">
                      {fmtPlain(m.avgStakeNotional)}
                    </MetricTile>
                    <MetricTile label="Profit factor">{fmtMaybeNumber(m.profitFactor)}</MetricTile>
                    <MetricTile label="Expectancy / trade (quote)">{fmtSigned(m.expectancy)}</MetricTile>
                    <MetricTile label="Expectancy ratio (avg win ÷ avg loss)">
                      {fmtMaybeNumber(m.expectancyRatio)}
                    </MetricTile>
                    <MetricTile label="Best trade (closed)">{fmtSigned(m.bestTrade)}</MetricTile>
                    <MetricTile label="Worst trade (closed)">{fmtSigned(m.worstTrade)}</MetricTile>
                    <MetricTile label="Avg duration — winners">{formatDurationMs(m.avgDurationWinnersMs)}</MetricTile>
                    <MetricTile label="Avg duration — losers">{formatDurationMs(m.avgDurationLosersMs)}</MetricTile>
                    <MetricTile label="Max consecutive wins">{m.maxConsecutiveWins}</MetricTile>
                    <MetricTile label="Max consecutive losses">{m.maxConsecutiveLosses}</MetricTile>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Daily outcomes (UTC calendar days)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricTile label="Days win / draw / lose">
                      {m.daysWin} / {m.daysDraw} / {m.daysLose}
                    </MetricTile>
                    <MetricTile label="Best day (quote P&amp;L)">{fmtSigned(m.bestDay)}</MetricTile>
                    <MetricTile label="Worst day (quote P&amp;L)">{fmtSigned(m.worstDay)}</MetricTile>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Drawdown</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricTile label="Max % underwater (from running peak)">
                      {fmtPct(m.maxUnderwaterPercent)}
                    </MetricTile>
                    <MetricTile label="Absolute drawdown (quote, account equity)">{fmtPlain(m.absoluteDrawdown)}</MetricTile>
                    <MetricTile label="Drawdown high (peak equity)">{fmtPlain(m.drawdownHigh)}</MetricTile>
                    <MetricTile label="Drawdown low (trough equity)">{fmtPlain(m.drawdownLow)}</MetricTile>
                    <MetricTile label="Drawdown start (peak time)">
                      {new Date(m.drawdownStart).toLocaleString()}
                    </MetricTile>
                    <MetricTile label="Drawdown end (trough time)">
                      {new Date(m.drawdownEnd).toLocaleString()}
                    </MetricTile>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Signals &amp; timeouts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricTile label="Rejected / skipped entry signals (risk + already long)">
                      {m.rejectedEntrySignals}
                    </MetricTile>
                    <MetricTile label="SELL signal while flat">{sig.sellSkippedFlat}</MetricTile>
                    <MetricTile label="Entry timeouts (not modeled)">{sig.entryTimeouts}</MetricTile>
                    <MetricTile label="Exit timeouts (not modeled)">{sig.exitTimeouts}</MetricTile>
                    <MetricTile label="BUY blocked by risk">{sig.buyBlockedByRisk}</MetricTile>
                    <MetricTile label="BUY skipped (already in position)">{sig.buySkippedInPosition}</MetricTile>
                  </div>
                </div>
              </>
            );
          })()}
        </section>
      ) : null}

      {rows.length > 0 ? <SimulationCharts rows={rows} /> : null}

      {rows.length > 0 ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-md font-medium text-white">Bar ledger</h3>
            <input
              type="search"
              placeholder="Search table…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full sm:max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
            />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            One row per bar after warmup. <span className="text-zinc-400">Signal</span> is the aggregated
            strategy vote; <span className="text-zinc-400">Action</span> is what the portfolio actually did.
          </p>

          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/90 text-zinc-400">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th key={h.id} className="px-3 py-2 font-medium whitespace-nowrap">
                        {h.isPlaceholder ? null : (
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 hover:text-white ${
                              h.column.getCanSort() ? "cursor-pointer select-none" : ""
                            }`}
                            onClick={h.column.getToggleSortingHandler()}
                            disabled={!h.column.getCanSort()}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {h.column.getIsSorted() === "asc" ? " ↑" : null}
                            {h.column.getIsSorted() === "desc" ? " ↓" : null}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-800/80 hover:bg-zinc-950/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-zinc-400">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800 disabled:opacity-40"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                First
              </button>
              <button
                type="button"
                className="rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800 disabled:opacity-40"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Prev
              </button>
              <button
                type="button"
                className="rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800 disabled:opacity-40"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </button>
              <button
                type="button"
                className="rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800 disabled:opacity-40"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                Last
              </button>
              <span className="text-zinc-500">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </span>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-zinc-500">Rows per page</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      ) : null}
    </div>
  );
}
