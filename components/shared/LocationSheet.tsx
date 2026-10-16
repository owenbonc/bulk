"use client";

import { Check, ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Marquee, Sheet, cn, scrollRootTo } from "@/components/ui";
import { CATALOG } from "@/lib/data";
import { partiesNear, pickupById, useApp } from "@/lib/store";

/**
 * After you switch location (not on mount): jumps the screen back to the top, so the new set of parties or
 * restaurants starts from its first row, and calls `onSwitch` with the new collection point id. The jump is
 * instant (it happens under the closing sheet's scrim), so the screen's own fade or row glide is the only motion.
 */
export function useLocationSwitch(onSwitch?: (pickupPointId: string) => void) {
  const { state } = useApp();
  const seen = useRef(state.location);
  const callback = useRef(onSwitch);
  useEffect(() => {
    callback.current = onSwitch;
  });
  useEffect(() => {
    if (seen.current === state.location) return;
    seen.current = state.location;
    scrollRootTo({ top: 0, behavior: "auto" });
    callback.current?.(state.location);
  }, [state.location]);
}

/** "3 here · 9 nearby": open parties collecting at a point and within a short walk of it. */
function partyCountLabel(here: number, nearby: number): string {
  if (nearby === 0) return "No parties nearby yet";
  return `${here} here · ${nearby} ${nearby === 1 ? "party" : "parties"} nearby`;
}

export interface LocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet listing the collection points, your current location first, as a radio group, each with its
 * access note and how many parties Home shows from there ("3 here · 9 parties nearby"). Arrow keys
 * and Home/End move the selection within the group (roving tabindex); tapping, Enter or Space picks a point
 * and closes the sheet.
 */
export function LocationSheet({ open, onOpenChange }: LocationSheetProps) {
  const { state, now, dispatch } = useApp();
  const current = state.location;
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Freeze the order while the sheet is open so rows don't jump under your finger after a pick.
  const [wasOpen, setWasOpen] = useState(open);
  const [pinned, setPinned] = useState(current);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPinned(current);
  }

  const points = [...CATALOG.pickupPoints].sort((a, b) => Number(b.id === pinned) - Number(a.id === pinned));
  // The checked point is the group's single tab stop; the first point when none is checked.
  const checkedIndex = Math.max(0, points.findIndex((p) => p.id === current));

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Your location"
      description="Home shows the parties collecting near you, and distances and delivery times are measured from here."
    >
      <div
        role="radiogroup"
        aria-label="Collection points"
        className="-mx-5 flex flex-col"
        onKeyDown={(e) => {
          const from = radioRefs.current.findIndex((el) => el === document.activeElement);
          if (from < 0) return;
          const last = points.length - 1;
          let to: number;
          switch (e.key) {
            case "ArrowDown":
            case "ArrowRight":
              to = from === last ? 0 : from + 1;
              break;
            case "ArrowUp":
            case "ArrowLeft":
              to = from === 0 ? last : from - 1;
              break;
            case "Home":
              to = 0;
              break;
            case "End":
              to = last;
              break;
            default:
              return;
          }
          e.preventDefault();
          const next = points[to];
          if (next.id !== current) dispatch({ type: "SET_LOCATION", pickupPointId: next.id });
          radioRefs.current[to]?.focus();
        }}
      >
        {points.map((point, i) => {
          const selected = point.id === current;
          const Icon = point.id === pinned ? LocateFixed : MapPin;
          const near = partiesNear(state.requests, point.id, now);
          const here = near.filter((p) => p.place.here).length;
          return (
            <div key={point.id}>
              {i > 0 && <div aria-hidden className="ml-[68px] h-px bg-line" />}
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                ref={(el) => {
                  radioRefs.current[i] = el;
                }}
                tabIndex={i === checkedIndex ? 0 : -1}
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
                  <span className={cn("tnum mt-0.5 block text-meta font-semibold", selected ? "text-accent-ink" : "text-ink-2")}>
                    {partyCountLabel(here, near.length)}
                  </span>
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
          "relative flex h-10 max-w-full min-w-0 items-center gap-1.5 rounded-full pr-2.5 pl-1.5 text-left",
          // 40px pill, like the bell beside it, with a 44px hit area.
          "before:absolute before:inset-x-0 before:-inset-y-0.5",
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
