"use client";

import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Countdown, EXIT, ImageFrame, ProgressPie, SPRING, cn, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { DELIVERY_STEPS, arrivesAt } from "@/lib/requests";
import { useApp } from "@/lib/store";
import { clockTime } from "./parts";
import type { HomeParty } from "./useHomeParties";

/** Gap between the card and the bottom bar. */
const GAP = 8;
/** Card row height. */
const CARD_HEIGHT = 76;
/** The scroller reaches this far under the bottom bar so the card's shadow is never cut off in view. */
const SHADOW_ROOM = 20;

/** Space the page reserves above the bottom bar while the dock shows. */
export const DOCK_SPACE = CARD_HEIGHT + GAP;

/**
 * Your-party card(s), floating just above the Home bottom bar: solid lime, one 76px row per party you're
 * in, most urgent first, swiped sideways when there are several. Tap opens the party's status page.
 */
export function YourPartyDock({ parties, barHeight }: { parties: HomeParty[]; barHeight: number }) {
  const show = parties.length > 0 && barHeight > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="dock"
          className="fixed inset-x-0 z-30 mx-auto w-full max-w-column"
          style={{ bottom: barHeight - SHADOW_ROOM }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: SPRING }}
          exit={{ opacity: 0, y: 16, transition: EXIT }}
        >
          <ul
            aria-label="Your parties"
            className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 pt-3 [touch-action:pan-x_pan-y]"
            style={{ paddingBottom: GAP + SHADOW_ROOM }}
          >
            {parties.map((p, i) => (
              <li key={p.request.id} className="w-full shrink-0 snap-center">
                <YourPartyCard party={p} index={i} count={parties.length} />
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function YourPartyCard({ party, index, count }: { party: HomeParty; index: number; count: number }) {
  const { request, restaurant, progress, me } = party;
  const host = request.hostId === ME.userId;
  const statusKey = `${request.status}:${request.round}:${me?.paid ? "paid" : "unpaid"}`;

  // One soft pulse whenever the party moves to a new stage.
  const [scope, animate] = useAnimate<HTMLAnchorElement>();
  const reduceMotion = useReducedMotion();
  const shown = useRef(statusKey);
  useEffect(() => {
    if (shown.current === statusKey || !scope.current) return;
    shown.current = statusKey;
    if (reduceMotion) animate(scope.current, { opacity: [1, 0.7, 1] }, { duration: 0.4, ease: "easeOut" });
    else animate(scope.current, { scale: [1, 1.03, 1] }, { duration: 0.45, ease: [0.23, 1, 0.32, 1] });
  }, [statusKey, animate, scope, reduceMotion]);

  return (
    <Link
      ref={scope}
      href={`/party/${request.id}/status`}
      className="flex items-center gap-3 rounded-[22px] bg-accent pr-4 pl-3 text-ink shadow-float transition-[scale,background-color] duration-100 ease-out active:scale-[0.97] active:bg-accent-strong"
      style={{ height: CARD_HEIGHT }}
    >
      <ImageFrame
        src={restaurant.image}
        alt=""
        ratio="1/1"
        radius="chip"
        emoji={restaurant.emoji}
        sizes="52px"
        className="size-[52px] shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] leading-4 font-semibold tracking-[0.06em] text-ink/70 uppercase">
            Your party{host ? " · Host" : ""}
          </span>
          {count > 1 && <PageDots index={index} count={count} />}
        </div>
        <p className="truncate text-body leading-5 font-semibold">{restaurant.name}</p>
        <StatusLine party={party} />
      </div>

      {request.status === "open" ? (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface">
          <ProgressPie
            value={progress.total}
            max={progress.target}
            size={32}
            label={`${progress.pct}% of the way to ${restaurant.deal.short}`}
          />
        </span>
      ) : (
        <ChevronRight aria-hidden className="shrink-0 text-ink/70" />
      )}
    </Link>
  );
}

function StatusLine({ party }: { party: HomeParty }) {
  const { now } = useApp();
  const { request, restaurant, progress, me } = party;
  const base = "tnum mt-0.5 truncate text-meta leading-[18px]";

  if (request.status === "open") {
    return (
      <p className={cn(base, "text-ink/80")}>
        <span className="font-semibold text-ink">{formatPrice(progress.left, { trim: true })} left</span>
        {" · "}
        <Countdown until={request.expiresAt} now={now} suffix="left" urgentBelowMs={0} />
      </p>
    );
  }

  if (request.status === "deal_achieved") {
    if (!me?.paid) {
      // --offer on lime fails contrast, so the urgent line sits on a white chip.
      return (
        <p className={cn(base, "mt-1")}>
          <span className="inline-flex h-5 items-center rounded-full bg-surface px-2 text-caption font-bold text-offer">
            Accept and pay ·&nbsp;
            <Countdown until={request.acceptDeadline ?? now} now={now} urgentBelowMs={0} />
          </span>
        </p>
      );
    }
    const waiting = request.participants.filter((p) => p.userId !== ME.userId && !p.paid && !p.declined).length;
    return (
      <p className={cn(base, "text-ink/80")}>
        Paid · {waiting > 0 ? `waiting for ${waiting} ${waiting === 1 ? "other" : "others"}` : "placing your order"}
      </p>
    );
  }

  if (request.status === "delivered") {
    return (
      <p className={cn(base, "text-ink/80")}>
        <span className="font-semibold text-ink">Ready to collect</span> · PIN{" "}
        <span className="font-mono font-semibold text-ink">{request.pin}</span>
      </p>
    );
  }

  const label = DELIVERY_STEPS.find((s) => s.status === request.status)?.label ?? "Order placed";
  const eta = arrivesAt(request, restaurant);
  return (
    <p className={cn(base, "text-ink/80")}>
      <span className="font-semibold text-ink">{label}</span>
      {eta !== undefined && ` · arrives ${clockTime(eta)}`}
    </p>
  );
}

function PageDots({ index, count }: { index: number; count: number }) {
  return (
    <span aria-label={`${index + 1} of ${count}`} role="img" className="flex shrink-0 items-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cn("size-1.5 rounded-full", i === index ? "bg-ink" : "bg-ink/25")} />
      ))}
    </span>
  );
}
