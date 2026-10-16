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

/** Card row height. */
const CARD_HEIGHT = 76;
/** How far below its place the card starts when it slides in. */
const ENTER_OFFSET = 32;

/** Parties whose card has already slid in this session, so coming back to Home doesn't replay the entrance. */
const introduced = new Set<string>();

/**
 * Your-party card(s): solid lime, one 76px row per party you're in, most urgent first, swiped sideways with
 * page dots when there are several. Rendered as the first item of Home's bottom stack, so it floats just
 * above the controls, over the list and under sheets. It slides up when a party first appears; tap opens
 * the party's status page.
 */
export function YourPartyDock({ parties }: { parties: HomeParty[] }) {
  const ids = parties.map((p) => p.request.id).join(" ");
  const fresh = parties.some((p) => !introduced.has(p.request.id));

  useEffect(() => {
    for (const id of ids.split(" ")) if (id) introduced.add(id);
  }, [ids]);

  return (
    <AnimatePresence>
      {parties.length > 0 && (
        <motion.div
          key="dock"
          initial={fresh ? { y: ENTER_OFFSET } : false}
          animate={{ y: 0, transition: SPRING }}
          exit={{ opacity: 0, y: 16, transition: EXIT }}
        >
          {/* Bleeds to the column edges and pads around the card so its shadow isn't clipped by the scroller. */}
          <ul
            aria-label="Your parties"
            className="no-scrollbar -mx-4 -mt-2 -mb-5 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 pt-2 pb-5 [touch-action:pan-x_pan-y]"
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
