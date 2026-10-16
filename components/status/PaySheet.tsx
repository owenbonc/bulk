"use client";

import { Check, CreditCard } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button, Countdown, EXIT, Price, Sheet, SPRING, formatPrice } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

/** How long the simulated card payment "processes" before it goes through. */
const PROCESSING_MS = 900;

export interface PaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  /** Your exact share in pence. */
  amount: number;
  /** End of the acceptance round. */
  deadline: number;
  now: number;
  onPay: () => void;
  onDecline: () => void;
}

/**
 * Simulated payment sheet for the acceptance round: demo card •••• 4242, "Pay £x", and a quiet
 * "Decline" that asks for confirmation before removing you from the order.
 */
export function PaySheet({ open, onOpenChange, restaurant, amount, deadline, now, onPay, onDecline }: PaySheetProps) {
  const [step, setStep] = useState<"pay" | "decline">("pay");
  const [paying, setPaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const pay = () => {
    setPaying(true);
    timer.current = window.setTimeout(() => {
      onPay();
      onOpenChange(false);
    }, PROCESSING_MS);
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setStep("pay");
    setPaying(false);
  };

  const footer =
    step === "pay" ? (
      <div className="flex flex-col gap-1">
        <Button size="lg" block loading={paying} onClick={pay}>
          Pay {formatPrice(amount)}
        </Button>
        <Button variant="danger" size="md" block disabled={paying} onClick={() => setStep("decline")}>
          Decline
        </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-1">
        <Button size="lg" block onClick={() => setStep("pay")}>
          Keep my place
        </Button>
        <Button
          variant="danger"
          size="md"
          block
          onClick={() => {
            onDecline();
            onOpenChange(false);
          }}
        >
          Decline and leave
        </Button>
      </div>
    );

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!paying) onOpenChange(next);
      }}
      dismissible={!paying}
      onClosed={reset}
      title={step === "pay" ? "Accept and pay" : "Decline this order?"}
      description="Simulated payment, no real money"
      footer={footer}
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "pay" ? (
          <motion.div
            key="pay"
            className="flex flex-col gap-3"
            initial={{ opacity: 0, transform: "translateX(-12px)" }}
            animate={{ opacity: 1, transform: "translateX(0px)", transition: SPRING }}
            exit={{ opacity: 0, transition: EXIT }}
          >
            <div className="flex items-baseline justify-between gap-4 rounded-card bg-surface-2 px-4 py-3.5">
              <span className="min-w-0 text-body text-ink-2">
                Your share at <span className="font-semibold text-ink">{restaurant.name}</span>
              </span>
              <Price pence={amount} className="shrink-0 font-display text-title font-semibold text-ink" />
            </div>

            <div className="flex items-center gap-3 rounded-card border border-line px-4 py-3">
              <span aria-hidden className="grid h-9 w-12 shrink-0 place-items-center rounded-md bg-ink text-bg">
                <CreditCard className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-ink">Demo card</p>
                <p className="tnum font-mono text-meta text-ink-2">
                  <span className="sr-only">ending in </span>•••• 4242
                </p>
              </div>
              <Check aria-hidden className="shrink-0 text-accent-ink" />
            </div>

            <p className="text-meta text-ink-2">
              Accept within <Countdown until={deadline} now={now} className="font-semibold" /> to lock in {restaurant.deal.short}. If
              someone drops out, the rest get one more round. Otherwise nobody is charged.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="decline"
            initial={{ opacity: 0, transform: "translateX(12px)" }}
            animate={{ opacity: 1, transform: "translateX(0px)", transition: SPRING }}
            exit={{ opacity: 0, transition: EXIT }}
          >
            <p className="text-body text-ink-2">
              You&apos;ll be taken out of this order and won&apos;t be charged. If the others still reach{" "}
              {formatPrice(restaurant.deal.minTotal, { trim: true })} without you, they get a second round to accept.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
