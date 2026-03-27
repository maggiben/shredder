"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  createTradingBot,
  deleteTradingBot,
  ApiError,
  KLINE_INTERVAL_OPTIONS,
  listTradingBots,
  startTradingBot,
  stopTradingBot,
  type TradingBotRow,
} from "../../../lib/api";
import { BotCandlestickChart } from "../../../components/bot-candlestick-chart";
import { accessTokenAtom, bannerAtom } from "../../../state/dashboard-atoms";

function formatError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

const MARKET_OPTIONS = ["demo", "coingecko", "binance"] as const;
const EXCHANGE_OPTIONS = ["binance", "none"] as const;

const DEFAULT_CREATE: {
  name: string;
  symbol: string;
  tickMs: number;
  candleInterval: string;
  candleLimit: number;
  marketDataProvider: (typeof MARKET_OPTIONS)[number];
  exchangeId: (typeof EXCHANGE_OPTIONS)[number];
  paperTrading: boolean;
  binanceBaseUrl: string;
  logStrategies: boolean;
  aiAnalyst: boolean;
  estimatedTakerFeeRate: string;
} = {
  name: "Demo bot",
  symbol: "BTCUSDT",
  tickMs: 15_000,
  candleInterval: "15m",
  candleLimit: 50,
  marketDataProvider: "demo",
  exchangeId: "binance",
  paperTrading: true,
  binanceBaseUrl: "",
  logStrategies: false,
  aiAnalyst: false,
  estimatedTakerFeeRate: "0.001",
};

