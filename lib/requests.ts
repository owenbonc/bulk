import { BOT_NAMES, CATALOG, DEFAULT_DURATION_MIN, ME, STATE_VERSION } from "./data";

export { STATE_VERSION };
import {
  basketCount,
  basketTotal,
  draftPreview,
  formatGBP,
  formatGBPShort,
  previewSplit,
  priceGroup,
  progressOf,
  queueTotal,
  soloCost,
  splitCosts,
  targetDiscount,
  type CostLine,
  type Preview,
  type Progress,
  type Split,
} from "./split";
import type {
  AppState,
  BasketLine,
  Catalog,
  DemoSettings,
  Draft,
  OrderRequest,
  Participant,
  ReleasedEntry,
  ReleaseReason,
  Restaurant,
  RequestStatus,
} from "./types";

export {
  basketCount,
  basketTotal,
  draftPreview,
  formatGBP,
  formatGBPShort,
  previewSplit,
  priceGroup,
  progressOf,
  queueTotal,
  soloCost,
  splitCosts,
  targetDiscount,
};
export type { CostLine, Preview, Progress, Split };

/** Time everyone has to accept and pay in each acceptance round. */
export const ACCEPT_WINDOW_MS = 60_000;

/** Simulated delivery timeline, measured from the moment everyone has paid. */
export const DELIVERY_STAGES: { status: RequestStatus; afterMs: number }[] = [
  { status: "preparing", afterMs: 4_000 },
  { status: "out_for_delivery", afterMs: 10_000 },
  { status: "delivered", afterMs: 30_000 },
];

/** The four steps of the paid-order progress bar, in order. */
export const DELIVERY_STEPS: { status: RequestStatus; label: string }[] = [
  { status: "confirmed", label: "Order placed" },
  { status: "preparing", label: "Preparing" },
  { status: "out_for_delivery", label: "On its way" },
  { status: "delivered", label: "Ready to collect" },
];

export const CANCEL_REASONS = {
  notEnoughAccepted: "Not everyone accepted, and the rest no longer reached the deal.",
  secondRoundFailed: "The repriced second round wasn't accepted by everyone.",
  expired: "The deal wasn't reached before the timer ran out.",
} as const;

/** Queue windows offered when creating a party or choosing to keep queueing. */
export const QUEUE_DURATIONS = [15, 30, 60];

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
  | { type: "SET_CUTLERY"; requestId: string; userId: string; cutlery: boolean }
  | { type: "FINALISE_ENTRY"; requestId: string; userId: string; now: number }
  /** `round` is the round being answered: an answer for an earlier round is ignored. */
  | { type: "ACCEPT_AND_PAY"; requestId: string; userId: string; round: 1 | 2; now: number }
  | { type: "DECLINE"; requestId: string; userId: string; round: 1 | 2; now: number; reason?: "declined" | "payment_failed" }
  | { type: "RETRY_ENTRY"; requestId: string; userId: string; newRequestId: string; durationMin: number; now: number }
  | { type: "CANCEL_ENTRY"; requestId: string; userId: string }
  | { type: "HANDOVER"; requestId: string; code: string; now: number }
  | { type: "SET_EXPIRY"; requestId: string; expiresAt: number }
  | { type: "SET_ACCEPT_DEADLINE"; requestId: string; deadline: number }
  | { type: "FILL_PARTY"; requestId: string; now: number }
  | { type: "TICK"; now: number }
  | { type: "DRAFT_START"; restaurantId: string }
  | { type: "DRAFT_ITEM"; itemId: string; delta: number }
  | { type: "DRAFT_SET"; pickupPointId?: string; durationMin?: number; cutlery?: boolean }
  | { type: "DRAFT_CLEAR" }
  | { type: "CREATE_FROM_DRAFT"; id: string; user: UserRef; now: number }
  | { type: "ADD_FRIEND"; userId: string }
  | { type: "MARK_ALERT_SEEN"; key: string }
  | { type: "MARK_NOTIFICATIONS_READ" }
  | { type: "SET_LOCATION"; pickupPointId: string }
  | { type: "SET_DEMO"; patch: Partial<DemoSettings> }
  | { type: "RESET"; state: AppState };

