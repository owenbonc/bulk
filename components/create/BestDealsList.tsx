"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { ImageFrame, SectionHeader } from "@/components/ui";
import type { Restaurant } from "@/lib/types";
import { OfferLine, PartyOpenPill, Rating, etaLabel } from "./bits";
import type { PartyMarker } from "./FeaturedCarousel";

export interface BestDealsListProps {
  /** Already sorted, best deal first. */
  restaurants: Restaurant[];
  /** Shows the result count while a search is active. */
  count?: number;
  partyAt: (restaurantId: string) => PartyMarker | undefined;
  onChoose: (event: MouseEvent<HTMLAnchorElement>, restaurantId: string) => void;
}

/** W6 "Best deals near you": one row per restaurant, hairlines between rows. */
export function BestDealsList({ restaurants, count, partyAt, onChoose }: BestDealsListProps) {
  return (
    <section aria-labelledby="deals-heading">
      <SectionHeader id="deals-heading" title="Best deals near you" count={count} className="px-4" />
      <ul className="mt-1">
        {restaurants.map((r, i) => {
          const party = partyAt(r.id);
          return (
            <li key={r.id}>
              {i > 0 && <div aria-hidden className="mr-4 ml-[128px] h-px bg-line" />}
              <Link
                href={`/create/${r.id}`}
                onClick={(e) => onChoose(e, r.id)}
                aria-haspopup={party ? "dialog" : undefined}
                className="group flex items-center gap-4 px-4 py-3 transition-colors duration-100 ease-out -outline-offset-2 active:bg-ink/[0.04] hover:bg-ink/[0.025]"
              >
                <ImageFrame
                  src={r.image}
                  alt=""
                  emoji={r.emoji}
                  radius="card"
                  sizes="96px"
                  className="size-24 shrink-0 transition-transform duration-100 ease-out group-active:scale-[0.97]"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-emphasis leading-snug font-semibold text-ink">{r.name}</p>
                    {party && <PartyOpenPill mine={party.mine} />}
                  </div>
                  <p className="flex items-center gap-1 text-meta text-ink-2">
                    <Rating value={r.rating} />
                    <span aria-hidden>·</span>
                    <span className="tnum">{r.distanceMiles.toFixed(1)} mi</span>
                  </p>
                  <p className="tnum text-meta text-ink-2">Est. {etaLabel(r)}</p>
                  <OfferLine restaurant={r} className="mt-0.5 text-meta" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
