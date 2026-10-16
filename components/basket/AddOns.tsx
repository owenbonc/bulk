"use client";

import { ImageFrame, Marquee, Price, SectionHeader, Stepper } from "@/components/ui";
import type { BasketLine, Restaurant } from "@/lib/types";

export interface AddOnsProps {
  restaurant: Restaurant;
  basket: BasketLine[];
  locked: boolean;
  onAdd: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

/** "Add ons": a snap carousel of the restaurant's sides and drinks, each with the shared stepper. */
export function AddOns({ restaurant, basket, locked, onAdd, onRemove }: AddOnsProps) {
  const items = restaurant.menu.filter((m) => m.category === "side" || m.category === "drink");
  if (items.length === 0) return null;
  const qtyOf = (id: string) => basket.find((l) => l.itemId === id)?.qty ?? 0;

  return (
    <section aria-labelledby="addons-heading">
      <SectionHeader id="addons-heading" title="Add ons" />
      <ul className="no-scrollbar -mx-gutter mt-2 flex snap-x snap-mandatory scroll-px-gutter gap-group overflow-x-auto overscroll-x-contain px-gutter pb-1 [touch-action:pan-x_pan-y]">
        {items.map((item) => (
          <li key={item.id} className="w-30 shrink-0 snap-start">
            <ImageFrame src={item.image} alt={item.name} ratio="1/1" emoji={restaurant.emoji} sizes="120px">
              <Stepper
                qty={qtyOf(item.id)}
                label={item.name}
                size="sm"
                variant="glass"
                disabled={locked}
                onAdd={() => onAdd(item.id)}
                onRemove={() => onRemove(item.id)}
                className="absolute right-2 bottom-2"
              />
            </ImageFrame>
            <Marquee as="p" className="mt-1.5 text-body font-medium text-ink">
              {item.name}
            </Marquee>
            <Price pence={item.price} originalPence={item.originalPrice} className="text-meta text-ink-2" />
          </li>
        ))}
      </ul>
    </section>
  );
}
