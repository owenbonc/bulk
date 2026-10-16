"use client";

import { Check, Timer } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Avatar, Countdown, DealPill, ImageFrame, Marquee, Pill, ProgressPie, Rating, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { DELIVERY_STEPS } from "@/lib/requests";
import { useApp } from "@/lib/store";
import { Eta, PartyPlaceLine, placeText } from "./parts";
import type { HomeParty } from "./useHomeParties";

/** Your parties open on their status page; any other party opens on its menu to join. */
export function partyHref({ request, me }: HomeParty): string {
  return me ? `/party/${request.id}/status` : `/party/${request.id}`;
}

/** Short label for a party you're in that has moved past filling. */
function stageLabel(party: HomeParty): string {
  const { status } = party.request;
  if (status === "deal_achieved") return party.me?.paid ? "Paid" : "Deal reached";
  return DELIVERY_STEPS.find((s) => s.status === status)?.label ?? "Closed";
}

const MAX_FACES = 3;

/**
 * "Other parties" card (wireframe 1): image left (with "You're in" on it when you're in the party); timer,
 * people and the red deal pill stacked in the right column, so cards stack with even gaps; name, rating and
 * delivery time to its collection point below, then where it collects ("Here" or "5 min walk"), with the
 * progress on the right. `priority` loads the image eagerly (the first cards
 * in the list).
 */
export function PartyListCard({ party, priority = false }: { party: HomeParty; priority?: boolean }) {
  const { now } = useApp();
  const nameId = useId();
  const descId = useId();
  const { request, restaurant, progress, place, me, contribution } = party;
  const open = request.status === "open";
  const people = request.participants;
  const faces = [...people].sort((a, b) => Number(b.userId === ME.userId) - Number(a.userId === ME.userId)).slice(0, MAX_FACES);
  const summary = [
    restaurant.deal.short,
    open ? `${formatPrice(progress.left, { trim: true })} left` : stageLabel(party),
    `${people.length} in party`,
    placeText(place),
    me ? "you're in" : null,
    open ? `closes in ${Math.max(1, Math.ceil((request.expiresAt - now) / 60_000))} min` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={partyHref(party)}
      aria-labelledby={nameId}
      aria-describedby={descId}
      className="block rounded-card border border-line bg-surface p-3 transition-transform duration-100 ease-out active:scale-[0.97]"
    >
      <div className="flex gap-3">
        <ImageFrame
          src={restaurant.image}
          alt=""
          ratio="1/1"
          radius="chip"
          emoji={restaurant.emoji}
          sizes="96px"
          priority={priority}
          className="size-24 shrink-0"
        >
          {me && (
            <Pill tone="soft" icon={<Check aria-hidden />} className="absolute top-1.5 left-1.5 shadow-float">
              You&apos;re in
            </Pill>
          )}
        </ImageFrame>
        <div className="flex min-w-0 flex-1 flex-col items-end gap-1.5 pt-0.5 text-right">
          {open ? (
            <span className="inline-flex items-center gap-1.5 text-body font-semibold text-ink">
              <Timer aria-hidden className="size-4 text-ink-2" />
              <Countdown until={request.expiresAt} now={now} suffix="left" />
            </span>
          ) : (
            <span className="text-body font-semibold text-accent-ink">{stageLabel(party)}</span>
          )}
          <span className="inline-flex items-center gap-2 text-meta text-ink-2">
            <span aria-hidden className="flex -space-x-1.5">
              {faces.map((p) => (
                <Avatar key={p.userId} name={p.name} you={p.userId === ME.userId} size={22} className="ring-2 ring-surface" />
              ))}
            </span>
            <span className="tnum">{people.length} in party</span>
          </span>
          <DealPill label={restaurant.deal.short} size="sm" />
        </div>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Marquee as="h3" className="text-emphasis font-semibold tracking-[-0.01em] text-ink">
            <span id={nameId}>{restaurant.name}</span>
          </Marquee>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1">
            <Rating value={restaurant.rating} count={restaurant.ratingCount} />
            <span aria-hidden className="text-meta text-ink-2">
              ·
            </span>
            {place.point && <Eta restaurant={restaurant} point={place.point} />}
          </p>
          <PartyPlaceLine place={place} className="mt-0.5" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="tnum text-body text-ink-2">
            <span className="font-semibold text-ink">{formatPrice(progress.total, { trim: true })}</span>
            {" / "}
            {formatPrice(progress.target, { trim: true })}
          </span>
          <ProgressPie
            value={progress.total}
            max={progress.target}
            contribution={contribution || undefined}
            size={32}
            label={`${progress.pct}% of the way to ${restaurant.deal.short}`}
          />
        </div>
      </div>
      <span id={descId} className="sr-only">
        {summary}
      </span>
    </Link>
  );
}
