"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Sheet, cn } from "@/components/ui";
import { CATALOG, PARTY_DURATIONS } from "@/lib/data";
import type { SettingsFocus } from "./InfoBubble";

export interface PartySettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationMin: number;
  pickupPointId: string;
  /** Which section was tapped; the sheet brings it into view. */
  focus: SettingsFocus;
  onApply: (settings: { durationMin: number; pickupPointId: string }) => void;
}

/** W7: how long the party stays open and where the order is delivered. Nothing changes until Apply. */
export function PartySettingsSheet({ open, onOpenChange, durationMin, pickupPointId, focus, onApply }: PartySettingsSheetProps) {
  const [duration, setDuration] = useState(durationMin);
  const [pickup, setPickup] = useState(pickupPointId);
  const pickupRef = useRef<HTMLDivElement>(null);

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
          <div role="radiogroup" aria-labelledby="party-lasts" className="grid grid-cols-4 gap-2">
            {PARTY_DURATIONS.map((min) => {
              const selected = min === duration;
              return (
                <button
                  key={min}
                  type="button"
                  role="radio"
                  aria-checked={selected}
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
          <div role="radiogroup" aria-labelledby="collect-from" className="flex flex-col gap-2">
            {CATALOG.pickupPoints.map((point) => {
              const selected = point.id === pickup;
              return (
                <button
                  key={point.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
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
                    <span className="block text-body font-semibold text-ink text-pretty">{point.name}</span>
                    <span className="mt-0.5 block text-meta text-ink-2 text-pretty">{point.access}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
