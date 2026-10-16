import { Clock, MapPin } from "lucide-react";
import { Marquee, cn } from "@/components/ui";
import { deliveryEta, type PartyPlace } from "@/lib/geo";
import type { PickupPoint, Restaurant } from "@/lib/types";

/** "18–28 min": the delivery window from the restaurant to a collection point. */
export function etaText(restaurant: Restaurant, point: PickupPoint): string {
  const [lo, hi] = deliveryEta(restaurant, point);
  return `${lo}–${hi} min`;
}

/** "Just now", "4 min ago", "2 h ago". */
export function timeAgo(at: number, now: number): string {
  const min = Math.floor(Math.max(0, now - at) / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  return `${Math.floor(min / 60)} h ago`;
}

/** Clock icon + delivery window to `point`, in the Rating's 12px secondary style. */
export function Eta({ restaurant, point, className }: { restaurant: Restaurant; point: PickupPoint; className?: string }) {
  return (
    <span className={cn("tnum inline-flex shrink-0 items-center gap-1 text-meta whitespace-nowrap text-ink-2", className)}>
      <Clock aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only">Delivers in </span>
      {etaText(restaurant, point)}
    </span>
  );
}

/** "collects here at Student Centre" or "collects at Main Library, 2 min walk", for screen reader summaries. */
export function placeText(place: PartyPlace): string {
  const name = place.point?.name ?? "a collection point";
  return place.here ? `collects here at ${name}` : `collects at ${name}, ${place.walkMin} min walk`;
}

/** Pin + where the party collects + "Here" (your own location) or "5 min walk"; scrolls if it doesn't fit. */
export function PartyPlaceLine({ place, className }: { place: PartyPlace; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1 text-meta text-ink-2", className)}>
      <MapPin aria-hidden className={cn("size-3.5 shrink-0", place.here && "text-accent-ink")} />
      <Marquee className="min-w-0">
        <span className="sr-only">Collects at </span>
        {place.point?.name ?? "Collection point"}
        <span aria-hidden> · </span>
        {place.here ? (
          <span className="font-semibold text-accent-ink">Here</span>
        ) : (
          <span className="tnum">
            <span className="sr-only">, </span>
            {place.walkMin} min walk
          </span>
        )}
      </Marquee>
    </span>
  );
}
