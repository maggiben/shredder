"use client";

import { useAtomValue } from "jotai";
import { OrdersPanel } from "../../../components/orders-panel";
import { accessTokenAtom } from "../../../state/dashboard-atoms";

export default function OrdersPage() {
  const token = useAtomValue(accessTokenAtom);

  if (!token) return null;

  return (
    <div className="mx-auto max-w-[min(100%,48rem)] space-y-8">
      <OrdersPanel />
    </div>
  );
}
