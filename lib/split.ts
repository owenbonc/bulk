import { basketTotal } from "./requests";
import type { OrderRequest, Restaurant } from "./types";

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

/** Cost split (design doc B4): discount in proportion to items, delivery fee equally. Finalised entries only. */
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

export function formatGBP(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
