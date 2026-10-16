"use client";

import { LogOut, MapPin, SlidersHorizontal, Tag, Timer, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Button, Countdown, LegendDot, ProgressBar, Sheet, formatPrice } from "@/components/ui";
import type { Progress } from "@/lib/requests";
import type { PickupPoint, Restaurant } from "@/lib/types";

const gbp = (pence: number) => formatPrice(pence, { trim: true });

// ---------------------------------------------------------------------------
// Deal sheet: opened from the Deal pill in the bottom bubble
// ---------------------------------------------------------------------------

export interface DealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "join" | "create";
  restaurant: Restaurant;
  /** Join: the party's finalised progress. Create: the draft as it will be created (your basket only). */
  progress: Progress;
  /** Your basket subtotal in pence. */
  mine: number;
}

export function DealSheet({ open, onOpenChange, mode, restaurant, progress, mine }: DealSheetProps) {
  const { deal } = restaurant;
  // Join progress counts finalised baskets only, so your basket is added on top; the draft already holds it.
  const withMine = mode === "join" ? progress.total + mine : progress.total;
  const left = Math.max(0, progress.target - withMine);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={deal.label}>
      <div className="flex flex-col gap-4 pt-1">
        <div className="flex flex-col gap-2.5 rounded-card bg-accent-soft p-card">
          <div className="flex items-baseline justify-between gap-3">
            <span className="tnum font-display text-hero font-semibold text-ink">
              {gbp(withMine)}
              <span className="text-section font-medium text-ink-2"> / {gbp(progress.target)}</span>
            </span>
            <span className="tnum text-body font-semibold text-accent-ink">{left > 0 ? `${gbp(left)} to go` : "Unlocked"}</span>
          </div>
          <ProgressBar
            value={withMine}
            max={progress.target}
            contribution={mine > 0 ? mine : undefined}
            size="md"
            label={mode === "join" ? "Party spend towards the deal" : "Your basket towards the deal"}
            valueText={
              mode === "join" && mine > 0
                ? `${gbp(withMine)} of ${gbp(progress.target)} with your basket (${gbp(progress.total)} from the party)`
                : `${gbp(progress.total)} of ${gbp(progress.target)}`
            }
            className="bg-surface!"
          />
          {mine > 0 && (
            <span className="flex items-center gap-1.5 text-meta text-ink-2">
              <LegendDot />
              Your basket <span className="tnum font-semibold text-ink">{formatPrice(mine)}</span>
            </span>
          )}
        </div>

        <p className="text-body text-ink">
          {deal.short} when the party spends {gbp(deal.minTotal)}.{" "}
          {mode === "join" ? (
            <>
              {left > 0 ? (
                <>
                  <span className="tnum font-semibold">{gbp(left)}</span> to go{mine > 0 && " with your basket"}.
                </>
              ) : (
                "Your basket unlocks it."
              )}
            </>
          ) : (
            <>
              Your basket counts <span className="tnum font-semibold">{formatPrice(mine)}</span> towards it; people who join make up the
              rest.
            </>
          )}{" "}
          Discount is applied to everyone&apos;s food when the party fills.
        </p>

        <ul className="flex flex-col gap-2 text-meta text-ink-2">
          {mode === "join" && mine > 0 && (
            <li>
              Your basket adds <span className="tnum font-semibold text-ink">{formatPrice(mine)}</span> once you join the party.
            </li>
          )}
          <li>
            Delivery (<span className="tnum">{formatPrice(restaurant.deliveryFee)}</span>) is split between everyone in the party.
          </li>
          <li>If the timer runs out first, the party closes and nobody is charged.</li>
        </ul>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// More sheet: the "…" button in the top bar
// ---------------------------------------------------------------------------

export interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  pickup: PickupPoint | undefined;
  /** Join mode: the party's closing time and size. */
  party?: { expiresAt: number; size: number };
  now: number;
  /** Create mode: opens the party settings sheet. */
  onEditSettings?: () => void;
  /** Present when you're in the party and may leave it. */
  onLeave?: () => void;
}

export function MoreSheet({ open, onOpenChange, restaurant, pickup, party, now, onEditSettings, onLeave }: MoreSheetProps) {
  const { deal } = restaurant;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={restaurant.name}
      description={`${restaurant.cuisine} · ${restaurant.area}`}
      footer={
        onLeave && (
          <Button variant="danger" block icon={<LogOut />} onClick={onLeave}>
            Leave party
          </Button>
        )
      }
    >
      <ul className="-mx-5 flex flex-col">
        <InfoRow icon={<Tag />} tone="offer" title="Deal">
          <p className="text-body text-ink">{deal.label}</p>
          <p className="mt-0.5 text-meta text-ink-2">
            Applied to everyone&apos;s food once the party spends <span className="tnum">{gbp(deal.minTotal)}</span>. Delivery (
            <span className="tnum">{formatPrice(restaurant.deliveryFee)}</span>) is split between everyone.
          </p>
        </InfoRow>

        <InfoRow icon={<MapPin />} title="Collection point">
          <p className="text-body text-ink">{pickup?.name ?? "Not set"}</p>
          {pickup?.access && <p className="mt-0.5 text-meta text-ink-2">{pickup.access}</p>}
        </InfoRow>

        {party && (
          <InfoRow icon={<Users />} title="This party">
            <p className="text-body text-ink">
              <span className="tnum">{party.size}</span> in party
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-meta text-ink-2">
              <Timer aria-hidden className="size-3.5" />
              Closes in <Countdown until={party.expiresAt} now={now} />
            </p>
          </InfoRow>
        )}
      </ul>

      {onEditSettings && (
        <Button variant="secondary" block icon={<SlidersHorizontal />} onClick={onEditSettings} className="mt-4">
          Change party settings
        </Button>
      )}
    </Sheet>
  );
}

function InfoRow({ icon, title, tone = "neutral", children }: { icon: ReactNode; title: string; tone?: "neutral" | "offer"; children: ReactNode }) {
  return (
    <li className="flex gap-3 border-b border-line px-5 py-3 last:border-b-0">
      <span
        aria-hidden
        className={
          tone === "offer"
            ? "grid size-10 shrink-0 place-items-center rounded-full bg-offer-soft text-offer-ink"
            : "grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2"
        }
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="font-sans text-meta font-semibold text-ink-2">{title}</h3>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}
