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
  type TradingBotPaperTrade,
  type TradingBotWorkerCandle,
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
  kind: "buy" | "sell";
  idx: number;
  price: number;
};

function isKlineInterval(s: string): s is KlineInterval {
  return (KLINE_INTERVAL_OPTIONS as readonly string[]).includes(s);
}

/** Matches worker `candleStepMs` so refresh cadence tracks the bot interval. */
function candleStepMs(interval: string): number {
  const trimmed = interval.trim().toLowerCase();
  const m = /^(\d+)(m|h|d)$/.exec(trimmed);
  if (!m) {
    return 60 * 60 * 1000;
  }
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) {
    return 60 * 60 * 1000;
  }
  const unit = m[2];
  if (unit === "m") {
    return n * 60 * 1000;
  }
  if (unit === "h") {
    return n * 60 * 60 * 1000;
  }
  return n * 24 * 60 * 60 * 1000;
}

function parseCandleRows(raw: TradingBotWorkerCandle[] | null | undefined): BotCandleRow[] | null {
  if (!raw || raw.length === 0) return null;
  const out: BotCandleRow[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const row = raw[i]!;
    if (
      !Number.isFinite(row.timestamp) ||
      !Number.isFinite(row.open) ||
      !Number.isFinite(row.high) ||
      !Number.isFinite(row.low) ||
      !Number.isFinite(row.close) ||
      !Number.isFinite(row.volume)
    ) {
      return null;
    }
    out.push({
      idx: out.length,
      t: row.timestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    });
  }
  return out;
}

function parsePaperTrades(raw: TradingBotPaperTrade[] | null | undefined): TradingBotPaperTrade[] {
  if (!raw || raw.length === 0) return [];
  return raw.filter(
    (row) =>
      (row.kind === "buy" || row.kind === "sell") &&
      Number.isFinite(row.timestamp) &&
      Number.isFinite(row.price),
  );
}

function markersForRows(
  rows: BotCandleRow[],
  trades: TradingBotPaperTrade[],
): BotPaperTradeMarker[] {
  if (rows.length === 0 || trades.length === 0) return [];
  const barMs = rows.length >= 2 ? Math.abs(rows[1]!.t - rows[0]!.t) : 60_000;
  const windowStart = rows[0]!.t;
  const windowEnd = rows[rows.length - 1]!.t;
  /** Keep markers bound to the rendered live window and avoid long-distance snapping. */
  const maxDelta = Math.max(Math.floor(barMs * 1.5), 60_000);
  const markers: BotPaperTradeMarker[] = [];
  for (let i = 0; i < trades.length; i += 1) {
    const tr = trades[i]!;
    if (tr.timestamp < windowStart - maxDelta || tr.timestamp > windowEnd + maxDelta) {
      continue;
    }
    let bestIdx = 0;
    let bestDelta = Infinity;
    for (let j = 0; j < rows.length; j += 1) {
      const d = Math.abs(rows[j]!.t - tr.timestamp);
      if (d < bestDelta) {
        bestDelta = d;
        bestIdx = j;
      }
    }
    if (bestDelta > maxDelta) continue;
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
  marketTrail: TradingBotWorkerCandle[];
  paperTrail: TradingBotPaperTrade[];
  /** When set, klines fallback refetches on new ticks and on a cadence derived from `candleInterval`. */
  lastTickAt: string | null;
}) {
  const { token, symbol, candleInterval, candleLimit, marketTrail, paperTrail, lastTickAt } = props;
  const [fallbackRows, setFallbackRows] = useState<BotCandleRow[] | null>(null);
  const [fallbackErr, setFallbackErr] = useState<string | null>(null);

  const fromApiTrail = useMemo(() => parseCandleRows(marketTrail), [marketTrail]);

  const intervalError =
    fromApiTrail === null && !isKlineInterval(candleInterval)
      ? `Interval ${candleInterval} is not supported for API klines fallback.`
      : null;

  const klinesFallbackOk = fromApiTrail === null && intervalError === null;

  const paperTrades = useMemo(() => parsePaperTrades(paperTrail), [paperTrail]);

  const rows = fromApiTrail ?? (klinesFallbackOk ? fallbackRows : null);
  const markers = useMemo(() => (rows ? markersForRows(rows, paperTrades) : []), [rows, paperTrades]);

  const yDomain = useMemo(() => {
    if (!rows || rows.length === 0) return [0, 1] as [number, number];
    let hi = Math.max(...rows.map((r) => r.high));
    let lo = Math.min(...rows.map((r) => r.low));
    /** Include worker paper prices so Y scale matches when klines differ slightly from webhook/feed data. */
    for (const t of paperTrades) {
      if (Number.isFinite(t.price)) {
        hi = Math.max(hi, t.price);
        lo = Math.min(lo, t.price);
      }
    }
    const pad = (hi - lo) * 0.06 || Math.abs(hi) * 0.001 || 0.01;
    return [lo - pad, hi + pad] as [number, number];
  }, [rows, paperTrades]);

  useEffect(() => {
    if (!klinesFallbackOk) {
      return;
    }
    let cancelled = false;
    const pull = async () => {
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
    };
    void pull();
    const step = candleStepMs(candleInterval);
    const refreshMs = Math.min(180_000, Math.max(5_000, Math.floor(step / 2)));
    const timer = window.setInterval(() => void pull(), refreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [token, symbol, candleInterval, candleLimit, klinesFallbackOk, lastTickAt]);

  if (!rows || rows.length === 0) {
    const idleMsg =
      fromApiTrail === null && klinesFallbackOk ? "Loading klines…" : "Waiting for market window…";
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
          <span className="text-emerald-400">△</span> buy{" "}
          <span className="text-rose-400">▽</span> sell · paper signals from worker
        </p>
      </div>
      <p className="mt-0.5 text-[10px] text-zinc-600">
        {fromApiTrail ? "Bars from persisted bot market trail" : "Bars from API klines (trail not available yet)"}
      </p>
      <div className="mt-2 h-[340px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 6, right: 8, left: 0, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              type="category"
              dataKey="idx"
              tickFormatter={(i: number | string) => {
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
                ifOverflow="visible"
                fill="transparent"
                stroke="transparent"
                shape={(dotProps: { cx?: number; cy?: number }) => {
                  const cx = dotProps.cx;
                  const cy = dotProps.cy;
                  if (cx == null || cy == null) {
                    return <g />;
                  }
                  if (m.kind === "buy") {
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
