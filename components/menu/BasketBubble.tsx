"use client";

import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { BottomBar, DealPill, SPRING_SNAPPY, formatPrice } from "@/components/ui";

export interface BasketBubbleProps {
  /** Items in your basket (sum of quantities). The bubble only shows when this is above zero. */
  count: number;
  /** Basket subtotal in pence, before the deal. */
  subtotal: number;
  /** "View basket" (join) or "Create party" (host draft). */
  label: string;
  /** Under the label, e.g. "deal not added yet". */
  note: string;
  href: string;
  dealLabel: string;
  onDealClick: () => void;
}

const tick: Variants = {
  enter: (dir: number) => ({ y: dir * 8, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir * -8, opacity: 0 }),
};

/**
 * The floating basket bubble (W3/W8): an ink capsule with the item count, the action, the running total,
 * and the Deal pill beside it. Slides up once there is something in the basket.
 */
export function BasketBubble({ count, subtotal, label, note, href, dealLabel, onDealClick }: BasketBubbleProps) {
  // Keep the last non-empty values while the bubble slides away, and remember which way the count moved.
  const [shown, setShown] = useState({ count, subtotal, dir: 1 });
  if (count > 0 && (count !== shown.count || subtotal !== shown.subtotal)) {
    setShown({ count, subtotal, dir: count >= shown.count ? 1 : -1 });
  }
  const { dir } = shown;
  const items = shown.count;
  const total = formatPrice(shown.subtotal);

  return (
    <BottomBar show={count > 0} material={false} className="flex items-center gap-2">
      <Link
        href={href}
        aria-label={`${label}, ${items} ${items === 1 ? "item" : "items"}, ${total}, ${note}`}
        className="group flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-ink pr-4 pl-2 text-bg shadow-float transition-[scale,background-color] duration-100 ease-out select-none active:scale-[0.97] active:bg-[#2c2f22] hover:bg-[#25281c]"
      >
        <span aria-hidden className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-on-accent">
          <AnimatePresence initial={false} mode="popLayout" custom={dir}>
            <motion.span
              key={items}
              custom={dir}
              variants={tick}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING_SNAPPY}
              className="tnum text-body font-bold"
            >
              {items}
            </motion.span>
          </AnimatePresence>
        </span>
        <span aria-hidden className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body leading-tight font-semibold">{label}</span>
          <span className="truncate text-caption leading-tight text-bg/70">{note}</span>
        </span>
        <span aria-hidden className="tnum shrink-0 text-body font-semibold">
          {total}
        </span>
        <ChevronRight aria-hidden className="-ml-1 size-4 shrink-0 text-bg/60 transition-transform duration-150 ease-out group-active:translate-x-0.5" />
      </Link>
      <DealPill
        label={dealLabel}
        size="lg"
        withIcon
        aria-label={`About the deal: ${dealLabel}`}
        aria-haspopup="dialog"
        onClick={onDealClick}
        className="h-14! shadow-float"
      />
    </BottomBar>
  );
}
