"use client";

import { useAtomValue } from "jotai";
import { SimulationPanel } from "../../../components/simulation-panel";
import { accessTokenAtom } from "../../../state/dashboard-atoms";

export default function SimulationsPage() {
  const token = useAtomValue(accessTokenAtom);
  if (!token) return null;

  return (
    <div className="mx-auto max-w-[min(100%,96rem)]">
      <SimulationPanel token={token} />
    </div>
  );
}

