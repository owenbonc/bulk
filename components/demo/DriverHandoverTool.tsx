"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button, cn } from "@/components/ui";
import { ME } from "@/lib/data";
import type { HandoverCheck } from "@/lib/requests";
import { checkHandover, useApp } from "@/lib/store";
import type { OrderRequest } from "@/lib/types";

const ERRORS: Record<Exclude<HandoverCheck, { ok: true }>["error"], string> = {
  not_arrived: "The food hasn't reached the collection point yet.",
  unknown_code: "No bag in this order has that PIN.",
  already_collected: "That bag has already been handed over.",
};

/**
 * Presenter tool: the driver at the collection point. One labelled bag per person in the picked order,
 * released when that person's own PIN is entered (HANDOVER); unknown and repeated PINs are refused.
 * "Simulate the others" hands over every other bag, so the order reaches `collected` once yours is
 * handed over too. Shown in the demo panel for a placed order only.
 */
export function DriverHandoverTool({ request }: { request: OrderRequest }) {
  const { dispatch } = useApp();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<HandoverCheck | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const arrived = request.status === "delivered";
  const nameOf = (userId: string, name: string) => (userId === ME.userId ? "You" : name);
  const othersWaiting = request.participants.some((p) => p.userId !== ME.userId && p.collectedAt === undefined);

  const handOver = (pin: string) => dispatch({ type: "HANDOVER", requestId: request.id, code: pin, now: Date.now() });

  function find() {
    setMessage(null);
    setResult(checkHandover(request, code));
  }

  function confirm() {
    if (!result?.ok) return;
    const p = result.participant;
    handOver(p.collectionCode!);
    setMessage(`Handed over ${p.userId === ME.userId ? "your" : `${p.name}'s`} bag.`);
    setResult(null);
    setCode("");
  }

  function simulateOthers() {
    for (const p of request.participants) {
      if (p.userId !== ME.userId && p.collectedAt === undefined && p.collectionCode) handOver(p.collectionCode);
    }
    setResult(null);
    setMessage("The others showed their PINs.");
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div>
        <p className="text-meta font-medium text-ink-2">Driver handover</p>
        <p className="text-caption text-ink-3">Presenter tool: plays the driver at the collection point.</p>
      </div>

      <ul className="flex flex-col gap-1">
        {request.participants.map((p, i) => (
          <li key={p.userId} className="flex items-center justify-between gap-3 text-meta">
            <span className="flex min-w-0 items-center gap-1.5 text-ink">
              <ShoppingBag aria-hidden className="size-3.5 shrink-0 text-ink-3" />
              <span className="min-w-0 break-words">
                Bag {i + 1} · {nameOf(p.userId, p.name)}
              </span>
            </span>
            <span className={cn("shrink-0", p.collectedAt !== undefined ? "font-semibold text-success" : "text-ink-3")}>
              {p.collectedAt !== undefined ? "Handed over" : "Waiting"}
            </span>
          </li>
        ))}
      </ul>

      {request.status === "collected" ? (
        <p className="text-meta font-semibold text-success">Every bag has been handed over. Order collected.</p>
      ) : !arrived ? (
        <p className="text-meta text-ink-3">Opens when the food reaches the collection point.</p>
      ) : (
        <>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length > 0) find();
            }}
          >
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
                setResult(null);
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="PIN"
              aria-label="Pickup PIN to check"
              className="tnum h-11 w-0 min-w-0 flex-1 rounded-chip bg-surface px-3.5 font-mono tracking-widest text-ink ring-1 ring-line-strong ring-inset outline-none focus-visible:ring-2 focus-visible:ring-accent-ink"
            />
            <Button type="submit" variant="secondary" disabled={code.length === 0}>
              Find bag
            </Button>
          </form>
          <div aria-live="polite" className="flex flex-col gap-2">
            {result && !result.ok && <p className="text-meta text-offer">{ERRORS[result.error]}</p>}
            {result?.ok && (
              <div className="flex items-center justify-between gap-3 rounded-chip bg-surface-2 p-2.5 pl-3">
                <p className="min-w-0 text-meta text-ink">
                  Matches <strong>{result.participant.userId === ME.userId ? "your bag" : `${result.participant.name}'s bag`}</strong>
                </p>
                <Button size="sm" icon={<Check />} onClick={confirm}>
                  Hand over
                </Button>
              </div>
            )}
            {message && <p className="text-meta text-success">{message}</p>}
          </div>
          {othersWaiting && (
            <Button variant="secondary" size="sm" block onClick={simulateOthers}>
              Simulate the others
            </Button>
          )}
        </>
      )}
    </div>
  );
}
