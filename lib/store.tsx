"use client";

import { createContext, useContext, useEffect, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CATALOG, ME, seedState } from "./data";
import { type Action, reduce } from "./requests";
import { botAcceptActions, botJoinActions } from "./simulation";
import type { AppState, OrderRequest } from "./types";

const STORAGE_KEY = "bulk-demo-v1";
const BOT_STEP_MS = [2_000, 4_000] as const;

interface AppContext {
  state: AppState;
  now: number;
  dispatch: (action: Action) => void;
}

const Ctx = createContext<AppContext | null>(null);

function loadState(): AppState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as AppState;
  } catch {
    // unreadable storage → fall back to a fresh demo
  }
  return seedState(Date.now());
}

const noopSubscribe = () => () => {};

export function AppProvider({ children }: { children: ReactNode }) {
  // The app lives in localStorage and a live clock, so it only renders in the browser.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return mounted ? <ClientProvider>{children}</ClientProvider> : null;
}

function ClientProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((s: AppState, a: Action) => reduce(s, a, CATALOG), undefined, loadState);
  const [now, setNow] = useState(() => Date.now());

  const stateRef = useRef(state);
  const nextBotAt = useRef(0);
  useEffect(() => {
    stateRef.current = state;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable (private mode) — demo still works in memory
    }
  }, [state]);

  // One heartbeat drives the clock, timeouts, delivery stages and the simulated participants.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      dispatch({ type: "TICK", now: t });
      const s = stateRef.current;
      if (t >= nextBotAt.current) {
        const joins = botJoinActions(s, t, Math.random);
        if (joins.length) {
          joins.forEach(dispatch);
          nextBotAt.current = t + BOT_STEP_MS[0] + Math.random() * (BOT_STEP_MS[1] - BOT_STEP_MS[0]);
        }
      }
      botAcceptActions(s, t, Math.random).forEach(dispatch);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return <Ctx.Provider value={{ state, now, dispatch }}>{children}</Ctx.Provider>;
}

export function useApp(): AppContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function resetDemo(dispatch: AppContext["dispatch"]) {
  dispatch({ type: "RESET", state: seedState(Date.now()) });
}

export function useRequest(id: string): OrderRequest | undefined {
  return useApp().state.requests.find((r) => r.id === id);
}

export function myEntry(r: OrderRequest | undefined) {
  return r?.participants.find((p) => p.userId === ME.userId);
}

export function restaurantById(id: string) {
  return CATALOG.restaurants.find((r) => r.id === id);
}

export function pickupById(id: string) {
  return CATALOG.pickupPoints.find((p) => p.id === id);
}
