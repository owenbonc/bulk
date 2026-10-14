"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import MenuPicker from "@/components/MenuPicker";
import { Button, Countdown } from "@/components/ui";
import { ME } from "@/lib/data";
import { queueTotal } from "@/lib/requests";
import { myEntry, pickupById, restaurantById, useApp, useRequest } from "@/lib/store";

/** Step 3 for joiners: choose food, build your basket, finalise your queue entry. */
export default function OrderPage() {
  const { reqId } = useParams<{ reqId: string }>();
  const { now, dispatch } = useApp();
  const router = useRouter();
  const request = useRequest(reqId);
  const me = myEntry(request);
  const done = !request || !me || me.finalised || request.status !== "open";

  useEffect(() => {
    if (request && me && done) router.replace(`/req/${reqId}`);
  }, [request, me, done, reqId, router]);

  if (!request || !me) {
    return (
      <p className="text-sm">
        You&apos;re not in this party. <Link href="/" className="underline">Back to parties</Link>
      </p>
    );
  }
  if (done) return null;

  const restaurant = restaurantById(request.restaurantId)!;
  const item = (itemId: string, type: "ADD_ITEM" | "REMOVE_ITEM") => dispatch({ type, requestId: reqId, userId: ME.userId, itemId });

  function finalise() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    dispatch({ type: "FINALISE_ENTRY", requestId: reqId, userId: ME.userId, now: Date.now() });
    router.push(`/req/${reqId}`);
  }

  function leave() {
    dispatch({ type: "LEAVE", requestId: reqId, userId: ME.userId });
    router.push("/");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-stone-500">
          {restaurant.emoji} {restaurant.name} · 📍 {pickupById(request.pickupPointId)?.name}
        </p>
        <h1 className="text-2xl font-bold">Choose your food</h1>
        <p className="text-xs text-stone-500">
          Party closes in <Countdown until={request.expiresAt} now={now} label="" />
        </p>
      </div>

      <MenuPicker
        restaurant={restaurant}
        basket={me.basket}
        queued={queueTotal(request, restaurant)}
        onAdd={(id) => item(id, "ADD_ITEM")}
        onRemove={(id) => item(id, "REMOVE_ITEM")}
      />

      <Button onClick={finalise} disabled={me.basket.length === 0}>
        Finalise queue entry
      </Button>
      {request.hostId !== ME.userId && (
        <Button variant="secondary" onClick={leave}>
          Leave this party
        </Button>
      )}
    </div>
  );
}
