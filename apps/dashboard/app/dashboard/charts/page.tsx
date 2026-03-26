"use client";

import { useAtomValue } from "jotai";
import { TradesChartsPanel } from "../../../components/trades-charts-panel";
import {
  accessTokenAtom,
  ordersAtom,
  portfolioAtom,
  tradesAtom,
} from "../../../state/dashboard-atoms";

export default function ChartsPage() {
  const token = useAtomValue(accessTokenAtom);
  const trades = useAtomValue(tradesAtom);
  const orders = useAtomValue(ordersAtom);
  const portfolio = useAtomValue(portfolioAtom);

  if (!token) return null;

  return (
    <div className="mx-auto max-w-[min(100%,96rem)]">
      <TradesChartsPanel token={token} trades={trades} orders={orders} portfolio={portfolio} />
    </div>
  );
}

