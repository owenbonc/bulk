"use client";

import { BellRing, House, LogOut, MapPin, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomBar, Button, Countdown, EXIT, LegendDot, Marquee, Popup, ProgressPie, SectionHeader, formatPrice, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { basketTotal } from "@/lib/split";
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
  const { now, dispatch } = useApp();
  const router = useRouter();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const me = request.participants.find((p) => p.userId === ME.userId);

  const leave = () => {
    dispatch({ type: "LEAVE", requestId: request.id, userId: ME.userId });
    setConfirmLeave(false);
    toast("You left the queue");
    router.push("/");
  };
  const progress = progressOf(request, restaurant);
  const preview = me && previewSplit(request, restaurant, ME.userId, me.basket);
  // Your finalised basket is part of the party's spend: its share of the pie is drawn in --mine.
  const mine = me?.finalised ? basketTotal(me.basket, restaurant) : 0;

  return (
    <>
      <div className="flex flex-col gap-section px-gutter pt-2 pb-6">
        <section aria-labelledby="filling-title" className="flex flex-col gap-group">
          <div className="flex min-h-10 items-center justify-between gap-3">
            <h1 id="filling-title" className="shrink-0 font-display text-section font-semibold text-ink">
              Filling the party
            </h1>
            <CollectionPoint pickup={pickup} />
          </div>

          <div className="flex items-center justify-between gap-3 border-y border-line py-4">
            <div className="min-w-0">
              <Countdown until={request.expiresAt} now={now} className="block text-hero font-semibold" />
              <p className="mt-1 text-meta text-ink-2">left to fill</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex flex-col items-end">
                <p className="tnum text-emphasis font-semibold text-ink">
                  {progress.pct}% <span className="font-normal text-ink-2">filled</span>
                </p>
                <p className="tnum text-meta text-ink-2">
                  {formatPrice(progress.total, { trim: true })} / {formatPrice(progress.target, { trim: true })}
                </p>
                {mine > 0 && (
                  <p className="tnum mt-0.5 flex items-center gap-1.5 text-meta text-ink-2">
                    <LegendDot />
                    You {formatPrice(mine, { trim: true })}
                  </p>
                )}
              </div>
              <ProgressPie
                value={progress.total}
                max={progress.target}
                contribution={mine}
                size={52}
                label={`${progress.pct}% filled${mine > 0 ? `, your basket ${formatPrice(mine)}` : ""}`}
              />
            </div>
          </div>

          <NotifyCaption />
        </section>

        <section aria-labelledby="order-title" className="flex flex-col gap-group">
          <SectionHeader id="order-title" title="Order" />
          {me && preview ? (
            <>
              {!me.finalised && (
                <div className="flex items-center gap-3 rounded-card bg-accent-soft p-card">
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
            <div className="flex flex-col items-start gap-group">
              <p className="text-body text-ink-2">You&apos;re not in this party yet. Pick something from the menu to join.</p>
              <Button size="md" variant="secondary" icon={<UtensilsCrossed />} href={`/party/${request.id}`}>
                See the menu
              </Button>
            </div>
          )}
        </section>

        <PartySection request={request}>
          <MemberList request={request} mode="filling" />
        </PartySection>
      </div>

      <BottomBar material={false} className="flex gap-2">
        <Button variant="glass" block={!me?.finalised} icon={<House />} href="/" className={me?.finalised ? "min-w-0 flex-1" : undefined}>
          {me?.finalised ? "Home" : "Back to home"}
        </Button>
        {/* Committed to the party but it hasn't filled yet: you can still leave. */}
        {me?.finalised && (
          <Button variant="glass" icon={<LogOut />} className="min-w-0 flex-1 text-offer" onClick={() => setConfirmLeave(true)}>
            Leave queue
          </Button>
        )}
      </BottomBar>

      <Popup
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        icon={<LogOut />}
        iconTone="offer"
        title="Leave the queue?"
        description={
          <>
            Your basket will be removed. The party stays open for everyone else
            {request.hostId === ME.userId ? ", even though you created it" : ""}, and their prices are recalculated. Nothing is
            charged.
          </>
        }
        action={
          <div className="flex w-full flex-col gap-2">
            <Button size="lg" block variant="danger" icon={<LogOut />} className="ring-1 ring-offer/30 ring-inset" onClick={leave}>
              Leave queue
            </Button>
            <Button size="lg" block variant="secondary" onClick={() => setConfirmLeave(false)}>
              Stay in the queue
            </Button>
          </div>
        }
      />
    </>
  );
}

export function CollectionPoint({ pickup }: { pickup: PickupPoint }) {
  return (
    <span className="flex min-w-0 items-center gap-1 text-meta text-ink-2">
      <MapPin aria-hidden className="size-4 shrink-0 text-accent-ink" />
      <span className="sr-only">Collection point: </span>
      <Marquee>{pickup.name}</Marquee>
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
          <motion.span exit={{ opacity: 0, transition: EXIT }}>
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

