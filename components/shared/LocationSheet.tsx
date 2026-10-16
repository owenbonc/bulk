"use client";

import { Check, ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { useState } from "react";
import { Marquee, Sheet, cn } from "@/components/ui";
import { CATALOG } from "@/lib/data";
import { pickupById, useApp } from "@/lib/store";

export interface LocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet listing the collection points, your current location first. Picking one sets it as your
 * location (SET_LOCATION) and closes the sheet.
 */
export function LocationSheet({ open, onOpenChange }: LocationSheetProps) {
  const { state, dispatch } = useApp();
  const current = state.location;

  // Freeze the order while the sheet is open so rows don't jump under your finger after a pick.
  const [wasOpen, setWasOpen] = useState(open);
  const [pinned, setPinned] = useState(current);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPinned(current);
  }

  const points = [...CATALOG.pickupPoints].sort((a, b) => Number(b.id === pinned) - Number(a.id === pinned));

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Your location"
      description="Parties deliver to one of these collection points."
    >
      <div role="radiogroup" aria-label="Collection points" className="-mx-5 flex flex-col">
        {points.map((point, i) => {
          const selected = point.id === current;
          const Icon = point.id === pinned ? LocateFixed : MapPin;
          return (
            <div key={point.id}>
              {i > 0 && <div aria-hidden className="ml-[68px] h-px bg-line" />}
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  if (!selected) dispatch({ type: "SET_LOCATION", pickupPointId: point.id });
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors duration-100 ease-out active:bg-surface-2 hover:bg-surface-hover"
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-150 [&_svg]:size-[18px]",
                    selected ? "bg-accent-soft text-accent-ink" : "bg-surface-2 text-ink-2",
                  )}
                >
                  <Icon />
                </span>
                <span className="min-w-0 flex-1">
                  {point.id === pinned && (
                    <span className="block text-caption font-semibold text-accent-ink">Current location</span>
                  )}
                  <Marquee className="text-body font-semibold text-ink">{point.name}</Marquee>
                  {point.access && <span className="block text-meta text-pretty text-ink-2">{point.access}</span>}
                </span>
                <Check
                  aria-hidden
                  className={cn(
                    "shrink-0 text-accent-ink transition-opacity duration-150",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

export interface LocationButtonProps {
  /** stacked: "Current location" caption over the place name (Home). inline: one line (Create top bar). */
  variant?: "stacked" | "inline";
  className?: string;
}

/** Pin + current location name (scrolls if it doesn't fit) + chevron. Opens the LocationSheet. */
export function LocationButton({ variant = "stacked", className }: LocationButtonProps) {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const point = pickupById(state.location) ?? CATALOG.pickupPoints[0];

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Current location: ${point?.name ?? "not set"}. Change location`}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-11 max-w-full min-w-0 items-center gap-1.5 rounded-full pr-2.5 pl-1.5 text-left",
          "transition-[scale,background-color] duration-100 ease-out active:scale-[0.97] active:bg-ink/[0.06] hover:bg-ink/[0.04]",
          className,
        )}
      >
        <MapPin aria-hidden className="shrink-0 text-accent-ink" />
        {variant === "stacked" ? (
          <span className="flex min-w-0 flex-col">
            <span className="text-meta leading-tight text-ink-2">Current location</span>
            <Marquee className="text-body leading-tight font-semibold text-ink">{point?.name}</Marquee>
          </span>
        ) : (
          <Marquee className="text-body font-semibold text-ink">{point?.name}</Marquee>
        )}
        <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-2" />
      </button>
      <LocationSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
