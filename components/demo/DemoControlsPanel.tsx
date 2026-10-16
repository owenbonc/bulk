"use client";

import { RotateCcw, Timer, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Divider, Switch, cn, toast } from "@/components/ui";
import { resetDemo, restaurantById, useApp } from "@/lib/store";

const PARTY_PATH = /^\/party\/([^/]+)/;

/**
 * Presenter controls for the simulated participants. The party actions target the party whose page is
 * open (/party/[id]…). Used inside the account sheet and the "d" hotkey panel.
 */
export function DemoControlsPanel({ className }: { className?: string }) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const partyId = usePathname().match(PARTY_PATH)?.[1];
  const party = partyId ? state.requests.find((r) => r.id === partyId) : undefined;
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
        <p className="text-meta text-ink-2">
          {party && restaurant ? (
            <>
              This party: <span className="font-semibold text-ink">{restaurant.name}</span>
              {!canSteer && " (no longer open)"}
            </>
          ) : (
            "Open a party to fill or expire it."
          )}
        </p>
        <Button
          variant="secondary"
          size="sm"
          block
          icon={<Zap />}
          disabled={!canSteer}
          onClick={() => {
            if (!party) return;
            dispatch({ type: "FILL_PARTY", requestId: party.id, now: Date.now() });
            toast("Filling the party");
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
            if (!party) return;
            dispatch({ type: "SET_EXPIRY", requestId: party.id, expiresAt: Date.now() + 5_000 });
            toast("This party closes in 5 seconds");
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
