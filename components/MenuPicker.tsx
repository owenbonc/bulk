import { basketTotal } from "@/lib/requests";
import { formatGBP } from "@/lib/split";
import type { BasketLine, Restaurant } from "@/lib/types";
import { Card, ProgressBar, Row } from "./ui";

interface Props {
  restaurant: Restaurant;
  basket: BasketLine[];
  onAdd: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  /** Already-queued total from other members, for the deal progress bar. */
  queued?: number;
}

/** Menu with +/− buttons and a running basket summary. */
export default function MenuPicker({ restaurant, basket, onAdd, onRemove, queued = 0 }: Props) {
  const mine = basketTotal(basket, restaurant);
  const qty = (itemId: string) => basket.find((l) => l.itemId === itemId)?.qty ?? 0;

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200">
        {restaurant.menu.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-stone-500">{formatGBP(m.price)}</p>
            </div>
            <div className="flex items-center gap-3">
              {qty(m.id) > 0 && (
                <>
                  <button aria-label={`Remove ${m.name}`} className="h-8 w-8 rounded-full border border-stone-300" onClick={() => onRemove(m.id)}>
                    −
                  </button>
                  <span className="w-4 text-center tabular-nums">{qty(m.id)}</span>
                </>
              )}
              <button aria-label={`Add ${m.name}`} className="h-8 w-8 rounded-full bg-emerald-600 text-white" onClick={() => onAdd(m.id)}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Card className="space-y-3">
        <p className="font-semibold">Your basket</p>
        {basket.length === 0 && <p className="text-sm text-stone-500">Nothing added yet.</p>}
        {basket.map((l) => {
          const m = restaurant.menu.find((x) => x.id === l.itemId)!;
          return <Row key={l.itemId} left={`${l.qty} × ${m.name}`} right={formatGBP(m.price * l.qty)} />;
        })}
        <Row left="Your subtotal" right={formatGBP(mine)} strong />
        <div className="space-y-1 pt-1">
          <ProgressBar value={queued + mine} max={restaurant.deal.minTotal} />
          <p className="text-xs text-stone-500">
            With your basket the group reaches {formatGBP(queued + mine)} of {formatGBP(restaurant.deal.minTotal)} for &ldquo;
            {restaurant.deal.label}&rdquo;.
          </p>
        </div>
      </Card>
    </div>
  );
}
