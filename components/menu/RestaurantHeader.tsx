import { MapPin, Truck } from "lucide-react";
import { ImageFrame, Rating } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

/**
 * Full-bleed 16:10 hero photo, loaded with priority. The floating glass buttons sit over its top edge, so
 * a short, light ink shade sits only there; the rest of the photo is untouched.
 */
export function MenuHero({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="relative">
      <ImageFrame src={restaurant.image} alt={restaurant.name} ratio="16/10" radius="none" emoji={restaurant.emoji} priority />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-ink/20 to-transparent" />
    </div>
  );
}

/** Name, cuisine and neighbourhood, rating and delivery estimate under the hero. */
export function RestaurantHeader({ restaurant }: { restaurant: Restaurant }) {
  const [min, max] = restaurant.etaMin;
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-title font-semibold text-ink">{restaurant.name}</h1>
      <p className="flex items-center gap-1 text-meta text-ink-2">
        <MapPin aria-hidden className="size-3.5 shrink-0" />
        <span>
          {restaurant.cuisine} · {restaurant.area} · <span className="tnum">{restaurant.distanceMiles} mi</span>
        </span>
      </p>
      <Rating value={restaurant.rating} label={restaurant.ratingLabel} count={restaurant.ratingCount} className="self-start" />
      <p className="flex items-center gap-1 text-meta text-ink-2">
        <Truck aria-hidden className="size-3.5 shrink-0" />
        <span>
          Delivers in <span className="tnum">{min}–{max}</span> min
        </span>
      </p>
    </div>
  );
}
