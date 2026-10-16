import { Price, SummaryRow, formatPrice } from "@/components/ui";
import { targetDiscount } from "@/lib/split";
import type { Restaurant } from "@/lib/types";

export interface DealRowProps {
  restaurant: Restaurant;
  /** Your food subtotal (pence): the saving is worked out from it. */
  subtotal: number;
  /** The discount that applies right now (pence); zero until the deal unlocks. */
  discount: number;
  /** The party's finalised baskets meet the threshold, so the discount applies. */
  eligible: boolean;
  /** How far the party is from the threshold (pence). */
  left: number;
}

/**
 * The "Group deal" line of a price breakdown. Before the party's finalised baskets reach the threshold it
 * says when it unlocks and what you'd save, in muted ink ("Unlocks at £50 · £11 to go" · "−£2.88 when it
 * unlocks"); once eligible it reads "Unlocked" with the saving in accent.
 */
export function DealRow({ restaurant, subtotal, discount, eligible, left }: DealRowProps) {
  const threshold = formatPrice(restaurant.deal.minTotal, { trim: true });
  return (
    <SummaryRow
      label={`Group deal (${restaurant.deal.short})`}
      hint={eligible ? "Unlocked" : <span className="tnum">{`Unlocks at ${threshold} · ${formatPrice(left, { trim: true })} to go`}</span>}
      value={
        eligible ? (
          <Price pence={discount} negative />
        ) : (
          <>
            <Price pence={targetDiscount(subtotal, restaurant)} negative /> when it unlocks
          </>
        )
      }
      tone={eligible ? "accent" : "muted"}
    />
  );
}

/** The calm note under an estimated total. */
export function estimateNote(eligible: boolean): string {
  return eligible
    ? "You'll confirm the exact total before paying."
    : "This is your price if the party stopped now. You'll confirm the exact total before paying.";
}