type PartyAction = Extract<Action, { requestId: string }>;

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Distinct 4-digit pickup PINs, one per participant, derived from the party so they are stable. */
export function assignCollectionCodes(r: OrderRequest): Participant[] {
  const used = new Set<string>();
  return r.participants.map((p) => {
    let salt = 0;
    let code: string;
    do code = String(1000 + (hash(`${r.id}:${p.userId}:${salt++}`) % 9000));
    while (used.has(code));
    used.add(code);
    return { ...p, collectionCode: code };
  });
}

export type HandoverCheck =
  | { ok: true; participant: Participant }
  | { ok: false; error: "not_arrived" | "unknown_code" | "already_collected"; participant?: Participant };

/** What the demo driver sees after entering a PIN. The reducer applies the same rules. */
export function checkHandover(r: OrderRequest, code: string): HandoverCheck {
  if (r.status !== "delivered") return { ok: false, error: "not_arrived" };
  const participant = r.participants.find((p) => p.collectionCode === code.trim());
  if (!participant) return { ok: false, error: "unknown_code" };
  if (participant.collectedAt !== undefined) return { ok: false, error: "already_collected", participant };
  return { ok: true, participant };
}

export function isTerminal(status: RequestStatus): boolean {
  return status === "collected" || status === "expired" || status === "cancelled";
}

/** Placed with the restaurant: can no longer be left or cancelled in the app. */
export function isSubmitted(status: RequestStatus): boolean {
  return ["confirmed", "preparing", "out_for_delivery", "delivered", "collected"].includes(status);
}

/** Someone's released entry in a party whose attempt ended for them (basket kept for keep-queueing or cancel). */
export function releasedEntry(r: OrderRequest | undefined, userId: string): ReleasedEntry | undefined {
  return r?.released.find((e) => e.userId === userId);
}

/** The open party at a restaurant (there is at most one), if any. */
export function openPartyFor(state: AppState, restaurantId: string): OrderRequest | undefined {
  return state.requests.find((r) => r.restaurantId === restaurantId && r.status === "open");
}

/** Open and at least 75% of the way to the deal. */
export function isHighlight(request: OrderRequest, restaurant: Restaurant): boolean {
  return request.status === "open" && progressOf(request, restaurant).pct >= 75;
}

/** Index into DELIVERY_STEPS for a paid order, or -1 before payment / after cancellation. */
export function deliveryStep(status: RequestStatus): number {
  // Collected is past the last step: every bag has been handed over.
  return DELIVERY_STEPS.findIndex((s) => s.status === (status === "collected" ? "delivered" : status));
}

function stageAfter(status: RequestStatus): number {
  return DELIVERY_STAGES.find((s) => s.status === status)!.afterMs;
}

/** Courier position along the route, 0–1, while `out_for_delivery` (0 before, 1 once delivered). */
export function deliveryProgress(request: OrderRequest, now: number): number {
  if (request.confirmedAt === undefined) return 0;
  if (request.status === "delivered" || request.status === "collected") return 1;
  const start = request.confirmedAt + stageAfter("out_for_delivery");
  const end = request.confirmedAt + stageAfter("delivered");
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

/** User-facing arrival estimate ("Arrives ~19:40"): payment time plus the middle of the restaurant's ETA window. */
export function arrivesAt(request: OrderRequest, restaurant: Restaurant): number | undefined {
  if (request.confirmedAt === undefined) return undefined;
  const [lo, hi] = restaurant.etaMin;
  return request.confirmedAt + Math.round((lo + hi) / 2) * 60_000;
}

function newParticipant(user: UserRef): Participant {
  return { userId: user.userId, name: user.name, isBot: !!user.isBot, basket: [], finalised: false, paid: false, cutlery: false };
}

function updateParticipant(r: OrderRequest, userId: string, fn: (p: Participant) => Participant): OrderRequest {
  return { ...r, participants: r.participants.map((p) => (p.userId === userId ? fn(p) : p)) };
}

function changeQty(basket: BasketLine[], itemId: string, delta: number): BasketLine[] {
  const existing = basket.find((l) => l.itemId === itemId);
  if (!existing) return delta > 0 ? [...basket, { itemId, qty: delta }] : basket;
  return basket.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0);
}

