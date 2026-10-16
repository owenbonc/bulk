"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "./cn";
import { lockMinePhase } from "./minePhase";
import { SPRING_FILL } from "./motion";

export type ProgressBarSize = "hairline" | "sm" | "md";
export type ProgressBarTone = "accent" | "ink" | "offer";

const heights: Record<ProgressBarSize, string> = {
  hairline: "h-[3px]",
  sm: "h-1.5",
  md: "h-2",
};

const fills: Record<ProgressBarTone, string> = {
  accent: "bg-accent",
  ink: "bg-ink",
  offer: "bg-offer",
};

export interface ProgressBarProps {
  /** Current amount including your contribution, in the same unit as `max` (e.g. pence, or a 0–100 percentage). */
  value: number;
  /** Defaults to 100, so `value` can be a percentage. */
  max?: number;
  /**
   * Your contribution: the last part of `value` (your basket's share), drawn as a gently pulsing --mine
   * yellow segment after the party's fill. Same unit as `value`.
   */
  contribution?: number;
  size?: ProgressBarSize;
  tone?: ProgressBarTone;
  /** Accessible name, e.g. "Deal progress". */
  label?: string;
  /** Spoken value, e.g. "£32 of £40". Defaults to the percentage. */
  valueText?: string;
  className?: string;
}

/**
 * Horizontal progress. The fill springs to new values (one of the authored moments: the party filling as
 * people join) and renders statically on first paint. With `contribution`, your share continues the fill
 * as a pulsing --mine segment (static under reduced motion).
 */
export function ProgressBar({
  value,
  max = 100,
  contribution,
  size = "sm",
  tone = "accent",
  label,
  valueText,
  className,
}: ProgressBarProps) {
  const reduce = useReducedMotion();
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  const pct = max > 0 ? clamp((value / max) * 100) : 0;
  const othersPct = max > 0 ? clamp(((value - (contribution ?? 0)) / max) * 100) : 0;
  const transition = reduce ? { duration: 0 } : SPRING_FILL;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-valuetext={valueText}
      className={cn("relative w-full overflow-hidden rounded-full bg-ink/8", heights[size], className)}
    >
      {/* Your segment runs under the party's fill to the full value, so only its last part shows. */}
      {contribution !== undefined && (
        <motion.div
          ref={lockMinePhase}
          className="absolute inset-0 animate-mine rounded-full bg-mine"
          initial={false}
          animate={{ transform: `translateX(${pct - 100}%)` }}
          transition={transition}
        />
      )}
      <motion.div
        className={cn("absolute inset-0 rounded-full", fills[tone])}
        initial={false}
        animate={{ transform: `translateX(${othersPct - 100}%)` }}
        transition={transition}
      />
    </div>
  );
}
