"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Button, Card, EXIT, Price, SPRING, SectionHeader, Stepper, cn, formatPrice } from "@/components/ui";
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
 * swaps its price for the shared stepper, already expanded; it folds back when the stepper collapses.
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
        <Card padded={false} className="mt-2 overflow-hidden py-1.5">
          <ul>
            <AnimatePresence initial={false}>
              {rows.map(({ item, qty }) => (
                <motion.li key={item.id} {...rowMotion} transition={SPRING} className="overflow-hidden">
                  <BasketRow
                    item={item}
                    qty={qty}
                    locked={locked}
                    editing={!locked && editing === item.id}
                    onEdit={() => setEditing(item.id)}
                    onDone={() => setEditing((current) => (current === item.id ? null : current))}
                    onAdd={() => onAdd(item.id)}
                    onRemove={() => {
                      if (qty === 1) setEditing(null);
                      onRemove(item.id);
                    }}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>
      )}

      <div className="mt-3 flex justify-end">
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
  onEdit: () => void;
  onDone: () => void;
  onAdd: () => void;
  onRemove: () => void;
}

/**
 * One basket line. At rest the whole row is a button ("2 × Margherita, £18.00. Change quantity") sitting
 * under the visual row; editing, the quantity prefix fades and the price slot holds the stepper.
 */
function BasketRow({ item, qty, locked, editing, onEdit, onDone, onAdd, onRemove }: BasketRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  const lineTotal = item.price * qty;
  const tappable = !locked && !editing;

  // Folding back while focus was in the stepper: put focus on the row so keyboard users keep their place.
  useEffect(() => {
    if (editing || !refocus.current) return;
    refocus.current = false;
    buttonRef.current?.focus({ preventScroll: true });
  }, [editing]);

  const collapse = () => {
    refocus.current = !!rowRef.current?.contains(document.activeElement);
    onDone();
  };

  return (
    <div ref={rowRef} className="relative">
      {tappable && (
        <button
          ref={buttonRef}
          type="button"
          onClick={onEdit}
          aria-label={`${qty} × ${item.name}, ${formatPrice(lineTotal)}. Change quantity`}
          className="absolute inset-0 transition-colors duration-100 ease-out hover:bg-surface-hover focus-visible:outline-offset-[-2px] active:bg-surface-2"
        />
      )}
      <div
        aria-hidden={tappable || undefined}
        className={cn("relative flex min-h-11 items-center gap-3 px-4 text-body", tappable && "pointer-events-none")}
      >
        <span
          aria-hidden={editing || undefined}
          className={cn("tnum w-6 shrink-0 text-ink-3 transition-opacity duration-150 ease-out", editing && "opacity-0")}
        >
          {qty}×
        </span>
        <span className="min-w-0 flex-1 py-2.5 text-ink">{item.name}</span>
        {editing ? (
          <QuantityEditor label={item.name} qty={qty} onAdd={onAdd} onRemove={onRemove} onCollapse={collapse} />
        ) : (
          <Price pence={lineTotal} className="shrink-0 text-ink" />
        )}
      </div>
    </div>
  );
}

/**
 * The shared Stepper in a slot as wide as its expanded pill (md: 132px), opened on arrival with focus on
 * its count. Reports `onCollapse` when the stepper folds (3s idle, "Done", Escape, or another stepper used).
 */
function QuantityEditor({
  label,
  qty,
  onAdd,
  onRemove,
  onCollapse,
}: {
  label: string;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onCollapse: () => void;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const collapsed = useEffectEvent(onCollapse);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const count = () => slot.querySelector<HTMLButtonElement>("button[aria-expanded]");

    const button = count();
    if (button?.getAttribute("aria-expanded") === "false") {
      button.focus({ preventScroll: true });
      button.click();
    }

    const observer = new MutationObserver(() => {
      if (count()?.getAttribute("aria-expanded") === "false") collapsed();
    });
    observer.observe(slot, { subtree: true, attributes: true, attributeFilter: ["aria-expanded"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={slotRef} className="flex w-[132px] shrink-0 justify-end">
      <Stepper qty={qty} label={label} onAdd={onAdd} onRemove={onRemove} />
    </div>
  );
}
