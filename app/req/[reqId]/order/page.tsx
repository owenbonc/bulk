"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Card, Countdown, ProgressBar, Row } from "@/components/ui";
import { ME } from "@/lib/data";
import { basketTotal, queueTotal } from "@/lib/requests";
import { formatGBP } from "@/lib/split";
import { myEntry, pickupById, restaurantById, useApp, useRequest } from "@/lib/store";

/** Step 3: choose food, build your basket, finalise your queue entry. */
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
        You&apos;re not in this request. <Link href="/" className="underline">Back home</Link>
      </p>
    );
  }
  if (done) return null;

  const restaurant = restaurantById(request.restaurantId)!;
  const mine = basketTotal(me.basket, restaurant);
  const queued = queueTotal(request, restaurant);
  const qty = (itemId: string) => me.basket.find((l) => l.itemId === itemId)?.qty ?? 0;
  const item = (itemId: string, type: "ADD_ITEM" | "REMOVE_ITEM") => dispatch({ type, requestId: reqId, userId: ME.userId, itemId });

  function finalise() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    dispatch({ type: "FINALISE_ENTRY", requestId: reqId, userId: ME.userId, now: Date.now() });
    router.push(`/req/${reqId}`);
  }

  function leave() {
    dispatch({ type: "LEAVE", requestId: reqId, userId: ME.userId });
    router.push(`/r/${restaurant.id}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-stone-500">
          {restaurant.emoji} {restaurant.name} · 📍 {pickupById(request.pickupPointId)?.name}
        </p>
        <h1 className="text-2xl font-bold">Choose your food</h1>
        <p className="text-xs text-stone-500">
          Request closes in <Countdown until={request.expiresAt} now={now} label="" />
        </p>
      </div>

      <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200">
        {restaurant.menu.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-stone-500">{formatGBP(m.price)}</p>
            </div>
            <div className="flex items-center gap-3">
              {qty(m.id) > 0 && (
                <>
                  <button aria-label={`Remove ${m.name}`} className="h-8 w-8 rounded-full border border-stone-300" onClick={() => item(m.id, "REMOVE_ITEM")}>
                    −
                  </button>
                  <span className="w-4 text-center tabular-nums">{qty(m.id)}</span>
                </>
              )}
              <button aria-label={`Add ${m.name}`} className="h-8 w-8 rounded-full bg-emerald-600 text-white" onClick={() => item(m.id, "ADD_ITEM")}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Card className="space-y-3">
        <p className="font-semibold">Your basket</p>
        {me.basket.length === 0 && <p className="text-sm text-stone-500">Nothing added yet.</p>}
        {me.basket.map((l) => {
          const m = restaurant.menu.find((x) => x.id === l.itemId)!;
          return <Row key={l.itemId} left={`${l.qty} × ${m.name}`} right={formatGBP(m.price * l.qty)} />;
        })}
        <Row left="Your subtotal" right={formatGBP(mine)} strong />
        <div className="space-y-1 pt-1">
          <ProgressBar value={queued + mine} max={restaurant.deal.minTotal} />
          <p className="text-xs text-stone-500">
            With your basket the group reaches {formatGBP(queued + mine)} of {formatGBP(restaurant.deal.minTotal)} for &ldquo;
            {restaurant.deal.label}&rdquo;.
          </p>
        </div>
      </Card>

      <Button onClick={finalise} disabled={me.basket.length === 0}>
        Finalise queue entry
      </Button>
      {request.hostId !== ME.userId && (
        <Button variant="secondary" onClick={leave}>
          Leave this request
        </Button>
      )}
    </div>
  );
}
