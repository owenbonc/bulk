"use client";

import { CATALOG, ME } from "@/lib/data";
import { isHighlight, isTerminal, progressOf, useApp } from "@/lib/store";
import type { Progress } from "@/lib/requests";
import type { OrderRequest, Participant, Restaurant } from "@/lib/types";

/** A party as the Home screen shows it. */
export interface HomeParty {
  request: OrderRequest;
  restaurant: Restaurant;
  progress: Progress;
  /** Your entry, when you're in this party. */
  me?: Participant;
}

/** How long a delivered order stays on Home as "Ready to collect". */
const READY_LINGER_MS = 60 * 60_000;

function normalise(text: string): string {
  return text.toLocaleLowerCase("en-GB").normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/** Matches the restaurant name, its cuisine or any dish on its menu. */
export function matchesQuery(restaurant: Restaurant, query: string): boolean {
  const q = normalise(query);
  if (!q) return true;
  return [restaurant.name, restaurant.cuisine, ...restaurant.menu.map((m) => m.name)].some((s) => normalise(s).includes(q));
}

/** Ranking for your-party cards: pay now, then paid and waiting, then on its way, then ready, then filling. */
function urgency(p: HomeParty): number {
  const { status } = p.request;
  if (status === "deal_achieved") return p.me?.paid ? 1 : 0;
  if (status === "confirmed" || status === "preparing" || status === "out_for_delivery") return 2;
  if (status === "delivered") return 3;
  return 4;
}

export interface HomeParties {
  /** Open parties at 75% or more of their deal, closest to the deal first. */
  highlights: HomeParty[];
  /** Every other visible party: yours that have moved past filling, then those at your collection point, then closing soonest. */
  others: HomeParty[];
  /** Parties you're in that still need you (including recently delivered ones), most urgent first. Not filtered by search. */
  mine: HomeParty[];
  /** Visible parties before the search filter. */
  totalCount: number;
}

export function useHomeParties(query: string): HomeParties {
  const { state, now } = useApp();

  const all: HomeParty[] = [];
  for (const request of state.requests) {
    const restaurant = CATALOG.restaurants.find((r) => r.id === request.restaurantId);
    if (!restaurant) continue;
    const me = request.participants.find((p) => p.userId === ME.userId && !p.declined);
    all.push({ request, restaurant, progress: progressOf(request, restaurant), me });
  }

  const isOpen = (p: HomeParty) => p.request.status === "open" && p.request.expiresAt > now;
  const listed = all.filter((p) => isOpen(p) || (p.me && !isTerminal(p.request.status)));
  const matching = listed.filter((p) => matchesQuery(p.restaurant, query));

  const highlights = matching
    .filter((p) => isOpen(p) && isHighlight(p.request, p.restaurant))
    .sort((a, b) => b.progress.pct - a.progress.pct || a.request.expiresAt - b.request.expiresAt);

  const nearby = (p: HomeParty) => p.request.pickupPointId === state.location;
  const others = matching
    .filter((p) => !highlights.includes(p))
    .sort(
      (a, b) =>
        Number(isOpen(a)) - Number(isOpen(b)) ||
        Number(nearby(b)) - Number(nearby(a)) ||
        a.request.expiresAt - b.request.expiresAt,
    );

  const mine = all
    .filter((p) => {
      if (!p.me) return false;
      const { status, confirmedAt } = p.request;
      if (status === "delivered") return confirmedAt !== undefined && now - confirmedAt < READY_LINGER_MS;
      if (status === "open") return p.request.expiresAt > now;
      return !isTerminal(status);
    })
    .sort((a, b) => urgency(a) - urgency(b) || a.request.expiresAt - b.request.expiresAt);

  return { highlights, others, mine, totalCount: listed.length };
}
