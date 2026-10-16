"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button, EXIT, Price, SPRING, SectionHeader, Stepper, formatPrice } from "@/components/ui";
import type { BasketLine, Restaurant } from "@/lib/types";

export interface BasketLinesProps {
  restaurant: Restaurant;
  basket: BasketLine[];
  locked: boolean;
  onAdd: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  /** Back to the menu. */
  onAddItems: () => void;
}

/** "Your basket": one row per item with the shared stepper, then "Add items" back to the menu. */
export function BasketLines({ restaurant, basket, locked, onAdd, onRemove, onAddItems }: BasketLinesProps) {
  const reduce = useReducedMotion();
  const rows = basket.flatMap((line) => {
    const item = restaurant.menu.find((m) => m.id === line.itemId);
    return item ? [{ item, qty: line.qty }] : [];
  });

  const rowMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: EXIT } }
    : {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: "auto" },
        exit: { opacity: 0, height: 0, transition: { ...EXIT, duration: 0.2 } },
      };

  return (
    <section aria-labelledby="basket-heading">
      <SectionHeader id="basket-heading" title="Your basket" />

      {rows.length === 0 ? (
        <p className="mt-1 text-body text-ink-2">Nothing in here yet. Pick something from the menu or an add on below.</p>
      ) : (
        <ul className="mt-1">
          <AnimatePresence initial={false}>
            {rows.map(({ item, qty }) => (
              <motion.li key={item.id} {...rowMotion} transition={SPRING} className="overflow-hidden">
                <div className="flex min-h-16 items-center gap-3 border-b border-line py-3">
                  <div className="min-w-0 flex-1 pr-[72px]">
                    <p className="truncate text-body font-medium text-ink">{item.name}</p>
                    <p className="tnum text-meta text-ink-2">
                      <Price pence={item.price * qty} />
                      {qty > 1 && <span className="text-ink-3"> · {formatPrice(item.price)} each</span>}
                    </p>
                  </div>
                  <Stepper
                    qty={qty}
                    label={item.name}
                    disabled={locked}
                    onAdd={() => onAdd(item.id)}
                    onRemove={() => onRemove(item.id)}
                  />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div className="mt-3 flex justify-end">
        <Button variant="secondary" size="sm" icon={<Plus />} onClick={onAddItems}>
          Add items
        </Button>
      </div>
    </section>
  );
}
