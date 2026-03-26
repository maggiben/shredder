"use client";

import { useEffect, useMemo, useState } from "react";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { SidebarNav } from "./sidebar-nav";
import { getApiBaseUrl } from "../lib/config";
import {
  accessTokenAtom,
  bannerAtom,
  dataBusyAtom,
  hydratedAtom,
  healthOkAtom,
  userEmailAtom,
} from "../state/dashboard-atoms";
import { useDashboardActions } from "../state/use-dashboard-actions";
import { LoginForms } from "./login-forms";

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const token = useAtomValue(accessTokenAtom);
  const userEmail = useAtomValue(userEmailAtom);
  const banner = useAtomValue(bannerAtom);
  const dataBusy = useAtomValue(dataBusyAtom);
  const isHydrated = useAtomValue(hydratedAtom);
  const healthOk = useAtomValue(healthOkAtom);

  const apiBase = useMemo(() => getApiBaseUrl(), []);

  const {
    hydrateFromSession,
    pingHealth,
    refreshAllData,
    logout,
    loginUser,
    registerUser,
  } = useDashboardActions();

  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  useEffect(() => {
    // Health is public; keep checking even when logged out.
    void pingHealth();
    const id = window.setInterval(() => void pingHealth(), 15000);
    return () => window.clearInterval(id);
  }, [pingHealth]);

  useEffect(() => {
    if (!isHydrated || !token) return;
    void refreshAllData(token);
  }, [isHydrated, refreshAllData, token]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-400">
        Loading session…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <header className="flex flex-col gap-4 border-b border-zinc-800 px-6 py-5 md:flex-row md:items-end md:justify-between">
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
                onClick={() => void refreshAllData(token)}
                disabled={dataBusy}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                {dataBusy ? "Refreshing…" : "Refresh data"}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-400 hover:bg-zinc-800"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {banner ? (
        <div className="px-6 py-4">
          <div className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            {banner}
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 overflow-hidden">
        {token ? <SidebarNav /> : null}

        <main className="flex-1 overflow-auto px-6 py-8">
          {!token ? (
            <LoginForms loginUser={loginUser} registerUser={registerUser} />
          ) : (
            <div className="mx-auto max-w-[min(100%,96rem)]">{children}</div>
          )}
        </main>
      </div>

      <footer className="border-t border-zinc-800 px-6 py-5 text-xs text-zinc-500">
        <div className="max-w-[min(100%,96rem)]">
          Shredder dashboard UI for strategy context. No agent bypasses risk/execution.
        </div>
      </footer>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </JotaiProvider>
  );
}

