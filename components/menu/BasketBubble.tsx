"use client";

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
  /** Short line under the label: "Deal not added yet" or "Unlocks the deal". */
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
 * The floating basket bubble (W3/W8): one ink capsule in two segments. The left segment links to the
 * basket (count badge, label and total on the first line, the deal note under them); the right segment is
 * the compact Deal pill, which opens the deal sheet. Sized so nothing truncates on a 375px phone: at the
 * widest ("Create party", "£100.00") the left segment needs about 228px and the pill segment 106px of the
 * 343px row. Slides up once there is something in the basket.
 */
export function BasketBubble({ count, subtotal, label, note, href, dealLabel, onDealClick }: BasketBubbleProps) {
  // Keep the last non-empty values while the bubble slides away, and remember which way the count moved.
  const [shown, setShown] = useState({ count, subtotal, note, dir: 1 });
  if (count > 0 && (count !== shown.count || subtotal !== shown.subtotal || note !== shown.note)) {
    setShown({ count, subtotal, note, dir: count >= shown.count ? 1 : -1 });
  }
  const { dir } = shown;
  const items = shown.count;
  const total = formatPrice(shown.subtotal);

  return (
    <BottomBar show={count > 0} material={false}>
      <div className="flex h-14 items-center rounded-full bg-ink text-bg shadow-float transition-[scale] duration-100 ease-out has-[a:active]:scale-[0.97]">
        <Link
          href={href}
          aria-label={`${label}, ${items} ${items === 1 ? "item" : "items"}, ${total}. ${shown.note}`}
          className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-full pr-3 pl-2 transition-colors duration-100 ease-out select-none focus-visible:outline-accent focus-visible:-outline-offset-4 active:bg-bg/10 hover:bg-bg/[0.06]"
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
          <span aria-hidden className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-nowrap">
            <span className="flex items-baseline justify-between gap-2 text-body leading-tight font-semibold">
              <span>{label}</span>
              <span className="tnum">{total}</span>
            </span>
            <span className="text-caption leading-tight text-bg/70">{shown.note}</span>
          </span>
        </Link>
        <DealPill
          label={dealLabel}
          withIcon
          aria-label={`About the deal: ${dealLabel}`}
          aria-haspopup="dialog"
          onClick={onDealClick}
          className="mr-3"
        />
      </div>
    </BottomBar>
  );
}
