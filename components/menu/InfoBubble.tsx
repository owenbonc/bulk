"use client";

import { ChevronDown, MapPin, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { Countdown, Divider, ProgressBar, cn, formatPrice } from "@/components/ui";
import type { Progress } from "@/lib/requests";

export type SettingsFocus = "duration" | "pickup";

/* The full bubble sits on the page as a card; the compact copy docks into the translucent top bar on a
   solid surface (never translucent on translucent). */
const fullShell = "flex items-stretch rounded-[22px] border border-line bg-surface";
const compactShell = "flex h-11 min-w-0 items-stretch rounded-full bg-surface ring-1 ring-line ring-inset";

function progressText(p: Progress) {
  return `${formatPrice(p.total, { trim: true })} of ${formatPrice(p.target, { trim: true })} towards the deal`;
}

// ---------------------------------------------------------------------------
// Join: "£X left" with a thin bar | pin + collection point | live countdown
// ---------------------------------------------------------------------------

export interface JoinInfoBubbleProps {
  progress: Progress;
  pickupName: string;
  expiresAt: number;
  now: number;
  compact?: boolean;
}

export function JoinInfoBubble({ progress, pickupName, expiresAt, now, compact = false }: JoinInfoBubbleProps) {
  const left = formatPrice(progress.left, { trim: true });

  if (compact) {
    return (
      <div role="group" aria-label="Party summary" className={cn(compactShell, "w-full gap-2.5 px-3.5 text-meta")}>
        <span className="flex shrink-0 flex-col justify-center gap-[5px]">
          <span className="tnum leading-none font-semibold text-ink">{left} left</span>
          <ProgressBar value={progress.total} max={progress.target} size="hairline" label="Deal progress" valueText={progressText(progress)} />
        </span>
        <Divider orientation="vertical" className="my-2.5" />
        <span className="flex min-w-0 flex-1 items-center gap-1 text-ink">
          <MapPin aria-hidden className="size-3.5 shrink-0 text-accent-ink" />
          <span className="truncate font-medium">{pickupName}</span>
        </span>
        <Divider orientation="vertical" className="my-2.5" />
        <Countdown until={expiresAt} now={now} className="self-center font-semibold text-ink" />
      </div>
    );
  }

  return (
    <div role="group" aria-label="Party summary" className={fullShell}>
      <div className="flex shrink-0 flex-col justify-center gap-2 py-3 pr-3.5 pl-4">
        <span className="tnum text-emphasis leading-none font-semibold text-ink">
          {left} <span className="font-medium text-ink-2">left</span>
        </span>
        <ProgressBar value={progress.total} max={progress.target} size="sm" label="Deal progress" valueText={progressText(progress)} />
      </div>
      <Divider orientation="vertical" className="my-3" />
      <div className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-3">
        <MapPin aria-hidden className="size-4 shrink-0 text-accent-ink" />
        <span className="line-clamp-2 text-meta leading-snug font-medium text-ink">
          <span className="sr-only">Collection point: </span>
          {pickupName}
        </span>
      </div>
      <Divider orientation="vertical" className="my-3" />
      <div className="flex shrink-0 flex-col items-start justify-center gap-0.5 py-3 pr-4 pl-3.5">
        <span className="flex items-center gap-1 text-caption text-ink-2">
          <Timer aria-hidden className="size-3.5" />
          Closes in
        </span>
        <Countdown until={expiresAt} now={now} className="text-emphasis leading-none font-semibold text-ink" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create: "Party lasts · 15 minutes ⌄" | "Collect from · … ⌄", both open the settings sheet
// ---------------------------------------------------------------------------

export interface CreateInfoBubbleProps {
  durationMin: number;
  pickupName: string;
  onEdit: (focus: SettingsFocus) => void;
  compact?: boolean;
}

export function CreateInfoBubble({ durationMin, pickupName, onEdit, compact = false }: CreateInfoBubbleProps) {
  if (compact) {
    return (
      <div role="group" aria-label="Party settings" className={cn(compactShell, "w-full overflow-hidden")}>
        <Setting
          compact
          caption="Party lasts"
          value={<span className="tnum">{durationMin} min</span>}
          label={`Party lasts ${durationMin} minutes. Change`}
          onClick={() => onEdit("duration")}
          className="shrink-0 pl-3.5"
        />
        <Divider orientation="vertical" className="my-2.5" />
        <Setting
          compact
          caption="Collect from"
          value={pickupName}
          label={`Collect from ${pickupName}. Change`}
          onClick={() => onEdit("pickup")}
          className="min-w-0 flex-1 pr-3"
        />
      </div>
    );
  }

  return (
    <div role="group" aria-label="Party settings" className={cn(fullShell, "overflow-hidden")}>
      <Setting
        caption="Party lasts"
        value={<span className="tnum">{durationMin} minutes</span>}
        label={`Party lasts ${durationMin} minutes. Change`}
        onClick={() => onEdit("duration")}
        className="shrink-0"
      />
      <Divider orientation="vertical" className="my-3" />
      <Setting
        caption="Collect from"
        icon={<MapPin aria-hidden className="size-4 shrink-0 text-accent-ink" />}
        value={pickupName}
        label={`Collect from ${pickupName}. Change`}
        onClick={() => onEdit("pickup")}
        className="min-w-0 flex-1"
      />
    </div>
  );
}

interface SettingProps {
  caption: string;
  value: ReactNode;
  label: string;
  icon?: ReactNode;
  compact?: boolean;
  onClick: () => void;
  className?: string;
}

function Setting({ caption, value, label, icon, compact = false, onClick, className }: SettingProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={onClick}
      className={cn(
        "flex items-center text-left transition-colors duration-100 ease-out active:bg-surface-2 hover:bg-[#fbfaf5]",
        compact ? "gap-1 px-2.5" : "gap-2 px-4 py-3",
        className,
      )}
    >
      <span className={cn("flex min-w-0 flex-1 flex-col", compact ? "gap-0.5" : "gap-1")}>
        <span className="text-caption leading-none text-ink-2">{caption}</span>
        <span
          className={cn(
            "flex min-w-0 items-center gap-1 leading-tight font-semibold text-ink",
            compact ? "text-meta" : "text-body",
          )}
        >
          {icon}
          <span className="truncate">{value}</span>
        </span>
      </span>
      <ChevronDown aria-hidden className={cn("shrink-0 text-ink-2", compact ? "size-3.5" : "size-4")} />
    </button>
  );
}
