"use client";

import { Check, House, MapPin, PiggyBank } from "lucide-react";
import { BottomBar, Button, SectionHeader, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { previewSplit } from "@/lib/store";
import type { ViewProps } from "./FillingView";
import { MemberList } from "./MemberList";
import { OrderSummary } from "./OrderSummary";
import { PartySection } from "./PartySection";

/** You've handed over your PIN and collected the order: a calm wrap-up of what you paid and who you ordered with. */
export function CollectedView({ request, restaurant, pickup }: ViewProps) {
  const me = request.participants.find((p) => p.userId === ME.userId)!;
  const cost = previewSplit(request, restaurant, ME.userId, me.basket);
  const others = request.participants.length - 1;
  const savedLine = `You saved ${formatPrice(cost.discount)} ${others > 0 ? `with ${others} ${others === 1 ? "other" : "others"}` : "with the deal"}`;

  return (
    <>
      <div className="flex flex-col gap-section px-gutter pt-2 pb-6">
        <section aria-labelledby="collected-title" className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-success-soft text-success">
            <Check strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <h1 id="collected-title" className="font-display text-title font-semibold text-ink">
              Collected
            </h1>
            <p className="mt-1 text-body text-ink-2">Enjoy your meal from {restaurant.name}.</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-meta text-ink-2">
              <MapPin aria-hidden className="size-3.5 shrink-0 text-accent-ink" />
              Picked up at {pickup.name}
            </p>
            {cost.discount > 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-emphasis font-semibold text-accent-ink">
                <PiggyBank aria-hidden className="size-4 shrink-0" />
                {savedLine}
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby="order-title" className="flex flex-col gap-group">
          <SectionHeader id="order-title" title="Order" />
          <OrderSummary restaurant={restaurant} basket={me.basket} cost={cost} members={cost.members} mode="paid" savedHint={false} />
        </section>

        <PartySection request={request}>
          <MemberList request={request} mode="delivery" />
        </PartySection>
      </div>

      <BottomBar material={false} className="flex justify-end">
        <Button variant="glass" icon={<House />} href="/">
          Home
        </Button>
      </BottomBar>
    </>
  );
}
