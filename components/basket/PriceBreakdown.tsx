import { Info } from "lucide-react";
import { Divider, Price, SummaryRow, formatPrice } from "@/components/ui";
import { targetDiscount, type Preview } from "@/lib/requests";
import type { Restaurant } from "@/lib/types";

/**
 * Projected cost of your basket: food, the group deal, your share of delivery and the estimated total.
 * The delivery split ("£3.49 ÷ 3") always shows; on your own it adds that the share drops as people join.
 */
export function PriceBreakdown({ restaurant, preview }: { restaurant: Restaurant; preview: Preview }) {
  const { subtotal, discount, delivery, total, members, discountEligible, progress } = preview;

  return (
    <section aria-label="Price breakdown" className="flex flex-col gap-2.5">
      <SummaryRow label="Food" value={<Price pence={subtotal} />} />
      {/* Eligible now vs not yet: the discount only counts once the party's finalised baskets reach the threshold. */}
      <SummaryRow
        label={`Group deal (${restaurant.deal.short})`}
        hint={
          discountEligible ? (
            "eligible now: the party reaches the threshold"
          ) : (
            <span className="tnum">
              not yet eligible · needs {formatPrice(progress.left, { trim: true })} more · then about −{formatPrice(targetDiscount(subtotal, restaurant))}
            </span>
          )
        }
        value={<Price pence={discount} negative />}
        tone={discountEligible ? "accent" : "muted"}
      />
      <SummaryRow
        label="Delivery share"
        hint={
          <span className="tnum">{`${formatPrice(restaurant.deliveryFee)} ÷ ${members}${members <= 1 ? " · drops as people join" : ""}`}</span>
        }
        value={<Price pence={delivery} />}
      />
      <Divider className="my-1" />
      <SummaryRow label="Estimated total" value={<Price pence={total} />} strong />
      <p className="mt-1 flex items-start gap-2 text-meta text-ink-2">
        <Info aria-hidden className="mt-px size-4 shrink-0 text-ink-3" />
        {discountEligible
          ? "You'll accept the exact total before paying."
          : "This is what you'd pay if the party stopped here. You'll accept the exact total before paying."}
      </p>
    </section>
  );
}
