"use client";

import { Check } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useId, useRef } from "react";
import { DealPill, ImageFrame, Marquee, Pill, ProgressPie, Rating, SectionHeader, formatPrice } from "@/components/ui";
import { useApp } from "@/lib/store";
import { Eta } from "./parts";
import { partyHref } from "./PartyListCard";
import type { HomeParty } from "./useHomeParties";

const GAP = 12;

/** Cards at the start of the carousel whose images load eagerly (in view on first paint). */
const PRIORITY_CARDS = 2;

/** "Highlights · n": parties at 75%+ of their deal in a horizontal snap carousel. */
export function Highlights({ parties }: { parties: HomeParty[] }) {
  const scroller = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion();

  function scrollNext() {
    const el = scroller.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + card.offsetWidth + GAP, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby="highlights-title">
      <SectionHeader
        id="highlights-title"
        title="Highlights"
        count={parties.length}
        onArrowClick={parties.length > 1 ? scrollNext : undefined}
        arrowLabel="Next highlight"
        className="px-4"
      />
      <ul
        ref={scroller}
        className="no-scrollbar mt-2 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [touch-action:pan-x_pan-y]"
        style={{ gap: GAP }}
      >
        {parties.map((p, i) => (
          <li key={p.request.id} className="relative w-[72%] max-w-[310px] shrink-0 snap-start">
            <HighlightCard party={p} priority={i < PRIORITY_CARDS} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function HighlightCard({ party, priority }: { party: HomeParty; priority: boolean }) {
  const { now } = useApp();
  const nameId = useId();
  const descId = useId();
  const { request, restaurant, progress, me } = party;
  const left = formatPrice(progress.left, { trim: true });
  const closesIn = Math.max(1, Math.ceil((request.expiresAt - now) / 60_000));

  return (
    <Link
      href={partyHref(party)}
      aria-labelledby={nameId}
      aria-describedby={descId}
      className="block rounded-card border border-line bg-surface transition-transform duration-100 ease-out active:scale-[0.97]"
    >
      <div className="relative">
        <div className="overflow-hidden rounded-t-[17px]">
          <ImageFrame
            src={restaurant.image}
            alt=""
            ratio="4/3"
            radius="none"
            emoji={restaurant.emoji}
            sizes="(min-width: 431px) 310px, 72vw"
            priority={priority}
          >
            {me && (
              <Pill tone="soft" icon={<Check aria-hidden />} className="absolute top-2.5 left-2.5 shadow-float">
                You&apos;re in
              </Pill>
            )}
          </ImageFrame>
        </div>
        <DealPill label={restaurant.deal.short} size="sm" className="absolute right-3 -bottom-3 ring-3 ring-surface" />
      </div>

      <div className="flex items-end justify-between gap-3 px-3.5 pt-3 pb-3.5">
        <div className="min-w-0 flex-1">
          <Marquee as="h3" className="text-emphasis font-semibold tracking-[-0.01em] text-ink">
            <span id={nameId}>{restaurant.name}</span>
          </Marquee>
          <p className="mt-0.5 flex">
            <Rating value={restaurant.rating} count={restaurant.ratingCount} />
          </p>
          <p className="flex">
            <Eta restaurant={restaurant} />
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-3">
          <span className="tnum text-emphasis leading-none font-bold text-ink">
            {left}
            <span className="font-semibold"> left</span>
          </span>
          <ProgressPie
            value={progress.total}
            max={progress.target}
            size={28}
            label={`${progress.pct}% of the way to ${restaurant.deal.short}`}
          />
        </div>
      </div>
      <span id={descId} className="sr-only">
        {`${restaurant.deal.short}, ${left} left, ${request.participants.length} in party${me ? ", you're in" : ""}, closes in ${closesIn} min`}
      </span>
    </Link>
  );
}
