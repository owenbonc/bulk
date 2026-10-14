"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import MenuPicker from "@/components/MenuPicker";
import { Button } from "@/components/ui";
import { CATALOG, ME } from "@/lib/data";
import { restaurantById, useApp } from "@/lib/store";
import type { BasketLine } from "@/lib/types";

const DURATIONS = [15, 30, 60];

function changeQty(basket: BasketLine[], itemId: string, delta: number): BasketLine[] {
  if (!basket.some((l) => l.itemId === itemId)) return delta > 0 ? [...basket, { itemId, qty: delta }] : basket;
  return basket.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0);
}

/** Create step 2: build your basket, choose pickup point and duration, then open the party. */
export default function CreateBasketPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { dispatch } = useApp();
  const router = useRouter();
  const restaurant = restaurantById(restaurantId);
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [pickupPointId, setPickupPointId] = useState(CATALOG.pickupPoints[0].id);
  const [durationMin, setDurationMin] = useState(30);

  if (!restaurant) {
    return (
      <p className="text-sm">
        Restaurant not found. <Link href="/create" className="underline">Pick another</Link>
      </p>
    );
  }

  function create() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    const id = crypto.randomUUID().slice(0, 8);
    const now = Date.now();
    dispatch({ type: "CREATE_REQUEST", id, restaurantId, pickupPointId, durationMin, user: ME, now });
    for (const line of basket) {
      for (let i = 0; i < line.qty; i++) dispatch({ type: "ADD_ITEM", requestId: id, userId: ME.userId, itemId: line.itemId });
    }
    dispatch({ type: "FINALISE_ENTRY", requestId: id, userId: ME.userId, now });
    router.push(`/req/${id}`);
  }

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm ${active ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-800" : "border-stone-300"}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/create" className="text-sm text-stone-500">← Restaurants</Link>
        <h1 className="mt-1 text-2xl font-bold">
          {restaurant.emoji} {restaurant.name}
        </h1>
        <p className="text-sm text-emerald-700">{restaurant.deal.label}</p>
      </div>

      <MenuPicker
        restaurant={restaurant}
        basket={basket}
        onAdd={(itemId) => setBasket((b) => changeQty(b, itemId, 1))}
        onRemove={(itemId) => setBasket((b) => changeQty(b, itemId, -1))}
      />

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Pickup point</legend>
        {CATALOG.pickupPoints.map((p) => (
          <label key={p.id} className={`flex items-center gap-2 ${chip(p.id === pickupPointId)}`}>
            <input type="radio" name="pickup" checked={p.id === pickupPointId} onChange={() => setPickupPointId(p.id)} />
            📍 {p.name}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Party stays open for</legend>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <button type="button" key={d} className={chip(d === durationMin)} onClick={() => setDurationMin(d)}>
              {d} min
            </button>
          ))}
        </div>
      </fieldset>

      <Button onClick={create} disabled={basket.length === 0}>
        Create order request
      </Button>
    </div>
  );
}
