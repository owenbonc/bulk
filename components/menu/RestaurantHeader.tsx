import { MapPin, Star, Truck } from "lucide-react";
import type { Ref } from "react";
import { ImageFrame } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

/** Full-bleed 16:10 hero photo. The floating top bar sits over it. */
export function MenuHero({ restaurant, ref }: { restaurant: Restaurant; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="relative">
      <ImageFrame src={restaurant.image} alt={restaurant.name} ratio="16/10" radius="none" emoji={restaurant.emoji} preload />
      {/* A soft shade under the status bar so the floating buttons always sit on something calm. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-ink/25 to-transparent" />
    </div>
  );
}

/** Name, neighbourhood, rating and delivery estimate under the hero. */
export function RestaurantHeader({ restaurant }: { restaurant: Restaurant }) {
  const [min, max] = restaurant.etaMin;
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-title font-semibold text-ink">{restaurant.name}</h1>
      <p className="flex items-center gap-1.5 text-body text-ink-2">
        <MapPin aria-hidden className="size-4 shrink-0" />
        <span className="truncate">
          {restaurant.cuisine} · {restaurant.area} · <span className="tnum">{restaurant.distanceMiles} mi</span>
        </span>
      </p>
      <p className="flex items-center gap-1.5 text-body text-ink-2">
        <Star aria-hidden className="size-4 shrink-0 fill-accent-ink text-accent-ink" />
        <span>
          <span className="sr-only">Rated </span>
          <span className="tnum font-semibold text-ink">{restaurant.rating.toFixed(1)}</span> {restaurant.ratingLabel}{" "}
          <span className="tnum">({restaurant.ratingCount})</span>
        </span>
      </p>
      <p className="flex items-center gap-1.5 text-body text-ink-2">
        <Truck aria-hidden className="size-4 shrink-0" />
        <span>
          Delivers in <span className="tnum">{min}–{max}</span> min
        </span>
      </p>
    </div>
  );
}
