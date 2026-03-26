"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ApiError,
  computeIndicator,
  getIndicatorsCatalog,
  getKlines,
  KLINE_INTERVAL_OPTIONS,
  type IndicatorsCatalog,
  type IndicatorComputeResponse,
  type KlineCandle,
  type KlineInterval,
} from "../lib/api";
import { formatDefaultIndicatorParamsJson } from "../lib/indicator-default-params";
import {
  buildIndicatorChartRows,
  extractIndicatorSeries,
  partitionSeriesForPriceAxis,
} from "../lib/indicator-chart-data";

const CHART_GRID = "#3f3f46";
const CHART_AXIS_STROKE = "#71717a";
const CHART_TICK_FILL = "#a1a1aa";
const TOOLTIP_BG = "#18181b";
const TOOLTIP_BORDER = "#3f3f46";
const CLOSE_STROKE = "#34d399";
const SERIES_STROKES = ["#a78bfa", "#fbbf24", "#38bdf8", "#fb7185", "#c084fc"] as const;

function strokeForSeries(i: number): string {
  return SERIES_STROKES[i % SERIES_STROKES.length]!;
}

const EXTRA_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;

function formatError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

function parseSymbol(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,32}$/.test(s)) return null;
  return s;
}

function parseParamsJson(raw: string): Record<string, unknown> | { error: string } {
  const t = raw.trim();
  if (!t) return {};
  try {
    const v = JSON.parse(t) as unknown;
    if (v === null || typeof v !== "object" || Array.isArray(v)) {
      return { error: "Params must be a JSON object." };
    }
    return v as Record<string, unknown>;
  } catch {
    return { error: "Invalid JSON in params." };
  }
}

function parseLimit(raw: string): number | { error: string } {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 50 || n > 1000) {
    return { error: "Limit must be an integer from 50 to 1000." };
  }
  return n;
}

type IndicatorsExplorerProps = {
  token: string;
};

