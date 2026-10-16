import { Clock, Star } from "lucide-react";
import { DealPill, cn } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

/** "19:40" */
export function clockTime(ms: number): string {
  return clock.format(ms);
}

/** "25–35 min" */
export function etaText(restaurant: Restaurant): string {
  const [lo, hi] = restaurant.etaMin;
  return `${lo}–${hi} min`;
}

/** "Just now", "4 min ago", "2 h ago". */
export function timeAgo(at: number, now: number): string {
  const min = Math.floor(Math.max(0, now - at) / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  return `${Math.floor(min / 60)} h ago`;
}

/** "4.6 ★ (250)" with a drawn star, read aloud as a sentence. */
export function Rating({ restaurant, className }: { restaurant: Restaurant; className?: string }) {
  return (
    <span className={cn("tnum inline-flex items-center gap-1", className)}>
      <span className="sr-only">
        Rated {restaurant.rating} from {restaurant.ratingCount} reviews
      </span>
      <span aria-hidden className="font-semibold text-ink">
        {restaurant.rating.toFixed(1)}
      </span>
      <Star aria-hidden className="size-3 fill-current text-ink" />
      <span aria-hidden>({restaurant.ratingCount})</span>
    </span>
  );
}

/** Clock icon + delivery window. */
export function Eta({ restaurant, className }: { restaurant: Restaurant; className?: string }) {
  return (
    <span className={cn("tnum inline-flex items-center gap-1", className)}>
      <Clock aria-hidden className="size-3.5" />
      <span className="sr-only">Delivers in </span>
      {etaText(restaurant)}
    </span>
  );
}

const R = 10; // flare radius

/**
 * One concave fillet joining the tab's side to the card's top edge, so the tab reads as part of the card
 * rather than a sticker on it. Drawn for the left side; the right side is mirrored.
 */
function Flare({ side }: { side: "left" | "right" }) {
  const s = R + 1;
  const h = R + 0.5;
  return (
    <svg
      aria-hidden
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={cn("relative z-10 shrink-0", side === "left" ? "-mr-px" : "-ml-px -scale-x-100")}
    >
      <path d={`M${s} 0 L${h} 0 A${h} ${h} 0 0 1 0 ${h} L0 ${s} L${s} ${s} Z`} fill="var(--surface)" />
      <path d={`M${h} 0 A${h} ${h} 0 0 1 0 ${h}`} fill="none" stroke="var(--line)" strokeWidth={1} />
    </svg>
  );
}

/**
 * The deal pill on a folder tab rising from a card's top edge (wireframe 1, "Other parties").
 * Place inside a `relative` card with a 1px --line border; it sits on the border.
 */
export function DealTab({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute bottom-full flex items-end", className)}>
      <Flare side="left" />
      <div className="rounded-t-[13px] border border-b-0 border-line bg-surface px-1 pt-1 pb-[3px]">
        <DealPill label={label} size="sm" className="font-bold" />
      </div>
      <Flare side="right" />
    </div>
  );
}

/** The tab's height above the card (pill 24 + padding + top border), for spacing the list. */
export const DEAL_TAB_HEIGHT = 32;
