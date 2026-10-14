"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import RequestCard from "@/components/RequestCard";
import { ButtonLink, Card } from "@/components/ui";
import { formatGBP } from "@/lib/split";
import { restaurantById, useApp } from "@/lib/store";

/** Step 2: the restaurant screen and its lobby of open order requests. */
export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const { state, now } = useApp();
  const restaurant = restaurantById(id);

  if (!restaurant) {
    return (
      <p>
        Restaurant not found. <Link href="/" className="underline">Back home</Link>
      </p>
    );
  }

  const open = state.requests
    .filter((r) => r.restaurantId === id && r.status === "open" && r.expiresAt > now)
    .sort((a, b) => a.expiresAt - b.expiresAt);

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-stone-500">← All restaurants</Link>
      <section className="space-y-1">
        <div className="text-5xl">{restaurant.emoji}</div>
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <p className="text-sm text-stone-500">
          {restaurant.cuisine} · {formatGBP(restaurant.deliveryFee)} delivery, split between the group
        </p>
      </section>

      <Card className="border-emerald-200 bg-emerald-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Group deal</p>
        <p className="font-semibold">{restaurant.deal.label}</p>
        <p className="text-xs text-stone-600">
          Unlocks when the group&apos;s confirmed baskets reach {formatGBP(restaurant.deal.minTotal)}.
        </p>
      </Card>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Lobby · {open.length} open requests</h2>
        </div>
        {open.length === 0 && <p className="text-sm text-stone-500">No open requests yet. Start one below and others nearby can join.</p>}
        {open.map((r) => (
          <RequestCard key={r.id} request={r} />
        ))}
        <ButtonLink href={`/create?restaurant=${restaurant.id}`} variant="secondary">
          ＋ Create order request
        </ButtonLink>
      </section>
    </div>
  );
}
