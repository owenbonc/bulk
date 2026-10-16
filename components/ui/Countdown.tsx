import { cn } from "./cn";
import { describeDuration, formatDuration } from "./format";

export interface CountdownProps {
  /** Deadline timestamp (ms). */
  until: number;
  /** Current time (ms): pass `now` from `useApp()` so every timer ticks on the same heartbeat. */
  now: number;
  /** Text after the clock, e.g. "left". */
  suffix?: string;
  /** Below this many ms the clock turns urgent. Defaults to 60s. Pass 0 to never turn urgent. */
  urgentBelowMs?: number;
  /**
   * Urgent colour: `offer` (default) on white or cream, `offer-ink` on tinted surfaces such as --accent-soft
   * where --offer misses 4.5:1. The urgent colour wins over a text colour passed in `className`.
   */
  urgentTone?: "offer" | "offer-ink";
  /** Use Geist Mono for the digits (PIN-like timers). */
  mono?: boolean;
  className?: string;
}

const urgentTones: Record<NonNullable<CountdownProps["urgentTone"]>, string> = {
  offer: "data-urgent:text-offer",
  "offer-ink": "data-urgent:text-offer-ink",
};

/** Live "m:ss" timer with tabular digits. Turns --offer (or --offer-ink) in the final minute. */
export function Countdown({
  until,
  now,
  suffix,
  urgentBelowMs = 60_000,
  urgentTone = "offer",
  mono = false,
  className,
}: CountdownProps) {
  const remaining = Math.max(0, until - now);
  const urgent = urgentBelowMs > 0 && remaining < urgentBelowMs;

  return (
    <span
      role="timer"
      aria-label={`${describeDuration(remaining)}${suffix ? ` ${suffix}` : ""}`}
      data-urgent={urgent || undefined}
      className={cn("tnum transition-colors duration-300", mono && "font-mono", urgentTones[urgentTone], className)}
    >
      {formatDuration(remaining)}
      {suffix ? ` ${suffix}` : null}
    </span>
  );
}