export function IndicatorsExplorer({ token }: IndicatorsExplorerProps) {
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalog, setCatalog] = useState<IndicatorsCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState<KlineInterval>("1h");
  const [limitStr, setLimitStr] = useState("200");
  const [indicatorId, setIndicatorId] = useState("");
  const [paramsStr, setParamsStr] = useState("{}\n");
  const [useRange, setUseRange] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [runBusy, setRunBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [computeResult, setComputeResult] = useState<IndicatorComputeResponse | null>(null);
  const [klines, setKlines] = useState<KlineCandle[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setCatalogBusy(true);
      setCatalogError(null);
      try {
        const res = await getIndicatorsCatalog(token);
        if (!cancelled) {
          setCatalog(res);
          if (res.indicators.length > 0 && !indicatorId) {
            setIndicatorId(res.indicators[0]!.id);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setCatalog(null);
          setCatalogError(formatError(e));
        }
      } finally {
        if (!cancelled) setCatalogBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedIndicatorMeta = useMemo(
    () => catalog?.indicators.find((i) => i.id === indicatorId),
    [catalog, indicatorId],
  );

  const lastDefaultParamsIndicatorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!catalog || !indicatorId) {
      return;
    }
    if (lastDefaultParamsIndicatorRef.current === indicatorId) {
      return;
    }
    lastDefaultParamsIndicatorRef.current = indicatorId;
    const meta = catalog.indicators.find((i) => i.id === indicatorId);
    if (!meta) {
      return;
    }
    setParamsStr(formatDefaultIndicatorParamsJson(meta));
  }, [catalog, indicatorId]);

  const limitParsed = useMemo(() => parseLimit(limitStr), [limitStr]);
  const paramsParsed = useMemo(() => parseParamsJson(paramsStr), [paramsStr]);

  const seriesMap = useMemo(
    () => (computeResult ? extractIndicatorSeries(computeResult.result) : {}),
    [computeResult],
  );

  const chartData = useMemo(() => {
    if (!computeResult || !klines?.length) return { rows: [], seriesKeys: [] as string[] };
    return buildIndicatorChartRows(klines, seriesMap, computeResult.candleCount);
  }, [computeResult, klines, seriesMap]);

  const { overlayKeys, separateKeys } = useMemo(() => {
    const closes = chartData.rows.map((r) => r.close);
    const { overlay, separate } = partitionSeriesForPriceAxis(closes, seriesMap);
    return { overlayKeys: overlay, separateKeys: separate };
  }, [chartData.rows, seriesMap]);

  async function runCompute() {
    setRunError(null);
    setComputeResult(null);
    setKlines(null);

    const sym = parseSymbol(symbol);
    if (!sym) {
      setRunError("Enter a valid symbol (e.g. BTCUSDT).");
      return;
    }
    if (typeof limitParsed === "object") {
      setRunError(limitParsed.error);
      return;
    }
    if ("error" in paramsParsed && typeof paramsParsed.error === "string") {
      setRunError(paramsParsed.error);
      return;
    }
    if (!indicatorId.trim()) {
      setRunError("Select an indicator.");
      return;
    }

    const startMs =
      useRange && startTime.trim() !== "" ? new Date(startTime).getTime() : undefined;
    const endMs = useRange && endTime.trim() !== "" ? new Date(endTime).getTime() : undefined;
    if (useRange && startTime.trim() !== "" && !Number.isFinite(startMs)) {
      setRunError("Invalid start time.");
      return;
    }
    if (useRange && endTime.trim() !== "" && !Number.isFinite(endMs)) {
      setRunError("Invalid end time.");
      return;
    }

    setRunBusy(true);
    try {
      const body = {
        indicatorId: indicatorId.trim(),
        symbol: sym,
        interval,
        limit: limitParsed,
        params: paramsParsed,
        ...(startMs !== undefined && Number.isFinite(startMs) ? { startTime: startMs } : {}),
        ...(endMs !== undefined && Number.isFinite(endMs) ? { endTime: endMs } : {}),
      };
      const [klRes, comp] = await Promise.all([getKlines(token, body), computeIndicator(token, body)]);

      setKlines(klRes.candles);
      setComputeResult(comp);
    } catch (e) {
      setRunError(formatError(e));
    } finally {
      setRunBusy(false);
    }
  }

  const indicatorListId = "indicators-catalog-list";
  const isShortOrScalar =
    computeResult &&
    (typeof computeResult.result === "number" ||
      chartData.rows.length < 2 ||
      (Object.keys(seriesMap).length === 1 &&
        seriesMap.value !== undefined &&
        seriesMap.value.length < computeResult.candleCount));

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white mb-2">Indicators</h2>
        <p className="text-sm text-zinc-400 max-w-3xl">
          Browse the catalog from{" "}
          <code className="text-zinc-300">GET /market/indicators</code>, then compute over live klines via{" "}
          <code className="text-zinc-300">POST /market/indicators/compute</code>. Charts use the same palette as
          simulations and trades.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={catalogBusy}
          onClick={async () => {
            setCatalogBusy(true);
            setCatalogError(null);
            try {
              const res = await getIndicatorsCatalog(token);
              setCatalog(res);
            } catch (e) {
              setCatalogError(formatError(e));
            } finally {
              setCatalogBusy(false);
            }
          }}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          {catalogBusy ? "Loading catalog…" : "Refresh catalog"}
        </button>
      </div>

      {catalogError ? <div className="text-sm text-rose-300 font-medium">{catalogError}</div> : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Catalog</h3>
        {catalog && catalog.indicators.length > 0 ? (
          <div className="max-h-48 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-900/95 text-zinc-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 font-medium">ID</th>
                  <th className="px-3 py-2 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300 divide-y divide-zinc-800/80">
                {catalog.indicators.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-800/30">
                    <td className="px-3 py-2 font-mono text-emerald-300/90">{row.id}</td>
                    <td className="px-3 py-2 text-zinc-400">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No catalog entries yet.</p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
        <h3 className="text-sm font-medium text-white">Compute &amp; chart</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Symbol</span>
            <input
              list={indicatorListId}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.trim().toUpperCase())}
              onBlur={(e) => {
                const p = parseSymbol(e.target.value);
                if (p) setSymbol(p);
              }}
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-600"
            />
            <datalist id={indicatorListId}>
              {EXTRA_SYMBOLS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Interval</span>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as KlineInterval)}
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-600"
            >
              {KLINE_INTERVAL_OPTIONS.map((iv) => (
                <option key={iv} value={iv}>
                  {iv}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Bars (50–1000)</span>
            <input
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-emerald-600"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={useRange}
            onChange={(e) => setUseRange(e.target.checked)}
            className="rounded border-zinc-600"
          />
          Use start / end time (Binance{" "}
          <code className="text-zinc-500">startTime</code> / <code className="text-zinc-500">endTime</code>)
        </label>
        {useRange ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">Start (local)</span>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-600"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">End (local)</span>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-600"
              />
            </label>
          </div>
        ) : null}

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">Indicator</span>
          <select
            value={indicatorId}
            onChange={(e) => setIndicatorId(e.target.value)}
            disabled={!catalog?.indicators.length}
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-600 disabled:opacity-50"
          >
            {!catalog?.indicators.length ? (
              <option value="">Load catalog to choose an indicator</option>
            ) : null}
            {(catalog?.indicators ?? []).map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.id} — {ind.description.slice(0, 72)}
                {ind.description.length > 72 ? "…" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Params (JSON object)</span>
            {selectedIndicatorMeta ? (
              <button
                type="button"
                onClick={() => setParamsStr(formatDefaultIndicatorParamsJson(selectedIndicatorMeta))}
                className="text-[10px] text-emerald-400/90 hover:text-emerald-300"
              >
                Reset to defaults
              </button>
            ) : null}
          </div>
          <p className="text-[10px] text-zinc-500">
            Prefilled from the catalog (excluding candle inputs). When the indicator supports{" "}
            <code className="text-zinc-400">sequential</code>, it is set to true so charts align with the full bar
            window; set it to false for a single latest value.
          </p>
          <textarea
            value={paramsStr}
            onChange={(e) => setParamsStr(e.target.value)}
            rows={6}
            spellCheck={false}
            className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-600"
          />
        </div>

        <button
          type="button"
          disabled={runBusy}
          onClick={() => void runCompute()}
          className="rounded-lg border border-emerald-700/60 bg-emerald-950/35 px-4 py-2 text-sm text-white hover:bg-emerald-900/40 disabled:opacity-50"
        >
          {runBusy ? "Computing…" : "Compute & plot"}
        </button>

        {runError ? <div className="text-sm text-rose-300 font-medium">{runError}</div> : null}

        {computeResult && !runError ? (
          <p className="text-xs text-zinc-500">
            <span className="text-zinc-300">{computeResult.indicatorId}</span> · {computeResult.candleCount} bars ·{" "}
            <span className="font-mono text-zinc-400">{computeResult.symbol}</span> {computeResult.interval}
          </p>
        ) : null}
      </section>

      {computeResult && Object.keys(seriesMap).length === 0 ? (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          This result is not a series (scalar or unsupported shape). Raw JSON is below.
          <pre className="mt-2 overflow-auto text-xs text-zinc-300">
            {JSON.stringify(computeResult.result, null, 2)}
          </pre>
        </div>
      ) : null}

      {isShortOrScalar && computeResult ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          Result is a scalar or too short to plot as a series over {computeResult.candleCount} bars.{" "}
          <span className="font-mono text-white">{JSON.stringify(computeResult.result)}</span>
        </div>
      ) : null}

      {chartData.rows.length > 1 && !isShortOrScalar ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-zinc-200">Price</h3>
              <p className="text-[10px] text-zinc-500">
                <span className="text-emerald-300">●</span> close · overlays share scale when near price
              </p>
            </div>
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.rows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
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
                    stroke={CHART_AXIS_STROKE}
                    tick={{ fill: CHART_TICK_FILL, fontSize: 10 }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    stroke={CHART_AXIS_STROKE}
                    tick={{ fill: CHART_TICK_FILL, fontSize: 10 }}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: TOOLTIP_BG,
                      border: `1px solid ${TOOLTIP_BORDER}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={(v) => new Date(v as number).toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={CLOSE_STROKE}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                  {overlayKeys.map((key, idx) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={strokeForSeries(idx)}
                      dot={false}
                      strokeWidth={1.75}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {separateKeys.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium text-zinc-200">Indicator (separate scale)</h3>
                <p className="text-[10px] text-zinc-500">Oscillators and series far from spot price</p>
              </div>
              <div className="h-[240px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.rows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
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
                      stroke={CHART_AXIS_STROKE}
                      tick={{ fill: CHART_TICK_FILL, fontSize: 10 }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      stroke={CHART_AXIS_STROKE}
                      tick={{ fill: CHART_TICK_FILL, fontSize: 10 }}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: TOOLTIP_BG,
                        border: `1px solid ${TOOLTIP_BORDER}`,
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelFormatter={(v) => new Date(v as number).toLocaleString()}
                    />
                    {separateKeys.map((key, idx) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={strokeForSeries(idx + overlayKeys.length)}
                        dot={false}
                        strokeWidth={1.75}
                        connectNulls
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {computeResult ? (
        <details className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
          <summary className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-200">Raw API response</summary>
          <pre
            className="mt-3 overflow-auto text-xs text-zinc-400 whitespace-pre-wrap break-words"
            style={{ maxHeight: 320 }}
          >
            {JSON.stringify(computeResult, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
