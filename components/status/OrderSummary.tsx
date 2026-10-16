import { Card, Divider, Price, SummaryRow, formatPrice } from "@/components/ui";
import type { CostLine } from "@/lib/split";
import type { BasketLine, Restaurant } from "@/lib/types";

export interface OrderSummaryProps {
  restaurant: Restaurant;
  basket: BasketLine[];
  /** Your share of the party's cost. */
  cost: CostLine;
  /** Finalised members sharing the delivery fee. */
  members: number;
  /** estimate: projected while filling · exact: during the acceptance round · paid: after payment. */
  mode: "estimate" | "exact" | "paid";
}

/** Your items and what you pay: the "Order" card on the status page. */
export function OrderSummary({ restaurant, basket, cost, members, mode }: OrderSummaryProps) {
  const lines = basket.flatMap((line) => {
    const item = restaurant.menu.find((m) => m.id === line.itemId);
    return item ? [{ ...line, item }] : [];
  });

  if (mode === "paid") {
    return (
      <Card className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {lines.map(({ item, qty }) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 text-body">
              <span className="min-w-0 text-ink">{item.name}</span>
              <span className="tnum shrink-0 text-ink-2">×{qty}</span>
            </li>
          ))}
        </ul>
        <Divider />
        <SummaryRow
          label="You paid"
          value={<Price pence={cost.total} />}
          hint={cost.discount > 0 ? `You saved ${formatPrice(cost.discount)} with the deal` : undefined}
          strong
        />
      </Card>
    );
  }

  const estimate = mode === "estimate";
  return (
    <Card className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {lines.map(({ item, qty }) => (
          <li key={item.id} className="flex items-baseline gap-3 text-body">
            <span className="tnum w-6 shrink-0 text-ink-3">{qty}×</span>
            <span className="min-w-0 flex-1 text-ink">{item.name}</span>
            <Price pence={item.price * qty} className="shrink-0 text-ink" />
          </li>
        ))}
      </ul>
      <Divider />
      <div className="flex flex-col gap-2">
        <SummaryRow
          label={`Group deal (${restaurant.deal.short})`}
          hint={estimate ? "when the party fills" : undefined}
          value={<Price pence={cost.discount} negative />}
          tone="accent"
        />
        <SummaryRow
          label="Delivery share"
          hint={members > 1 ? <span className="tnum">{`${formatPrice(restaurant.deliveryFee)} ÷ ${members}`}</span> : undefined}
          value={<Price pence={cost.delivery} />}
        />
      </div>
      <Divider />
      <SummaryRow label={estimate ? "Estimated total" : "Total"} value={<Price pence={cost.total} />} strong />
      {estimate && <p className="-mt-1 text-meta text-ink-3">Final total is confirmed when the party fills.</p>}
    </Card>
  );
}
