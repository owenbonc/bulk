"use client";

import PartyCard from "@/components/PartyCard";
import { ButtonLink } from "@/components/ui";
import { isTerminal } from "@/lib/requests";
import { myEntry, useApp } from "@/lib/store";

/** Home: every active order request ("party"), stacked. Tap one to join. */
export default function Home() {
  const { state, now } = useApp();
  const parties = state.requests
    .filter((r) => (r.status === "open" && r.expiresAt > now) || (myEntry(r) && !isTerminal(r.status)))
    // Parties you're in first, then the ones closing soonest.
    .sort((a, b) => Number(!!myEntry(b)) - Number(!!myEntry(a)) || a.expiresAt - b.expiresAt);

  return (
    <div className="space-y-4">
      <ButtonLink href="/create">＋ Create order request</ButtonLink>

      <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Active parties · {parties.length}</h2>
      {parties.length === 0 && <p className="text-sm text-stone-500">No active parties right now. Create one and others nearby can join.</p>}
      <div className="space-y-3">
        {parties.map((r) => (
          <PartyCard key={r.id} request={r} />
        ))}
      </div>
    </div>
  );
}
