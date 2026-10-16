"use client";

import { ChevronDown, RotateCcw, Timer, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button, Divider, Switch, cn, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { isTerminal, resetDemo, restaurantById, useApp } from "@/lib/store";
import type { OrderRequest, RequestStatus } from "@/lib/types";

const PARTY_PATH = /^\/party\/([^/]+)/;

const STATUS_LABEL: Record<RequestStatus, string> = {
  open: "filling",
  deal_achieved: "deal reached",
  confirmed: "order placed",
  preparing: "preparing",
  out_for_delivery: "on its way",
  delivered: "ready to collect",
  expired: "closed",
  cancelled: "cancelled",
};

// Parties you're in, after the open ones: the order the Home your-party card uses (pay now first).
const IN_PARTY_RANK: Partial<Record<RequestStatus, number>> = {
  deal_achieved: 0,
  out_for_delivery: 1,
  preparing: 2,
  confirmed: 3,
};

const isMine = (r: OrderRequest) => r.participants.some((p) => p.userId === ME.userId);

/**
 * The party the controls act on when nobody has picked one: the party in the URL, else the most urgent
 * party you're in (an open one closing soonest, since fill and expire only act on open parties; then pay
 * now, on its way, preparing, placed), else the first open party.
 */
function defaultParty(parties: OrderRequest[], urlId: string | undefined): OrderRequest | undefined {
  const fromUrl = urlId ? parties.find((r) => r.id === urlId) : undefined;
  if (fromUrl) return fromUrl;
  const mine = parties.filter(isMine);
  const mineOpen = mine.filter((r) => r.status === "open").sort((a, b) => a.expiresAt - b.expiresAt);
  if (mineOpen[0]) return mineOpen[0];
  const mineOther = [...mine].sort((a, b) => (IN_PARTY_RANK[a.status] ?? 9) - (IN_PARTY_RANK[b.status] ?? 9));
  if (mineOther[0]) return mineOther[0];
  return parties.find((r) => r.status === "open");
}

/**
 * Presenter controls for the simulated participants. A picker chooses the party that "Fill this party now"
 * and "Expire this party in 5s" act on (every party that hasn't ended), defaulting as `defaultParty` says,
 * so the controls work from Home's account sheet as well as on a party page. Used inside the account sheet
 * and the "d" hotkey panel.
 */
export function DemoControlsPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const urlId = pathname.match(PARTY_PATH)?.[1];
  const selectId = useId();

  const parties = state.requests.filter((r) => !isTerminal(r.status));

  // A pick lasts until you open a different page; it is dropped if that party ends.
  const [pick, setPick] = useState<{ id: string; path: string } | null>(null);
  const picked = pick && pick.path === pathname ? parties.find((r) => r.id === pick.id) : undefined;
  const party = picked ?? defaultParty(parties, urlId);
  const restaurant = party ? restaurantById(party.restaurantId) : undefined;
  const canSteer = party?.status === "open";

  return (
    <div className={cn("flex flex-col", className)}>
      <Switch
        label="Pause bots"
        description="Nobody new joins any party"
        checked={state.demo.botsPaused}
        onCheckedChange={(botsPaused) => dispatch({ type: "SET_DEMO", patch: { botsPaused } })}
        className="py-2"
      />
      <Divider />
      <Switch
        label="A bot won't accept"
        description="One member skips paying when the deal is reached"
        checked={state.demo.botWontAccept}
        onCheckedChange={(botWontAccept) => dispatch({ type: "SET_DEMO", patch: { botWontAccept } })}
        className="py-2"
      />
      <Divider />

      <div className="flex flex-col gap-2 py-3">
        <label htmlFor={selectId} className="text-meta font-medium text-ink-2">
          Party
        </label>
        {parties.length > 0 ? (
          <div className="relative">
            <select
              id={selectId}
              value={party?.id ?? ""}
              onChange={(e) => setPick({ id: e.target.value, path: pathname })}
              className={cn(
                "h-11 w-full min-w-0 cursor-pointer appearance-none truncate rounded-chip bg-surface pr-10 pl-3.5 text-ink",
                "ring-1 ring-line-strong ring-inset transition-shadow duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent-ink",
              )}
            >
              {parties.map((r) => {
                const name = restaurantById(r.restaurantId)?.name ?? r.id;
                return (
                  <option key={r.id} value={r.id}>
                    {name} · {STATUS_LABEL[r.status]}
                    {isMine(r) ? " · you're in" : ""}
                  </option>
                );
              })}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-2" />
          </div>
        ) : (
          <p className="text-meta text-ink-2">No parties are running. Create one, or reset the demo.</p>
        )}
        {party && !canSteer && (
          <p className="text-meta text-ink-2">
            {restaurant?.name ?? "This party"} is past filling, so it can&rsquo;t be filled or expired.
          </p>
        )}
        <Button
          variant="secondary"
          size="sm"
          block
          icon={<Zap />}
          disabled={!canSteer}
          onClick={() => {
            if (!party || party.status !== "open") return;
            dispatch({ type: "FILL_PARTY", requestId: party.id, now: Date.now() });
            toast(`Filling ${restaurant?.name ?? "the party"}`);
          }}
        >
          Fill this party now
        </Button>
        <Button
          variant="secondary"
          size="sm"
          block
          icon={<Timer />}
          disabled={!canSteer}
          onClick={() => {
            if (!party || party.status !== "open") return;
            dispatch({ type: "SET_EXPIRY", requestId: party.id, expiresAt: Date.now() + 5_000 });
            toast(`${restaurant?.name ?? "This party"} closes in 5 seconds`);
          }}
        >
          Expire this party in 5s
        </Button>
      </div>
      <Divider />

      <Button
        variant="danger"
        size="sm"
        block
        icon={<RotateCcw />}
        className="mt-3"
        onClick={() => {
          resetDemo(dispatch);
          router.push("/");
          toast("Demo reset");
        }}
      >
        Reset demo
      </Button>
    </div>
  );
}
