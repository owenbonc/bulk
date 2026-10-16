"use client";

import { Check, CreditCard } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { Button, Countdown, EASE_OUT, EXIT, Price, Sheet, formatPrice } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

/** How long the simulated card payment "processes" before it goes through. */
const PROCESSING_MS = 900;

export interface PaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  /** Your exact share in pence. */
  amount: number;
  /**
   * Acceptance round. Round 2 is the final round: any drop-out cancels the order, and the pay and
   * decline copy says so. A new round starts the sheet over.
   */
  round: number;
  /** End of the acceptance round. */
  deadline: number;
  now: number;
  onPay: () => void;
  onDecline: () => void;
}

/**
 * Simulated payment sheet for the acceptance round: demo card •••• 4242, "Pay £x", and a quiet
 * "Decline" that asks for confirmation before removing you from the order (the host too: they are
 * treated like everyone else). The body cross-fades between the two steps while the sheet's height
 * glides to the new content.
 */
export function PaySheet({ open, onOpenChange, restaurant, amount, round, deadline, now, onPay, onDecline }: PaySheetProps) {
  const finalRound = round === 2;
  const [step, setStep] = useState<"pay" | "decline">("pay");
  const [paying, setPaying] = useState(false);
  const reduce = useReducedMotion();
  const [bodyHeight, setBodyHeight] = useState<number | "auto">("auto");

  // The sheet's content mounts only while it is open, so the body is measured through a ref callback.
  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(() => setBodyHeight(node.offsetHeight));
    observer.observe(node);
    return () => {
      observer.disconnect();
      setBodyHeight("auto");
    };
  }, []);

  // Each opening, and each new round, starts on a fresh "Pay" step. The sheet usually closes through `open`
  // (after a payment, or when the round ends), which skips vaul's close callbacks, so the reset happens
  // here. Closing keeps the state, so the sheet slides away exactly as it was.
  const [session, setSession] = useState({ open, round });
  if (session.open !== open || session.round !== round) {
    setSession({ open, round });
    if (open) {
      setStep("pay");
      setPaying(false);
    }
  }

  const complete = useEffectEvent(() => {
    onPay();
    onOpenChange(false);
  });

  // The simulated card processes while the sheet is open. Closing the sheet or a new round cancels it.
  useEffect(() => {
    if (!open || !paying) return;
    const timer = window.setTimeout(() => complete(), PROCESSING_MS);
    return () => window.clearTimeout(timer);
  }, [open, paying]);

  const footer =
    step === "pay" ? (
      <div className="flex flex-col gap-1">
        <Button size="lg" block loading={paying} onClick={() => setPaying(true)}>
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
      title={step === "pay" ? "Accept and pay" : "Decline this order?"}
      description={step === "pay" ? "Simulated payment, no real money" : "You won't be charged"}
      footer={footer}
    >
      <motion.div
        className="relative overflow-hidden"
        initial={false}
        animate={{ height: bodyHeight }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <div ref={measure}>
          <AnimatePresence mode="popLayout" initial={false}>
            {step === "pay" ? (
              <motion.div
                key="pay"
                className="flex flex-col gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: EXIT }}
              >
                <div className="flex items-baseline justify-between gap-3 rounded-card bg-surface-2 p-card">
                  <span className="min-w-0 text-body text-ink-2">
                    Your share at <span className="font-semibold text-ink">{restaurant.name}</span>
                  </span>
                  <Price pence={amount} className="shrink-0 font-display text-title font-semibold text-ink" />
                </div>

                <div className="flex items-center gap-3 rounded-card border border-line p-card">
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
                  Accept within <Countdown until={deadline} now={now} className="font-semibold" /> to lock in {restaurant.deal.short}.
                  {finalRound
                    ? " This is the final round: if anyone drops out, the order is cancelled and nobody is charged."
                    : " If someone drops out, the rest get one more round. Otherwise nobody is charged."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="decline"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: EXIT }}
              >
                <p className="text-body text-ink-2">
                  You&apos;ll be taken out of this order.
                  {finalRound
                    ? " This is the final round, so the order will be cancelled for everyone."
                    : ` If the others still reach ${formatPrice(restaurant.deal.minTotal, { trim: true })} without you, they get a second round to accept.`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Sheet>
  );
}
