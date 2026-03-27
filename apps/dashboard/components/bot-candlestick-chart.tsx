"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Layer,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  useXAxisScale,
  useYAxisScale,
} from "recharts";
import {
  KLINE_INTERVAL_OPTIONS,
  getKlines,
  type KlineInterval,
} from "../lib/api";

export type BotCandleRow = {
  idx: number;
  t: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type BotPaperTradeMarker = {
  id: string;
  kind: "entry" | "exit";
  idx: number;
  price: number;
};

function isKlineInterval(s: string): s is KlineInterval {
  return (KLINE_INTERVAL_OPTIONS as readonly string[]).includes(s);
}

function parseCandleRows(raw: unknown): BotCandleRow[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: BotCandleRow[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const row = raw[i];
    if (row === null || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    const ts = typeof o.timestamp === "number" ? o.timestamp : Number(o.timestamp);
    const open = typeof o.open === "number" ? o.open : Number(o.open);
    const high = typeof o.high === "number" ? o.high : Number(o.high);
    const low = typeof o.low === "number" ? o.low : Number(o.low);
    const close = typeof o.close === "number" ? o.close : Number(o.close);
    const volume =
      o.volume === undefined
        ? 0
        : typeof o.volume === "number"
          ? o.volume
          : Number(o.volume);
    if (
      !Number.isFinite(ts) ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close)
    ) {
      return null;
    }
    out.push({ idx: out.length, t: ts, open, high, low, close, volume });
  }
  return out;
}

function parsePaperTrades(raw: unknown): { kind: "entry" | "exit"; timestamp: number; price: number }[] {
  if (!Array.isArray(raw)) return [];
  const out: { kind: "entry" | "exit"; timestamp: number; price: number }[] = [];
  for (const row of raw) {
    if (row === null || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const kind = o.kind === "exit" ? "exit" : o.kind === "entry" ? "entry" : null;
    const ts = typeof o.timestamp === "number" ? o.timestamp : Number(o.timestamp);
    const price = typeof o.price === "number" ? o.price : Number(o.price);
    if (kind === null || !Number.isFinite(ts) || !Number.isFinite(price)) continue;
    out.push({ kind, timestamp: ts, price });
  }
  return out;
}

function markersForRows(
  rows: BotCandleRow[],
  trades: { kind: "entry" | "exit"; timestamp: number; price: number }[],
): BotPaperTradeMarker[] {
  if (rows.length === 0 || trades.length === 0) return [];
  const step =
    rows.length >= 2 ? Math.max(1, Math.abs(rows[1]!.t - rows[0]!.t) * 1.5) : 60_000;
  const markers: BotPaperTradeMarker[] = [];
  for (let i = 0; i < trades.length; i += 1) {
    const tr = trades[i]!;
    let bestIdx = 0;
    let bestDelta = Infinity;
    for (let j = 0; j < rows.length; j += 1) {
      const d = Math.abs(rows[j]!.t - tr.timestamp);
      if (d < bestDelta) {
        bestDelta = d;
        bestIdx = j;
      }
    }
    if (bestDelta > step) continue;
    markers.push({
      id: `${tr.kind}-${tr.timestamp}-${i}`,
      kind: tr.kind,
      idx: bestIdx,
      price: tr.price,
    });
  }
  return markers;
}

function CandlestickGlyphs({ data }: { data: BotCandleRow[] }) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  if (!xScale || !yScale || data.length === 0) return null;

  const start0 = xScale(0, { position: "start" });
  const end0 = xScale(0, { position: "end" });
  const band =
    start0 !== undefined && end0 !== undefined ? Math.abs(end0 - start0) : 8;
  const bodyW = Math.max(2, band * 0.72);

  return (
    <Layer className="recharts-candlestick-glyphs">
      {data.map((d) => {
        const cx = xScale(d.idx, { position: "middle" });
        if (cx === undefined) return null;
        const yHigh = yScale(d.high);
        const yLow = yScale(d.low);
        const yOpen = yScale(d.open);
        const yClose = yScale(d.close);
        if (yHigh === undefined || yLow === undefined || yOpen === undefined || yClose === undefined) {
          return null;
        }
        const bull = d.close >= d.open;
        const stroke = bull ? "#4ade80" : "#f87171";
        const fill = bull ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.4)";
        const bodyTop = Math.min(yOpen, yClose);
        const bodyBottom = Math.max(yOpen, yClose);
        const bodyH = Math.max(1, bodyBottom - bodyTop);
        const xLeft = cx - bodyW / 2;
        return (
          <g key={d.idx}>
            <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={stroke} strokeWidth={1} />
            <rect
              x={xLeft}
              y={bodyTop}
              width={bodyW}
              height={bodyH}
              fill={fill}
              stroke={stroke}
              strokeWidth={1}
            />
          </g>
        );
      })}
    </Layer>
  );
}

function CandleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: BotCandleRow }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 shadow-lg">
      <p className="font-medium text-zinc-300">
        {new Date(row.t).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <p className="mt-1 font-mono text-[11px] text-zinc-400">
        O {row.open.toFixed(6)} H {row.high.toFixed(6)}
        <br />
        L {row.low.toFixed(6)} C {row.close.toFixed(6)}
      </p>
    </div>
  );
}

export function BotCandlestickChart(props: {
  token: string;
  symbol: string;
  candleInterval: string;
  candleLimit: number;
  lastOutput: Record<string, unknown> | null;
}) {
  const { token, symbol, candleInterval, candleLimit, lastOutput } = props;
  const [fallbackRows, setFallbackRows] = useState<BotCandleRow[] | null>(null);
  const [fallbackErr, setFallbackErr] = useState<string | null>(null);

  const fromWebhook = useMemo(() => {
    if (!lastOutput) return null;
    return parseCandleRows(lastOutput["candles"]);
  }, [lastOutput]);

  const intervalError =
    fromWebhook === null && !isKlineInterval(candleInterval)
      ? `Interval ${candleInterval} is not supported for API klines fallback.`
      : null;

  const klinesFallbackOk = fromWebhook === null && intervalError === null;

  const paperTrades = useMemo(() => {
    if (!lastOutput) return [];
    return parsePaperTrades(lastOutput["paperTrades"]);
  }, [lastOutput]);

  const rows = fromWebhook ?? (klinesFallbackOk ? fallbackRows : null);
  const markers = useMemo(() => (rows ? markersForRows(rows, paperTrades) : []), [rows, paperTrades]);

  const yDomain = useMemo(() => {
    if (!rows || rows.length === 0) return [0, 1] as [number, number];
    const hi = Math.max(...rows.map((r) => r.high));
    const lo = Math.min(...rows.map((r) => r.low));
    const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.001 || 0.01;
    return [lo - pad, hi + pad] as [number, number];
  }, [rows]);

  useEffect(() => {
    if (!klinesFallbackOk) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const interval = candleInterval as KlineInterval;
      try {
        const res = await getKlines(token, {
          symbol: symbol.trim().toUpperCase(),
          interval,
          limit: Math.min(500, Math.max(20, candleLimit)),
        });
        if (cancelled) return;
        const parsed = parseCandleRows(
          res.candles.map((c) => ({
            timestamp: c.openTime,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          })),
        );
        setFallbackRows(parsed);
        setFallbackErr(null);
      } catch (e) {
        if (cancelled) return;
        setFallbackErr(e instanceof Error ? e.message : "Could not load klines");
        setFallbackRows(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, symbol, candleInterval, candleLimit, klinesFallbackOk]);

  if (!rows || rows.length === 0) {
    const idleMsg =
      fromWebhook === null && klinesFallbackOk ? "Loading klines…" : "Waiting for market window…";
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-500">
        {intervalError ?? fallbackErr ?? idleMsg}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-zinc-300">Live market window</p>
        <p className="text-[10px] text-zinc-500">
          <span className="text-emerald-400">△</span> entry{" "}
          <span className="text-rose-400">▽</span> exit · paper signals from worker
        </p>
      </div>
      <p className="mt-0.5 text-[10px] text-zinc-600">
        {fromWebhook ? "Bars from last tick webhook" : "Bars from API klines (webhook had no candles)"}
      </p>
      <div className="mt-2 h-[340px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 6, right: 8, left: 0, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              type="category"
              dataKey="idx"
              tickFormatter={(i) => {
                const idx = Number(i);
                const t = rows[idx]?.t;
                if (t === undefined) return "";
                return new Date(t).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }}
              interval="preserveStartEnd"
              stroke="#71717a"
              tick={{ fill: "#a1a1aa", fontSize: 9 }}
            />
            <YAxis
              domain={yDomain}
              stroke="#71717a"
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              width={56}
            />
            <Tooltip content={<CandleTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#52525b" }} />
            <Bar
              dataKey="high"
              fill="transparent"
              stroke="transparent"
              isAnimationActive={false}
              maxBarSize={32}
            />
            <CandlestickGlyphs data={rows} />
            {markers.map((m) => (
              <ReferenceDot
                key={m.id}
                x={m.idx}
                y={m.price}
                r={6}
                fill="transparent"
                stroke="transparent"
                shape={(dotProps) => {
                  const cx = dotProps.cx;
                  const cy = dotProps.cy;
                  if (cx == null || cy == null) {
                    return <g />;
                  }
                  if (m.kind === "entry") {
                    return (
                      <polygon
                        points={`${cx},${cy - 7} ${cx - 6},${cy + 4} ${cx + 6},${cy + 4}`}
                        fill="#22c55e"
                        stroke="#fafafa"
                        strokeWidth={1}
                      />
                    );
                  }
                  return (
                    <polygon
                      points={`${cx},${cy + 7} ${cx - 6},${cy - 4} ${cx + 6},${cy - 4}`}
                      fill="#ef4444"
                      stroke="#fafafa"
                      strokeWidth={1}
                    />
                  );
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
