import { MapPin, Truck } from "lucide-react";
import type { Ref } from "react";
import { ImageFrame, Marquee, Rating } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

/** How far the page lifts over the bottom of the hero photo (the rounded sheet edge), in px. */
export const HERO_OVERLAP = 24;

/**
 * Full-bleed hero photo from the very top of the phone, under the status bar: 16:10 of the photo stays
 * visible below the status bar's safe area. An ink shade over the top edge holds through the status bar
 * band and fades out below the floating buttons, so the white status bar glyphs clear 4.5:1 even over pale
 * photos and the glass buttons read over any photo.
 */
export function MenuHero({ restaurant, ref }: { restaurant: Restaurant; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="@container relative">
      <ImageFrame
        src={restaurant.image}
        alt={restaurant.name}
        radius="none"
        emoji={restaurant.emoji}
        priority
        className="h-[calc(62.5cqw+var(--safe-top))] w-full"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[calc(var(--safe-top)+80px)] bg-linear-to-b from-ink/60 via-ink/45 via-30% to-transparent"
      />
    </div>
  );
}

/** Name, cuisine and neighbourhood, rating and delivery estimate under the hero. */
export function RestaurantHeader({ restaurant }: { restaurant: Restaurant }) {
  const [min, max] = restaurant.etaMin;
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-title font-semibold text-ink">{restaurant.name}</h1>
      <p className="flex min-w-0 items-center gap-1 text-meta text-ink-2">
        <MapPin aria-hidden className="size-3.5 shrink-0" />
        <Marquee>
          {restaurant.cuisine} · {restaurant.area} · <span className="tnum">{restaurant.distanceMiles} mi</span>
        </Marquee>
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Rating value={restaurant.rating} label={restaurant.ratingLabel} count={restaurant.ratingCount} />
        <p className="flex items-center gap-1 text-meta text-ink-2">
          <Truck aria-hidden className="size-3.5 shrink-0" />
          <span>
            Delivers in <span className="tnum">{min}–{max}</span> min
          </span>
        </p>
      </div>
    </div>
  );
}
