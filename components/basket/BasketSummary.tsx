import { Clock, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { ProgressPie, formatPrice } from "@/components/ui";
import type { Preview } from "@/lib/requests";
import type { PickupPoint, Restaurant } from "@/lib/types";

export interface BasketSummaryProps {
  restaurant: Restaurant;
  pickup?: PickupPoint;
  /** Icon for the party line (people in join mode, timer in host mode), aria-hidden with `mt-[2px]`. */
  partyIcon: ReactNode;
  /** "4 in party · closes in 5:37" or "Party lasts 15 min". */
  partyLine: ReactNode;
  preview: Preview;
}

/** Restaurant, collection point, delivery estimate and party line on the left; the deal card on the right. */
export function BasketSummary({ restaurant, pickup, partyIcon, partyLine, preview }: BasketSummaryProps) {
  const [lo, hi] = restaurant.etaMin;

  return (
    <section aria-label="Order summary" className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0 pt-1">
        <h1 className="text-title font-semibold text-ink">{restaurant.name}</h1>
        <ul className="mt-3 flex flex-col gap-2 text-body text-ink-2 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-ink-3">
          <li className="flex items-start gap-2.5">
            <MapPin aria-hidden className="mt-[2px]" />
            <span className="min-w-0">
              <span className="sr-only">Collection point: </span>
              {pickup?.name ?? "Collection point"}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Clock aria-hidden className="mt-[2px]" />
            <span className="tnum">
              Est. delivery {lo}–{hi} min
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            {partyIcon}
            <span className="min-w-0">{partyLine}</span>
          </li>
        </ul>
      </div>
      <DealCard restaurant={restaurant} preview={preview} />
    </section>
  );
}

/**
 * The deal and the party's progress towards it including your basket. Your basket is the --offer slice at
 * the leading edge of the fill, so you can see how far your order moves the party.
 */
function DealCard({ restaurant, preview }: { restaurant: Restaurant; preview: Preview }) {
  const { progress, subtotal } = preview;
  const yours = Math.min(100, Math.round((subtotal * 100) / progress.target));
  const unlocked = progress.left === 0;

  return (
    <div className="w-[9.5rem] rounded-card border border-line bg-surface p-3.5">
      <p className="font-display text-section font-semibold text-ink">{restaurant.deal.short}</p>
      <div className="mt-3 flex items-center gap-3">
        <ProgressPie
          value={progress.total}
          max={progress.target}
          contribution={subtotal}
          size={48}
          label={`Party ${progress.pct}% of the way to the deal${subtotal > 0 ? `, ${yours}% from your basket` : ""}`}
        />
        <div className="min-w-0">
          <p className="tnum text-emphasis leading-tight font-semibold text-ink">{progress.pct}%</p>
          <p className={unlocked ? "text-meta font-medium text-accent-ink" : "tnum text-meta text-ink-2"}>
            {unlocked ? "Deal reached" : `${formatPrice(progress.left, { trim: true })} left`}
          </p>
        </div>
      </div>
      {subtotal > 0 && (
        <p className="mt-2.5 flex items-center gap-1.5 text-caption text-ink-2">
          <span aria-hidden className="size-2 shrink-0 rounded-full bg-offer" />
          Your basket
        </p>
      )}
    </div>
  );
}
