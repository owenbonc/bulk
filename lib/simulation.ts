import { BOT_NAMES, CATALOG, ME } from "./data";
import type { Action } from "./requests";
import type { AppState, OrderRequest } from "./types";

/** Chance per second that each waiting bot accepts & pays once a deal is achieved. */
const BOT_ACCEPT_CHANCE = 0.3;

function meIn(r: OrderRequest) {
  return r.participants.find((p) => p.userId === ME.userId);
}

/** The bot that refuses to accept when the "a bot won't accept" demo switch is on. */
export function stubbornBot(r: OrderRequest) {
  return r.participants.find((p) => p.isBot);
}

/**
 * One bot joins a request you're queued in: picks 1–2 items and finalises.
 * Only advances requests where you've finalised, so you're never dropped mid-basket.
 */
export function botJoinActions(state: AppState, now: number, rand: () => number): Action[] {
  if (state.demo.botsPaused) return [];
  const r = state.requests.find((x) => x.status === "open" && meIn(x)?.finalised);
  if (!r) return [];
  const name = BOT_NAMES.find((n) => !r.participants.some((p) => p.name === n));
  if (!name) return [];

  const user = { userId: `bot-${name.toLowerCase()}`, name, isBot: true };
  const menu = CATALOG.restaurants.find((x) => x.id === r.restaurantId)!.menu;
  const picks = Array.from({ length: 1 + Math.floor(rand() * 2) }, () => menu[Math.floor(rand() * menu.length)]);
  return [
    { type: "JOIN", requestId: r.id, user },
    ...picks.map((item): Action => ({ type: "ADD_ITEM", requestId: r.id, userId: user.userId, itemId: item.id })),
    { type: "FINALISE_ENTRY", requestId: r.id, userId: user.userId, now },
  ];
}

/** Bots in deal-achieved requests you're part of accept & pay at random moments. */
export function botAcceptActions(state: AppState, now: number, rand: () => number): Action[] {
  const actions: Action[] = [];
  for (const r of state.requests) {
    if (r.status !== "deal_achieved" || !meIn(r)) continue;
    const stubborn = state.demo.botWontAccept ? stubbornBot(r)?.userId : undefined;
    for (const p of r.participants) {
      if (p.isBot && !p.paid && p.userId !== stubborn && rand() < BOT_ACCEPT_CHANCE) {
        actions.push({ type: "ACCEPT_AND_PAY", requestId: r.id, userId: p.userId, now });
      }
    }
  }
  return actions;
}
