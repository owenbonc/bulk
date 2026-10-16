import { Check, Tag } from "lucide-react";
import { Marquee, Pill, cn } from "@/components/ui";
import { deliveryEta, restaurantMiles } from "@/lib/geo";
import type { PickupPoint, Restaurant } from "@/lib/types";

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

/** "18–28 min": the delivery window from the restaurant to a collection point. */
export function etaLabel(restaurant: Restaurant, point: PickupPoint): string {
  const [lo, hi] = deliveryEta(restaurant, point);
  return `${lo}–${hi} min`;
}

/** "0.4 mi" from a collection point. */
export function milesLabel(restaurant: Restaurant, point: PickupPoint): string {
  return `${restaurantMiles(restaurant, point).toFixed(1)} mi`;
}

/** "£50" for whole pounds, "£42.50" otherwise. */
export function thresholdLabel(pence: number): string {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`;
}

/** "Offer: 25% off £50" in tomato with the tag icon; scrolls (Marquee) if the column is too narrow. */
export function OfferLine({ restaurant, className }: { restaurant: Restaurant; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1 font-semibold text-offer", className)}>
      <Tag aria-hidden className="size-3.5 shrink-0" />
      <Marquee className="tnum">
        Offer: {restaurant.deal.short} {thresholdLabel(restaurant.deal.minTotal)}
      </Marquee>
    </span>
  );
}

/**
 * Marker for a restaurant that already has an open party at your location, so the "already a party here" popup is never a
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
