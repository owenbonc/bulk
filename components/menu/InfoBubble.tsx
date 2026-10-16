"use client";

import { ChevronDown, MapPin, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { Countdown, Divider, Marquee, ProgressBar, cn, formatPrice } from "@/components/ui";
import type { Progress } from "@/lib/requests";

export type SettingsFocus = "duration" | "pickup";

/* The full bubble sits on the page as an open strip between hairlines; the compact copy floats at the top
   between the back and search buttons as its own clear-glass pill. The collection point takes the space
   that is left and scrolls (Marquee) if its name doesn't fit. */
const fullShell = "flex items-stretch border-y border-line";
const compactShell = "glass flex h-10 min-w-0 items-stretch rounded-full";

// ---------------------------------------------------------------------------
// Join: "£X left" with a thin bar | pin + collection point | live countdown
// ---------------------------------------------------------------------------

export interface JoinInfoBubbleProps {
  /** The party's finalised spend towards the deal. */
  progress: Progress;
  /** Your basket subtotal in pence: drawn after the party's spend as your pulsing contribution. */
  mine: number;
  pickupName: string;
  expiresAt: number;
  now: number;
  compact?: boolean;
}

/**
 * The bar shows the party's finalised spend in lime, then your basket as a pulsing --mine segment, so you
 * see what you would add; "£X left" is what is still needed with your basket counted.
 */
export function JoinInfoBubble({ progress, mine, pickupName, expiresAt, now, compact = false }: JoinInfoBubbleProps) {
  const withMine = progress.total + mine;
  const leftPence = Math.max(0, progress.target - withMine);
  const left = formatPrice(leftPence, { trim: true });
  const gbp = (pence: number) => formatPrice(pence, { trim: true });
  const valueText =
    `${gbp(progress.total)} of ${gbp(progress.target)} towards the deal` +
    (mine > 0 ? `, ${gbp(withMine)} with your basket` : "");
  const bar = (size: "hairline" | "sm") => (
    <ProgressBar
      value={withMine}
      max={progress.target}
      contribution={mine > 0 ? mine : undefined}
      size={size}
      label="Deal progress"
      valueText={valueText}
    />
  );
  const pickup = (
    <>
      <span className="sr-only">Collection point: </span>
      {pickupName}
    </>
  );

  if (compact) {
    return (
      <div role="group" aria-label="Party summary" className={cn(compactShell, "w-full gap-1.5 px-3 text-meta")}>
        <span className="flex min-w-14 shrink-0 flex-col justify-center gap-[5px]">
          <span className="tnum leading-none font-semibold whitespace-nowrap text-ink">
            {`${left} left`}
          </span>
          {bar("hairline")}
        </span>
        <Divider orientation="vertical" className="my-2.5" />
        <span className="flex min-w-0 flex-1 items-center gap-0.5 text-ink">
          <MapPin aria-hidden className="size-3.5 shrink-0 text-accent-ink" />
          <Marquee className="font-medium">{pickup}</Marquee>
        </span>
        <Divider orientation="vertical" className="my-2.5" />
        {/* Urgency in the last minute is a red dot, so the digits stay ink on glass over any photo. */}
        <span className="flex shrink-0 items-center gap-1 self-center">
          {expiresAt - now < 60_000 && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-offer" />}
          <Countdown until={expiresAt} now={now} urgentBelowMs={0} className="font-semibold text-ink" />
        </span>
      </div>
    );
  }

  return (
    <div role="group" aria-label="Party summary" className={fullShell}>
      <div className="flex min-w-24 shrink-0 flex-col justify-center gap-2 py-2.5 pr-3 pl-3">
        <span className="tnum text-emphasis leading-none font-semibold whitespace-nowrap text-ink">
          {left} <span className="font-medium text-ink-2">left</span>
        </span>
        {bar("sm")}
      </div>
      <Divider orientation="vertical" className="my-2.5" />
      <div className="flex min-w-0 flex-1 items-center gap-1 px-2.5 py-2.5">
        <MapPin aria-hidden className="size-4 shrink-0 text-accent-ink" />
        <Marquee className="text-meta font-medium text-ink">{pickup}</Marquee>
      </div>
      <Divider orientation="vertical" className="my-2.5" />
      <div className="flex shrink-0 flex-col items-start justify-center gap-0.5 py-2.5 pr-3 pl-2.5">
        <span className="flex items-center gap-1 text-caption whitespace-nowrap text-ink-2">
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
      <div role="group" aria-label="Party settings" className={cn(compactShell, "w-full")}>
        <Setting
          compact
          caption="Party lasts"
          value={<span className="tnum">{durationMin} min</span>}
          label={`Party lasts ${durationMin} minutes. Change`}
          onClick={() => onEdit("duration")}
          className="shrink-0 rounded-l-full pl-3"
        />
        <Divider orientation="vertical" className="my-2.5" />
        <Setting
          compact
          caption="Collect from"
          value={pickupName}
          label={`Collect from ${pickupName}. Change`}
          onClick={() => onEdit("pickup")}
          className="min-w-0 flex-1 rounded-r-full pr-3"
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
      <Divider orientation="vertical" className="my-2.5" />
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
        "flex items-center text-left transition-colors duration-100 ease-out",
        compact
          ? "relative gap-1 px-2.5 before:absolute before:inset-x-0 before:-inset-y-0.5 active:bg-ink/[0.06] hover:bg-ink/[0.03]"
          : "gap-2 px-3 py-2.5 active:bg-ink/[0.04] hover:bg-ink/[0.03]",
        className,
      )}
    >
      <span className={cn("flex min-w-0 flex-1 flex-col", compact ? "gap-0.5" : "gap-1")}>
        <span className={cn("text-caption leading-none", compact ? "font-medium text-ink" : "text-ink-2")}>{caption}</span>
        <span
          className={cn(
            "flex min-w-0 items-center gap-1 leading-tight font-semibold text-ink",
            compact ? "text-meta" : "text-body",
          )}
        >
          {icon}
          <Marquee>{value}</Marquee>
        </span>
      </span>
      <ChevronDown aria-hidden className={cn("shrink-0", compact ? "size-3.5 text-ink" : "size-4 text-ink-2")} />
    </button>
  );
}
