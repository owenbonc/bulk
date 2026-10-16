"use client";

import { CircleSlash, CircleX, House, Info, SearchX, TimerOff, UserX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EASE_OUT, EXIT, IconButton, Marquee, TopBar, formatPrice, scrollRootTo, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { CANCEL_REASONS } from "@/lib/requests";
import { myReleased, pickupById, previewSplit, progressOf, restaurantById, useApp } from "@/lib/store";
import type { OrderRequest } from "@/lib/types";
import { AcceptView } from "./AcceptView";
import { ClosedView } from "./ClosedView";
import { CollectedView } from "./CollectedView";
import { DeliveryView } from "./DeliveryView";
import { FillingView } from "./FillingView";
import { HANDOVER_MS, HandoverSheet, type HandoverPhase } from "./HandoverSheet";
import { HelpSheet } from "./HelpSheet";
import { PaySheet } from "./PaySheet";
import { NewPartyCard } from "./NewPartyCard";

type View = "filling" | "accept" | "delivery" | "collected" | "closed" | "removed" | "missed";

function viewFor(request: OrderRequest): View {
  const me = request.participants.find((p) => p.userId === ME.userId);
  if (request.status === "expired" || request.status === "cancelled") return "closed";
  if (me?.declined || (!me && request.removedUserIds.includes(ME.userId))) return "removed";
  if (request.status === "open") return "filling";
  if (!me) return "missed";
  // Your bag has been handed over (the order itself is `collected` once every bag has).
  if (me.collectedAt !== undefined) return "collected";
  return request.status === "deal_achieved" ? "accept" : "delivery";
}

/**
 * The party status page (/party/[id]/status). Switches on the party's status: filling (W5), accept
 * and pay (W9), paid and on its way (W10), collected, or a closed state. The pay, help and handover sheets
 * stay mounted so they can animate closed when the status moves on underneath them.
 *
 * `?handover=1` (from the "ready" popup or notification) runs the simulated PIN handover as soon as the
 * order is ready to collect and you haven't collected it: the sheet shows your own pickup PIN, the courier
 * "accepts" it after HANDOVER_MS, HANDOVER is dispatched with that PIN (your bag is handed over) and the
 * param is dropped from the URL.
 */
export function PartyStatus({ id }: { id: string }) {
  const { state, now, dispatch } = useApp();
  const router = useRouter();
  const request = state.requests.find((r) => r.id === id);
  const restaurant = request && restaurantById(request.restaurantId);
  const pickup = request && pickupById(request.pickupPointId);

  const [helpOpen, setHelpOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [declinedHere, setDeclinedHere] = useState(false);

  const statusPath = `/party/${id}/status`;
  const wantsHandover = useSearchParams().get("handover") === "1";
  const mine = request?.participants.find((p) => p.userId === ME.userId);
  const myPin = mine?.collectionCode;
  const canCollect = request?.status === "delivered" && !!mine?.paid && !!myPin && mine.collectedAt === undefined;
  const [handover, setHandover] = useState<{ open: boolean; phase: HandoverPhase }>({ open: false, phase: "showing" });

  // The param arms one handover each time it appears in the URL (including on arrival).
  const [armed, setArmed] = useState(wantsHandover);
  const [lastWants, setLastWants] = useState(wantsHandover);
  if (wantsHandover !== lastWants) {
    setLastWants(wantsHandover);
    if (wantsHandover) setArmed(true);
  }
  if (armed && !handover.open) {
    setArmed(false);
    if (canCollect) setHandover({ open: true, phase: "showing" });
  }

  const startHandover = () => setHandover({ open: true, phase: "showing" });
  const closeHandover = () => {
    setHandover((h) => ({ ...h, open: false }));
    if (wantsHandover) router.replace(statusPath, { scroll: false });
  };

  // A param that has nothing to hand over (already collected, or not ready) is dropped.
  useEffect(() => {
    if (wantsHandover && !armed && !handover.open && !canCollect) router.replace(statusPath, { scroll: false });
  }, [wantsHandover, armed, handover.open, canCollect, router, statusPath]);

  // The simulated courier checks the code, then you've collected.
  const checking = handover.open && handover.phase === "showing";
  useEffect(() => {
    if (!checking) return;
    const timer = window.setTimeout(() => {
      setHandover({ open: true, phase: "accepted" });
      if (myPin) dispatch({ type: "HANDOVER", requestId: id, code: myPin, now: Date.now() });
      if (new URLSearchParams(window.location.search).has("handover")) router.replace(statusPath, { scroll: false });
    }, HANDOVER_MS);
    return () => window.clearTimeout(timer);
  }, [checking, dispatch, id, myPin, router, statusPath]);

  const view: View | "missing" = request && restaurant && pickup ? viewFor(request) : "missing";

  if (!request || !restaurant || !pickup) {
    return (
      <>
        <TopBar left={<HomeButton />} title="Party" />
        <ClosedView
          icon={<SearchX />}
          tone="neutral"
          title="Party not found"
          reason="This party doesn't exist any more. It may have been cleared when the demo was reset."
        />
      </>
    );
  }

  const me = request.participants.find((p) => p.userId === ME.userId);
  const myCost = me ? previewSplit(request, restaurant, ME.userId, me.basket) : undefined;
  const released = myReleased(request);
  const retry = released && <NewPartyCard request={request} entry={released} restaurant={restaurant} pickup={pickup} />;

  let content;
  switch (view) {
    case "filling":
      content = <FillingView request={request} restaurant={restaurant} pickup={pickup} />;
      break;
    case "accept":
      content = <AcceptView request={request} restaurant={restaurant} pickup={pickup} onPay={() => setPayOpen(true)} />;
      break;
    case "delivery":
      content = <DeliveryView request={request} restaurant={restaurant} pickup={pickup} onCollect={startHandover} />;
      break;
    case "collected":
      content = <CollectedView request={request} restaurant={restaurant} pickup={pickup} />;
      break;
    case "removed":
      content = (
        <ClosedView
          icon={<UserX />}
          tone="neutral"
          title="You're out of this order"
          reason={
            released?.reason === "payment_failed" || me?.declineReason === "payment_failed"
              ? "Your demo payment didn't go through, so you were taken out of this order."
              : declinedHere || me?.declined || released?.reason === "declined"
                ? "You declined this order."
                : "You didn't accept within 60 seconds."
          }
          reassurance="Nothing was charged. The rest of the party carries on without you."
        >
          {retry}
        </ClosedView>
      );
      break;
    case "missed":
      content = (
        <ClosedView
          icon={<CircleSlash />}
          tone="neutral"
          title="This party has moved on"
          reason="It reached the deal before your basket was in, so you're not part of this order."
          reassurance="Nothing was charged."
        />
      );
      break;
    default: {
      const expired = request.status === "expired";
      const progress = progressOf(request, restaurant);
      content = (
        <ClosedView
          icon={expired ? <TimerOff /> : <CircleX />}
          tone="offer"
          title={expired ? "Party closed" : "Order cancelled"}
          reason={request.cancelReason ?? (expired ? CANCEL_REASONS.expired : CANCEL_REASONS.notEnoughAccepted)}
          reassurance="Nobody was charged."
        >
          {expired && (
            <p className="tnum text-meta text-ink-3">
              The party reached {formatPrice(progress.total, { trim: true })} of {formatPrice(progress.target, { trim: true })}.
            </p>
          )}
          {retry && <div className={expired ? "mt-5" : undefined}>{retry}</div>}
        </ClosedView>
      );
    }
  }

  return (
    <>
      <TopBar
        left={
          <div className="flex min-w-0 items-center gap-2">
            {view !== "delivery" && view !== "collected" && <HomeButton />}
            <Marquee as="p" className="pr-2 font-display text-emphasis font-semibold tracking-[-0.01em] text-ink">
              {restaurant.name}
            </Marquee>
          </div>
        }
        right={
          <IconButton aria-label="More information" aria-haspopup="dialog" onClick={() => setHelpOpen(true)}>
            <Info />
          </IconButton>
        }
      />

      {/* When the old state has faded out, jump to the top so the new state is read from the start. */}
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => scrollRootTo({ top: 0, behavior: "auto" })}>
        {/* Opacity only: a transform or filter here would trap the fixed bottom bars inside this wrapper. */}
        <motion.main
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: EXIT }}
        >
          {content}
        </motion.main>
      </AnimatePresence>

      {myPin && (
        <HandoverSheet
          open={handover.open}
          onOpenChange={(open) => (open ? startHandover() : closeHandover())}
          phase={handover.phase}
          pin={myPin}
          pickupName={pickup.name}
        />
      )}

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} request={request} restaurant={restaurant} pickup={pickup} />

      <PaySheet
        open={payOpen && view === "accept" && !!me && !me.paid}
        onOpenChange={setPayOpen}
        restaurant={restaurant}
        amount={myCost?.total ?? 0}
        round={request.round}
        deadline={request.acceptDeadline ?? now}
        now={now}
        onPay={() => {
          const at = Date.now();
          if (request.acceptDeadline !== undefined && at >= request.acceptDeadline) {
            toast("This round has ended", { description: "Nothing was charged." });
            return;
          }
          // Paying last with someone out ends the round: it either opens round 2 or cancels the party.
          const others = request.participants.filter((p) => p.userId !== ME.userId);
          const settles = others.every((p) => p.paid || p.declined);
          const someoneOut = others.some((p) => p.declined);
          const answer = { requestId: request.id, userId: ME.userId, round: request.round, now: at };
          if (state.demo.myPaymentFails) {
            dispatch({ type: "DECLINE", reason: "payment_failed", ...answer });
            toast("Demo payment failed", { description: "Nothing was charged." });
            return;
          }
          dispatch({ type: "ACCEPT_AND_PAY", ...answer });
          if (!(settles && someoneOut)) toast.success(`Paid ${formatPrice(myCost?.total ?? 0)}`);
        }}
        onDecline={() => {
          setDeclinedHere(true);
          dispatch({ type: "DECLINE", requestId: request.id, userId: ME.userId, round: request.round, now: Date.now() });
        }}
      />
    </>
  );
}

function HomeButton() {
  return (
    <IconButton aria-label="Home" href="/">
      <House />
    </IconButton>
  );
}
