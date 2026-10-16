"use client";

import { BellRing, CircleX, ShoppingBag, TimerOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Countdown, Popup } from "@/components/ui";
import { ME } from "@/lib/data";
import { CANCEL_REASONS, type PartyAlert } from "@/lib/requests";
import { hasCollected, pickupById, restaurantById, useApp, useNextAlert } from "@/lib/store";

/** Pause between one popup closing and the next opening, so they never cross-fade into each other. */
const BETWEEN_MS = 320;

const statusPathOf = (id: string) => `/party/${id}/status`;
/** The status page with the simulated PIN handover running. */
const handoverPathOf = (id: string) => `${statusPathOf(id)}?handover=1`;

function notifyBrowser(title: string, body: string, tag: string, onClick: () => void) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body, tag, icon: "/icon.svg" });
    n.onclick = () => {
      window.focus();
      onClick();
      n.close();
    };
  } catch {
    // Some mobile browsers only allow notifications from a service worker; the popup still shows.
  }
}

/** "Collect from Ramsay Hall · PIN 4821", with your own pickup PIN. */
function readyLine(pickupPointId: string, pin: string | undefined): string {
  const place = pickupById(pickupPointId)?.name ?? "your collection point";
  return pin ? `Collect from ${place} · PIN ${pin}` : `Collect from ${place}`;
}

/**
 * Global party popups, mounted once in the root layout. W11 "Party filled!" when a party you're in
 * reaches its deal; "Your food is ready!" when your paid order is delivered (not while you're on that
 * party's status page, which already shows it); W12 "Order cancelled" / "Party closed" when one ends
 * without an order, naming the restaurant above the reason. Each shows once per party: the alert is
 * marked seen (MARK_ALERT_SEEN) the moment it opens, or straight away when it is skipped.
 */
export default function PartyAlerts() {
  const { state, now, dispatch } = useApp();
  const next = useNextAlert();
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = useState<PartyAlert | null>(null);
  const [open, setOpen] = useState(false);

  const request = current ? state.requests.find((r) => r.id === current.requestId) : undefined;
  const restaurant = request ? restaurantById(request.restaurantId) : undefined;
  // "Party filled!" stops making sense once the acceptance round is over, "ready" once you've collected.
  const stale =
    (current?.kind === "filled" && request?.status !== "deal_achieved") ||
    (current?.kind === "ready" && !!request && (hasCollected(request) || pathname === statusPathOf(request.id)));
  const visible = open && !stale && !!request && !!restaurant;

  const nextKey = next?.key;
  const nextKind = next?.kind;
  const nextRequestId = next?.requestId;
  const hasShown = current !== null;
  // Someone who declined already knows they're out; the cancelled/closed popup isn't for them.
  const meOut =
    next?.request.participants.find((p) => p.userId === ME.userId)?.declined ||
    (!next?.request.participants.some((p) => p.userId === ME.userId) && next?.request.removedUserIds.includes(ME.userId));
  // The status page already shows the order is ready, so the popup isn't needed there.
  const onReadyPage = nextKind === "ready" && !!nextRequestId && pathname === statusPathOf(nextRequestId);
  const skip = (nextKind !== "filled" && !!meOut) || onReadyPage;

  useEffect(() => {
    if (visible || !nextKey || !nextKind || !nextRequestId) return;
    if (skip) {
      dispatch({ type: "MARK_ALERT_SEEN", key: nextKey });
      return;
    }
    const timer = window.setTimeout(
      () => {
        setCurrent({ key: nextKey, kind: nextKind, requestId: nextRequestId });
        setOpen(true);
        dispatch({ type: "MARK_ALERT_SEEN", key: nextKey });
        const party = state.requests.find((x) => x.id === nextRequestId);
        const r = restaurantById(party?.restaurantId ?? "");
        if (nextKind === "filled") {
          notifyBrowser(
            "Party filled!",
            r ? `${r.name}: confirm and pay within a minute to lock in ${r.deal.short}.` : "Confirm and pay within a minute to lock in the deal.",
            nextKey,
            () => router.push(statusPathOf(nextRequestId)),
          );
        }
        if (nextKind === "ready" && party) {
          const pin = party.participants.find((p) => p.userId === ME.userId)?.collectionCode;
          notifyBrowser("Your food is ready!", readyLine(party.pickupPointId, pin), nextKey, () =>
            router.push(handoverPathOf(nextRequestId)),
          );
        }
      },
      hasShown ? BETWEEN_MS : 0,
    );
    return () => window.clearTimeout(timer);
    // `state` is read only to name the restaurant and collection point in the notification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, nextKey, nextKind, nextRequestId, hasShown, skip, dispatch, router]);

  if (!current || !request || !restaurant) return null;

  const statusPath = statusPathOf(request.id);
  const onPartyPage = pathname === `/party/${request.id}` || pathname.startsWith(`/party/${request.id}/`);

  if (current.kind === "filled") {
    return (
      <Popup
        open={visible}
        onOpenChange={setOpen}
        icon={<BellRing className="animate-ring origin-[50%_12%]" />}
        title="Party filled!"
        description={
          <>
            Confirm and pay within{" "}
            <Countdown until={request.acceptDeadline ?? now} now={now} className="font-semibold" /> to lock in{" "}
            {restaurant.deal.short} at {restaurant.name}.
          </>
        }
        action={
          <Button
            size="lg"
            block
            onClick={() => {
              setOpen(false);
              if (pathname !== statusPath) router.push(statusPath);
            }}
          >
            Go to order
          </Button>
        }
      />
    );
  }

  if (current.kind === "ready") {
    const pickup = pickupById(request.pickupPointId);
    const pin = request.participants.find((p) => p.userId === ME.userId)?.collectionCode;
    return (
      <Popup
        open={visible}
        onOpenChange={setOpen}
        icon={<ShoppingBag className="animate-arrive" />}
        title="Your food is ready!"
        description={
          <>
            Collect from {pickup?.name ?? "your collection point"} · PIN{" "}
            <span className="tnum font-mono font-semibold text-ink">{pin}</span>
          </>
        }
        action={
          <Button
            size="lg"
            block
            onClick={() => {
              setOpen(false);
              router.push(handoverPathOf(request.id));
            }}
          >
            Collect my order
          </Button>
        }
      />
    );
  }

  const expired = current.kind === "expired";
  // Your basket is saved so you can start a new party with it: take you to that card rather than home.
  const decisionPending = request.released.some((e) => e.userId === ME.userId && e.choice === "pending");
  const close = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) return;
    if (decisionPending) {
      if (!onPartyPage) router.push(statusPath);
    } else if (onPartyPage) router.push("/");
  };

  return (
    <Popup
      open={visible}
      onOpenChange={close}
      icon={expired ? <TimerOff /> : <CircleX />}
      iconTone="offer"
      title={expired ? "Party closed" : "Order cancelled"}
      description={
        <>
          <span className="block font-semibold text-ink">{restaurant.name}</span>
          <span className="block">
            {request.cancelReason ?? (expired ? CANCEL_REASONS.expired : CANCEL_REASONS.notEnoughAccepted)}
          </span>
          <span className="mt-1 block font-semibold text-ink">Nobody was charged.</span>
          {decisionPending && <span className="mt-1 block">Your basket is saved.</span>}
        </>
      }
      action={
        <Button size="lg" block variant={decisionPending ? "primary" : "secondary"} onClick={() => close(false)}>
          {decisionPending ? "Start a new party" : "Close"}
        </Button>
      }
    />
  );
}
