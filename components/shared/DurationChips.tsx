"use client";

import { useRef } from "react";
import { cn } from "@/components/ui";
import { PARTY_DURATIONS } from "@/lib/data";

/** The option a radio-group key moves to, wrapping at both ends; null for keys the group ignores. */
export function radioKeyIndex(key: string, index: number, count: number): number | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return (index - 1 + count) % count;
    case "ArrowRight":
    case "ArrowDown":
      return (index + 1) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

export interface DurationChipsProps {
  /** The lengths to offer, in minutes (default PARTY_DURATIONS, 10/15/30/60). */
  options?: readonly number[];
  /** Selected length in minutes (one of `options`). */
  value: number;
  onChange: (min: number) => void;
  /** Id of the element that names the group, e.g. the "Party lasts" heading. */
  labelledBy?: string;
  /** Accessible name when there is no visible heading. */
  label?: string;
}

/**
 * How long a party stays open: one chip per length as a radio group. Arrow keys and Home/End move the
 * selection; only the checked chip is a tab stop. Used by the host settings sheet (10/15/30/60) and the
 * "Start a new party with your basket" card (RETRY_DURATIONS).
 */
export function DurationChips({ options = PARTY_DURATIONS, value, onChange, labelledBy, label }: DurationChipsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, options.indexOf(value));

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      onKeyDown={(e) => {
        const next = radioKeyIndex(e.key, index, options.length);
        if (next === null) return;
        e.preventDefault();
        onChange(options[next]);
        refs.current[next]?.focus();
      }}
    >
      {options.map((min, i) => {
        const selected = min === value;
        return (
          <button
            key={min}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === index ? 0 : -1}
            aria-label={`${min} minutes`}
            onClick={() => onChange(min)}
            className={cn(
              "flex h-14 flex-col items-center justify-center rounded-chip transition-[scale,background-color,box-shadow] duration-100 ease-out active:scale-[0.97]",
              selected ? "bg-accent text-on-accent" : "bg-surface text-ink ring-1 ring-line ring-inset hover:bg-surface-hover",
            )}
          >
            <span className="tnum font-display text-section leading-none font-semibold">{min}</span>
            <span className={cn("mt-0.5 text-caption", selected ? "text-on-accent" : "text-ink-2")}>min</span>
          </button>
        );
      })}
    </div>
  );
}
