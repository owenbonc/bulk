"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Card, SummaryRow, cn, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { basketTotal } from "@/lib/requests";
import { newPartyId, openPartyFor, QUEUE_DURATIONS, useApp } from "@/lib/store";
import type { OrderRequest, PickupPoint, ReleasedEntry, Restaurant } from "@/lib/types";

export interface RetryChoiceProps {
  request: OrderRequest;
  entry: ReleasedEntry;
  restaurant: Restaurant;
  pickup: PickupPoint;
}

/**
 * Shown when your attempt ended: your basket is kept, and you choose to keep queueing (a fresh
 * party just for you, same basket, restaurant and collection point) or cancel. Nothing happens
 * until you choose, and choosing never moves anyone else.
 */
export function RetryChoice({ request, entry, restaurant, pickup }: RetryChoiceProps) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  // A ref, not just state: a rapid second click lands before the re-render that disables the button.
  const submitted = useRef(false);
  const basket = entry.basket.filter((l) => restaurant.menu.some((m) => m.id === l.itemId));
  const blocking = openPartyFor(state, request.restaurantId);

  if (entry.choice === "retried") {
    return (
      <Card className="text-left">
        <p className="text-body text-ink-2">You chose to keep queueing. Your basket moved to a fresh party.</p>
        <Button className="mt-3" variant="secondary" block href={`/party/${entry.retriedAs}/status`}>
          Go to your new party
        </Button>
      </Card>
    );
  }
  if (entry.choice === "cancelled") {
    return <p className="text-body text-ink-2">You left the queue. Nothing was charged.</p>;
  }

  function keepQueueing() {
    if (submitted.current || durationMin === null) return;
    submitted.current = true;
    setBusy(true);
    const newRequestId = newPartyId();
    dispatch({ type: "RETRY_ENTRY", requestId: request.id, userId: ME.userId, newRequestId, durationMin, now: Date.now() });
    router.push(`/party/${newRequestId}/status`);
  }

  return (
    <div className="space-y-3 text-left">
      <Card>
        <p className="text-emphasis font-semibold text-ink">Your saved basket</p>
        <div className="mt-2 space-y-1">
          {basket.map((l) => {
            const item = restaurant.menu.find((m) => m.id === l.itemId)!;
            return <SummaryRow key={l.itemId} label={`${l.qty} × ${item.name}`} value={formatPrice(item.price * l.qty)} />;
          })}
          <SummaryRow strong label="Food" value={formatPrice(basketTotal(basket, restaurant))} />
        </div>
        <p className="mt-2 text-meta text-ink-3">
          {restaurant.name} · collect from {pickup.name}
        </p>
      </Card>

      {basket.length === 0 ? (
        <p className="text-body text-offer">None of these items are on the menu any more, so this basket can&apos;t be requeued.</p>
      ) : blocking ? (
        <p className="text-body text-ink-2">
          There&apos;s already an open party at {restaurant.name}. Join it from the menu, or cancel below.
        </p>
      ) : (
        <Card>
          <p className="text-emphasis font-semibold text-ink">Keep queueing?</p>
          <p className="mt-1 text-meta text-ink-2">
            Starts a fresh party with the same basket and collection point. It&apos;s just for you: nobody else is moved unless they choose
            to keep queueing too. Old quotes, acceptances and demo payments don&apos;t carry over.
          </p>
          <p className="mt-3 text-meta font-semibold text-ink">Wait up to</p>
          <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="How long to wait">
            {QUEUE_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={d === durationMin}
                onClick={() => setDurationMin(d)}
                className={cn(
                  "h-11 rounded-full text-body font-semibold ring-1 ring-inset transition-colors",
                  d === durationMin ? "bg-accent-soft text-accent-ink ring-accent" : "bg-surface text-ink ring-line",
                )}
              >
                {d} min
              </button>
            ))}
          </div>
          <Button className="mt-3" block icon={<RotateCcw />} disabled={busy || durationMin === null} onClick={keepQueueing}>
            {durationMin === null ? "Choose how long to wait" : `Keep queueing for ${durationMin} min`}
          </Button>
        </Card>
      )}

      <Button variant="danger" block disabled={busy} onClick={() => dispatch({ type: "CANCEL_ENTRY", requestId: request.id, userId: ME.userId })}>
        Cancel and leave the queue (no charge)
      </Button>
    </div>
  );
}
