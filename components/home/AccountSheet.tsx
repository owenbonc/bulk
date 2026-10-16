"use client";

import { FlaskConical, MapPin, Users } from "lucide-react";
import { DemoControlsPanel } from "@/components/demo";
import { Avatar, Divider, Sheet } from "@/components/ui";
import { CATALOG, ME } from "@/lib/data";
import { pickupById, useApp } from "@/lib/store";

export interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** You, your friends, the demo note and the presenter's demo controls. */
export function AccountSheet({ open, onOpenChange }: AccountSheetProps) {
  const { state } = useApp();
  const friends = state.friends.length;
  const location = pickupById(state.location) ?? CATALOG.pickupPoints[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Account" hideTitle>
      <div className="flex items-center gap-4 pt-1 pb-5">
        <Avatar name={ME.name} you size={56} />
        <div className="min-w-0">
          <p className="font-display text-title font-semibold text-ink">{ME.name}</p>
          <p className="flex items-center gap-1 truncate text-meta text-ink-2">
            <MapPin aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">{location?.name}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-card bg-surface-2 px-4 py-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink">
          <Users />
        </span>
        <div className="min-w-0">
          <p className="tnum text-body font-semibold text-ink">
            {friends === 0 ? "No friends yet" : `${friends} ${friends === 1 ? "friend" : "friends"}`}
          </p>
          <p className="text-meta text-ink-2">
            {friends === 0 ? "Add people from a party you've ordered with." : "Added from parties you've ordered with."}
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-2 px-1 text-meta text-ink-2">
        <FlaskConical aria-hidden className="size-4 shrink-0" />
        Demo: sample restaurants and offers
      </p>

      <Divider className="my-5" />

      <section aria-labelledby="demo-controls-title">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h3 id="demo-controls-title" className="text-emphasis font-semibold tracking-[-0.01em] text-ink">
            Demo controls
          </h3>
          <span className="hidden text-caption text-ink-3 [@media(pointer:fine)]:inline">
            Press <kbd className="rounded-[6px] bg-surface-2 px-1.5 py-0.5 text-ink-2">D</kbd> anywhere
          </span>
        </div>
        <DemoControlsPanel />
      </section>
    </Sheet>
  );
}