// ---------------------------------------------------------------------------
// Deal and acceptance rounds
// ---------------------------------------------------------------------------

function release(p: Participant, reason: ReleaseReason): ReleasedEntry {
  return { userId: p.userId, name: p.name, isBot: p.isBot, basket: p.basket, cutlery: p.cutlery, reason, choice: "pending" };
}

/** Fresh consent: nobody carries an acceptance, decline or demo payment into a new round. */
function clearConsent(p: Participant): Participant {
  return { ...p, paid: false, declined: false, declineReason: undefined };
}

/**
 * Locks the party into an acceptance round (an exact quote) once finalised spend meets the
 * threshold. Unfinalised members drop out. The host is not special: the lobby can lock
 * whether or not its creator is still in it.
 */
function lockDealIfReached(r: OrderRequest, restaurant: Restaurant, now: number): OrderRequest {
  if (r.status !== "open" || !splitCosts(r, restaurant).discountEligible) return r;
  return {
    ...r,
    status: "deal_achieved",
    round: 1,
    dealAt: now,
    acceptDeadline: now + ACCEPT_WINDOW_MS,
    participants: r.participants.filter((p) => p.finalised).map(clearConsent),
  };
}

/**
 * Ends the current acceptance round. Everyone paid → confirmed, with a collection code each.
 * Otherwise whoever declined, failed to pay or timed out is released with their basket kept.
 * Round 1 falls back to a single repriced round 2 when everyone left still meets the
 * threshold (fresh consent from all); anything else ends the attempt, releasing everyone so
 * each person can choose to keep queueing or cancel.
 */
function resolveRound(r: OrderRequest, restaurant: Restaurant, now: number, windowClosed: boolean): OrderRequest {
  if (r.participants.every((p) => p.paid)) {
    return { ...r, status: "confirmed", confirmedAt: now, participants: assignCollectionCodes(r) };
  }

  // Before the window closes, people who simply haven't answered yet aren't out.
  const isOut = (p: Participant) => !!p.declined || (!p.paid && windowClosed);
  const out = r.participants.filter(isOut);
  const stay = r.participants.filter((p) => !isOut(p)).map(clearConsent);
  const released = [...r.released, ...out.map((p) => release(p, p.declineReason ?? (p.declined ? "declined" : "timed_out")))];
  const removedUserIds = [...r.removedUserIds, ...out.map((p) => p.userId)];
  const removedNames = [...r.removedNames, ...out.map((p) => p.name)];

  if (r.round === 1 && stay.length > 0 && priceGroup(stay, restaurant).discountEligible) {
    return { ...r, round: 2, participants: stay, released, removedUserIds, removedNames, acceptDeadline: now + ACCEPT_WINDOW_MS };
  }

  // Cancelled parties keep their members so everyone involved can see what happened. Nobody is charged.
  return {
    ...r,
    status: "cancelled",
    cancelReason: r.round === 1 ? CANCEL_REASONS.notEnoughAccepted : CANCEL_REASONS.secondRoundFailed,
    closedAt: now,
    removedUserIds,
    removedNames,
    released: [...released, ...stay.map((p) => release(p, "group_fell_through"))],
    participants: r.participants.map(clearConsent),
  };
}

/**
 * Resolves the round once every member has answered, or as soon as anyone declines the
 * round-2 fallback: nobody should be asked to accept a quote that can no longer go through.
 */
function resolveIfSettled(r: OrderRequest, restaurant: Restaurant, now: number): OrderRequest {
  const answered = r.participants.every((p) => p.paid || p.declined);
  const fallbackDeclined = r.round === 2 && r.participants.some((p) => p.declined);
  return answered || fallbackDeclined ? resolveRound(r, restaurant, now, false) : r;
}

// ---------------------------------------------------------------------------
// Bots (shared by FILL_PARTY and the live simulation)
// ---------------------------------------------------------------------------

/** Bots that may refuse when "a bot won't accept" is on: any bot except the host. */
function droppableBots(r: OrderRequest): Participant[] {
  return r.participants.filter((p) => p.isBot && p.finalised && p.userId !== r.hostId);
}

