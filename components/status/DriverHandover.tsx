"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button, Card, cn } from "@/components/ui";
import { ME } from "@/lib/data";
import type { HandoverCheck } from "@/lib/requests";
import { checkHandover, useApp } from "@/lib/store";
import type { OrderRequest } from "@/lib/types";

const ERRORS: Record<Exclude<HandoverCheck, { ok: true }>["error"], string> = {
  not_arrived: "The food hasn't arrived at the collection point yet.",
  unknown_code: "No bag in this order has that PIN. Ask the student to check it.",
  already_collected: "That bag has already been handed over.",
};

/**
 * Demo-only stand-in for the person at the collection point: one labelled bag per participant,
 * released when that participant's own PIN is entered. Not a real courier or platform feature.
 */
export function DriverHandover({ request }: { request: OrderRequest }) {
  const { dispatch } = useApp();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<HandoverCheck | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const arrived = request.status === "delivered";
  const nameOf = (userId: string, name: string) => (userId === ME.userId ? "You" : name);
  const othersWaiting = request.participants.some((p) => p.userId !== ME.userId && p.collectedAt === undefined);

  function find() {
    setMessage(null);
    setResult(checkHandover(request, code));
  }

  function handOver() {
    if (!result?.ok) return;
    const p = result.participant;
    dispatch({ type: "HANDOVER", requestId: request.id, code: p.collectionCode!, now: Date.now() });
    setMessage(p.userId === ME.userId ? "Handed over your bag." : `Handed over ${p.name}'s bag.`);
    setResult(null);
    setCode("");
  }

  function simulateOthers() {
    for (const p of request.participants) {
      if (p.userId !== ME.userId && p.collectedAt === undefined) dispatch({ type: "HANDOVER", requestId: request.id, code: p.collectionCode!, now: Date.now() });
    }
    setMessage("The other students showed their PINs (simulated).");
  }

  return (
    <Card className="border-dashed">
      <p className="text-caption font-semibold tracking-wide text-ink-3 uppercase">Demo · driver handover (simulated)</p>
      <p className="mt-1 text-meta text-ink-2">Each person&apos;s food is in its own labelled bag, released when their PIN is entered.</p>

      <ul className="mt-3 space-y-1.5">
        {request.participants.map((p, i) => (
          <li key={p.userId} className="flex items-center justify-between gap-3 text-body">
            <span className="flex min-w-0 items-center gap-2 text-ink">
              <ShoppingBag aria-hidden className="size-4 shrink-0 text-ink-3" />
              <span className="truncate">
                Bag {i + 1}: {nameOf(p.userId, p.name)}
              </span>
            </span>
            <span className={cn("shrink-0 text-meta", p.collectedAt !== undefined ? "font-semibold text-success" : "text-ink-3")}>
              {p.collectedAt !== undefined ? "Handed over" : "Waiting"}
            </span>
          </li>
        ))}
      </ul>

      {!arrived ? (
        <p className="mt-3 text-meta text-ink-3">Handover opens when the food arrives at the collection point.</p>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
                setResult(null);
              }}
              inputMode="numeric"
              placeholder="Student's PIN"
              aria-label="Pickup PIN"
              className="tnum h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-4 font-mono text-body tracking-widest text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <Button variant="secondary" disabled={code.length === 0} onClick={find}>
              Find bag
            </Button>
          </div>
          {result && !result.ok && <p className="text-meta text-offer">{ERRORS[result.error]}</p>}
          {result?.ok && (
            <div className="flex items-center justify-between gap-3 rounded-card bg-surface-2 p-3">
              <p className="text-body text-ink">
                Matches {result.participant.userId === ME.userId ? <strong>your bag</strong> : <strong>{result.participant.name}&apos;s bag</strong>}
              </p>
              <Button size="sm" icon={<Check />} onClick={handOver}>
                Hand over
              </Button>
            </div>
          )}
          {message && <p className="text-meta text-success">{message}</p>}
          {othersWaiting && (
            <Button variant="ghost" size="sm" onClick={simulateOthers}>
              Simulate the others showing their PINs
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
