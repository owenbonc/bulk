"use client";

import { BottomBar, Button, formatPrice } from "@/components/ui";

export interface BasketCtaProps {
  /** Action label: "Join party" / "Create party". */
  label: string;
  /** Shown instead of the label while the basket is empty. */
  emptyLabel: string;
  /** Estimated total in pence, shown on the lime chip. */
  total: number;
  /** Nothing in the basket: the button is disabled and shows `emptyLabel`. */
  empty: boolean;
  /** The party can no longer take this action (closed, or already submitted). */
  disabled?: boolean;
  /** Submitting: shows a spinner and ignores further presses. */
  busy?: boolean;
  onPress: () => void;
}

/**
 * Floating bottom action for the basket: the 52px clear-glass button with the label on the left and the
 * estimated total on a lime chip, on its own above the home indicator (no bar or band behind it).
 */
export function BasketCta({ label, emptyLabel, total, empty, disabled = false, busy = false, onPress }: BasketCtaProps) {
  const price = formatPrice(total);

  return (
    <BottomBar material={false}>
      {empty ? (
        <Button variant="glass" block disabled>
          {emptyLabel}
        </Button>
      ) : (
        <Button
          variant="glass"
          block
          chip={price}
          disabled={disabled}
          loading={busy}
          aria-label={`${label}, ${price} estimated`}
          onClick={onPress}
        >
          {label}
        </Button>
      )}
    </BottomBar>
  );
}
