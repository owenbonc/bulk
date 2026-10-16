"use client";

import { BellRing, House, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BottomBar, Button, Card, Countdown, ProgressPie, SectionHeader, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { previewSplit, progressOf, useApp } from "@/lib/store";
import type { OrderRequest, PickupPoint, Restaurant } from "@/lib/types";
import { MemberList } from "./MemberList";
import { OrderSummary } from "./OrderSummary";
import { PartySection } from "./PartySection";

export interface ViewProps {
  request: OrderRequest;
  restaurant: Restaurant;
  pickup: PickupPoint;
}

/** W5: the party is still filling. Timer, progress, your projected order and who's in. */
export function FillingView({ request, restaurant, pickup }: ViewProps) {
  const { now } = useApp();
  const me = request.participants.find((p) => p.userId === ME.userId);
  const progress = progressOf(request, restaurant);
  const preview = me && previewSplit(request, restaurant, ME.userId, me.basket);

  return (
    <>
      <div className="flex flex-col gap-8 px-4 pt-3 pb-8">
        <section aria-labelledby="filling-title" className="flex flex-col gap-3">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <h1 id="filling-title" className="shrink-0 font-display text-section font-semibold text-ink">
              Filling the party
            </h1>
            <CollectionPoint pickup={pickup} />
          </div>

          <Card className="flex items-center justify-between gap-4 py-5">
            <div className="min-w-0">
              <Countdown until={request.expiresAt} now={now} className="block text-hero font-semibold" />
              <p className="mt-1 text-meta text-ink-2">left to fill</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="tnum text-emphasis font-semibold text-ink">
                  {progress.pct}% <span className="font-normal text-ink-2">filled</span>
                </p>
                <p className="tnum text-meta text-ink-2">
                  {formatPrice(progress.total, { trim: true })} / {formatPrice(progress.target, { trim: true })}
                </p>
              </div>
              <ProgressPie value={progress.total} max={progress.target} size={56} />
            </div>
          </Card>

          <NotifyCaption />
        </section>

        <section aria-labelledby="order-title" className="flex flex-col gap-3">
          <SectionHeader id="order-title" title="Order" />
          {me && preview ? (
            <>
              {!me.finalised && (
                <div className="flex items-center gap-3 rounded-card bg-accent-soft p-4">
                  <ShoppingBag aria-hidden className="shrink-0 text-accent-ink" />
                  <p className="min-w-0 flex-1 text-meta text-ink">
                    <span className="font-semibold">Your basket isn&apos;t in yet.</span> Finish joining so it counts towards the deal.
                  </p>
                  <Button size="sm" href={`/party/${request.id}/basket`}>
                    Review
                  </Button>
                </div>
              )}
              <OrderSummary restaurant={restaurant} basket={me.basket} cost={preview} members={preview.members} mode="estimate" />
            </>
          ) : (
            <Card className="flex flex-col items-start gap-3">
              <p className="text-body text-ink-2">You&apos;re not in this party yet. Pick something from the menu to join.</p>
              <Button size="md" variant="secondary" icon={<UtensilsCrossed />} href={`/party/${request.id}`}>
                See the menu
              </Button>
            </Card>
          )}
        </section>

        <PartySection request={request}>
          <MemberList request={request} mode="filling" />
        </PartySection>
      </div>

      <BottomBar>
        <Button variant="secondary" size="lg" block icon={<House />} href="/">
          Back to home
        </Button>
      </BottomBar>
    </>
  );
}

export function CollectionPoint({ pickup }: { pickup: PickupPoint }) {
  return (
    <span className="flex min-w-0 items-center gap-1 text-meta text-ink-2">
      <MapPin aria-hidden className="size-4 shrink-0 text-accent-ink" />
      <span className="sr-only">Collection point: </span>
      <span className="truncate">{pickup.name}</span>
    </span>
  );
}

function readPermission(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

/** "We'll notify you…" with a one-tap way to allow browser notifications when they haven't been decided yet. */
function NotifyCaption() {
  const [permission, setPermission] = useState(readPermission);

  return (
    <div className="flex items-center gap-2 text-meta text-ink-2">
      <BellRing aria-hidden className="size-4 shrink-0 text-accent-ink" />
      <p className="min-w-0 flex-1">We&apos;ll notify you when the deal is reached.</p>
      <AnimatePresence initial={false}>
        {permission === "default" && (
          <motion.span exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            <button
              type="button"
              onClick={() => {
                void Notification.requestPermission().then(setPermission, () => setPermission(readPermission()));
              }}
              className="relative -my-2 h-9 rounded-full px-3 text-meta font-semibold text-accent-ink transition-[scale,background-color] duration-100 ease-out before:absolute before:-inset-y-1 before:inset-x-0 active:scale-[0.97] active:bg-accent-soft hover:bg-accent-soft/60"
            >
              Allow alerts
            </button>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

