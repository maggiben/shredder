"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { LoginForms } from "./login-forms";
import { SimulationPanel } from "./simulation-panel";
import { TradesChartsPanel } from "./trades-charts-panel";
import {
  aiSuggest,
  ApiError,
  createOrder,
  getHealth,
  getPortfolio,
  listOrders,
  listStrategies,
  listTrades,
  login,
  register,
} from "../lib/api";
import type { OrderRow, PortfolioSnapshot, StrategyRow, TradeRow } from "../lib/api-types";
import {
  clearSession,
  getStoredToken,
  getStoredUserEmail,
  setStoredToken,
  setStoredUserEmail,
} from "../lib/auth-storage";
import { getApiBaseUrl } from "../lib/config";

function formatError(e: unknown): string {
  if (e instanceof ApiError) {
    return e.message;
  }
  if (e instanceof Error) {
    return e.message;
  }
  return "Something went wrong";
}

type CreateOrderValues = {
  symbol: string;
  quantity: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  limitPrice: string;
};

type AiSuggestValues = {
  message: string;
};

export function DashboardApp() {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [trades, setTrades] = useState<TradeRow[] | null>(null);
  const [strategies, setStrategies] = useState<StrategyRow[] | null>(null);

  const [aiReply, setAiReply] = useState<string | null>(null);

  const [dataBusy, setDataBusy] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "charts" | "simulations">("overview");

  const orderForm = useForm<CreateOrderValues>({
    defaultValues: {
      symbol: "BTCUSDT",
      quantity: "0.01",
      side: "BUY",
      type: "MARKET",
      limitPrice: "",
    },
  });

  const aiForm = useForm<AiSuggestValues>({
    defaultValues: {
      message: "",
    },
  });

  const watchOrderType = orderForm.watch("type");
  const apiBase = useMemo(() => getApiBaseUrl(), []);

  useEffect(() => {
    setToken(getStoredToken());
    setUserEmail(getStoredUserEmail());
    setHydrated(true);
  }, []);

  const pingHealth = useCallback(async () => {
    try {
      const h = await getHealth();
      setHealthOk(h.status === "ok");
    } catch {
      setHealthOk(false);
    }
  }, []);

  useEffect(() => {
    void pingHealth();
    const id = setInterval(() => void pingHealth(), 15000);
    return () => clearInterval(id);
  }, [pingHealth]);

  const loadData = useCallback(async (t: string) => {
    setDataBusy(true);
    setBanner(null);
    try {
      const [p, o, tr, st] = await Promise.all([
        getPortfolio(t),
        listOrders(t),
        listTrades(t),
        listStrategies(t),
      ]);
      setPortfolio(p);
      setOrders(o);
      setTrades(tr);
      setStrategies(st);
    } catch (e) {
      const msg = formatError(e);
      if (e instanceof ApiError && e.status === 401) {
        clearSession();
        setToken(null);
        setUserEmail(null);
        setPortfolio(null);
        setOrders(null);
        setTrades(null);
        setStrategies(null);
        setBanner("Session expired; please sign in again.");
      } else {
        setBanner(msg);
      }
    } finally {
      setDataBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !token) {
      return;
    }
    void loadData(token);
  }, [hydrated, token, loadData]);

  const loginUser = useCallback(async (email: string, password: string) => {
    setBanner(null);
    const { access_token } = await login(email, password);
    setStoredToken(access_token);
    setStoredUserEmail(email);
    setToken(access_token);
    setUserEmail(email);
  }, []);

  const registerUser = useCallback(async (email: string, password: string) => {
    setBanner(null);
    const { access_token } = await register(email, password);
    setStoredToken(access_token);
    setStoredUserEmail(email);
    setToken(access_token);
    setUserEmail(email);
  }, []);

  function handleLogout() {
    clearSession();
    setToken(null);
    setUserEmail(null);
    setPortfolio(null);
    setOrders(null);
    setTrades(null);
    setStrategies(null);
    setAiReply(null);
    setBanner(null);
  }

  const handleCreateOrder = orderForm.handleSubmit(async (values) => {
    orderForm.clearErrors("root");
    if (!token) return;

    const qty = Number(values.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      orderForm.setError("quantity", { message: "Order quantity must be a positive number." });
      return;
    }

    const limitPrice =
      values.type === "LIMIT" && values.limitPrice.trim() !== "" ? Number(values.limitPrice) : undefined;
    if (values.type === "LIMIT" && (limitPrice === undefined || !Number.isFinite(limitPrice))) {
      orderForm.setError("limitPrice", { message: "LIMIT orders need a numeric limit price." });
      return;
    }

    setBanner(null);
    try {
      await createOrder(token, {
        symbol: values.symbol.trim().toUpperCase(),
        side: values.side,
        type: values.type,
        quantity: qty,
        ...(limitPrice !== undefined ? { limitPrice } : {}),
      });
      await loadData(token);
      orderForm.setValue("limitPrice", "");
    } catch (err) {
      const msg = formatError(err);
      orderForm.setError("root", { message: msg });
      setBanner(msg);
    }
  });

  const handleAiSuggest = aiForm.handleSubmit(async (values) => {
    aiForm.clearErrors("root");
    if (!token) return;

    const message = values.message.trim();
    if (!message) return;

    setBanner(null);
    try {
      const { reply } = await aiSuggest(token, message);
      setAiReply(reply);
    } catch (err) {
      const msg = formatError(err);
      aiForm.setError("root", { message: msg });
      setBanner(msg);
      setAiReply(null);
    }
  });

  // Memoized above for stable header display.

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-400 text-sm">
        Loading session…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-widest text-emerald-400">Shredder</p>
          <h1 className="text-3xl font-semibold text-white">Control tower</h1>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs text-zinc-500 md:items-end">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                healthOk === true ? "bg-emerald-500" : healthOk === false ? "bg-red-500" : "bg-zinc-600"
              }`}
              title="API health"
            />
            <span className="font-mono text-zinc-400">{apiBase}</span>
          </div>
          {token && userEmail ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-zinc-300">{userEmail}</span>
              <button
                type="button"
                onClick={() => void loadData(token)}
                disabled={dataBusy}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                {dataBusy ? "Refreshing…" : "Refresh data"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-400 hover:bg-zinc-800"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {banner ? (
        <div className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          {banner}
        </div>
      ) : null}

      {!token ? (
        <LoginForms loginUser={loginUser} registerUser={registerUser} />
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <nav
            aria-label="Dashboard sections"
            className="flex shrink-0 gap-2 border-b border-zinc-800 pb-4 lg:w-52 lg:flex-col lg:border-b-0 lg:border-r lg:border-zinc-800 lg:pb-0 lg:pr-6"
          >
            <button
              type="button"
              onClick={() => setActiveSection("overview")}
              className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                activeSection === "overview"
                  ? "border border-emerald-700/60 bg-emerald-950/35 text-white"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("charts")}
              className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                activeSection === "charts"
                  ? "border border-emerald-700/60 bg-emerald-950/35 text-white"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              Trades &amp; charts
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("simulations")}
              className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                activeSection === "simulations"
                  ? "border border-emerald-700/60 bg-emerald-950/35 text-white"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              Simulations
            </button>
          </nav>

          <div className="min-w-0 flex-1 space-y-8">
            {activeSection === "charts" ? (
              <TradesChartsPanel
                token={token}
                trades={trades}
                orders={orders}
                portfolio={portfolio}
              />
            ) : null}

            {activeSection === "simulations" ? <SimulationPanel token={token} /> : null}

            {activeSection === "overview" ? (
              <>
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-lg font-medium text-white">Portfolio</h2>
            {portfolio ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Trades (all time)</p>
                    <p className="text-xl font-mono text-white">{portfolio.tradeCount}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Realized cash flow (approx.)</p>
                    <p className="text-xl font-mono text-white">
                      {portfolio.realizedCashFlowApprox.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Fees paid (quote)</p>
                    <p className="text-xl font-mono text-white">{portfolio.feesPaidQuote.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Open positions</p>
                    <p className="text-xl font-mono text-white">{portfolio.positions.length}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Positions</p>
                  {portfolio.positions.length === 0 ? (
                    <p className="text-sm text-zinc-500">No open positions.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-zinc-800">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-950/80 text-zinc-400">
                          <tr>
                            <th className="px-3 py-2 font-medium">Symbol</th>
                            <th className="px-3 py-2 font-medium">Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolio.positions.map((p) => (
                            <tr key={p.symbol} className="border-t border-zinc-800">
                              <td className="px-3 py-2 font-mono text-white">{p.symbol}</td>
                              <td className="px-3 py-2 font-mono text-zinc-300">{p.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Recent trades</p>
                  {portfolio.recentTrades.length === 0 ? (
                    <p className="text-sm text-zinc-500">No trades yet.</p>
                  ) : (
                    <div className="max-h-48 overflow-auto rounded-lg border border-zinc-800">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-zinc-950/95 text-zinc-400">
                          <tr>
                            <th className="px-3 py-2 font-medium">Time</th>
                            <th className="px-3 py-2 font-medium">Symbol</th>
                            <th className="px-3 py-2 font-medium">Side</th>
                            <th className="px-3 py-2 font-medium">Qty</th>
                            <th className="px-3 py-2 font-medium">Price</th>
                            <th className="px-3 py-2 font-medium">Fee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolio.recentTrades.map((t) => (
                            <tr key={t.id} className="border-t border-zinc-800">
                              <td className="px-3 py-2 text-zinc-500 whitespace-nowrap">
                                {new Date(t.executedAt).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 font-mono text-white">{t.symbol}</td>
                              <td className="px-3 py-2">{t.side}</td>
                              <td className="px-3 py-2 font-mono">{t.quantity}</td>
                              <td className="px-3 py-2 font-mono">{t.price}</td>
                              <td className="px-3 py-2 font-mono text-zinc-400">{t.fee ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">{dataBusy ? "Loading…" : "No data."}</p>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="text-lg font-medium text-white">Orders</h2>
              <form
                onSubmit={(e) => void handleCreateOrder(e)}
                className="mt-4 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
              >
                <p className="text-xs text-zinc-500">Submit routes through the API queue (demo settlement).</p>
                {orderForm.formState.errors.root?.message ? (
                  <div className="text-sm font-semibold text-rose-200">
                    {orderForm.formState.errors.root.message}
                  </div>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs text-zinc-500">Symbol</span>
                    <input
                      {...orderForm.register("symbol", { required: "Symbol is required." })}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-mono text-white"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-zinc-500">Quantity</span>
                    <input
                      {...orderForm.register("quantity", { required: "Quantity is required." })}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-mono text-white"
                    />
                    {orderForm.formState.errors.quantity?.message ? (
                      <span className="text-xs font-semibold text-rose-200">
                        {orderForm.formState.errors.quantity.message}
                      </span>
                    ) : null}
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-zinc-500">Side</span>
                    <select
                      {...orderForm.register("side", { required: true })}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-zinc-500">Type</span>
                    <select
                      {...orderForm.register("type", { required: true })}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                    >
                      <option value="MARKET">MARKET</option>
                      <option value="LIMIT">LIMIT</option>
                    </select>
                  </label>
                </div>
                {watchOrderType === "LIMIT" ? (
                  <label className="block space-y-1">
                    <span className="text-xs text-zinc-500">Limit price</span>
                    <input
                      {...orderForm.register("limitPrice")}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-mono text-white"
                    />
                    {orderForm.formState.errors.limitPrice?.message ? (
                      <span className="text-xs font-semibold text-rose-200">
                        {orderForm.formState.errors.limitPrice.message}
                      </span>
                    ) : null}
                  </label>
                ) : null}
                <button
                  type="submit"
                  disabled={orderForm.formState.isSubmitting}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {orderForm.formState.isSubmitting ? "Submitting…" : "Place order"}
                </button>
              </form>
              <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-zinc-800">
                {orders && orders.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-950/95 text-zinc-400">
                      <tr>
                        <th className="px-3 py-2">Created</th>
                        <th className="px-3 py-2">Symbol</th>
                        <th className="px-3 py-2">Side</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-t border-zinc-800">
                          <td className="px-3 py-2 text-zinc-500 whitespace-nowrap text-xs">
                            {new Date(o.createdAt).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 font-mono">{o.symbol}</td>
                          <td className="px-3 py-2">{o.side}</td>
                          <td className="px-3 py-2">{o.type}</td>
                          <td className="px-3 py-2 font-mono text-xs">{o.quantity}</td>
                          <td className="px-3 py-2 text-xs">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-zinc-500">{dataBusy ? "Loading…" : "No orders yet."}</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h2 className="text-lg font-medium text-white">Trades</h2>
              <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-zinc-800">
                {trades && trades.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-950/95 text-zinc-400">
                      <tr>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Symbol</th>
                        <th className="px-3 py-2">Side</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t) => (
                        <tr key={t.id} className="border-t border-zinc-800">
                          <td className="px-3 py-2 text-zinc-500 whitespace-nowrap text-xs">
                            {new Date(t.executedAt).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 font-mono">{t.symbol}</td>
                          <td className="px-3 py-2">{t.side}</td>
                          <td className="px-3 py-2 font-mono text-xs">{t.quantity}</td>
                          <td className="px-3 py-2 font-mono text-xs">{t.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-zinc-500">{dataBusy ? "Loading…" : "No trades yet."}</p>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-lg font-medium text-white">Registered strategies</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Deterministic strategies from the worker registry; IDs align with backtest and tools.
            </p>
            <ul className="mt-4 space-y-2">
              {strategies && strategies.length > 0 ? (
                strategies.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-mono text-emerald-400">{s.id}</span>
                    <span className="text-xs text-zinc-500">{s.toolSurface}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-zinc-500">{dataBusy ? "Loading…" : "No strategies returned."}</li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-lg font-medium text-white">AI suggestions</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Read-only commentary from <code className="text-emerald-400/90">POST /ai/suggest</code>. No trade
              authority; configure <code className="text-zinc-500">OPENAI_API_KEY</code> on the API for LLM
              responses.
            </p>
            <form onSubmit={(e) => void handleAiSuggest(e)} className="mt-4 space-y-3">
              {aiForm.formState.errors.root?.message ? (
                <div className="text-sm font-semibold text-rose-200">{aiForm.formState.errors.root.message}</div>
              ) : null}
              <textarea
                {...aiForm.register("message")}
                rows={4}
                placeholder="Ask for a narrative about regimes, strategy fit, or workflow hints…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={aiForm.formState.isSubmitting || !aiForm.watch("message").trim()}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
              >
                {aiForm.formState.isSubmitting ? "Thinking…" : "Get suggestion"}
              </button>
            </form>
            {aiReply ? (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200 whitespace-pre-wrap">
                {aiReply}
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
            <h2 className="text-sm font-medium text-zinc-300">Risk</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Max notional, drawdown halts, and execution gates live in{" "}
              <code className="text-zinc-400">@shredder/risk</code> and the worker — not in this UI.
            </p>
          </section>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
