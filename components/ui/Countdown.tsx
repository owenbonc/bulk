import { cn } from "./cn";
import { describeDuration, formatDuration } from "./format";

export interface CountdownProps {
  /** Deadline timestamp (ms). */
  until: number;
  /** Current time (ms): pass `now` from `useApp()` so every timer ticks on the same heartbeat. */
  now: number;
  /** Text after the clock, e.g. "left". */
  suffix?: string;
  /** Below this many ms the clock turns --offer. Defaults to 60s. Pass 0 to never turn urgent. */
  urgentBelowMs?: number;
  /** Use Geist Mono for the digits (PIN-like timers). */
  mono?: boolean;
  className?: string;
}

/** Live "m:ss" timer with tabular digits. Turns --offer in the final minute. */
export function Countdown({ until, now, suffix, urgentBelowMs = 60_000, mono = false, className }: CountdownProps) {
  const remaining = Math.max(0, until - now);
  const urgent = urgentBelowMs > 0 && remaining < urgentBelowMs;

  return (
    <span
      role="timer"
      aria-label={`${describeDuration(remaining)}${suffix ? ` ${suffix}` : ""}`}
      data-urgent={urgent || undefined}
      className={cn("tnum transition-colors duration-300", mono && "font-mono", urgent && "text-offer", className)}
    >
      {formatDuration(remaining)}
      {suffix ? ` ${suffix}` : null}
    </span>
  );
}
