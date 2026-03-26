import { atom } from "jotai";
import type { OrderRow, PortfolioSnapshot, StrategyRow, TradeRow } from "../lib/api-types";

export const accessTokenAtom = atom<string | null>(null);
export const userEmailAtom = atom<string | null>(null);

export const hydratedAtom = atom<boolean>(false);

export const healthOkAtom = atom<boolean | null>(null);
export const dataBusyAtom = atom<boolean>(false);
export const bannerAtom = atom<string | null>(null);

export const portfolioAtom = atom<PortfolioSnapshot | null>(null);
export const ordersAtom = atom<OrderRow[] | null>(null);
export const tradesAtom = atom<TradeRow[] | null>(null);
export const strategiesAtom = atom<StrategyRow[] | null>(null);

