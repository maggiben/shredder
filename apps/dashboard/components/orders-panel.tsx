"use client";

import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { accessTokenAtom, bannerAtom, dataBusyAtom, ordersAtom } from "../state/dashboard-atoms";
import { useDashboardActions } from "../state/use-dashboard-actions";

export function OrdersPanel() {
  const token = useAtomValue(accessTokenAtom);
  const dataBusy = useAtomValue(dataBusyAtom);
  const orders = useAtomValue(ordersAtom);
  const setBanner = useSetAtom(bannerAtom);

  const { createOrderAndRefresh } = useDashboardActions();

  const [orderSymbol, setOrderSymbol] = useState("BTCUSDT");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [orderQty, setOrderQty] = useState("0.01");
  const [orderLimit, setOrderLimit] = useState("");
  const [orderBusy, setOrderBusy] = useState(false);

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
    } finally {
      setOrderBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-lg font-medium text-white">Orders</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Submit routes through the API queue (demo settlement).
      </p>
      <form
        onSubmit={(e) => void handleCreateOrder(e)}
        className="mt-4 space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
      >
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

      <div className="mt-4 max-h-[min(24rem,50vh)] overflow-auto rounded-lg border border-zinc-800">
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
  );
}
