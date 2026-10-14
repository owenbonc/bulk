"use client";

import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";
import { CATALOG } from "@/lib/data";
import { isTerminal } from "@/lib/requests";
import { formatGBP } from "@/lib/split";
import { myEntry, restaurantById, useApp } from "@/lib/store";
import type { RequestStatus } from "@/lib/types";

const STATUS_LABEL: Record<RequestStatus, string> = {
  open: "In queue",
  deal_achieved: "Deal achieved — accept now",
  confirmed: "Order placed",
  preparing: "Preparing",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  expired: "Expired",
  cancelled: "Cancelled",
};

/** Step 1: restaurant boxes + your active requests. */
export default function Home() {
  const { state, now } = useApp();
  const mine = state.requests.filter((r) => myEntry(r) && !isTerminal(r.status));
  const openCount = (restaurantId: string) =>
    state.requests.filter((r) => r.restaurantId === restaurantId && r.status === "open" && r.expiresAt > now).length;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Order together, pay less</h1>
        <p className="text-sm text-stone-600">Join a group order near your hall to unlock restaurant deals and share delivery.</p>
        <ButtonLink href="/create">＋ Create order request</ButtonLink>
      </section>

      {mine.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Your requests</h2>
          {mine.map((r) => (
            <Link key={r.id} href={myEntry(r)!.finalised ? `/req/${r.id}` : `/req/${r.id}/order`} className="block">
              <Card className="flex items-center justify-between py-3 hover:border-emerald-400">
                <span className="font-medium">
                  {restaurantById(r.restaurantId)?.emoji} {restaurantById(r.restaurantId)?.name}
                </span>
                <span className="text-xs text-emerald-700">{myEntry(r)!.finalised ? STATUS_LABEL[r.status] : "Choosing food"} →</span>
              </Card>
            </Link>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Restaurants near you</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATALOG.restaurants.map((r) => (
            <Link key={r.id} href={`/r/${r.id}`} className="block">
              <Card className="h-full space-y-1 hover:border-emerald-400">
                <div className="text-3xl">{r.emoji}</div>
                <p className="font-semibold leading-tight">{r.name}</p>
                <p className="text-xs text-stone-500">
                  {r.cuisine} · {formatGBP(r.deliveryFee)} delivery
                </p>
                <p className="text-xs font-medium text-emerald-700">{r.deal.label}</p>
                <p className="text-xs text-stone-500">{openCount(r.id)} open requests</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
