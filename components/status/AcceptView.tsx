"use client";

import { CircleCheck, RefreshCw, Tag } from "lucide-react";
import { BottomBar, Button, Countdown, SectionHeader, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { ACCEPT_WINDOW_MS } from "@/lib/requests";
import { previewSplit, useApp } from "@/lib/store";
import { CollectionPoint, type ViewProps } from "./FillingView";
import { MemberList } from "./MemberList";
import { OrderSummary } from "./OrderSummary";
import { PartySection } from "./PartySection";

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** W9: the deal is reached. Everyone accepts and pays before the round ends. */
export function AcceptView({ request, restaurant, pickup, onPay }: ViewProps & { onPay: () => void }) {
  const { now } = useApp();
  const me = request.participants.find((p) => p.userId === ME.userId)!;
  const cost = previewSplit(request, restaurant, ME.userId, me.basket);
  const deadline = request.acceptDeadline ?? now;
  const remaining = Math.max(0, deadline - now);
  const paid = request.participants.filter((p) => p.paid).length;
  const waitingOn = request.participants.filter((p) => p.userId !== ME.userId && !p.paid && !p.declined).length;
  const dropped = request.removedNames.filter((n) => n !== ME.name);
  const secondRound = request.round === 2;

  return (
    <>
      <div className="flex flex-col gap-8 px-4 pt-3 pb-8">
        <section aria-labelledby="deal-title" className="flex flex-col gap-2">
          <div className="flex min-h-8 justify-end">
            <CollectionPoint pickup={pickup} />
          </div>
          <div className="rounded-card bg-accent-soft p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                {secondRound ? <RefreshCw /> : <Tag />}
              </span>
              <h1 id="deal-title" className="font-display text-section font-semibold text-ink">
                {secondRound ? "Second round" : "Deal reached!"}
              </h1>
            </div>
            <p className="mt-3 text-body text-ink">
              {secondRound ? (
                <>
                  {dropped.length > 0 ? `${joinNames(dropped)} didn't accept. ` : ""}Totals updated, accept again in{" "}
                  <Countdown until={deadline} now={now} urgentTone="offer-ink" className="font-semibold" />.
                </>
              ) : (
                <>
                  Everyone must accept in <Countdown until={deadline} now={now} urgentTone="offer-ink" className="font-semibold" />.
                </>
              )}
            </p>
            <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent-ink/15">
              <div
                className="h-full origin-left rounded-full bg-accent-ink transition-transform duration-1000 ease-linear motion-reduce:transition-none"
                style={{ transform: `scaleX(${remaining / ACCEPT_WINDOW_MS})` }}
              />
            </div>
            <p className="tnum mt-2 text-meta text-ink-2">
              {paid} of {request.participants.length} paid · {restaurant.deal.short} locked in once everyone accepts
            </p>
          </div>
        </section>

        <section aria-labelledby="order-title" className="flex flex-col gap-3">
          <SectionHeader id="order-title" title="Order" />
          <OrderSummary restaurant={restaurant} basket={me.basket} cost={cost} members={cost.members} mode="exact" />
        </section>

        <PartySection request={request}>
          <MemberList request={request} mode="accept" />
        </PartySection>
      </div>

      <BottomBar material={false}>
        {me.paid ? (
          <div role="status" className="glass flex h-14 w-full items-center justify-center gap-2 rounded-full px-6">
            <CircleCheck aria-hidden className="shrink-0 text-success" />
            <span className="tnum truncate text-emphasis font-semibold text-ink">
              {waitingOn > 0 ? `Paid, waiting for ${waitingOn} other${waitingOn === 1 ? "" : "s"}` : "Paid, placing the order…"}
            </span>
          </div>
        ) : (
          <Button
            variant="glass"
            block
            chip={formatPrice(cost.total)}
            onClick={onPay}
            aria-haspopup="dialog"
            aria-label={`Accept and pay, ${formatPrice(cost.total)}`}
          >
            Accept and pay
          </Button>
        )}
      </BottomBar>
    </>
  );
}
