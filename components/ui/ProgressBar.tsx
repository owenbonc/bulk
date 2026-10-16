"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "./cn";
import { SPRING_FILL } from "./motion";

export type ProgressBarSize = "hairline" | "sm" | "md";
export type ProgressBarTone = "accent" | "ink" | "offer";

const heights: Record<ProgressBarSize, string> = {
  hairline: "h-[3px]",
  sm: "h-1.5",
  md: "h-2.5",
};

const fills: Record<ProgressBarTone, string> = {
  accent: "bg-accent",
  ink: "bg-ink",
  offer: "bg-offer",
};

export interface ProgressBarProps {
  /** Current amount, in the same unit as `max` (e.g. pence, or a 0–100 percentage). */
  value: number;
  /** Defaults to 100, so `value` can be a percentage. */
  max?: number;
  size?: ProgressBarSize;
  tone?: ProgressBarTone;
  /** Accessible name, e.g. "Deal progress". */
  label?: string;
  /** Spoken value, e.g. "£32 of £40". Defaults to the percentage. */
  valueText?: string;
  className?: string;
}

/**
 * Horizontal progress. The fill springs to new values (one of the authored moments: the party filling
 * as people join) and renders statically on first paint.
 */
export function ProgressBar({ value, max = 100, size = "sm", tone = "accent", label, valueText, className }: ProgressBarProps) {
  const reduce = useReducedMotion();
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-valuetext={valueText}
      className={cn("relative w-full overflow-hidden rounded-full bg-ink/[0.08]", heights[size], className)}
    >
      <motion.div
        className={cn("absolute inset-0 rounded-full", fills[tone])}
        initial={false}
        animate={{ transform: `translateX(${pct - 100}%)` }}
        transition={reduce ? { duration: 0 } : SPRING_FILL}
      />
    </div>
  );
}
