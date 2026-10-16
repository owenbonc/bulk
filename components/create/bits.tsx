import { Check, Tag } from "lucide-react";
import { Pill, cn } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

/** Best deal first: biggest discount, then the lowest threshold to reach, then the nearest. */
export function byBestDeal(a: Restaurant, b: Restaurant): number {
  return (
    b.deal.discountPct - a.deal.discountPct ||
    a.deal.minTotal - b.deal.minTotal ||
    a.distanceMiles - b.distanceMiles
  );
}

/** Lower-case and accent-free, so "taqueria" finds "Taquería". */
export function normalise(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** Matches a restaurant by name, cuisine, area or any dish on its menu. `query` is already normalised. */
export function matchesQuery(restaurant: Restaurant, query: string): boolean {
  if (!query) return true;
  const fields = [restaurant.name, restaurant.cuisine, restaurant.area, ...restaurant.menu.map((m) => m.name)];
  return fields.some((field) => normalise(field).includes(query));
}

/** "25–35 min" */
export function etaLabel(restaurant: Restaurant): string {
  return `${restaurant.etaMin[0]}–${restaurant.etaMin[1]} min`;
}

/** "£50" for whole pounds, "£42.50" otherwise. */
export function thresholdLabel(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

/** "Offer: 25% off £50" in tomato with the tag icon. */
export function OfferLine({ restaurant, className }: { restaurant: Restaurant; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 font-semibold text-offer", className)}>
      <Tag aria-hidden className="size-4 shrink-0" />
      <span className="tnum truncate">
        Offer: {restaurant.deal.short} {thresholdLabel(restaurant.deal.minTotal)}
      </span>
    </span>
  );
}

/**
 * Marker for a restaurant that already has an open party, so the "already a party here" popup is never a
 * surprise: "Party open", or "You're in" (same pill as Home) when you are a member. `overlay` lifts it off
 * a photo with the floating shadow.
 */
export function PartyOpenPill({ mine, overlay, className }: { mine?: boolean; overlay?: boolean; className?: string }) {
  return (
    <Pill
      tone="soft"
      icon={mine ? <Check aria-hidden /> : <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent-ink" />}
      className={cn(overlay && "shadow-float", className)}
    >
      {mine ? "You're in" : "Party open"}
    </Pill>
  );
}
