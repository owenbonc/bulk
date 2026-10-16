"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { useRef, useState, type MouseEvent } from "react";
import { IconButton, ImageFrame, SectionHeader, cn } from "@/components/ui";
import type { Restaurant } from "@/lib/types";
import { OfferDealPill, PartyOpenPill, Rating, etaLabel } from "./bits";

export interface PartyMarker {
  /** You are already a member of the open party. */
  mine: boolean;
}

export interface FeaturedCarouselProps {
  restaurants: Restaurant[];
  partyAt: (restaurantId: string) => PartyMarker | undefined;
  onChoose: (event: MouseEvent<HTMLAnchorElement>, restaurantId: string) => void;
}

/** W6 "Featured": horizontal snap carousel of image tiles with the deal pill on the photo's bottom edge. */
export function FeaturedCarousel({ restaurants, partyAt, onChoose }: FeaturedCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const reduce = useReducedMotion();
  const scrollable = restaurants.length > 2;

  const updateEnd = () => {
    const track = trackRef.current;
    if (!track) return;
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 8);
  };

  // One tile per press; from the last tile it returns to the start.
  const step = () => {
    const track = trackRef.current;
    if (!track) return;
    const behavior = reduce ? "auto" : "smooth";
    if (atEnd) {
      track.scrollTo({ left: 0, behavior });
      return;
    }
    const tile = track.querySelector("li");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: (tile?.getBoundingClientRect().width ?? track.clientWidth / 2) + gap, behavior });
  };

  return (
    <section aria-labelledby="featured-heading">
      <SectionHeader
        id="featured-heading"
        title="Featured"
        className="px-4"
        action={
          scrollable ? (
            <IconButton
              aria-label={atEnd ? "Back to the first featured restaurant" : "Next featured restaurant"}
              aria-controls="featured-track"
              size="sm"
              variant="outline"
              onClick={step}
            >
              <ArrowRight
                aria-hidden
                className={cn("transition-transform duration-300 ease-out", atEnd && "rotate-180")}
              />
            </IconButton>
          ) : undefined
        }
      />
      <ul
        id="featured-track"
        ref={trackRef}
        onScroll={updateEnd}
        className="no-scrollbar mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 touch-pan-x touch-pan-y"
      >
        {restaurants.map((r) => {
          const party = partyAt(r.id);
          return (
            <li key={r.id} className="w-[44%] shrink-0 snap-start">
              <Link
                href={`/create/${r.id}`}
                onClick={(e) => onChoose(e, r.id)}
                aria-haspopup={party ? "dialog" : undefined}
                className="group block rounded-sheet outline-offset-4"
              >
                <div className="relative transition-transform duration-100 ease-out group-active:scale-[0.97]">
                  <ImageFrame src={r.image} alt="" ratio="1/1" emoji={r.emoji} sizes="180px">
                    {party && <PartyOpenPill overlay mine={party.mine} className="absolute top-2 left-2" />}
                  </ImageFrame>
                  <OfferDealPill label={r.deal.short} className="absolute right-3 -bottom-3 ring-3 ring-bg" />
                </div>
                <p className="mt-4 truncate text-emphasis leading-tight font-semibold text-ink">{r.name}</p>
                <p className="mt-0.5 flex min-w-0 items-center gap-1 text-meta text-ink-2">
                  <Rating value={r.rating} />
                  <span aria-hidden>·</span>
                  <span className="tnum truncate">{etaLabel(r)}</span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
