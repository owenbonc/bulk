"use client";

import { ChevronDown, RotateCcw, Timer, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button, Divider, Switch, cn, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { isSubmitted, isTerminal, partiesNear, pickupById, resetDemo, restaurantById, useApp } from "@/lib/store";
import type { OrderRequest, RequestStatus } from "@/lib/types";
import { DriverHandoverTool } from "./DriverHandoverTool";

const PARTY_PATH = /^\/party\/([^/]+)/;

const STATUS_LABEL: Record<RequestStatus, string> = {
  open: "filling",
  deal_achieved: "paying",
  confirmed: "placed",
  preparing: "cooking",
  out_for_delivery: "on its way",
  delivered: "arrived",
  collected: "collected",
  expired: "closed",
  cancelled: "cancelled",
};

// Parties you're in, after the open ones: the order the Home your-party card uses (pay now first).
const IN_PARTY_RANK: Partial<Record<RequestStatus, number>> = {
  deal_achieved: 0,
  out_for_delivery: 1,
  delivered: 2,
  preparing: 3,
  confirmed: 4,
};

const isMine = (r: OrderRequest) => r.participants.some((p) => p.userId === ME.userId);

/**
 * The party the controls act on when nobody has picked one: the party in the URL, else the most urgent
 * party you're in (an open one closing soonest, since fill and expire only act on open parties; then pay
 * now, on its way, ready to collect, preparing, placed), else the first party Home lists near your location, else the first
 * open party.
 */
function defaultParty(parties: OrderRequest[], urlId: string | undefined, locationId: string): OrderRequest | undefined {
  const fromUrl = urlId ? parties.find((r) => r.id === urlId) : undefined;
  if (fromUrl) return fromUrl;
  const mine = parties.filter(isMine);
  const mineOpen = mine.filter((r) => r.status === "open").sort((a, b) => a.expiresAt - b.expiresAt);
  if (mineOpen[0]) return mineOpen[0];
  const mineOther = [...mine].sort((a, b) => (IN_PARTY_RANK[a.status] ?? 9) - (IN_PARTY_RANK[b.status] ?? 9));
  if (mineOther[0]) return mineOther[0];
  return partiesNear(parties, locationId)[0]?.request ?? parties.find((r) => r.status === "open");
}

/**
 * Presenter controls for the simulated participants. A picker chooses the party the controls act on (every
 * party that hasn't ended, plus collected orders), defaulting as `defaultParty` says, so the controls work
 * from Home's account sheet as well as on a party page: fill and expire while it's filling, end the accept
 * window while it's paying, and the driver handover once the order is placed. Used inside the account sheet
 * and the "d" hotkey panel.
 */
export function DemoControlsPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const urlId = pathname.match(PARTY_PATH)?.[1];
  const selectId = useId();

  const parties = state.requests.filter((r) => !isTerminal(r.status) || r.status === "collected");

  // A pick lasts until you open a different page; it is dropped if that party ends.
  const [pick, setPick] = useState<{ id: string; path: string } | null>(null);
  const picked = pick && pick.path === pathname ? parties.find((r) => r.id === pick.id) : undefined;
  const party = picked ?? defaultParty(parties, urlId, state.location);
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
        description="One member declines the first quote; the rest get a repriced second round"
        checked={state.demo.botWontAccept}
        onCheckedChange={(botWontAccept) => dispatch({ type: "SET_DEMO", patch: { botWontAccept } })}
        className="py-2"
      />
      <Divider />
      <Switch
        label="…and declines again"
        description="A bot declines the second round too, so it fails"
        checked={state.demo.botDeclinesAgain}
        onCheckedChange={(botDeclinesAgain) => dispatch({ type: "SET_DEMO", patch: { botDeclinesAgain } })}
        className="py-2"
      />
      <Divider />
      <Switch
        label="A bot never answers"
        description="The 60-second window runs out on one member"
        checked={state.demo.botSilent}
        onCheckedChange={(botSilent) => dispatch({ type: "SET_DEMO", patch: { botSilent } })}
        className="py-2"
      />
      <Divider />
      <Switch
        label="My payment fails"
        description="Your demo payment is declined when you accept"
        checked={state.demo.myPaymentFails}
        onCheckedChange={(myPaymentFails) => dispatch({ type: "SET_DEMO", patch: { myPaymentFails } })}
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
                "h-11 w-full min-w-0 cursor-pointer appearance-none rounded-chip bg-surface pr-10 pl-3.5 text-body text-ink",
                "ring-1 ring-line-strong ring-inset transition-shadow duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-accent-ink",
              )}
            >
              {parties.map((r) => {
                const name = restaurantById(r.restaurantId)?.name ?? r.id;
                return (
                  <option key={r.id} value={r.id}>
                    {isMine(r) ? "• " : ""}
                    {name} · {pickupById(r.pickupPointId)?.name ?? r.pickupPointId} · {STATUS_LABEL[r.status]}
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
        <Button
          variant="secondary"
          size="sm"
          block
          icon={<Timer />}
          disabled={party?.status !== "deal_achieved"}
          onClick={() => {
            if (!party || party.status !== "deal_achieved") return;
            dispatch({ type: "SET_ACCEPT_DEADLINE", requestId: party.id, deadline: Date.now() + 5_000 });
            toast("Accept window ends in 5 seconds");
          }}
        >
          End the accept window in 5s
        </Button>
      </div>
      <Divider />

      {party && isSubmitted(party.status) && (
        <>
          <DriverHandoverTool key={party.id} request={party} />
          <Divider />
        </>
      )}

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
