"use client";

import { Camera, ChevronLeft, FlaskConical, MapPin, Users, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { DemoControlsPanel } from "@/components/demo";
import { Avatar, Divider, IconButton, Marquee, Sheet } from "@/components/ui";
import { CATALOG, ME } from "@/lib/data";
import { pickupById, useApp } from "@/lib/store";

export interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Credit {
  file: string;
  title: string;
  author: string;
  licence: string;
}

/** Turns the table rows of public/images/CREDITS.md into credits, with markdown links reduced to their text. */
function parseCredits(md: string): Credit[] {
  const unlink = (cell: string) => cell.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return md
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => {
      const [file = "", source = "", author = "", licence = ""] = line
        .split("|")
        .map((cell) => cell.trim())
        .slice(1, -1);
      return { file: file.replace(/`/g, ""), title: unlink(source), author: unlink(author), licence: unlink(licence) };
    });
}

/**
 * The Bulk logo, you, your friends, the demo and photo credits, and the presenter's demo controls. The photo
 * credits open inside the sheet as a second view (loaded from public/images/CREDITS.md) with a back button.
 */
export function AccountSheet({ open, onOpenChange }: AccountSheetProps) {
  const [view, setView] = useState<"account" | "credits">("account");
  const [credits, setCredits] = useState<Credit[] | null>(null);

  const showCredits = () => {
    setView("credits");
    if (credits !== null) return;
    fetch("/images/CREDITS.md")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((md) => setCredits(parseCredits(md)))
      .catch(() => setCredits([]));
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => setView("account")}
      title={view === "credits" ? "Photo credits" : "Account"}
      hideTitle
      showClose={false}
    >
      {view === "credits" ? (
        <CreditsView credits={credits} onBack={() => setView("account")} onClose={() => onOpenChange(false)} />
      ) : (
        <AccountView onShowCredits={showCredits} onClose={() => onOpenChange(false)} />
      )}
    </Sheet>
  );
}

function AccountView({ onShowCredits, onClose }: { onShowCredits: () => void; onClose: () => void }) {
  const { state } = useApp();
  const friends = state.friends.length;
  const location = pickupById(state.location) ?? CATALOG.pickupPoints[0];

  return (
    <>
      <div className="flex items-center justify-between gap-3 pb-4">
        <Logo size={30} />
        <IconButton aria-label="Close" size="sm" variant="soft" className="-mr-1.5" onClick={onClose}>
          <X />
        </IconButton>
      </div>

      <div className="flex items-center gap-4 pb-5">
        <Avatar name={ME.name} you size={56} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-title font-semibold text-ink">{ME.name}</p>
          <p className="flex items-center gap-1 text-meta text-ink-2">
            <MapPin aria-hidden className="size-3.5 shrink-0" />
            <Marquee>{location?.name}</Marquee>
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

      <div className="mt-3 flex flex-col gap-1.5 px-1 text-meta text-ink-2">
        <p className="flex items-center gap-2">
          <FlaskConical aria-hidden className="size-4 shrink-0" />
          Demo: sample restaurants and offers
        </p>
        <p className="flex items-center gap-2">
          <Camera aria-hidden className="size-4 shrink-0" />
          <span>
            Photos:{" "}
            <button
              type="button"
              onClick={onShowCredits}
              className="relative font-medium text-ink-2 underline decoration-line-strong before:absolute before:-inset-x-1 before:-inset-y-3.5 hover:text-ink hover:decoration-ink-3"
            >
              Wikimedia Commons contributors
            </button>
          </span>
        </p>
      </div>

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
    </>
  );
}

function CreditsView({
  credits,
  onBack,
  onClose,
}: {
  credits: Credit[] | null;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 pb-3">
        <IconButton aria-label="Back" size="sm" variant="soft" className="-ml-1.5" onClick={onBack}>
          <ChevronLeft />
        </IconButton>
        <h2 className="min-w-0 flex-1 font-display text-section font-semibold text-ink">Photo credits</h2>
        <IconButton aria-label="Close" size="sm" variant="soft" className="-mr-1.5" onClick={onClose}>
          <X />
        </IconButton>
      </div>

      {credits === null ? (
        <p className="text-meta text-ink-3">Loading…</p>
      ) : credits.length === 0 ? (
        <p className="text-meta text-ink-2">Photos from Wikimedia Commons under CC0, CC BY and CC BY-SA.</p>
      ) : (
        <>
          <p className="text-meta text-ink-2">
            Every photo comes from Wikimedia Commons under the licence listed, resized and recompressed with no other
            changes.
          </p>
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {credits.map((c) => (
              <li key={c.file} className="py-2">
                <p className="text-body text-ink">{c.title}</p>
                <p className="text-meta text-ink-2">
                  {c.author} · {c.licence}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
