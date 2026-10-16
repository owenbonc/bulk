"use client";

import { Bell, BellOff, Bike, CircleX, CreditCard, PackageCheck, ReceiptText, Tag, TimerOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { IconButton, Sheet, cn } from "@/components/ui";
import type { NotificationKind } from "@/lib/requests";
import { useApp, useNotifications } from "@/lib/store";
import { timeAgo } from "./parts";

const ICONS: Record<NotificationKind, { icon: LucideIcon; tone: string }> = {
  deal: { icon: Tag, tone: "bg-accent-soft text-accent-ink" },
  pay: { icon: CreditCard, tone: "bg-offer-soft text-offer-ink" },
  placed: { icon: ReceiptText, tone: "bg-surface-2 text-ink-2" },
  on_its_way: { icon: Bike, tone: "bg-accent-soft text-accent-ink" },
  ready: { icon: PackageCheck, tone: "bg-success-soft text-success" },
  cancelled: { icon: CircleX, tone: "bg-offer-soft text-offer-ink" },
  expired: { icon: TimerOff, tone: "bg-surface-2 text-ink-2" },
};

/**
 * Bell button with an unread dot, and the notifications sheet it opens. Opening marks everything read;
 * the rows that were unread keep their dot until the sheet closes, so you can still see what's new.
 */
export function NotificationsButton() {
  const { state, now, dispatch } = useApp();
  const { items, unread } = useNotifications();
  const [open, setOpen] = useState(false);
  const [freshKeys, setFreshKeys] = useState<string[]>([]);

  function openSheet() {
    setFreshKeys(items.filter((n) => !state.readNotifications.includes(n.key)).map((n) => n.key));
    setOpen(true);
    if (unread > 0) dispatch({ type: "MARK_NOTIFICATIONS_READ" });
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    // Anything that arrived while the sheet was open has been seen too.
    if (!next && unread > 0) dispatch({ type: "MARK_NOTIFICATIONS_READ" });
  }

  const isFresh = (key: string) => freshKeys.includes(key) || !state.readNotifications.includes(key);

  return (
    <>
      <IconButton
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="dialog"
        badge={unread > 0}
        onClick={openSheet}
      >
        <Bell />
      </IconButton>

      <Sheet open={open} onOpenChange={onOpenChange} title="Notifications" className="pb-[max(12px,env(safe-area-inset-bottom))]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-10 text-center">
            <span aria-hidden className="grid size-12 place-items-center rounded-full bg-surface-2 text-ink-2">
              <BellOff />
            </span>
            <p className="text-body font-semibold text-ink">Nothing yet</p>
            <p className="max-w-[30ch] text-body text-ink-2">Join a party and we&apos;ll tell you when the deal is reached and your food is on its way.</p>
          </div>
        ) : (
          <ul className="-mx-5">
            {items.map((n, i) => {
              const { icon: Icon, tone } = ICONS[n.kind];
              const fresh = isFresh(n.key);
              return (
                <li key={n.key}>
                  {i > 0 && <div aria-hidden className="ml-[76px] h-px bg-line" />}
                  <Link
                    href={`/party/${n.requestId}/status`}
                    onClick={() => setOpen(false)}
                    className="flex gap-4 px-5 py-3 transition-colors duration-100 ease-out active:bg-surface-2 hover:bg-surface-hover"
                  >
                    <span aria-hidden className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-full", tone)}>
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={cn("truncate text-body text-ink", fresh ? "font-semibold" : "font-medium")}>{n.title}</span>
                        <span className="tnum shrink-0 text-caption text-ink-3">{timeAgo(n.at, now)}</span>
                      </span>
                      <span className="mt-0.5 block text-meta text-ink-2">{n.body}</span>
                    </span>
                    <span
                      aria-hidden
                      className={cn("mt-2 size-2 shrink-0 rounded-full bg-accent ring-1 ring-accent-ink/30", !fresh && "invisible")}
                    />
                    {fresh && <span className="sr-only">(new)</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </>
  );
}
