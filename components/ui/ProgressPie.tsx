"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "./cn";
import { SPRING_FILL } from "./motion";

export interface ProgressPieProps {
  /** Progress including any contribution, in the same unit as `max` (pence, or a 0–100 percentage). */
  value: number;
  /** Defaults to 100, so `value` can be a percentage. */
  max?: number;
  /** "Your contribution": the last part of `value`, drawn as an --offer slice. Same unit as `value`. */
  contribution?: number;
  /** Diameter in px. */
  size?: number;
  /** Accessible description, e.g. "75% filled". Defaults to the percentage. */
  label?: string;
  className?: string;
}

const C = 16; // centre of the 32-unit viewBox

/**
 * Pie chart of progress towards the deal. Filled in --accent from 12 o'clock, clockwise; an optional
 * --offer slice marks your contribution. Springs to new values, static on first paint.
 */
export function ProgressPie({ value, max = 100, contribution = 0, size = 28, label, className }: ProgressPieProps) {
  const reduce = useReducedMotion();
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const p = max > 0 ? clamp(value / max) : 0;
  const c = max > 0 ? Math.min(p, clamp(contribution / max)) : 0;
  const transition = reduce ? { duration: 0 } : SPRING_FILL;

  return (
    <svg
      role="img"
      aria-label={label ?? `${Math.round(p * 100)}% filled`}
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
        animate={{ pathLength: p, opacity: p > 0 ? 1 : 0 }}
        transition={transition}
      />
      <motion.circle
        cx={C}
        cy={C}
        r={8}
        fill="none"
        stroke="var(--offer)"
        strokeWidth={16}
        initial={false}
        animate={{ pathLength: c, pathOffset: p - c, opacity: c > 0 ? 1 : 0 }}
        transition={transition}
      />
      <circle cx={C} cy={C} r={15.5} fill="none" strokeWidth={1} className="stroke-ink/12" />
    </svg>
  );
}
