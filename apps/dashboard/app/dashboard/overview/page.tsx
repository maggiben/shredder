"use client";

import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { aiSuggest, ApiError } from "../../../lib/api";
import {
  accessTokenAtom,
  bannerAtom,
  dataBusyAtom,
  ordersAtom,
  portfolioAtom,
  strategiesAtom,
  tradesAtom,
} from "../../../state/dashboard-atoms";
import { useDashboardActions } from "../../../state/use-dashboard-actions";

function formatError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export default function OverviewPage() {
  const token = useAtomValue(accessTokenAtom);
  const dataBusy = useAtomValue(dataBusyAtom);
  const portfolio = useAtomValue(portfolioAtom);
  const orders = useAtomValue(ordersAtom);
  const trades = useAtomValue(tradesAtom);
  const strategies = useAtomValue(strategiesAtom);
  const setBanner = useSetAtom(bannerAtom);

  const { createOrderAndRefresh } = useDashboardActions();

  // Orders form (mirrors the original DashboardApp).
  const [orderSymbol, setOrderSymbol] = useState("BTCUSDT");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [orderQty, setOrderQty] = useState("0.01");
  const [orderLimit, setOrderLimit] = useState("");
  const [orderBusy, setOrderBusy] = useState(false);

  // AI suggest panel.
  const [aiMessage, setAiMessage] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  if (!token) return null;

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const qty = Number(orderQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setBanner("Order quantity must be a positive number.");
      return;
    }

    const limitPrice =
      orderType === "LIMIT" && orderLimit.trim() !== "" ? Number(orderLimit) : undefined;
    if (orderType === "LIMIT" && (limitPrice === undefined || !Number.isFinite(limitPrice))) {
      setBanner("LIMIT orders need a numeric limit price.");
      return;
    }

    setBanner(null);
    setOrderBusy(true);
    try {
      await createOrderAndRefresh({
        symbol: orderSymbol.trim().toUpperCase(),
        side: orderSide,
        type: orderType,
        quantity: qty,
        ...(limitPrice !== undefined ? { limitPrice } : {}),
      });
      setOrderLimit("");
    } catch (e) {
      setBanner(formatError(e));
    } finally {
      setOrderBusy(false);
    }
  }

  async function handleAiSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !aiMessage.trim()) return;

    setBanner(null);
    setAiBusy(true);
    try {
      const { reply } = await aiSuggest(token, aiMessage.trim());
      setAiReply(reply);
    } catch (err) {
      setAiReply(null);
      setBanner(formatError(err));
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                              <td className="px-3 py-2 text-zinc-500 whitespace-nowrap text-xs">
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
        </div>

        <div className="lg:col-span-1 space-y-6">
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
              Read-only commentary from <code className="text-emerald-400/90">POST /ai/suggest</code>.
              No trade authority; configure <code className="text-zinc-500">OPENAI_API_KEY</code> on the API
              for LLM responses.
            </p>
            <form onSubmit={(e) => void handleAiSuggest(e)} className="mt-4 space-y-3">
              <textarea
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                rows={4}
                placeholder="Ask for a narrative about regimes, strategy fit, or workflow hints…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={aiBusy || !aiMessage.trim()}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
              >
                {aiBusy ? "Thinking…" : "Get suggestion"}
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
              Max notional, drawdown halts, and execution gates live in <code className="text-zinc-400">@shredder/risk</code>{" "}
              and the worker — not in this UI.
            </p>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-lg font-medium text-white">Orders</h2>
          <form
            onSubmit={(e) => void handleCreateOrder(e)}
            className="mt-4 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
          >
            <p className="text-xs text-zinc-500">Submit routes through the API queue (demo settlement).</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">Symbol</span>
                <input
                  value={orderSymbol}
                  onChange={(e) => setOrderSymbol(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-mono text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">Quantity</span>
                <input
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-mono text-white"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">Side</span>
                <select
                  value={orderSide}
                  onChange={(e) => setOrderSide(e.target.value as "BUY" | "SELL")}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-zinc-500">Type</span>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as "MARKET" | "LIMIT")}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                >
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                </select>
              </label>
            </div>
            {orderType === "LIMIT" ? (
              <label className="block space-y-1">
                <span className="text-xs text-zinc-500">Limit price</span>
                <input
                  value={orderLimit}
                  onChange={(e) => setOrderLimit(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-mono text-white"
                />
              </label>
            ) : null}
            <button
              type="submit"
              disabled={orderBusy}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {orderBusy ? "Submitting…" : "Place order"}
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
    </div>
  );
}

