"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { CATALOG } from "@/lib/data";
import { formatGBP } from "@/lib/split";

/** Create step 1: pick a restaurant. */
export default function CreatePage() {
  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-stone-500">← Back to parties</Link>
      <div>
        <h1 className="text-2xl font-bold">Create order request</h1>
        <p className="text-sm text-stone-500">Pick a restaurant. You&apos;ll be the host.</p>
      </div>
      <div className="space-y-3">
        {CATALOG.restaurants.map((r) => (
          <Link key={r.id} href={`/create/${r.id}`} className="block">
            <Card className="flex items-center gap-4 hover:border-emerald-400">
              <span className="text-4xl">{r.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-stone-500">
                  {r.cuisine} · {formatGBP(r.deliveryFee)} delivery
                </p>
                <p className="text-xs font-medium text-emerald-700">{r.deal.label}</p>
              </div>
              <span className="text-stone-400">→</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
