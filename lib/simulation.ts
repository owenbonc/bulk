import { CATALOG, ME } from "./data";
import { type Action, botId, freeBotName, shapeBotBasket, stubbornBot } from "./requests";
import type { AppState, BasketLine, OrderRequest } from "./types";

/** Chance per second that each waiting bot responds once the deal is reached. */
const BOT_ACCEPT_CHANCE = 0.3;

function meIn(r: OrderRequest) {
  return r.participants.find((p) => p.userId === ME.userId);
}

function restaurantOf(r: OrderRequest) {
  return CATALOG.restaurants.find((x) => x.id === r.restaurantId);
}

/** The open party you've finalised in, which bots join; undefined while bots are paused. */
export function botTarget(state: AppState): OrderRequest | undefined {
  if (state.demo.botsPaused) return undefined;
  return state.requests.find((x) => x.status === "open" && meIn(x)?.finalised);
}

/**
 * One bot joins an open party you've joined (your basket is finalised): it picks a main,
 * maybe a side or drink, and finalises. Parties where you're still choosing are left
 * alone, so the deal never locks you out mid-basket.
 */
export function botJoinActions(state: AppState, now: number, rand: () => number): Action[] {
  const r = botTarget(state);
  const restaurant = r && restaurantOf(r);
  if (!r || !restaurant) return [];
  const name = freeBotName(r);
  if (!name) return [];

  const mains = restaurant.menu.filter((m) => m.category === "main");
  const extras = restaurant.menu.filter((m) => m.category !== "main");
  const picked: BasketLine[] = [{ itemId: mains[Math.floor(rand() * mains.length)].id, qty: 1 }];
  if (extras.length && rand() < 0.5) picked.push({ itemId: extras[Math.floor(rand() * extras.length)].id, qty: 1 });
  const basket = shapeBotBasket(r, restaurant, picked, state.demo.botWontAccept);

  const user = { userId: botId(name), name, isBot: true };
  return [
    { type: "JOIN", requestId: r.id, user },
    ...basket.flatMap((line) =>
      Array.from({ length: line.qty }, (): Action => ({ type: "ADD_ITEM", requestId: r.id, userId: user.userId, itemId: line.itemId })),
    ),
    { type: "FINALISE_ENTRY", requestId: r.id, userId: user.userId, now },
  ];
}

/**
 * Bots in parties that reached the deal respond at random moments: they accept and pay
 * in both rounds. With "a bot won't accept" on, exactly one bot declines in round 1 only,
 * so the demo shows the fallback round succeeding.
 */
export function botAcceptActions(state: AppState, now: number, rand: () => number): Action[] {
  const actions: Action[] = [];
  for (const r of state.requests) {
    const restaurant = restaurantOf(r);
    if (r.status !== "deal_achieved" || !restaurant) continue;
    const stubborn = state.demo.botWontAccept && r.round === 1 ? stubbornBot(r, restaurant)?.userId : undefined;
    for (const p of r.participants) {
      if (!p.isBot || p.paid || p.declined || rand() >= BOT_ACCEPT_CHANCE) continue;
      actions.push({ type: p.userId === stubborn ? "DECLINE" : "ACCEPT_AND_PAY", requestId: r.id, userId: p.userId, now });
    }
  }
  return actions;
}
