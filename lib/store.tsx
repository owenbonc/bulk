"use client";

import { createContext, useContext, useEffect, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CATALOG, ME, seedState } from "./data";
import { type Action, isTerminal, notificationsFor, pendingAlerts, reduce } from "./requests";
import { botAcceptActions, botJoinActions } from "./simulation";
import type { AppState, OrderRequest } from "./types";

export {
  arrivesAt,
  deliveryProgress,
  deliveryStep,
  draftPreview,
  formatGBP,
  formatGBPShort,
  isHighlight,
  isTerminal,
  notificationsFor,
  openPartyFor,
  pendingAlerts,
  previewSplit,
  progressOf,
  unreadCount,
} from "./requests";

const STORAGE_KEY = "bulk-demo-v2";
const HEARTBEAT_MS = 1_000;
const BOT_STEP_MS = [2_000, 4_000] as const;

interface AppContext {
  state: AppState;
  /** Wall clock, updated every second by the heartbeat. */
  now: number;
  dispatch: (action: Action) => void;
}

const Ctx = createContext<AppContext | null>(null);

/** Saved state, or a fresh demo when nothing is saved or every party has ended (e.g. seeded timers ran out overnight). */
function loadState(): AppState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as AppState;
      if (Array.isArray(state.requests) && state.requests.some((r) => !isTerminal(r.status))) return state;
    }
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
      // storage unavailable (private mode): the demo still works in memory
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
    }, HEARTBEAT_MS);
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

/** A short random id for a new party (CREATE_FROM_DRAFT / CREATE_REQUEST). */
export function newPartyId(): string {
  return crypto.randomUUID().slice(0, 8);
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

/** Notifications for the bell sheet, newest first, plus how many are unread. */
export function useNotifications() {
  const { state } = useApp();
  const items = notificationsFor(state);
  return { items, unread: items.filter((n) => !state.readNotifications.includes(n.key)).length };
}

/** The next global popup to show (W11/W12), if any. Dispatch MARK_ALERT_SEEN with its key once shown. */
export function useNextAlert() {
  const { state } = useApp();
  const alert = pendingAlerts(state)[0];
  return alert && { ...alert, request: state.requests.find((r) => r.id === alert.requestId)! };
}

/**
 * A clock that updates every animation frame while `active` (for smooth motion such as
 * the courier on the live map); otherwise the heartbeat's once-a-second `now`.
 */
export function useFrameNow(active: boolean): number {
  const { now } = useApp();
  const [frameNow, setFrameNow] = useState(now);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      setFrameNow(Date.now());
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [active]);
  return active ? Math.max(frameNow, now) : now;
}
