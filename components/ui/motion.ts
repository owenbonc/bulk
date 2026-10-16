import type { Transition } from "motion/react";

/** Default UI spring: critically damped, no overshoot. */
export const SPRING: Transition = { type: "spring", bounce: 0, duration: 0.4 };

/** Snappy spring for small controls (stepper, pills). */
export const SPRING_SNAPPY: Transition = { type: "spring", bounce: 0, duration: 0.3 };

/** Progress filling as people join: a touch of life, settles quickly. */
export const SPRING_FILL: Transition = { type: "spring", bounce: 0.15, duration: 0.9 };

/** Quick exit, always faster than the entrance. */
export const EXIT: Transition = { duration: 0.15, ease: [0.23, 1, 0.32, 1] };

/** Strong ease-out curve, matching the --ease-out token. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
