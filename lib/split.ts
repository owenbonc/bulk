import type { BasketLine, Draft, OrderRequest, Participant, Restaurant } from "./types";

export interface CostLine {
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
}

export interface Split {
  group: CostLine;
  people: Record<string, CostLine>;
}

export interface Progress {
  /** Finalised spend counted toward the deal. */
  total: number;
  /** The deal threshold. */
  target: number;
  /** How much is still needed (0 once reached). */
  left: number;
  /** Whole percent toward the threshold, 0–100, rounded down. */
  pct: number;
}

/**
 * Your projected cost as if your basket were finalised (`CostLine` fields), plus the
 * whole projected split, how many finalised members share delivery, and the party's
 * progress including your basket. `share` is your subtotal as a fraction of the
 * threshold (the "your contribution" slice of the pie).
 */
export interface Preview extends CostLine, Split {
  members: number;
  progress: Progress;
  share: number;
}

export function basketTotal(basket: BasketLine[], restaurant: Restaurant): number {
  return basket.reduce((sum, line) => {
    const item = restaurant.menu.find((m) => m.id === line.itemId);
    return sum + (item ? item.price * line.qty : 0);
  }, 0);
}

/** Number of items in a basket (sum of quantities). */
export function basketCount(basket: BasketLine[]): number {
  return basket.reduce((n, line) => n + line.qty, 0);
}

/** Combined total of finalised baskets: what counts toward the deal. */
export function queueTotal(request: OrderRequest, restaurant: Restaurant): number {
  return request.participants.filter((p) => p.finalised).reduce((sum, p) => sum + basketTotal(p.basket, restaurant), 0);
}

export function progressOf(request: OrderRequest, restaurant: Restaurant): Progress {
  const total = queueTotal(request, restaurant);
  const target = restaurant.deal.minTotal;
  return {
    total,
    target,
    left: Math.max(0, target - total),
    pct: Math.min(100, Math.floor((total * 100) / target)),
  };
}

/**
 * Splits `amount` across `weights` in proportion, using largest-remainder so
 * the parts are whole pence and always sum exactly to `amount`.
 */
function allocate(amount: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return weights.map(() => 0);
  const exact = weights.map((w) => (amount * w) / totalWeight);
  const parts = exact.map(Math.floor);
  let left = amount - parts.reduce((a, b) => a + b, 0);
  const byRemainder = exact.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of byRemainder) {
    if (left-- <= 0) break;
    parts[i] += 1;
  }
  return parts;
}

/** Cost split: discount in proportion to items, delivery fee equally. Finalised entries only. */
export function splitCosts(request: OrderRequest, restaurant: Restaurant): Split {
  const members = request.participants.filter((p) => p.finalised);
  const subtotals = members.map((p) => basketTotal(p.basket, restaurant));
  const subtotal = subtotals.reduce((a, b) => a + b, 0);
  const discount = Math.round((subtotal * restaurant.deal.discountPct) / 100);
  const delivery = members.length ? restaurant.deliveryFee : 0;

  const discounts = allocate(discount, subtotals);
  const deliveries = allocate(delivery, members.map(() => 1));

  const people: Record<string, CostLine> = {};
  members.forEach((p, i) => {
    people[p.userId] = {
      subtotal: subtotals[i],
      discount: discounts[i],
      delivery: deliveries[i],
      total: subtotals[i] - discounts[i] + deliveries[i],
    };
  });
  return { group: { subtotal, discount, delivery, total: subtotal - discount + delivery }, people };
}

const NO_COST: CostLine = { subtotal: 0, discount: 0, delivery: 0, total: 0 };

function preview(request: OrderRequest, restaurant: Restaurant, userId: string): Preview {
  const split = splitCosts(request, restaurant);
  const mine = split.people[userId] ?? NO_COST;
  return {
    ...mine,
    group: split.group,
    people: split.people,
    members: Object.keys(split.people).length,
    progress: progressOf(request, restaurant),
    share: mine.subtotal / restaurant.deal.minTotal,
  };
}

/**
 * Your cost as if `basket` were your finalised entry in this party (deal applied,
 * delivery shared with every finalised member). An empty basket previews as zero.
 */
export function previewSplit(request: OrderRequest, restaurant: Restaurant, userId: string, basket: BasketLine[]): Preview {
  const existing = request.participants.find((p) => p.userId === userId);
  const entry: Participant = { ...(existing ?? { userId, name: "", isBot: false, paid: false, cutlery: false }), basket, finalised: true };
  const participants = existing
    ? request.participants.flatMap((p) => (p.userId !== userId ? [p] : basket.length ? [entry] : []))
    : basket.length
      ? [...request.participants, entry]
      : request.participants;
  return preview({ ...request, participants }, restaurant, userId);
}

/** The host's projected cost for a draft: the party as it will be created, with only the host in it. */
export function draftPreview(draft: Draft, restaurant: Restaurant, userId = "me"): Preview {
  const host: Participant = { userId, name: "", isBot: false, basket: draft.basket, finalised: draft.basket.length > 0, paid: false, cutlery: draft.cutlery };
  const request: OrderRequest = {
    id: "draft",
    restaurantId: restaurant.id,
    pickupPointId: draft.pickupPointId,
    hostId: userId,
    createdAt: 0,
    expiresAt: draft.durationMin * 60_000,
    status: "open",
    participants: [host],
    round: 1,
    removedUserIds: [],
    removedNames: [],
  };
  return preview(request, restaurant, userId);
}

export function formatGBP(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/** Compact form for progress copy: whole pounds drop the pence ("£8 left", "£32 / £40"), others keep them ("£7.25"). */
export function formatGBPShort(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : formatGBP(pence);
}
