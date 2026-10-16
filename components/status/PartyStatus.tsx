"use client";

import { CircleSlash, CircleX, House, Info, SearchX, TimerOff, UserX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { EASE_OUT, EXIT, IconButton, Marquee, TopBar, formatPrice, scrollRootTo, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { CANCEL_REASONS } from "@/lib/requests";
import { pickupById, previewSplit, progressOf, restaurantById, useApp } from "@/lib/store";
import type { OrderRequest } from "@/lib/types";
import { AcceptView } from "./AcceptView";
import { ClosedView } from "./ClosedView";
import { DeliveryView } from "./DeliveryView";
import { FillingView } from "./FillingView";
import { HelpSheet } from "./HelpSheet";
import { PaySheet } from "./PaySheet";

type View = "filling" | "accept" | "delivery" | "closed" | "removed" | "missed";

function viewFor(request: OrderRequest): View {
  const me = request.participants.find((p) => p.userId === ME.userId);
  // A host who declines cancels the party, so they see why it was cancelled rather than being "out".
  if (request.status === "cancelled" && request.hostId === ME.userId) return "closed";
  if (me?.declined || (!me && request.removedUserIds.includes(ME.userId))) return "removed";
  if (request.status === "expired" || request.status === "cancelled") return "closed";
  if (request.status === "open") return "filling";
  if (!me) return "missed";
  return request.status === "deal_achieved" ? "accept" : "delivery";
}

/**
 * The party status page (/party/[id]/status). Switches on the party's status: filling (W5), accept
 * and pay (W9), paid and on its way (W10), or a closed state. The pay and help sheets stay mounted so
 * they can animate closed when the status moves on underneath them.
 */
export function PartyStatus({ id }: { id: string }) {
  const { state, now, dispatch } = useApp();
  const request = state.requests.find((r) => r.id === id);
  const restaurant = request && restaurantById(request.restaurantId);
  const pickup = request && pickupById(request.pickupPointId);

  const [helpOpen, setHelpOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [declinedHere, setDeclinedHere] = useState(false);

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

  let content;
  switch (view) {
    case "filling":
      content = <FillingView request={request} restaurant={restaurant} pickup={pickup} />;
      break;
    case "accept":
      content = <AcceptView request={request} restaurant={restaurant} pickup={pickup} onPay={() => setPayOpen(true)} />;
      break;
    case "delivery":
      content = <DeliveryView request={request} restaurant={restaurant} pickup={pickup} />;
      break;
    case "removed":
      content = (
        <ClosedView
          icon={<UserX />}
          tone="neutral"
          title="You're out of this order"
          reason={
            declinedHere || me?.declined
              ? "You declined this order."
              : "You didn't accept within 60 seconds."
          }
          reassurance="Nothing was charged."
        />
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
        </ClosedView>
      );
    }
  }

  return (
    <>
      <TopBar
        left={
          <div className="flex min-w-0 items-center gap-2">
            {view !== "delivery" && <HomeButton />}
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

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} request={request} restaurant={restaurant} pickup={pickup} />

      <PaySheet
        open={payOpen && view === "accept" && !!me && !me.paid}
        onOpenChange={setPayOpen}
        restaurant={restaurant}
        amount={myCost?.total ?? 0}
        round={request.round}
        deadline={request.acceptDeadline ?? now}
        now={now}
        hosting={request.hostId === ME.userId}
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
          dispatch({ type: "ACCEPT_AND_PAY", requestId: request.id, userId: ME.userId, now: at });
          if (!(settles && someoneOut)) toast.success(`Paid ${formatPrice(myCost?.total ?? 0)}`);
        }}
        onDecline={() => {
          setDeclinedHere(true);
          dispatch({ type: "DECLINE", requestId: request.id, userId: ME.userId, now: Date.now() });
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
