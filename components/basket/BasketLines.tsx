"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button, Card, EXIT, Marquee, Price, SPRING, SectionHeader, Stepper, cn, formatPrice } from "@/components/ui";
import type { BasketLine, MenuItem, Restaurant } from "@/lib/types";

export interface BasketLinesProps {
  restaurant: Restaurant;
  basket: BasketLine[];
  locked: boolean;
  onAdd: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  /** The menu this basket belongs to ("Add items"). */
  menuHref: string;
}

/**
 * "Your basket": a card of `1×  Name ……… £9.00` rows in the status page's Order card style. Tapping a row
 * swaps its price for the shared stepper, opened through its controlled `open` prop; the row folds back
 * when the stepper asks to close (3s idle, "Done", Escape, another stepper used, last one removed).
 */
export function BasketLines({ restaurant, basket, locked, onAdd, onRemove, menuHref }: BasketLinesProps) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState<string | null>(null);
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
        <Card padded={false} className="mt-2 overflow-hidden py-1">
          <ul>
            <AnimatePresence initial={false}>
              {rows.map(({ item, qty }) => (
                <motion.li key={item.id} {...rowMotion} transition={SPRING} className="overflow-hidden">
                  <BasketRow
                    item={item}
                    qty={qty}
                    locked={locked}
                    editing={!locked && editing === item.id}
                    onEditingChange={(open) =>
                      setEditing((current) => (open ? item.id : current === item.id ? null : current))
                    }
                    onAdd={() => onAdd(item.id)}
                    onRemove={() => onRemove(item.id)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      )}

      <div className="mt-group flex justify-end">
        <Button variant="secondary" size="sm" icon={<Plus />} href={menuHref}>
          Add items
        </Button>
      </div>
    </section>
  );
}

interface BasketRowProps {
  item: MenuItem;
  qty: number;
  locked: boolean;
  editing: boolean;
  onEditingChange: (open: boolean) => void;
  onAdd: () => void;
  onRemove: () => void;
}

const swap = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.12 } },
};

/**
 * One basket line. At rest the whole row is a button ("2 × Margherita, £18.00. Change quantity") sitting
 * under the visual row; editing, the price slot holds the open stepper while the quantity prefix stays and
 * counts live, with focus on its count so keyboard users land in it and return to the row when it folds.
 */
function BasketRow({ item, qty, locked, editing, onEditingChange, onAdd, onRemove }: BasketRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const hadFocus = useRef(false);
  const lineTotal = item.price * qty;
  const tappable = !locked && !editing;

  // Opening from the row button: focus follows into the stepper. Folding back with focus inside it: focus
  // returns to the row.
  useEffect(() => {
    if (editing) {
      if (!hadFocus.current) return;
      hadFocus.current = false;
      slotRef.current?.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus({ preventScroll: true });
    } else if (hadFocus.current) {
      hadFocus.current = false;
      buttonRef.current?.focus({ preventScroll: true });
    }
  }, [editing]);

  const setOpen = (open: boolean) => {
    hadFocus.current = !!rowRef.current?.contains(document.activeElement);
    onEditingChange(open);
  };

  return (
    <div ref={rowRef} className="relative">
      {tappable && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${qty} × ${item.name}, ${formatPrice(lineTotal)}. Change quantity`}
          className="absolute inset-0 transition-colors duration-100 ease-out hover:bg-surface-hover focus-visible:outline-offset-[-2px] active:bg-surface-2"
        />
      )}
      <div
        aria-hidden={tappable || undefined}
        className={cn("relative flex min-h-11 items-center gap-2.5 px-card text-body", tappable && "pointer-events-none")}
      >
        <span
          aria-hidden={editing || undefined}
          className={cn("tnum min-w-6 shrink-0 text-ink-3")}
        >
          {qty}×
        </span>
        <Marquee className="flex-1 py-2.5 text-ink">{item.name}</Marquee>
        <AnimatePresence initial={false} mode="popLayout">
          {editing ? (
            <motion.div key="stepper" ref={slotRef} {...swap} className="flex w-30 shrink-0 justify-end">
              <Stepper qty={qty} label={item.name} onAdd={onAdd} onRemove={onRemove} open onOpenChange={setOpen} />
            </motion.div>
          ) : (
            <motion.div key="price" {...swap} className="shrink-0">
              <Price pence={lineTotal} className="text-ink" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
