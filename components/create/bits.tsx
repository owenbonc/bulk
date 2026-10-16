import { Star, Tag } from "lucide-react";
import { DealPill, cn } from "@/components/ui";
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

/** Filled star + rating, e.g. "★ 4.7". */
export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Star aria-hidden className="size-3.5 shrink-0 fill-current text-ink" />
      <span className="sr-only">Rated </span>
      <span className="tnum">{value.toFixed(1)}</span>
    </span>
  );
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

/** The deal pill in its solid tomato form (white bold text), built on the shared DealPill. */
export function OfferDealPill({ label, className }: { label: string; className?: string }) {
  return <DealPill label={label} size="sm" className={cn("bg-offer! font-bold! text-white!", className)} />;
}

/**
 * Small marker for a restaurant that already has an open party, so the "already a party here" popup is
 * never a surprise. `overlay` is the photo-friendly version for image tiles.
 */
export function PartyOpenPill({ mine, overlay, className }: { mine?: boolean; overlay?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-caption font-semibold whitespace-nowrap",
        overlay
          ? "bg-surface/90 text-ink shadow-[0_1px_3px_rgb(27_29_20/0.18)] backdrop-blur-md [@media(prefers-reduced-transparency:reduce)]:bg-surface"
          : "bg-accent-soft text-accent-ink",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", overlay ? "bg-accent-strong" : "bg-accent-ink")} />
      {mine ? "You're in" : "Party open"}
    </span>
  );
}