export default function TradingBotsPage() {
  const token = useAtomValue(accessTokenAtom);
  const setBanner = useSetAtom(bannerAtom);
  const [bots, setBots] = useState<TradingBotRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_CREATE);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setBanner(null);
    try {
      const rows = await listTradingBots(token);
      setBots(rows);
    } catch (e) {
      setBanner(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [token, setBanner]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [token, load]);

  const createPayload = useMemo((): Parameters<typeof createTradingBot>[1] => {
    const fee = Number(form.estimatedTakerFeeRate);
    return {
      name: form.name.trim(),
      symbol: form.symbol.trim(),
      tickMs: form.tickMs,
      candleInterval: form.candleInterval,
      candleLimit: form.candleLimit,
      marketDataProvider: form.marketDataProvider,
      exchangeId: form.exchangeId,
      paperTrading: form.paperTrading,
      ...(form.binanceBaseUrl.trim() !== "" ? { binanceBaseUrl: form.binanceBaseUrl.trim() } : {}),
      logStrategies: form.logStrategies,
      aiAnalyst: form.aiAnalyst,
      ...(Number.isFinite(fee) ? { estimatedTakerFeeRate: fee } : {}),
    };
  }, [form]);

  if (!token) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const auth = token;
    if (!auth || !form.name.trim()) return;
    setBusyId("__create__");
    setBanner(null);
    try {
      await createTradingBot(auth, createPayload);
      setCreateOpen(false);
      setForm(DEFAULT_CREATE);
      await load();
    } catch (err) {
      setBanner(formatError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleStart(id: string) {
    const auth = token;
    if (!auth) return;
    setBusyId(id);
    setBanner(null);
    try {
      await startTradingBot(auth, id);
      await load();
    } catch (e) {
      setBanner(formatError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleStop(id: string) {
    const auth = token;
    if (!auth) return;
    setBusyId(id);
    setBanner(null);
    try {
      await stopTradingBot(auth, id);
      await load();
    } catch (e) {
      setBanner(formatError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    const auth = token;
    if (!auth) return;
    if (!window.confirm("Delete this bot? This cannot be undone.")) return;
    setBusyId(id);
    setBanner(null);
    try {
      await deleteTradingBot(auth, id);
      await load();
    } catch (e) {
      setBanner(formatError(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Trading bots</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Spawn tick workers per symbol, data provider, and interval. API supervises processes and ingests
            tick webhooks. Paper mode is default; no agent may place orders from here—risk stays in code.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen((v) => !v)}
            className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-950/60"
          >
            {createOpen ? "Close form" : "Add bot"}
          </button>
        </div>
      </div>

      {createOpen ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h3 className="text-sm font-medium text-zinc-200">New bot</h3>
          <form onSubmit={(e) => void handleCreate(e)} className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="block text-xs text-zinc-500">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Symbol
              <input
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))}
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Tick interval (ms)
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={form.tickMs}
                min={1000}
                onChange={(e) => setForm((f) => ({ ...f, tickMs: Number(e.target.value) }))}
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Candle interval
              <select
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={form.candleInterval}
                onChange={(e) => setForm((f) => ({ ...f, candleInterval: e.target.value }))}
              >
                {KLINE_INTERVAL_OPTIONS.map((iv) => (
                  <option key={iv} value={iv}>
                    {iv}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-zinc-500">
              Candle limit
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={form.candleLimit}
                min={10}
                onChange={(e) => setForm((f) => ({ ...f, candleLimit: Number(e.target.value) }))}
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Market data
              <select
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={form.marketDataProvider}
                onChange={(e) =>
                  setForm((f) => ({ ...f, marketDataProvider: e.target.value as (typeof MARKET_OPTIONS)[number] }))
                }
              >
                {MARKET_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-zinc-500">
              Exchange label (future execution)
              <select
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={form.exchangeId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, exchangeId: e.target.value as (typeof EXCHANGE_OPTIONS)[number] }))
                }
              >
                {EXCHANGE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-zinc-500">
              Binance base URL (optional)
              <input
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                placeholder="https://testnet.binance.vision"
                value={form.binanceBaseUrl}
                onChange={(e) => setForm((f) => ({ ...f, binanceBaseUrl: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-500 md:col-span-2">
              <input
                type="checkbox"
                checked={form.paperTrading}
                onChange={(e) => setForm((f) => ({ ...f, paperTrading: e.target.checked }))}
              />
              Paper trading (default on; worker never auto-places orders today)
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={form.logStrategies}
                onChange={(e) => setForm((f) => ({ ...f, logStrategies: e.target.checked }))}
              />
              Log per-strategy signals
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={form.aiAnalyst}
                onChange={(e) => setForm((f) => ({ ...f, aiAnalyst: e.target.checked }))}
              />
              OpenAI analyst (needs API key on worker env)
            </label>
            <label className="block text-xs text-zinc-500">
              Estimated taker fee rate
              <input
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={form.estimatedTakerFeeRate}
                onChange={(e) => setForm((f) => ({ ...f, estimatedTakerFeeRate: e.target.value }))}
              />
            </label>
            <div className="md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={busyId !== null}
                className="rounded-lg border border-emerald-800 bg-emerald-950/50 px-4 py-2 text-sm font-medium text-emerald-100 disabled:opacity-50"
              >
                Create bot
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="space-y-4">
        {bots.length === 0 && !loading ? (
          <p className="text-sm text-zinc-500">No bots yet. Add one to run a supervised worker.</p>
        ) : null}
        <ul className="space-y-3">
          {bots.map((b) => (
            <li key={b.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{b.name}</span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-mono",
                        b.status === "RUNNING"
                          ? "bg-emerald-950/80 text-emerald-200"
                          : b.status === "ERROR"
                            ? "bg-red-950/60 text-red-200"
                            : b.status === "STARTING"
                              ? "bg-amber-950/60 text-amber-100"
                              : "bg-zinc-800 text-zinc-300",
                      ].join(" ")}
                    >
                      {b.status}
                    </span>
                    {b.config.paperTrading ? (
                      <span className="rounded-full bg-sky-950/50 px-2 py-0.5 text-xs text-sky-200">Paper</span>
                    ) : (
                      <span className="rounded-full bg-rose-950/50 px-2 py-0.5 text-xs text-rose-200">Live intent</span>
                    )}
                    {b.runtime.alive ? (
                      <span className="text-xs text-emerald-400">process attached</span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-xs text-zinc-400">
                    {b.config.symbol} · {b.config.marketDataProvider} · {b.config.candleInterval} · tick{" "}
                    {b.config.tickMs}ms
                  </p>
                  {b.lastError ? (
                    <p className="mt-2 text-xs text-red-300/90">{b.lastError}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === "RUNNING" || b.status === "STARTING" ? (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleStop(b.id)}
                      className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleStart(b.id)}
                      className="rounded-lg border border-emerald-800 bg-emerald-950/35 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-950/50 disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === b.id || b.status === "RUNNING" || b.status === "STARTING"}
                    onClick={() => void handleDelete(b.id)}
                    className="rounded-lg border border-red-900/60 px-3 py-1.5 text-sm text-red-200/90 hover:bg-red-950/30 disabled:opacity-40"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => (e === b.id ? null : b.id))}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    {expanded === b.id ? "Hide detail" : "Detail"}
                  </button>
                </div>
              </div>
              {expanded === b.id ? <BotDetail bot={b} token={token} /> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function BotDetail({ bot, token }: { bot: TradingBotRow; token: string }) {
  const last = bot.lastOutput;
  return (
    <div className="mt-4 space-y-4 border-t border-zinc-800 pt-4 text-xs">
      <BotCandlestickChart
        token={token}
        symbol={bot.config.symbol}
        candleInterval={bot.config.candleInterval}
        candleLimit={bot.config.candleLimit}
        lastOutput={last}
      />
      <div>
        <p className="text-zinc-500">Config</p>
        <pre className="mt-1 overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-3 text-zinc-300">
          {JSON.stringify(bot.config, null, 2)}
        </pre>
      </div>
      {last !== null ? (
        <div>
          <p className="text-zinc-500">Last tick (from webhook)</p>
          <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-3 text-zinc-300">
            {JSON.stringify(last, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="text-zinc-500">No tick received yet (start the bot and wait for the first interval).</p>
      )}
      {bot.runtime.logTail.length > 0 ? (
        <div>
          <p className="text-zinc-500">Recent stdout / stderr</p>
          <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-zinc-800/80 bg-black/40 p-3 font-mono text-[11px] text-zinc-400">
            {bot.runtime.logTail.join("\n")}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
