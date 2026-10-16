"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { ImageFrame, Marquee, Rating, SPRING, SectionHeader } from "@/components/ui";
import type { PickupPoint, Restaurant } from "@/lib/types";
import { OfferLine, PartyOpenPill, etaLabel, milesLabel } from "./bits";
import type { PartyMarker } from "./FeaturedCarousel";

/** Rows in view on first paint under the Featured carousel; their photos load first. */
const PRIORITY_ROWS = 3;

/** The location-switch glide starts as the location sheet finishes closing. */
const GLIDE: Transition = { ...SPRING, delay: 0.15 };

export interface BestDealsListProps {
  /** Already sorted, best deal near `point` first. */
  restaurants: Restaurant[];
  /** Your location: distances and delivery times are measured from it. */
  point: PickupPoint;
  /** Shows the result count while a search is active. */
  count?: number;
  partyAt: (restaurantId: string) => PartyMarker | undefined;
  onChoose: (event: MouseEvent<HTMLAnchorElement>, restaurantId: string) => void;
}

/**
 * W6 "Best deals near you": one row per restaurant (80px photo, name, rating and distance, delivery
 * estimate, offer line), hairlines between rows aligned with the text column. A restaurant with an open
 * party at your location carries its pill pinned to the row's right edge, top-aligned with the name. Rows
 * are measured only when the location changes: a new location makes them glide to their new order once the
 * location sheet is mostly closed, while a search re-lays them out instantly. Under reduced motion they jump.
 */
export function BestDealsList({ restaurants, point, count, partyAt, onChoose }: BestDealsListProps) {
  const reduceMotion = useReducedMotion();
  return (
    <section aria-labelledby="deals-heading">
      <SectionHeader id="deals-heading" title="Best deals near you" count={count} className="px-gutter" />
      <ul>
        {restaurants.map((r, i) => {
          const party = partyAt(r.id);
          return (
            <motion.li
              key={r.id}
              layout={reduceMotion ? false : "position"}
              layoutDependency={point.id}
              transition={GLIDE}
            >
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
                    <span className="tnum">{milesLabel(r, point)}</span>
                  </p>
                  <p className="tnum text-meta text-ink-2">Est. {etaLabel(r, point)}</p>
                  <OfferLine restaurant={r} className="mt-1 text-meta" />
                </div>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
