"use client";

import { useRouter } from "next/navigation";
import { ME } from "@/lib/data";
import { queueTotal } from "@/lib/requests";
import { formatGBP } from "@/lib/split";
import { myEntry, pickupById, restaurantById, useApp } from "@/lib/store";
import type { OrderRequest, RequestStatus } from "@/lib/types";
import { Countdown, ProgressBar } from "./ui";

const STATUS_LABEL: Partial<Record<RequestStatus, string>> = {
  deal_achieved: "Deal achieved, accept now",
  confirmed: "Order placed",
  preparing: "Preparing",
  out_for_delivery: "On the way",
};

/** One active order request on the home screen. Tap to join (or reopen if you're in it). */
export default function PartyCard({ request }: { request: OrderRequest }) {
  const { now, dispatch } = useApp();
  const router = useRouter();
  const restaurant = restaurantById(request.restaurantId)!;
  const total = queueTotal(request, restaurant);
  const me = myEntry(request);

  function open() {
    if (me) {
      router.push(me.finalised ? `/req/${request.id}` : `/req/${request.id}/order`);
      return;
    }
    dispatch({ type: "JOIN", requestId: request.id, user: ME });
    router.push(`/req/${request.id}/order`);
  }

  return (
    <button
      onClick={open}
      className={`block w-full rounded-2xl border bg-white p-4 text-left transition hover:border-emerald-400 hover:shadow-sm ${
        me ? "border-emerald-300 ring-1 ring-emerald-200" : "border-stone-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold leading-tight">
          {restaurant.emoji} {restaurant.name}
        </p>
        {request.status === "open" ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            <Countdown until={request.expiresAt} now={now} />
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">{STATUS_LABEL[request.status]}</span>
        )}
      </div>
      <p className="mt-1 text-sm text-stone-600">📍 {pickupById(request.pickupPointId)?.name}</p>

      <div className="mt-3 space-y-1">
        <ProgressBar value={total} max={restaurant.deal.minTotal} />
        <div className="flex justify-between text-xs text-stone-500">
          <span>
            {formatGBP(total)} / {formatGBP(restaurant.deal.minTotal)} · {restaurant.deal.label}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-stone-500">👥 {request.participants.length} in party</span>
        <span className={`font-semibold ${me ? "text-emerald-700" : "text-stone-800"}`}>{me ? "Joined ✓" : "Join party →"}</span>
      </div>
    </button>
  );
}
