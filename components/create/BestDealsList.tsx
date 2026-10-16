"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { ImageFrame, Marquee, Rating, SectionHeader } from "@/components/ui";
import type { Restaurant } from "@/lib/types";
import { OfferLine, PartyOpenPill, etaLabel } from "./bits";
import type { PartyMarker } from "./FeaturedCarousel";

/** Rows in view on first paint under the Featured carousel; their photos load first. */
const PRIORITY_ROWS = 3;

export interface BestDealsListProps {
  /** Already sorted, best deal first. */
  restaurants: Restaurant[];
  /** Shows the result count while a search is active. */
  count?: number;
  partyAt: (restaurantId: string) => PartyMarker | undefined;
  onChoose: (event: MouseEvent<HTMLAnchorElement>, restaurantId: string) => void;
}

/**
 * W6 "Best deals near you": one row per restaurant (80px photo, name, rating and distance, delivery
 * estimate, offer line), hairlines between rows aligned with the text column. A restaurant with an open
 * party carries its pill pinned to the row's right edge, top-aligned with the name.
 */
export function BestDealsList({ restaurants, count, partyAt, onChoose }: BestDealsListProps) {
  return (
    <section aria-labelledby="deals-heading">
      <SectionHeader id="deals-heading" title="Best deals near you" count={count} className="px-gutter" />
      <ul>
        {restaurants.map((r, i) => {
          const party = partyAt(r.id);
          return (
            <li key={r.id}>
              {i > 0 && <div aria-hidden className="mr-gutter ml-[108px] h-px bg-line" />}
              <Link
                href={`/create/${r.id}`}
                onClick={(e) => onChoose(e, r.id)}
                aria-haspopup={party ? "dialog" : undefined}
                className="group flex items-center gap-3 px-gutter py-2.5 transition-colors duration-100 ease-out -outline-offset-2 active:bg-ink/[0.04] hover:bg-ink/[0.025]"
              >
                <ImageFrame
                  src={r.image}
                  alt=""
                  emoji={r.emoji}
                  radius="chip"
                  sizes="80px"
                  priority={i < PRIORITY_ROWS}
                  className="size-20 shrink-0 transition-transform duration-100 ease-out group-active:scale-[0.97]"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex min-w-0 items-start gap-2">
                    <Marquee as="h3" className="min-w-0 flex-1 basis-0 text-emphasis font-semibold text-ink">
                      {r.name}
                    </Marquee>
                    {party && <PartyOpenPill mine={party.mine} className="mt-px ml-auto shrink-0 self-start" />}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-meta text-ink-2">
                    <Rating value={r.rating} />
                    <span aria-hidden>·</span>
                    <span className="tnum">{r.distanceMiles.toFixed(1)} mi</span>
                  </p>
                  <p className="tnum text-meta text-ink-2">Est. {etaLabel(r)}</p>
                  <OfferLine restaurant={r} className="mt-1 text-meta" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
