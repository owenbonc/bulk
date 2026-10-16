"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DurationChips } from "@/components/shared/DurationChips";
import { Button, Card, EASE_OUT, EXIT, Marquee, formatPrice } from "@/components/ui";
import { DEFAULT_DURATION_MIN, ME } from "@/lib/data";
import { RETRY_DURATIONS, basketTotal } from "@/lib/requests";
import { newPartyId, openPartyFor, useApp } from "@/lib/store";
import type { BasketLine, OrderRequest, PickupPoint, ReleasedEntry, Restaurant } from "@/lib/types";
import { useFocusClosedTitle } from "./ClosedView";

export interface NewPartyCardProps {
  request: OrderRequest;
  entry: ReleasedEntry;
  restaurant: Restaurant;
  pickup: PickupPoint;
}

/** "1× Butter Chicken, 2× Naan · £15.50 · collect from Ramsay Hall" */
function basketLine(basket: BasketLine[], restaurant: Restaurant, pickup: PickupPoint): string {
  const items = basket
    .map((l) => {
      const item = restaurant.menu.find((m) => m.id === l.itemId);
      return item ? `${l.qty}× ${item.name}` : "";
    })
    .filter(Boolean)
    .join(", ");
  return `${items} · ${formatPrice(basketTotal(basket, restaurant))} · collect from ${pickup.name}`;
}

/**
 * Shown when a party you were in ended without an order for you (it closed, was cancelled, or you were
 * taken out): your basket is saved, and one compact card offers to start a new party with it at the same
 * restaurant and collection point (RETRY_ENTRY, just for you), or "No thanks" (CANCEL_ENTRY). If that
 * restaurant already has a party open at the collection point, the card points you to it instead.
 */
export function NewPartyCard({ request, entry, restaurant, pickup }: NewPartyCardProps) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const reduce = useReducedMotion();
  const focusTitle = useFocusClosedTitle();
  const [durationMin, setDurationMin] = useState(DEFAULT_DURATION_MIN);
  const [busy, setBusy] = useState(false);
  // A ref, not just state: a rapid second tap lands before the re-render that disables the button.
  const submitted = useRef(false);
  const basket = entry.basket.filter((l) => restaurant.menu.some((m) => m.id === l.itemId));
  const open = openPartyFor(state, request.restaurantId, request.pickupPointId);
  const inOpen = open?.participants.some((p) => p.userId === ME.userId);

  const start = () => {
    if (submitted.current) return;
    submitted.current = true;
    setBusy(true);
    const newRequestId = newPartyId();
    dispatch({ type: "RETRY_ENTRY", requestId: request.id, userId: ME.userId, newRequestId, durationMin, now: Date.now() });
    router.push(`/party/${newRequestId}/status`);
  };

  let card = null;
  if (entry.choice === "retried" && entry.retriedAs) {
    card = (
      <Card className="flex flex-col gap-3 text-left">
        <p className="text-emphasis font-semibold text-ink">Your basket is in a new party</p>
        <Button variant="secondary" block href={`/party/${entry.retriedAs}/status`}>
          See your new party
        </Button>
      </Card>
    );
  } else if (entry.choice === "pending" && basket.length > 0) {
    card = (
      <Card className="flex flex-col gap-3 text-left">
        <div className="min-w-0">
          <h2 className="text-emphasis font-semibold text-ink">Start a new party with your basket</h2>
          <Marquee as="p" className="tnum mt-0.5 text-meta text-ink-2">
            {basketLine(basket, restaurant, pickup)}
          </Marquee>
        </div>

        {open ? (
          <div className="flex flex-col gap-3">
            <p className="text-body text-ink-2">
              {inOpen ? <>You&apos;re already in a party at {restaurant.name} here.</> : <>There&apos;s already a party at {restaurant.name} here.</>}
            </p>
            <Button block href={inOpen ? `/party/${open.id}/status` : `/party/${open.id}`}>
              {inOpen ? "See your party" : "See party"}
            </Button>
          </div>
        ) : (
          <>
            <DurationChips options={RETRY_DURATIONS} value={durationMin} onChange={setDurationMin} label="Party lasts" />
            <Button block loading={busy} onClick={start}>
              Start new party
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="self-center"
          disabled={busy}
          onClick={() => {
            dispatch({ type: "CANCEL_ENTRY", requestId: request.id, userId: ME.userId });
            // The card (and the focused button) goes away: keep focus on the page's heading instead of <body>.
            requestAnimationFrame(focusTitle);
          }}
        >
          No thanks
        </Button>
      </Card>
    );
  }

  return (
    // popLayout: the outgoing card leaves the flow (positioned against this wrapper) while it fades, so the two never stack.
    <div className="relative">
      <AnimatePresence initial={false} mode="popLayout">
        {card && (
          <motion.div
            key={entry.choice}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: EXIT }}
          >
            {card}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
