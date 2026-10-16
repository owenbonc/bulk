"use client";

import { MapPin } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button, EASE_OUT, EXIT, Pill, SPRING, Sheet } from "@/components/ui";
import { PinTiles } from "./DeliveryView";

/** How long the sheet takes to rise (vaul's open duration). The courier's check starts once it is up. */
export const SHEET_RISE_MS = 500;

/** How long the simulated courier takes to check your PIN. */
export const HANDOVER_MS = 1_800;

export type HandoverPhase = "showing" | "accepted";

export interface HandoverSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: HandoverPhase;
  pin: string;
  pickupName: string;
}

/**
 * The simulated PIN handover: "Show this code to your courier" with the PIN as large tiles while the
 * courier checks it (a hairline fills over HANDOVER_MS once the sheet has risen), then "Code accepted" with a
 * check that draws itself. Both phases share one height so the sheet doesn't jump between them. The sheet's
 * title names the dialog; the visible headings repeat it for sight only.
 */
export function HandoverSheet({ open, onOpenChange, phase, pin, pickupName }: HandoverSheetProps) {
  const reduce = !!useReducedMotion();
  const accepted = phase === "accepted";

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={accepted ? "Code accepted" : "Show this code to your courier"}
      hideTitle
    >
      <p className="sr-only" aria-live="polite">
        {accepted ? "Code accepted. Enjoy your meal!" : ""}
      </p>
      <div className="grid min-h-[300px] place-items-center pb-2 text-center">
        <AnimatePresence mode="wait" initial={false}>
          {accepted ? (
            <motion.div
              key="accepted"
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } }}
            >
              <SuccessMark reduce={reduce} />
              <p aria-hidden className="mt-5 font-display text-title font-semibold text-ink">
                Code accepted
              </p>
              <p className="mt-1.5 text-emphasis text-ink-2">Enjoy your meal!</p>
              <Button size="lg" className="mt-6 w-[220px]" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="showing"
              className="flex w-full flex-col items-center"
              exit={{ opacity: 0, y: reduce ? 0 : -4, transition: EXIT }}
            >
              <Pill tone="neutral">Simulated handover</Pill>
              <p aria-hidden className="mt-3 font-display text-section font-semibold text-ink">
                Show this code to your courier
              </p>
              <p className="mt-1 flex items-center gap-1 text-meta text-ink-2">
                <MapPin aria-hidden className="size-3.5 shrink-0 text-accent-ink" />
                {pickupName}
              </p>
              <div className="mt-5">
                {/* Already readable as the sheet rises: no entrance of its own. */}
                <PinTiles pin={pin} ready reduce={reduce} size="lg" animateIn={false} />
              </div>
              <div className="mt-6 w-full max-w-[220px]">
                <div className="h-1 overflow-hidden rounded-full bg-ink/[0.08]">
                  {/* Linear on purpose, and kept under reduced motion: it shows time passing, not spatial movement. */}
                  <motion.div
                    className="h-full origin-left rounded-full bg-accent"
                    initial={{ transform: "scaleX(0)" }}
                    animate={{ transform: "scaleX(1)" }}
                    transition={{ delay: SHEET_RISE_MS / 1000, duration: HANDOVER_MS / 1000, ease: "linear" }}
                  />
                </div>
                <p className="mt-2 text-meta text-ink-3">Your courier is checking the code…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}

/** Success check on a soft green disc: the disc settles in, the tick draws itself and one soft ring spreads out. */
function SuccessMark({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden className="relative grid size-24 place-items-center">
      {!reduce && (
        <motion.span
          className="absolute inset-0 rounded-full bg-success-soft"
          initial={{ opacity: 0, transform: "scale(1)" }}
          animate={{ opacity: [0, 0.5, 0], transform: ["scale(1)", "scale(1.05)", "scale(1.45)"] }}
          transition={{ duration: 0.6, times: [0, 0.15, 1], ease: EASE_OUT, delay: 0.3 }}
        />
      )}
      <motion.span
        className="relative grid size-24 place-items-center rounded-full bg-success-soft text-success"
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduce ? { duration: 0.2, ease: EASE_OUT } : SPRING}
      >
        <svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M20 6 9 17l-5-5"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.12 }}
          />
        </svg>
      </motion.span>
    </div>
  );
}
