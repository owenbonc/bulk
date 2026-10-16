import { Info } from "lucide-react";
import { Divider, Price, SummaryRow, formatPrice } from "@/components/ui";
import type { Preview } from "@/lib/requests";
import type { Restaurant } from "@/lib/types";

/** Projected cost of your basket: food, the group deal, your share of delivery and the estimated total. */
export function PriceBreakdown({ restaurant, preview }: { restaurant: Restaurant; preview: Preview }) {
  const { subtotal, discount, delivery, total, members } = preview;

  return (
    <section aria-label="Price breakdown" className="flex flex-col gap-2.5">
      <SummaryRow label="Food" value={<Price pence={subtotal} />} />
      <SummaryRow
        label={`Group deal (${restaurant.deal.short})`}
        hint="when the party fills"
        value={<Price pence={discount} negative />}
        tone="accent"
      />
      <SummaryRow
        label="Delivery share"
        hint={
          <span className="tnum">
            {formatPrice(restaurant.deliveryFee)} ÷ {members}
          </span>
        }
        value={<Price pence={delivery} />}
      />
      <Divider className="my-1" />
      <SummaryRow label="Estimated total" value={<Price pence={total} />} strong />
      <p className="mt-1 flex items-start gap-2 text-meta text-ink-2">
        <Info aria-hidden className="mt-px size-4 shrink-0 text-ink-3" />
        Final total is confirmed when the party fills.
      </p>
    </section>
  );
}
