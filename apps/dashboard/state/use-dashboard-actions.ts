"use client";

import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
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
import {
  accessTokenAtom,
  bannerAtom,
  dataBusyAtom,
  hydratedAtom,
  healthOkAtom,
  ordersAtom,
  portfolioAtom,
  strategiesAtom,
  tradesAtom,
  userEmailAtom,
} from "./dashboard-atoms";
import {
  clearSession,
  getStoredToken,
  getStoredUserEmail,
  setStoredToken,
  setStoredUserEmail,
} from "../lib/auth-storage";

function formatError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

export function useDashboardActions() {
  const token = useAtomValue(accessTokenAtom);
  const isHydrated = useAtomValue(hydratedAtom);

  const setHydrated = useSetAtom(hydratedAtom);
  const setToken = useSetAtom(accessTokenAtom);
  const setUserEmail = useSetAtom(userEmailAtom);

  const setHealthOk = useSetAtom(healthOkAtom);
  const setBanner = useSetAtom(bannerAtom);
  const setDataBusy = useSetAtom(dataBusyAtom);
  const setPortfolio = useSetAtom(portfolioAtom);
  const setOrders = useSetAtom(ordersAtom);
  const setTrades = useSetAtom(tradesAtom);
  const setStrategies = useSetAtom(strategiesAtom);

  const hydrateFromSession = useCallback(() => {
    setToken(getStoredToken());
    setUserEmail(getStoredUserEmail());
    setHydrated(true);
  }, [setHydrated, setToken, setUserEmail]);

  const pingHealth = useCallback(async () => {
    try {
      const h = await getHealth();
      setHealthOk(h.status === "ok");
    } catch {
      setHealthOk(false);
    }
  }, [setHealthOk]);

  const refreshAllData = useCallback(
    async (tokenOverride?: string | null) => {
      const t = tokenOverride ?? token;
      if (!t) return;

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
          setHealthOk(null);
          setBanner("Session expired; please sign in again.");
        } else {
          setBanner(msg);
        }
      } finally {
        setDataBusy(false);
      }
    },
    [
      token,
      setBanner,
      setDataBusy,
      setOrders,
      setPortfolio,
      setStrategies,
      setHealthOk,
      setTrades,
      setToken,
      setUserEmail,
    ],
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUserEmail(null);
    setHealthOk(null);
    setPortfolio(null);
    setOrders(null);
    setTrades(null);
    setStrategies(null);
    setBanner(null);
  }, [
    setBanner,
    setHealthOk,
    setOrders,
    setPortfolio,
    setStrategies,
    setTrades,
    setToken,
    setUserEmail,
  ]);

  const loginUser = useCallback(
    async (email: string, password: string) => {
      setBanner(null);
      try {
        const { access_token } = await login(email, password);
        setStoredToken(access_token);
        setStoredUserEmail(email);
        setToken(access_token);
        setUserEmail(email);
        await refreshAllData(access_token);
      } catch (e) {
        clearSession();
        setToken(null);
        setUserEmail(null);
        setPortfolio(null);
        setOrders(null);
        setTrades(null);
        setStrategies(null);
        setBanner(formatError(e));
      }
    },
    [refreshAllData, setOrders, setPortfolio, setStrategies, setBanner, setToken, setTrades, setUserEmail],
  );

  const registerUser = useCallback(
    async (email: string, password: string) => {
      setBanner(null);
      try {
        const { access_token } = await register(email, password);
        setStoredToken(access_token);
        setStoredUserEmail(email);
        setToken(access_token);
        setUserEmail(email);
        await refreshAllData(access_token);
      } catch (e) {
        clearSession();
        setToken(null);
        setUserEmail(null);
        setPortfolio(null);
        setOrders(null);
        setTrades(null);
        setStrategies(null);
        setBanner(formatError(e));
      }
    },
    [refreshAllData, setOrders, setPortfolio, setStrategies, setBanner, setToken, setTrades, setUserEmail],
  );

  const createOrderAndRefresh = useCallback(
    async (dto: Parameters<typeof createOrder>[1]) => {
      const t = token;
      if (!t) return;
      setBanner(null);
      try {
        await createOrder(t, dto);
        await refreshAllData(t);
      } catch (e) {
        setBanner(formatError(e));
      }
    },
    [refreshAllData, setBanner, token],
  );

  return {
    token,
    hydrateFromSession,
    hydrated: isHydrated,
    pingHealth,
    refreshAllData,
    logout,
    loginUser,
    registerUser,
    createOrderAndRefresh,
  };
}

