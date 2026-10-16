"use client";

import { LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { BottomBar, SPRING_SNAPPY, cn, formatPrice } from "@/components/ui";
import styles from "./basket.module.css";

export interface BasketCtaProps {
  /** Action label: "Join party" / "Create party". */
  label: string;
  /** Shown instead of the label while the basket is empty. */
  emptyLabel: string;
  /** Estimated total in pence, shown on the lime chip. */
  total: number;
  /** Nothing in the basket: the button is inert and quiet. */
  empty: boolean;
  /** The party can no longer take this action (closed, or already submitted). */
  disabled?: boolean;
  /** Submitting: shows a spinner on the chip and ignores further presses. */
  busy?: boolean;
  onPress: () => void;
}

/**
 * Fixed bottom action for the basket: a 56px clear-glass pill with the label on the left and the estimated
 * total on a lime chip on the right. Content scrolling underneath fades out into the cream.
 */
export function BasketCta({ label, emptyLabel, total, empty, disabled = false, busy = false, onPress }: BasketCtaProps) {
  const inert = empty || disabled;
  const price = formatPrice(total);

  return (
    <BottomBar material={false}>
      <div aria-hidden className={cn(styles.fade, "absolute inset-x-0 -top-6 bottom-0 -z-10 pointer-events-none!")} />
      <button
        type="button"
        aria-disabled={inert || undefined}
        aria-busy={busy || undefined}
        aria-label={inert ? undefined : `${label}, ${price} estimated`}
        onClick={() => {
          if (inert || busy) return;
          onPress();
        }}
        className={cn(
          styles.glass,
          "flex h-14 w-full items-center gap-3 rounded-full transition-[scale,background-color] duration-100 ease-out",
          inert ? "cursor-not-allowed justify-center px-6" : "justify-between pr-2 pl-6 active:scale-[0.97]",
        )}
      >
        <span className={cn("truncate text-emphasis font-bold", inert ? "w-full text-center font-semibold text-ink-3" : "text-ink")}>
          {empty ? emptyLabel : label}
        </span>
        {!inert && (
          <span className="tnum relative grid h-10 min-w-[84px] shrink-0 place-items-center overflow-hidden rounded-full bg-accent px-4 text-emphasis font-bold text-on-accent">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={busy ? "busy" : price}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={SPRING_SNAPPY}
                className="grid place-items-center"
              >
                {busy ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : price}
              </motion.span>
            </AnimatePresence>
          </span>
        )}
      </button>
    </BottomBar>
  );
}
