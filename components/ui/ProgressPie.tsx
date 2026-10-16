"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "./cn";
import { lockMinePhase } from "./minePhase";
import { SPRING_FILL } from "./motion";

export interface ProgressPieProps {
  /** Progress including your contribution, in the same unit as `max` (pence, or a 0–100 percentage). */
  value: number;
  /** Defaults to 100, so `value` can be a percentage. */
  max?: number;
  /**
   * Your contribution: the last part of `value` (your basket's share), drawn as a gently pulsing --mine
   * yellow slice after the party's lime. Same unit as `value`.
   */
  contribution?: number;
  /** Diameter in px. */
  size?: number;
  /** Accessible description, e.g. "75% filled". Defaults to the percentage. */
  label?: string;
  className?: string;
}

const C = 16; // centre of the 32-unit viewBox

/**
 * Pie chart of progress towards the deal: the party's spend in --accent from 12 o'clock, clockwise, then
 * your contribution as a pulsing --mine slice (static under reduced motion). Springs to new values, static
 * on first paint.
 */
export function ProgressPie({ value, max = 100, contribution = 0, size = 28, label, className }: ProgressPieProps) {
  const reduce = useReducedMotion();
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const total = max > 0 ? clamp(value / max) : 0;
  const others = max > 0 ? Math.min(total, clamp((value - contribution) / max)) : 0;
  const mine = total - others;
  const transition = reduce ? { duration: 0 } : SPRING_FILL;

  return (
    <svg
      role="img"
      aria-label={label ?? `${Math.round(total * 100)}% filled`}
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0 -rotate-90", className)}
    >
      <circle cx={C} cy={C} r={16} className="fill-ink/8" />
      {/* A circle of radius 8 stroked 16 wide paints a full disc; pathLength turns the stroke into a wedge. */}
      <motion.circle
        cx={C}
        cy={C}
        r={8}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={16}
        initial={false}
        animate={{ pathLength: others, opacity: others > 0 ? 1 : 0 }}
        transition={transition}
      />
      <g ref={lockMinePhase} className="animate-mine">
        <motion.circle
          cx={C}
          cy={C}
          r={8}
          fill="none"
          stroke="var(--mine)"
          strokeWidth={16}
          initial={false}
          animate={{ pathLength: mine, pathOffset: others, opacity: mine > 0 ? 1 : 0 }}
          transition={transition}
        />
      </g>
      <circle cx={C} cy={C} r={15.5} fill="none" strokeWidth={1} className="stroke-ink/12" />
    </svg>
  );
}

export interface LegendDotProps {
  /** `mine` (your contribution, pulsing yellow), `accent` (the party's lime) or `track` (still to go). */
  tone?: "mine" | "accent" | "track";
  className?: string;
}

/** 8px legend dot matching a ProgressPie/ProgressBar segment, e.g. beside "Your basket £9.00". */
export function LegendDot({ tone = "mine", className }: LegendDotProps) {
  return (
    <span
      ref={tone === "mine" ? lockMinePhase : undefined}
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        tone === "mine" && "animate-mine bg-mine",
        tone === "accent" && "bg-accent",
        tone === "track" && "bg-ink/8 ring-1 ring-ink/12 ring-inset",
        className,
      )}
    />
  );
}
