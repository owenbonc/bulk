"use client";

import { CATALOG, ME } from "@/lib/data";
import { hasCollected, isActiveFor, isHighlight, progressOf, useApp } from "@/lib/store";
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
  /** Every other visible party: yours that have moved past filling (including delivered ones you haven't collected), then those at your collection point, then closing soonest. */
  others: HomeParty[];
  /** Parties you're in that still need you (including delivered ones you haven't collected), most urgent first. Not filtered by search. */
  mine: HomeParty[];
  /** Delivered parties you've collected, so the your-party card can see one off. */
  collected: HomeParty[];
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
  const stillYours = (p: HomeParty) => isActiveFor(p.request, now);
  const listed = all.filter((p) => isOpen(p) || stillYours(p));
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
    .filter(stillYours)
    .sort((a, b) => urgency(a) - urgency(b) || a.request.expiresAt - b.request.expiresAt);

  const collected = all.filter((p) => p.request.status === "delivered" && hasCollected(p.request));

  return { highlights, others, mine, collected, totalCount: listed.length };
}
