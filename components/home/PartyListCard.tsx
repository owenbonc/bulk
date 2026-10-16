"use client";

import { Check, Timer } from "lucide-react";
import Link from "next/link";
import { Avatar, Countdown, ImageFrame, Pill, ProgressPie, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { DELIVERY_STEPS } from "@/lib/requests";
import { useApp } from "@/lib/store";
import { DEAL_TAB_HEIGHT, DealTab, Eta, Rating } from "./parts";
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

/** "Other parties" card (wireframe 1): image left, deal tab on the top-right edge, timer and people right, name and progress below. */
export function PartyListCard({ party }: { party: HomeParty }) {
  const { now } = useApp();
  const { request, restaurant, progress, me } = party;
  const open = request.status === "open";
  const people = request.participants;
  const faces = [...people].sort((a, b) => Number(b.userId === ME.userId) - Number(a.userId === ME.userId)).slice(0, MAX_FACES);

  return (
    <Link
      href={partyHref(party)}
      className="relative block rounded-card border border-line bg-surface p-3 transition-transform duration-100 ease-out active:scale-[0.97]"
    >
      <DealTab label={restaurant.deal.short} className="right-4" />

      <div className="flex gap-3">
        <ImageFrame
          src={restaurant.image}
          alt=""
          ratio="1/1"
          radius="chip"
          emoji={restaurant.emoji}
          sizes="96px"
          className="size-24 shrink-0"
        />
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
          {me && (
            <Pill tone="soft" icon={<Check aria-hidden />} className="mt-auto">
              You&apos;re in
            </Pill>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-emphasis font-semibold tracking-[-0.01em] text-ink">{restaurant.name}</h3>
          <p className="flex flex-wrap items-center gap-x-1.5 text-meta text-ink-2">
            <Rating restaurant={restaurant} />
            <span aria-hidden>·</span>
            <Eta restaurant={restaurant} />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="tnum text-body text-ink-2">
            <span className="font-semibold text-ink">{formatPrice(progress.total, { trim: true })}</span>
            {" / "}
            {formatPrice(progress.target, { trim: true })}
          </span>
          <ProgressPie
            value={progress.total}
            max={progress.target}
            size={32}
            label={`${progress.pct}% of the way to ${restaurant.deal.short}`}
          />
        </div>
      </div>
    </Link>
  );
}

/** Top padding each list item needs so its deal tab clears the item above. */
export const LIST_ITEM_TOP = DEAL_TAB_HEIGHT;