/**
 * The bot that refuses in round 1 when "a bot won't accept" is on: the smallest non-host
 * basket whose loss still leaves the party over the threshold (so round 2 can succeed),
 * falling back to the smallest non-host basket.
 */
export function stubbornBot(r: OrderRequest, restaurant: Restaurant): Participant | undefined {
  const total = r.participants.reduce((sum, p) => sum + basketTotal(p.basket, restaurant), 0);
  const bySize = [...droppableBots(r)].sort((a, b) => basketTotal(a.basket, restaurant) - basketTotal(b.basket, restaurant));
  return bySize.find((p) => total - basketTotal(p.basket, restaurant) >= restaurant.deal.minTotal) ?? bySize[0];
}

/**
 * Adjusts a joining bot's basket. With `spare` on ("a bot won't accept"), the deal must
 * survive one non-host bot dropping out: the bot that would close the party tops up by
 * the smallest such basket, and a first non-host bot stays under the threshold so that
 * a second one is needed.
 */
export function shapeBotBasket(r: OrderRequest, restaurant: Restaurant, basket: BasketLine[], spare: boolean): BasketLine[] {
  if (!spare) return basket;
  const left = restaurant.deal.minTotal - queueTotal(r, restaurant);
  if (basketTotal(basket, restaurant) < left) return basket;

  const others = droppableBots(r).map((p) => basketTotal(p.basket, restaurant));
  if (others.length === 0) {
    const under = [...restaurant.menu].sort((a, b) => b.price - a.price).find((m) => m.price < left);
    return under ? [{ itemId: under.id, qty: 1 }] : basket;
  }
  const need = left + Math.min(...others);
  const topUp = [...restaurant.menu].sort((a, b) => b.price - a.price)[0];
  let shaped = basket;
  while (basketTotal(shaped, restaurant) < need) shaped = changeQty(shaped, topUp.id, 1);
  return shaped;
}

/** A bot name not yet used in this party. */
export function freeBotName(r: OrderRequest): string | undefined {
  return BOT_NAMES.find((n) => !r.participants.some((p) => p.name === n || p.userId === botId(n)));
}

export function botId(name: string): string {
  return `bot-${name.toLowerCase()}`;
}

/** Deterministic bot basket for FILL_PARTY: one main plus one side or drink, varied by position. */
function fillBasket(restaurant: Restaurant, i: number): BasketLine[] {
  const mains = restaurant.menu.filter((m) => m.category === "main");
  const extras = restaurant.menu.filter((m) => m.category !== "main");
  const basket: BasketLine[] = [{ itemId: mains[i % mains.length].id, qty: 1 }];
  if (extras.length) basket.push({ itemId: extras[i % extras.length].id, qty: 1 });
  return basket;
}

/**
 * Demo shortcut: people still choosing who already have items (the presenter) are locked in
 * first so the deal doesn't drop them, then bots join until the threshold is met.
 */
