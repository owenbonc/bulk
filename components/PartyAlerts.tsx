"use client";

import { BellRing, CircleX, TimerOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Countdown, Popup } from "@/components/ui";
import { CANCEL_REASONS, type PartyAlert } from "@/lib/requests";
import { restaurantById, useApp, useNextAlert } from "@/lib/store";

/** Pause between one popup closing and the next opening, so they never cross-fade into each other. */
const BETWEEN_MS = 320;

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

/**
 * Global party popups, mounted once in the root layout. W11 "Party filled!" when a party you're in
 * reaches its deal, W12 "Order cancelled" / "Party closed" when one ends without an order. Each shows
 * once per party: the alert is marked seen (MARK_ALERT_SEEN) the moment it opens.
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
  // "Party filled!" stops making sense once the acceptance round is over.
  const stale = current?.kind === "filled" && request?.status !== "deal_achieved";
  const visible = open && !stale && !!request && !!restaurant;

  const nextKey = next?.key;
  const nextKind = next?.kind;
  const nextRequestId = next?.requestId;
  const hasShown = current !== null;

  useEffect(() => {
    if (visible || !nextKey || !nextKind || !nextRequestId) return;
    const timer = window.setTimeout(
      () => {
        setCurrent({ key: nextKey, kind: nextKind, requestId: nextRequestId });
        setOpen(true);
        dispatch({ type: "MARK_ALERT_SEEN", key: nextKey });
        if (nextKind === "filled") {
          const r = restaurantById(state.requests.find((x) => x.id === nextRequestId)?.restaurantId ?? "");
          notifyBrowser(
            "Party filled!",
            r ? `${r.name}: confirm and pay within a minute to lock in ${r.deal.short}.` : "Confirm and pay within a minute to lock in the deal.",
            nextKey,
            () => router.push(`/party/${nextRequestId}/status`),
          );
        }
      },
      hasShown ? BETWEEN_MS : 0,
    );
    return () => window.clearTimeout(timer);
    // `state` is read only to name the restaurant in the notification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, nextKey, nextKind, nextRequestId, hasShown, dispatch, router]);

  if (!current || !request || !restaurant) return null;

  const statusPath = `/party/${request.id}/status`;
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

  const expired = current.kind === "expired";
  const close = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && onPartyPage) router.push("/");
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
          <span className="block">
            {request.cancelReason ?? (expired ? CANCEL_REASONS.expired : CANCEL_REASONS.notEnoughAccepted)}
          </span>
          <span className="mt-1 block font-semibold text-ink">Nobody was charged.</span>
        </>
      }
      action={
        <Button size="lg" block variant="secondary" onClick={() => close(false)}>
          Close
        </Button>
      }
    />
  );
}
