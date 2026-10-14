"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { myEntry, restaurantById, useApp } from "@/lib/store";
import { Countdown } from "./ui";

/** Step 5: tells you a deal was achieved, on every screen, until you accept. */
export default function NotificationBanner() {
  const { state, now } = useApp();
  const pending = state.requests.filter((r) => r.status === "deal_achieved" && myEntry(r) && !myEntry(r)!.paid);
  const notified = useRef(new Set<string>());

  useEffect(() => {
    for (const r of pending) {
      if (notified.current.has(r.id)) continue;
      notified.current.add(r.id);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Deal achieved! 🎉", { body: `${restaurantById(r.restaurantId)?.name}: accept and pay to place the group order.` });
      }
    }
  }, [pending]);

  if (pending.length === 0) return null;
  return (
    <div className="sticky top-[53px] z-10 space-y-px">
      {pending.map((r) => (
        <Link key={r.id} href={`/req/${r.id}`} className="block bg-emerald-600 px-4 py-2 text-sm text-white">
          🎉 <strong>Deal achieved at {restaurantById(r.restaurantId)?.name}!</strong> Accept within{" "}
          <Countdown until={r.acceptDeadline!} now={now} label="" />→
        </Link>
      ))}
    </div>
  );
}
