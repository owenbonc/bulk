"use client";

import { Button, Countdown, Popup, ProgressBar, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { progressOf, restaurantById, useApp } from "@/lib/store";

/** A bold "!" in a lucide-style rounded stroke, matching the other popup illustrations. */
function Exclamation() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" aria-hidden>
      <path d="M12 5.5v8.5" />
      <path d="M12 18.5h.01" />
    </svg>
  );
}

export interface PartyExistsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The open party at the restaurant you tapped. Kept while the popup animates out. */
  partyId?: string;
}

/** W13: the restaurant already has an open party (one per restaurant), so point to it instead of creating one. */
export function PartyExistsPopup({ open, onOpenChange, partyId }: PartyExistsPopupProps) {
  const { state, now } = useApp();
  const party = partyId ? state.requests.find((r) => r.id === partyId) : undefined;
  const restaurant = party && restaurantById(party.restaurantId);

  if (!party || !restaurant) {
    return <Popup open={false} onOpenChange={onOpenChange} title="There's already a party here" />;
  }

  const progress = progressOf(party, restaurant);
  const mine = party.participants.some((p) => p.userId === ME.userId);
  const hosting = party.hostId === ME.userId;
  const host = party.participants.find((p) => p.userId === party.hostId)?.name;
  const people = party.participants.length;
  const isOpen = party.status === "open";
  const left = formatPrice(progress.left, { trim: true });

  const lead = hosting
    ? `You're already hosting a party at ${restaurant.name}.`
    : mine
      ? `You're already in this party at ${restaurant.name}.`
      : host
        ? `Join ${host}'s party at ${restaurant.name} instead.`
        : `Join the party at ${restaurant.name} instead.`;

  return (
    <Popup
      open={open}
      onOpenChange={onOpenChange}
      icon={<Exclamation />}
      iconTone="accent"
      title="There's already a party here"
      description={
        <>
          {lead}{" "}
          {isOpen && progress.left > 0 ? (
            <>
              It&apos;s <span className="tnum font-semibold text-ink">{left}</span> from the deal.
            </>
          ) : (
            "It's just reached the deal."
          )}
        </>
      }
      action={
        <Button block size="lg" href={mine ? `/party/${party.id}/status` : `/party/${party.id}`}>
          See party
        </Button>
      }
    >
      <div className="rounded-card bg-surface-2 px-4 pt-3 pb-3.5 text-left">
        <div className="flex items-baseline justify-between gap-3 text-meta">
          <span className="tnum font-semibold text-ink">
            {formatPrice(progress.total, { trim: true })} / {formatPrice(progress.target, { trim: true })}
          </span>
          <span className="tnum text-ink-2">
            {people} in party
            {isOpen && (
              <>
                {" · "}
                <Countdown until={party.expiresAt} now={now} suffix="left" urgentTone="offer-ink" />
              </>
            )}
          </span>
        </div>
        <ProgressBar
          value={progress.total}
          max={progress.target}
          size="sm"
          className="mt-2"
          label={`${restaurant.deal.short} deal progress`}
          valueText={`${formatPrice(progress.total, { trim: true })} of ${formatPrice(progress.target, { trim: true })}`}
        />
      </div>
    </Popup>
  );
}