function fillParty(r: OrderRequest, restaurant: Restaurant, now: number, spare: boolean): OrderRequest {
  if (r.status !== "open") return r;
  let next: OrderRequest = {
    ...r,
    participants: r.participants.map((p) => (!p.isBot && !p.finalised && p.basket.length > 0 ? { ...p, finalised: true } : p)),
  };
  for (let i = 0; i < 20 && queueTotal(next, restaurant) < restaurant.deal.minTotal; i++) {
    const name = freeBotName(next) ?? `Guest ${i + 1}`;
    const basket = shapeBotBasket(next, restaurant, fillBasket(restaurant, i), spare);
    const bot: Participant = { ...newParticipant({ userId: botId(name), name, isBot: true }), basket, finalised: true, cutlery: i % 2 === 0 };
    next = { ...next, participants: [...next.participants, bot] };
  }
  return lockDealIfReached(next, restaurant, now);
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reduceRequest(r: OrderRequest, action: PartyAction | Extract<Action, { type: "TICK" }>, restaurant: Restaurant): OrderRequest {
  const member = "userId" in action ? r.participants.find((p) => p.userId === action.userId) : undefined;

  switch (action.type) {
    case "JOIN":
      if (r.status !== "open" || r.participants.some((p) => p.userId === action.user.userId)) return r;
      return { ...r, participants: [...r.participants, newParticipant(action.user)] };

    case "LEAVE":
      // Anyone, the host included, can leave while the lobby is open. The lobby stays open for the
      // rest (even if empty, until it expires): the host's only role was creating it and choosing the
      // collection point, so nobody is promoted. A quote or a placed order has its own rules.
      if (r.status !== "open" || !member) return r;
      return { ...r, participants: r.participants.filter((p) => p.userId !== action.userId) };

    case "ADD_ITEM":
      if (r.status !== "open" || !member || member.finalised) return r;
      if (!restaurant.menu.some((m) => m.id === action.itemId)) return r;
      return updateParticipant(r, action.userId, (p) => ({ ...p, basket: changeQty(p.basket, action.itemId, 1) }));

    case "REMOVE_ITEM": {
      if (r.status !== "open" || !member || member.finalised) return r;
      if (!member.basket.some((l) => l.itemId === action.itemId)) return r;
      const basket = changeQty(member.basket, action.itemId, -1);
      // Emptying your basket before joining properly takes you out of the party.
      if (basket.length === 0) {
        return { ...r, participants: r.participants.filter((p) => p.userId !== action.userId) };
      }
      return updateParticipant(r, action.userId, (p) => ({ ...p, basket }));
    }

    case "SET_CUTLERY":
      if ((r.status !== "open" && r.status !== "deal_achieved") || !member || member.cutlery === action.cutlery) return r;
      return updateParticipant(r, action.userId, (p) => ({ ...p, cutlery: action.cutlery }));

    case "FINALISE_ENTRY": {
      if (r.status !== "open" || !member || member.finalised || member.basket.length === 0) return r;
      const next = updateParticipant(r, action.userId, (p) => ({ ...p, finalised: true }));
      return lockDealIfReached(next, restaurant, action.now);
    }

    case "ACCEPT_AND_PAY":
    case "DECLINE": {
      // Answers for an earlier round (a stale bot decision, a double click after repricing) and late
      // answers are ignored, so nobody's consent carries over to a different price.
      if (r.status !== "deal_achieved" || action.round !== r.round || action.now >= r.acceptDeadline!) return r;
      if (!member || member.paid || member.declined) return r;
      const next = updateParticipant(r, action.userId, (p) =>
        action.type === "ACCEPT_AND_PAY" ? { ...p, paid: true } : { ...p, declined: true, declineReason: action.reason ?? "declined" },
      );
      return resolveIfSettled(next, restaurant, action.now);
    }

    case "CANCEL_ENTRY":
      if (releasedEntry(r, action.userId)?.choice !== "pending") return r;
      return { ...r, released: r.released.map((e) => (e.userId === action.userId ? { ...e, choice: "cancelled" } : e)) };

    case "HANDOVER": {
      const check = checkHandover(r, action.code);
      if (!check.ok) return r;
      const next = updateParticipant(r, check.participant.userId, (p) => ({ ...p, collectedAt: action.now }));
      return next.participants.every((p) => p.collectedAt !== undefined) ? { ...next, status: "collected", completedAt: action.now } : next;
    }

    case "SET_EXPIRY":
      return r.status === "open" ? { ...r, expiresAt: action.expiresAt } : r;

    case "SET_ACCEPT_DEADLINE":
      return r.status === "deal_achieved" ? { ...r, acceptDeadline: action.deadline } : r;

    case "TICK": {
      if (r.status === "open" && action.now >= r.expiresAt) {
        // No match in this window. Baskets are kept so each person can choose to keep queueing or cancel.
        const released = r.participants.filter((p) => p.basket.length > 0).map((p) => release(p, "no_match"));
        return { ...r, status: "expired", cancelReason: CANCEL_REASONS.expired, closedAt: action.now, released: [...r.released, ...released] };
      }
      if (r.status === "deal_achieved" && action.now >= r.acceptDeadline!) return resolveRound(r, restaurant, action.now, true);
      if (r.confirmedAt !== undefined && ["confirmed", "preparing", "out_for_delivery"].includes(r.status)) {
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

function newRequest(
  id: string,
  restaurantId: string,
  pickupPointId: string,
  durationMin: number,
  host: Participant,
  now: number,
): OrderRequest {
  return {
    id,
    restaurantId,
    pickupPointId,
    hostId: host.userId,
    createdAt: now,
    expiresAt: now + durationMin * 60_000,
    status: "open",
    participants: [host],
    round: 1,
    removedUserIds: [],
    removedNames: [],
    attempt: 1,
    released: [],
  };
}

/**
 * "Keep queueing" for one person: a fresh party with only their basket, restaurant and collection
 * point. Nobody else is moved. Idempotent: a second click finds the entry already retried. Refused
 * (state unchanged) if the restaurant already has an open party, the window is invalid, or none of
 * the basket is still on the menu.
 */
function retryEntry(state: AppState, action: Extract<Action, { type: "RETRY_ENTRY" }>, catalog: Catalog): AppState {
  const old = state.requests.find((r) => r.id === action.requestId);
  const entry = releasedEntry(old, action.userId);
  if (!old || !entry || entry.choice !== "pending" || state.requests.some((r) => r.id === action.newRequestId)) return state;
  const restaurant = catalog.restaurants.find((x) => x.id === old.restaurantId);
  if (!restaurant || openPartyFor(state, old.restaurantId) || !catalog.pickupPoints.some((p) => p.id === old.pickupPointId)) return state;
  if (!QUEUE_DURATIONS.includes(action.durationMin)) return state;
  const basket = entry.basket.filter((l) => restaurant.menu.some((m) => m.id === l.itemId));
  if (basket.length === 0) return state;

  const host: Participant = {
    ...newParticipant({ userId: entry.userId, name: entry.name, isBot: entry.isBot }),
    basket,
    finalised: true,
    cutlery: entry.cutlery,
  };
  const fresh = newRequest(action.newRequestId, old.restaurantId, old.pickupPointId, action.durationMin, host, action.now);
  const retried = lockDealIfReached({ ...fresh, attempt: old.attempt + 1, retryOf: old.id }, restaurant, action.now);
  const updatedOld: OrderRequest = {
    ...old,
    released: old.released.map((e) => (e.userId === action.userId ? { ...e, choice: "retried", retriedAs: action.newRequestId } : e)),
  };
  return { ...state, requests: [...state.requests.map((r) => (r.id === old.id ? updatedOld : r)), retried] };
}

function withoutDraft(state: AppState): AppState {
  const next = { ...state };
  delete next.draft;
  return next;
}

export function reduce(state: AppState, action: Action, catalog: Catalog): AppState {
  const restaurantOf = (id: string) => catalog.restaurants.find((x) => x.id === id);

  switch (action.type) {
    case "RESET":
      return action.state;

    case "SET_DEMO":
      return { ...state, demo: { ...state.demo, ...action.patch } };

    case "CREATE_REQUEST": {
      if (!restaurantOf(action.restaurantId) || openPartyFor(state, action.restaurantId)) return state;
      if (state.requests.some((r) => r.id === action.id)) return state;
      const host = newParticipant(action.user);
      const request = newRequest(action.id, action.restaurantId, action.pickupPointId, action.durationMin, host, action.now);
      return { ...state, requests: [...state.requests, request] };
    }

    case "DRAFT_START": {
      if (!restaurantOf(action.restaurantId) || state.draft?.restaurantId === action.restaurantId) return state;
      const draft: Draft = {
        restaurantId: action.restaurantId,
        pickupPointId: state.location,
        durationMin: DEFAULT_DURATION_MIN,
        basket: [],
        cutlery: false,
      };
      return { ...state, draft };
    }

    case "DRAFT_ITEM": {
      const draft = state.draft;
      const restaurant = draft && restaurantOf(draft.restaurantId);
      if (!draft || !restaurant || !restaurant.menu.some((m) => m.id === action.itemId) || action.delta === 0) return state;
      return { ...state, draft: { ...draft, basket: changeQty(draft.basket, action.itemId, action.delta) } };
    }

    case "DRAFT_SET": {
      const draft = state.draft;
      if (!draft) return state;
      const next = { ...draft };
      if (action.pickupPointId && catalog.pickupPoints.some((p) => p.id === action.pickupPointId)) next.pickupPointId = action.pickupPointId;
      if (action.durationMin && action.durationMin > 0) next.durationMin = action.durationMin;
      if (action.cutlery !== undefined) next.cutlery = action.cutlery;
      return { ...state, draft: next };
    }

    case "DRAFT_CLEAR":
      return state.draft ? withoutDraft(state) : state;

    case "CREATE_FROM_DRAFT": {
      const draft = state.draft;
      const restaurant = draft && restaurantOf(draft.restaurantId);
      if (!draft || !restaurant || draft.basket.length === 0) return state;
      if (openPartyFor(state, draft.restaurantId) || state.requests.some((r) => r.id === action.id)) return state;
      const host: Participant = { ...newParticipant(action.user), basket: draft.basket, finalised: true, cutlery: draft.cutlery };
      const request = lockDealIfReached(
        newRequest(action.id, draft.restaurantId, draft.pickupPointId, draft.durationMin, host, action.now),
        restaurant,
        action.now,
      );
      return { ...withoutDraft(state), requests: [...state.requests, request] };
    }

    case "RETRY_ENTRY":
      return retryEntry(state, action, catalog);

    case "ADD_FRIEND":
      return state.friends.includes(action.userId) ? state : { ...state, friends: [...state.friends, action.userId] };

    case "MARK_ALERT_SEEN":
      return state.seenAlerts.includes(action.key) ? state : { ...state, seenAlerts: [...state.seenAlerts, action.key] };

    case "MARK_NOTIFICATIONS_READ": {
      const unread = notificationsFor(state, catalog)
        .map((n) => n.key)
        .filter((k) => !state.readNotifications.includes(k));
      return unread.length ? { ...state, readNotifications: [...state.readNotifications, ...unread] } : state;
    }

    case "SET_LOCATION":
      if (state.location === action.pickupPointId || !catalog.pickupPoints.some((p) => p.id === action.pickupPointId)) return state;
      return { ...state, location: action.pickupPointId };

    case "FILL_PARTY": {
      const target = state.requests.find((r) => r.id === action.requestId);
      const restaurant = target && restaurantOf(target.restaurantId);
      if (!target || !restaurant) return state;
      const filled = fillParty(target, restaurant, action.now, state.demo.botWontAccept);
      return filled === target ? state : { ...state, requests: state.requests.map((r) => (r === target ? filled : r)) };
    }

    case "TICK": {
      const requests = state.requests.map((r) => {
        const restaurant = restaurantOf(r.restaurantId);
        return restaurant ? reduceRequest(r, action, restaurant) : r;
      });
      return requests.every((r, i) => r === state.requests[i]) ? state : { ...state, requests };
    }

    default: {
      const target = state.requests.find((r) => r.id === action.requestId);
      const restaurant = target && restaurantOf(target.restaurantId);
      if (!target || !restaurant) return state;
      const next = reduceRequest(target, action, restaurant);
      return next === target ? state : { ...state, requests: state.requests.map((r) => (r === target ? next : r)) };
    }
  }
}

// ---------------------------------------------------------------------------
// Notifications and global popups
// ---------------------------------------------------------------------------

export type NotificationKind = "deal" | "pay" | "placed" | "on_its_way" | "ready" | "cancelled" | "expired";

export interface AppNotification {
  /** Stable id, used for read state. */
  key: string;
  kind: NotificationKind;
  requestId: string;
  title: string;
  body: string;
  /** When it happened (ms). */
  at: number;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** Notifications for the parties you're in, newest first. */
export function notificationsFor(state: AppState, catalog: Catalog = CATALOG, userId = ME.userId): AppNotification[] {
  // Built in chronological order per party, so ties sort with the later event first.
  const list: AppNotification[] = [];
  const push = (n: AppNotification) => list.push(n);

  for (const r of state.requests) {
    const me = r.participants.find((p) => p.userId === userId);
    const restaurant = catalog.restaurants.find((x) => x.id === r.restaurantId);
    if (!me || !restaurant) continue;
    const pickup = catalog.pickupPoints.find((p) => p.id === r.pickupPointId);
    const base = { requestId: r.id };

    if (r.dealAt !== undefined) {
      push({
        ...base,
        key: `${r.id}:deal`,
        kind: "deal",
        title: `Deal reached at ${restaurant.name}`,
        body: `Your party hit ${formatGBPShort(restaurant.deal.minTotal)}. ${restaurant.deal.short} is unlocked.`,
        at: r.dealAt,
      });
    }
    if (r.status === "deal_achieved" && !me.paid && !me.declined && r.acceptDeadline !== undefined) {
      const owed = splitCosts(r, restaurant).people[userId]?.total ?? 0;
      const others = r.removedNames.filter((n) => n !== me.name);
      push({
        ...base,
        key: `${r.id}:pay-${r.round}`,
        kind: "pay",
        title: r.round === 1 ? "Payment needed" : "Accept again",
        body:
          r.round === 1
            ? `Accept and pay ${formatGBP(owed)} to lock in ${restaurant.deal.short} at ${restaurant.name}.`
            : `${joinNames(others)} didn't accept. Totals updated: accept and pay ${formatGBP(owed)} to keep the deal.`,
        at: r.acceptDeadline - ACCEPT_WINDOW_MS,
      });
    }
    if (r.confirmedAt !== undefined) {
      push({ ...base, key: `${r.id}:placed`, kind: "placed", title: "Order placed", body: `Everyone paid. ${restaurant.name} is on it.`, at: r.confirmedAt });
      if (deliveryStep(r.status) >= deliveryStep("out_for_delivery")) {
        push({
          ...base,
          key: `${r.id}:on-its-way`,
          kind: "on_its_way",
          title: "On its way",
          body: `Your ${restaurant.name} order is heading to ${pickup?.name ?? "your collection point"}.`,
          at: r.confirmedAt + stageAfter("out_for_delivery"),
        });
      }
      if (r.status === "delivered" || r.status === "collected") {
        push({
          ...base,
          key: `${r.id}:ready`,
          kind: "ready",
          title: "Ready to collect",
          body: `Collect from ${pickup?.name ?? "your collection point"} with PIN ${me.collectionCode}.`,
          at: r.confirmedAt + stageAfter("delivered"),
        });
      }
    }
    if (r.status === "cancelled") {
      push({
        ...base,
        key: `${r.id}:cancelled`,
        kind: "cancelled",
        title: `Order cancelled at ${restaurant.name}`,
        body: `${r.cancelReason ?? CANCEL_REASONS.notEnoughAccepted} Nobody was charged.`,
        at: r.closedAt ?? r.acceptDeadline ?? r.createdAt,
      });
    }
    if (r.status === "expired") {
      push({
        ...base,
        key: `${r.id}:expired`,
        kind: "expired",
        title: `Party closed at ${restaurant.name}`,
        body: `${r.cancelReason ?? CANCEL_REASONS.expired} Nobody was charged.`,
        at: r.closedAt ?? r.expiresAt,
      });
    }
  }

  return list
    .map((n, seq) => ({ n, seq }))
    .sort((a, b) => b.n.at - a.n.at || b.seq - a.seq)
    .map(({ n }) => n);
}

export function unreadCount(state: AppState, catalog: Catalog = CATALOG): number {
  return notificationsFor(state, catalog).filter((n) => !state.readNotifications.includes(n.key)).length;
}

export type AlertKind = "filled" | "cancelled" | "expired";

export interface PartyAlert {
  /** Pass to MARK_ALERT_SEEN once shown. */
  key: string;
  kind: AlertKind;
  requestId: string;
}

/**
 * Global popups still to show, once per party: "Party filled!" while a party you're in
 * is in its acceptance round, and the cancelled / closed popup when one ends without an order.
 */
export function pendingAlerts(state: AppState, userId = ME.userId): PartyAlert[] {
  const alerts: PartyAlert[] = [];
  for (const r of state.requests) {
    if (!r.participants.some((p) => p.userId === userId)) continue;
    const kind: AlertKind | undefined =
      r.status === "deal_achieved" ? "filled" : r.status === "cancelled" ? "cancelled" : r.status === "expired" ? "expired" : undefined;
    if (!kind) continue;
    const key = `${r.id}:${kind}`;
    if (!state.seenAlerts.includes(key)) alerts.push({ key, kind, requestId: r.id });
  }
  return alerts;
}
