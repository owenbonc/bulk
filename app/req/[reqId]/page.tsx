"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import DeliveryTimeline from "@/components/DeliveryTimeline";
import { Button, ButtonLink, Card, Countdown, ProgressBar, Row } from "@/components/ui";
import { ME } from "@/lib/data";
import { queueTotal } from "@/lib/requests";
import { formatGBP, splitCosts } from "@/lib/split";
import { myEntry, pickupById, restaurantById, useApp, useRequest } from "@/lib/store";
import type { OrderRequest, Participant } from "@/lib/types";

function MemberList({ request, show }: { request: OrderRequest; show: (p: Participant) => string }) {
  return (
    <ul className="space-y-2">
      {request.participants.map((p) => (
        <li key={p.userId} className="flex items-center justify-between text-sm">
          <span>
            {p.userId === ME.userId ? "You" : p.name}
            {p.userId === request.hostId && <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">host</span>}
          </span>
          <span className="text-stone-500">{show(p)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Steps 4–7: queue → deal achieved → accept & pay → delivery (or expired / cancelled). */
export default function RequestPage() {
  const { reqId } = useParams<{ reqId: string }>();
  const { now, dispatch } = useApp();
  const router = useRouter();
  const request = useRequest(reqId);
  const [paying, setPaying] = useState(false);

  if (!request) {
    return (
      <p className="text-sm">
        Request not found. <Link href="/" className="underline">Back home</Link>
      </p>
    );
  }

  const restaurant = restaurantById(request.restaurantId)!;
  const pickup = pickupById(request.pickupPointId)!;
  const me = myEntry(request);
  const split = splitCosts(request, restaurant);
  const myCost = split.people[ME.userId];
  const queued = queueTotal(request, restaurant);

  const header = (
    <div>
      <p className="text-sm text-stone-500">
        {restaurant.emoji} {restaurant.name} · 📍 {pickup.name}
      </p>
    </div>
  );

  const costCard = myCost && (
    <Card className="space-y-1">
      <Row left="Your food" right={formatGBP(myCost.subtotal)} />
      <Row left={`Group deal (${restaurant.deal.discountPct}% off)`} right={`−${formatGBP(myCost.discount)}`} />
      <Row left={`Delivery share (1/${request.participants.length})`} right={formatGBP(myCost.delivery)} />
      <Row left="You pay" right={formatGBP(myCost.total)} strong />
    </Card>
  );

  switch (request.status) {
    case "open":
      return (
        <div className="space-y-5">
          {header}
          <h1 className="text-2xl font-bold">Waiting for the group</h1>
          <Card className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{restaurant.deal.label}</span>
              <Countdown until={request.expiresAt} now={now} />
            </div>
            <ProgressBar value={queued} max={restaurant.deal.minTotal} />
            <p className="text-xs text-stone-500">
              {formatGBP(queued)} of {formatGBP(restaurant.deal.minTotal)} queued · {formatGBP(Math.max(0, restaurant.deal.minTotal - queued))} to go
            </p>
          </Card>
          <Card>
            <p className="mb-2 font-semibold">In the lobby</p>
            <MemberList request={request} show={(p) => (p.finalised ? "✓ in queue" : "choosing food…")} />
          </Card>
          {!me && (
            <Button
              onClick={() => {
                dispatch({ type: "JOIN", requestId: request.id, user: ME });
                router.push(`/req/${request.id}/order`);
              }}
            >
              Join lobby
            </Button>
          )}
          {me && !me.finalised && <ButtonLink href={`/req/${request.id}/order`}>Continue choosing food</ButtonLink>}
          {me?.finalised && <p className="text-center text-sm text-stone-500">You&apos;re in the queue. We&apos;ll notify you when the deal is achieved.</p>}
        </div>
      );

    case "deal_achieved":
      return (
        <div className="space-y-5">
          {header}
          <div className="rounded-2xl bg-emerald-600 p-4 text-white">
            <p className="text-2xl font-bold">🎉 Deal achieved!</p>
            <p className="text-sm">
              Everyone must accept and pay within <Countdown until={request.acceptDeadline!} now={now} label="" />, or the order is cancelled.
            </p>
          </div>
          {costCard}
          <Card>
            <p className="mb-2 font-semibold">Group</p>
            <MemberList request={request} show={(p) => (p.paid ? "✓ paid" : "waiting…")} />
          </Card>
          {me && !me.paid && <Button onClick={() => setPaying(true)}>Accept &amp; pay {formatGBP(myCost.total)}</Button>}
          {me?.paid && <p className="text-center text-sm text-stone-500">You&apos;ve paid. Waiting for everyone else to accept…</p>}

          {paying && me && !me.paid && (
            <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={() => setPaying(false)}>
              <div className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Demo payment, no real money</p>
                <p className="text-lg font-bold">Pay {formatGBP(myCost.total)}</p>
                <Card className="flex items-center justify-between py-3 text-sm">
                  <span>💳 Demo card</span>
                  <span className="font-mono">•••• 4242</span>
                </Card>
                <Button
                  onClick={() => {
                    dispatch({ type: "ACCEPT_AND_PAY", requestId: request.id, userId: ME.userId, now: Date.now() });
                    setPaying(false);
                  }}
                >
                  Confirm payment
                </Button>
                <Button variant="secondary" onClick={() => setPaying(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      );

    case "expired":
      return (
        <div className="space-y-5">
          {header}
          <h1 className="text-2xl font-bold">Request expired</h1>
          <p className="text-sm text-stone-600">
            The group reached {formatGBP(queued)} of {formatGBP(restaurant.deal.minTotal)} before time ran out. The deal wasn&apos;t
            reached, so <strong>nobody was charged</strong>.
          </p>
          <ButtonLink href={`/r/${restaurant.id}`}>Back to {restaurant.name}</ButtonLink>
        </div>
      );

    case "cancelled": {
      const missing = request.participants.filter((p) => !p.paid);
      return (
        <div className="space-y-5">
          {header}
          <h1 className="text-2xl font-bold">Order cancelled</h1>
          <p className="text-sm text-stone-600">
            Not everyone accepted in time ({missing.map((p) => (p.userId === ME.userId ? "you" : p.name)).join(", ")}). The whole order was
            cancelled and any payments were released, so <strong>nobody was charged</strong>.
          </p>
          <ButtonLink href={`/r/${restaurant.id}`}>Back to {restaurant.name}</ButtonLink>
        </div>
      );
    }

    default:
      // confirmed → preparing → out_for_delivery → delivered
      return (
        <div className="space-y-5">
          {header}
          <h1 className="text-2xl font-bold">{request.status === "delivered" ? "Your food has arrived 🎉" : "Group order placed"}</h1>
          <Card>
            <DeliveryTimeline status={request.status} />
          </Card>
          <Card className="space-y-1 text-center">
            <p className="text-sm text-stone-500">Collect from</p>
            <p className="font-semibold">📍 {pickup.name}</p>
            <p className="pt-2 text-sm text-stone-500">Your pickup PIN</p>
            <p className="font-mono text-3xl font-bold tracking-widest">{request.pin}</p>
          </Card>
          {costCard}
          <p className="text-center text-xs text-stone-500">
            Group saved {formatGBP(split.group.discount)} with the deal, and shared one {formatGBP(split.group.delivery)} delivery between{" "}
            {request.participants.length} people.
          </p>
          <ButtonLink href="/" variant="secondary">
            Back home
          </ButtonLink>
        </div>
      );
  }
}
