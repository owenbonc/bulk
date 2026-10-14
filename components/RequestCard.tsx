"use client";

import { useRouter } from "next/navigation";
import { ME } from "@/lib/data";
import { queueTotal } from "@/lib/requests";
import { formatGBP } from "@/lib/split";
import { myEntry, pickupById, restaurantById, useApp } from "@/lib/store";
import type { OrderRequest } from "@/lib/types";
import { Button, Card, Countdown, ProgressBar } from "./ui";

/** An open order request in a restaurant's lobby, with a Join / Open action. */
export default function RequestCard({ request }: { request: OrderRequest }) {
  const { now, dispatch } = useApp();
  const router = useRouter();
  const restaurant = restaurantById(request.restaurantId)!;
  const total = queueTotal(request, restaurant);
  const host = request.participants.find((p) => p.userId === request.hostId);
  const joined = !!myEntry(request);

  function join() {
    dispatch({ type: "JOIN", requestId: request.id, user: ME });
    router.push(`/req/${request.id}/order`);
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">📍 {pickupById(request.pickupPointId)?.name}</p>
          <p className="text-xs text-stone-500">
            Hosted by {host?.userId === ME.userId ? "you" : host?.name} · {request.participants.length} in lobby
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
          <Countdown until={request.expiresAt} now={now} />
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <ProgressBar value={total} max={restaurant.deal.minTotal} />
        <p className="text-xs text-stone-500">
          {formatGBP(total)} of {formatGBP(restaurant.deal.minTotal)} queued
        </p>
      </div>
      <div className="mt-3">
        {joined ? (
          <Button variant="secondary" onClick={() => router.push(`/req/${request.id}`)}>
            Open your request
          </Button>
        ) : (
          <Button onClick={join}>Join lobby</Button>
        )}
      </div>
    </Card>
  );
}
