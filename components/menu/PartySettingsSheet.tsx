"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Pill, Sheet, cn } from "@/components/ui";
import { CATALOG, PARTY_DURATIONS } from "@/lib/data";
import type { SettingsFocus } from "./InfoBubble";

export interface PartySettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationMin: number;
  pickupPointId: string;
  /** Which section was tapped; the sheet brings it into view. */
  focus: SettingsFocus;
  /** Your current location, tagged "You're here". */
  locationId: string;
  /** This restaurant already has an open party collecting at the point (one per restaurant per point). */
  hasPartyAt: (pickupPointId: string) => boolean;
  onApply: (settings: { durationMin: number; pickupPointId: string }) => void;
}

const DURATIONS: readonly number[] = PARTY_DURATIONS;

/** The option a radio-group key moves to, wrapping at both ends; null for keys the group ignores. */
function radioKeyIndex(key: string, index: number, count: number): number | null {
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

/**
 * W7: how long the party stays open and where the order is delivered. Points where this restaurant already
 * has a party carry a "Party open" pill (creating there offers to join it instead). Nothing changes until Apply.
 */
export function PartySettingsSheet({
  open,
  onOpenChange,
  durationMin,
  pickupPointId,
  focus,
  locationId,
  hasPartyAt,
  onApply,
}: PartySettingsSheetProps) {
  const [duration, setDuration] = useState(durationMin);
  const [pickup, setPickup] = useState(pickupPointId);
  const pickupRef = useRef<HTMLDivElement>(null);
  const durationRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pickupRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const durationIndex = Math.max(0, DURATIONS.indexOf(duration));
  const pickupIndex = Math.max(0, CATALOG.pickupPoints.findIndex((p) => p.id === pickup));

  // Start from the saved settings every time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDuration(durationMin);
      setPickup(pickupPointId);
    }
  }

  useEffect(() => {
    if (!open || focus !== "pickup") return;
    const id = window.requestAnimationFrame(() => pickupRef.current?.scrollIntoView({ block: "nearest" }));
    return () => window.cancelAnimationFrame(id);
  }, [open, focus]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Party settings"
      description="Everyone who joins collects from the same place."
      footer={
        <Button
          block
          size="lg"
          onClick={() => {
            onApply({ durationMin: duration, pickupPointId: pickup });
            onOpenChange(false);
          }}
        >
          Apply
        </Button>
      }
    >
      <div className="flex flex-col gap-section pt-1">
        <section aria-labelledby="party-lasts" className="flex flex-col gap-group">
          <h3 id="party-lasts" className="font-sans text-body font-semibold text-ink">
            Party lasts
          </h3>
          {/* Arrow keys move the selection; only the checked option is a tab stop. */}
          <div
            role="radiogroup"
            aria-labelledby="party-lasts"
            className="grid grid-cols-4 gap-2"
            onKeyDown={(e) => {
              const next = radioKeyIndex(e.key, durationIndex, DURATIONS.length);
              if (next === null) return;
              e.preventDefault();
              setDuration(DURATIONS[next]);
              durationRefs.current[next]?.focus();
            }}
          >
            {DURATIONS.map((min, i) => {
              const selected = min === duration;
              return (
                <button
                  key={min}
                  ref={(el) => {
                    durationRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={i === durationIndex ? 0 : -1}
                  aria-label={`${min} minutes`}
                  onClick={() => setDuration(min)}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center rounded-chip transition-[scale,background-color,box-shadow] duration-150 ease-out active:scale-[0.96]",
                    selected
                      ? "bg-accent text-on-accent"
                      : "bg-surface text-ink ring-1 ring-line ring-inset hover:bg-surface-hover",
                  )}
                >
                  <span className="tnum font-display text-section leading-none font-semibold">{min}</span>
                  <span className={cn("mt-0.5 text-caption", selected ? "text-on-accent" : "text-ink-2")}>min</span>
                </button>
              );
            })}
          </div>
          <p className="text-meta text-ink-2">If the deal isn&apos;t reached in time, the party closes and nobody is charged.</p>
        </section>

        <section ref={pickupRef} aria-labelledby="collect-from" className="flex scroll-mt-4 flex-col gap-group">
          <h3 id="collect-from" className="font-sans text-body font-semibold text-ink">
            Collection point
          </h3>
          <div
            role="radiogroup"
            aria-labelledby="collect-from"
            className="flex flex-col gap-2"
            onKeyDown={(e) => {
              const next = radioKeyIndex(e.key, pickupIndex, CATALOG.pickupPoints.length);
              if (next === null) return;
              e.preventDefault();
              setPickup(CATALOG.pickupPoints[next].id);
              pickupRefs.current[next]?.focus();
            }}
          >
            {CATALOG.pickupPoints.map((point, i) => {
              const selected = point.id === pickup;
              const taken = hasPartyAt(point.id);
              return (
                <button
                  key={point.id}
                  ref={(el) => {
                    pickupRefs.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={i === pickupIndex ? 0 : -1}
                  onClick={() => setPickup(point.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-card px-3 py-3 text-left transition-[scale,background-color,box-shadow] duration-150 ease-out active:scale-[0.98]",
                    selected
                      ? "bg-accent-soft ring-2 ring-accent-ink ring-inset"
                      : "bg-surface ring-1 ring-line ring-inset hover:bg-surface-hover",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-150",
                      selected ? "bg-accent-ink" : "ring-[1.5px] ring-line-strong ring-inset",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full bg-surface transition-[scale,opacity] duration-150 ease-out",
                        selected ? "scale-100 opacity-100" : "scale-50 opacity-0",
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-body font-semibold text-ink text-pretty">{point.name}</span>
                      {point.id === locationId && <span className="text-caption font-semibold text-accent-ink">You&apos;re here</span>}
                    </span>
                    <span className="mt-0.5 block text-meta text-ink-2 text-pretty">{point.access}</span>
                    {taken && selected && (
                      <span className="mt-1 block text-meta text-ink-2 text-pretty">
                        This restaurant already has a party here, so you&apos;ll be offered that one to join.
                      </span>
                    )}
                  </span>
                  {taken && (
                    <Pill tone="soft" icon={<span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent-ink" />} className="mt-px shrink-0">
                      Party open
                    </Pill>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
