import { Clock, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { DealPill, LegendDot, Marquee, ProgressPie, cn, formatPrice } from "@/components/ui";
import { deliveryEta } from "@/lib/geo";
import type { Preview } from "@/lib/requests";
import type { PickupPoint, Restaurant } from "@/lib/types";

export interface BasketSummaryProps {
  restaurant: Restaurant;
  pickup?: PickupPoint;
  /** Icon for the party line (people in join mode, timer in host mode), aria-hidden. */
  partyIcon: ReactNode;
  /** "4 in party · closes in 5:37" or "Party lasts 15 min". */
  partyLine: ReactNode;
  preview: Preview;
}

/**
 * Restaurant, collection point, delivery estimate and party line on the left; the deal block on the right
 * behind a hairline. In a narrow container the deal block stacks below the facts.
 */
export function BasketSummary({ restaurant, pickup, partyIcon, partyLine, preview }: BasketSummaryProps) {
  const [lo, hi] = pickup ? deliveryEta(restaurant, pickup) : [restaurant.prepMin, restaurant.prepMin + 10];

  return (
    <section aria-label="Order summary" className="@container">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 @max-[22rem]:grid-cols-1">
        <div className="min-w-0 pt-0.5">
          <Marquee as="h1" className="text-title font-semibold text-ink">
            {restaurant.name}
          </Marquee>
          <ul className="mt-2.5 flex flex-col gap-1.5 text-body text-ink-2">
            <Fact icon={<MapPin aria-hidden />} iconClassName="text-accent-ink">
              <span className="sr-only">Collection point: </span>
              <Marquee>{pickup?.name ?? "Collection point"}</Marquee>
            </Fact>
            <Fact icon={<Clock aria-hidden />}>
              <span className="tnum">
                Est. delivery {lo}–{hi} min
              </span>
            </Fact>
            <Fact icon={partyIcon}>{partyLine}</Fact>
          </ul>
        </div>
        <DealBlock restaurant={restaurant} preview={preview} />
      </div>
    </section>
  );
}

/** One summary line: a 16px icon centred on the first line of text. */
function Fact({ icon, iconClassName = "text-ink-3", children }: { icon: ReactNode; iconClassName?: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className={cn("flex h-[1lh] shrink-0 items-center [&_svg]:size-4", iconClassName)}>{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

/**
 * The deal and the party's progress towards it including your basket. Your basket is the pulsing --mine
 * slice at the leading edge of the fill, so you can see how far your order moves the party. Nothing is
 * reached until you submit, so the copy speaks of your basket unlocking the deal, or what's still to go.
 */
function DealBlock({ restaurant, preview }: { restaurant: Restaurant; preview: Preview }) {
  const { progress, subtotal } = preview;
  const yours = Math.min(100, Math.round((subtotal * 100) / progress.target));
  const unlocks = progress.left === 0;

  return (
    <div className="w-40 border-l border-line pl-3 @max-[22rem]:w-auto @max-[22rem]:border-t @max-[22rem]:border-l-0 @max-[22rem]:pt-3 @max-[22rem]:pl-0">
      <DealPill label={restaurant.deal.short} />
      <div className="mt-2.5 flex items-center gap-2.5">
        <ProgressPie
          value={progress.total}
          max={progress.target}
          contribution={subtotal}
          size={44}
          label={`Party ${progress.pct}% of the way to the deal${subtotal > 0 ? `, ${yours}% from your basket` : ""}`}
        />
        <div className="min-w-0">
          <p className="tnum text-emphasis font-semibold text-ink">{progress.pct}%</p>
          {!unlocks && <p className="tnum whitespace-nowrap text-meta text-ink-2">{formatPrice(progress.left, { trim: true })} to go</p>}
        </div>
      </div>
      {unlocks ? (
        <p className="mt-2 flex items-start gap-1.5 text-meta font-medium text-accent-ink">
          <span className="flex h-[1lh] items-center">
            <LegendDot />
          </span>
          Your basket unlocks the deal
        </p>
      ) : (
        subtotal > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-caption text-ink-2">
            <LegendDot />
            Your basket
          </p>
        )
      )}
    </div>
  );
}
