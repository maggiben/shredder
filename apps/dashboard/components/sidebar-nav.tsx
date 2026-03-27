"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { searchParamsToQueryRecord } from "../lib/search-params";

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: "/dashboard/overview", label: "Overview" },
  { href: "/dashboard/bots", label: "Bots" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/charts", label: "Trades & charts" },
  { href: "/dashboard/simulations", label: "Simulations" },
  { href: "/dashboard/indicators", label: "Indicators" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const preservedQuery = searchParamsToQueryRecord(searchParams);

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950/60 hidden lg:block">
      <div className="h-full p-4">
        <nav className="space-y-2" aria-label="Dashboard sections">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={{ pathname: item.href, query: preservedQuery }}
                className={[
                  "block rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border border-emerald-700/60 bg-emerald-950/35 text-white"
                    : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

