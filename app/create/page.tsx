"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui";
import { CATALOG, ME } from "@/lib/data";
import { useApp } from "@/lib/store";

const DURATIONS = [15, 30, 60];

function CreateForm() {
  const { dispatch } = useApp();
  const router = useRouter();
  const preselected = useSearchParams().get("restaurant");
  const [restaurantId, setRestaurantId] = useState(
    CATALOG.restaurants.some((r) => r.id === preselected) ? preselected! : CATALOG.restaurants[0].id,
  );
  const [pickupPointId, setPickupPointId] = useState(CATALOG.pickupPoints[0].id);
  const [durationMin, setDurationMin] = useState(30);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = crypto.randomUUID().slice(0, 8);
    dispatch({ type: "CREATE_REQUEST", id, restaurantId, pickupPointId, durationMin, user: ME, now: Date.now() });
    router.push(`/req/${id}/order`);
  }

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm ${active ? "border-emerald-600 bg-emerald-50 font-semibold text-emerald-800" : "border-stone-300"}`;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create order request</h1>
        <p className="text-sm text-stone-500">You&apos;ll be the host. Others nearby can join until the timer runs out.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Restaurant</legend>
        <div className="grid grid-cols-2 gap-2">
          {CATALOG.restaurants.map((r) => (
            <button type="button" key={r.id} className={chip(r.id === restaurantId)} onClick={() => setRestaurantId(r.id)}>
              {r.emoji} {r.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-emerald-700">{CATALOG.restaurants.find((r) => r.id === restaurantId)?.deal.label}</p>
      </fieldset>

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
        <legend className="mb-2 text-sm font-semibold">Request stays open for</legend>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => (
            <button type="button" key={d} className={chip(d === durationMin)} onClick={() => setDurationMin(d)}>
              {d} min
            </button>
          ))}
        </div>
      </fieldset>

      <Button type="submit">Create &amp; choose food</Button>
    </form>
  );
}

export default function CreatePage() {
  return (
    <Suspense>
      <CreateForm />
    </Suspense>
  );
}
