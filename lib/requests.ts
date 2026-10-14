import type { AppState, BasketLine, Catalog, DemoSettings, OrderRequest, Participant, Restaurant, RequestStatus } from "./types";

export const ACCEPT_WINDOW_MS = 60_000;

/** Simulated delivery timeline, measured from the moment everyone has paid. */
export const DELIVERY_STAGES: { status: RequestStatus; afterMs: number }[] = [
  { status: "preparing", afterMs: 4_000 },
  { status: "out_for_delivery", afterMs: 12_000 },
  { status: "delivered", afterMs: 20_000 },
];

export interface UserRef {
  userId: string;
  name: string;
  isBot?: boolean;
}

export type Action =
  | { type: "CREATE_REQUEST"; id: string; restaurantId: string; pickupPointId: string; durationMin: number; user: UserRef; now: number }
  | { type: "JOIN"; requestId: string; user: UserRef }
  | { type: "LEAVE"; requestId: string; userId: string }
  | { type: "ADD_ITEM"; requestId: string; userId: string; itemId: string }
  | { type: "REMOVE_ITEM"; requestId: string; userId: string; itemId: string }
  | { type: "FINALISE_ENTRY"; requestId: string; userId: string; now: number }
  | { type: "ACCEPT_AND_PAY"; requestId: string; userId: string; now: number }
  | { type: "TICK"; now: number }
  | { type: "SET_EXPIRY"; requestId: string; expiresAt: number }
  | { type: "SET_DEMO"; patch: Partial<DemoSettings> }
  | { type: "RESET"; state: AppState };

export function basketTotal(basket: BasketLine[], restaurant: Restaurant): number {
  return basket.reduce((sum, line) => {
    const item = restaurant.menu.find((m) => m.id === line.itemId);
    return sum + (item ? item.price * line.qty : 0);
  }, 0);
}

/** Combined total of finalised baskets — what counts toward the deal. */
export function queueTotal(request: OrderRequest, restaurant: Restaurant): number {
  return request.participants.filter((p) => p.finalised).reduce((sum, p) => sum + basketTotal(p.basket, restaurant), 0);
}

export function pinFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return String(1000 + (h % 9000));
}

export function isTerminal(status: RequestStatus): boolean {
  return status === "delivered" || status === "expired" || status === "cancelled";
}

function newParticipant(user: UserRef): Participant {
  return { userId: user.userId, name: user.name, isBot: !!user.isBot, basket: [], finalised: false, paid: false };
}

function updateParticipant(r: OrderRequest, userId: string, fn: (p: Participant) => Participant): OrderRequest {
  return { ...r, participants: r.participants.map((p) => (p.userId === userId ? fn(p) : p)) };
}

function changeQty(basket: BasketLine[], itemId: string, delta: number): BasketLine[] {
  const existing = basket.find((l) => l.itemId === itemId);
  if (!existing) return delta > 0 ? [...basket, { itemId, qty: delta }] : basket;
  return basket.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0);
}

function reduceRequest(r: OrderRequest, action: Action, catalog: Catalog): OrderRequest {
  const restaurant = catalog.restaurants.find((x) => x.id === r.restaurantId)!;
  const member = "userId" in action ? r.participants.find((p) => p.userId === action.userId) : undefined;

  switch (action.type) {
    case "JOIN":
      if (r.status !== "open" || r.participants.some((p) => p.userId === action.user.userId)) return r;
      return { ...r, participants: [...r.participants, newParticipant(action.user)] };

    case "LEAVE":
      if (r.status !== "open" || action.userId === r.hostId) return r;
      return { ...r, participants: r.participants.filter((p) => p.userId !== action.userId) };

    case "ADD_ITEM":
    case "REMOVE_ITEM":
      if (r.status !== "open" || !member || member.finalised) return r;
      return updateParticipant(r, action.userId, (p) => ({
        ...p,
        basket: changeQty(p.basket, action.itemId, action.type === "ADD_ITEM" ? 1 : -1),
      }));

    case "FINALISE_ENTRY": {
      if (r.status !== "open" || !member || member.finalised || member.basket.length === 0) return r;
      const next = updateParticipant(r, action.userId, (p) => ({ ...p, finalised: true }));
      if (queueTotal(next, restaurant) < restaurant.deal.minTotal) return next;
      // Deal achieved: lock the group. Anyone who hadn't finalised wasn't in the queue.
      return {
        ...next,
        status: "deal_achieved",
        acceptDeadline: action.now + ACCEPT_WINDOW_MS,
        participants: next.participants.filter((p) => p.finalised),
      };
    }

    case "ACCEPT_AND_PAY": {
      if (r.status !== "deal_achieved" || !member || action.now >= r.acceptDeadline!) return r;
      const next = updateParticipant(r, action.userId, (p) => ({ ...p, paid: true }));
      if (!next.participants.every((p) => p.paid)) return next;
      return { ...next, status: "confirmed", confirmedAt: action.now, pin: pinFor(r.id) };
    }

    case "SET_EXPIRY":
      return r.status === "open" ? { ...r, expiresAt: action.expiresAt } : r;

    case "TICK": {
      if (r.status === "open" && action.now >= r.expiresAt) return { ...r, status: "expired" };
      if (r.status === "deal_achieved" && action.now >= r.acceptDeadline!) return { ...r, status: "cancelled" };
      if (r.confirmedAt !== undefined && !isTerminal(r.status)) {
        const elapsed = action.now - r.confirmedAt;
        const reached = DELIVERY_STAGES.filter((s) => elapsed >= s.afterMs).at(-1);
        if (reached && reached.status !== r.status) return { ...r, status: reached.status };
      }
      return r;
    }

    default:
      return r;
  }
}

export function reduce(state: AppState, action: Action, catalog: Catalog): AppState {
  switch (action.type) {
    case "RESET":
      return action.state;
    case "SET_DEMO":
      return { ...state, demo: { ...state.demo, ...action.patch } };
    case "CREATE_REQUEST": {
      const request: OrderRequest = {
        id: action.id,
        restaurantId: action.restaurantId,
        pickupPointId: action.pickupPointId,
        hostId: action.user.userId,
        createdAt: action.now,
        expiresAt: action.now + action.durationMin * 60_000,
        status: "open",
        participants: [newParticipant(action.user)],
      };
      return { ...state, requests: [...state.requests, request] };
    }
    case "TICK": {
      const requests = state.requests.map((r) => reduceRequest(r, action, catalog));
      return requests.every((r, i) => r === state.requests[i]) ? state : { ...state, requests };
    }
    default: {
      const requests = state.requests.map((r) => (r.id === action.requestId ? reduceRequest(r, action, catalog) : r));
      return { ...state, requests };
    }
  }
}
