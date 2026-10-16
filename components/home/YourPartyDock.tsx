"use client";

import { Check, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Countdown, EXIT, ImageFrame, Marquee, ProgressPie, SPRING, cn, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { DELIVERY_STAGES } from "@/lib/requests";
import { hasCollected, useApp } from "@/lib/store";
import type { HomeParty } from "./useHomeParties";

/** Card row height (it grows only when reduced motion wraps a long line). */
const CARD_HEIGHT = 76;
/** How far below its place the card starts when it slides in. */
const ENTER_OFFSET = 32;
/** Time from payment to "Ready to collect" in the simulated delivery. */
const DELIVERED_AFTER_MS = DELIVERY_STAGES.find((s) => s.status === "delivered")?.afterMs ?? 0;

/** How long a collected party's card stays on screen as "Collected" before it leaves. */
const FAREWELL_DELAY_MS = 700;

/** Parties whose card has already slid in this session, so coming back to Home doesn't replay the entrance. */
const introduced = new Set<string>();
/** Collected parties whose card has already left, so it only says goodbye once. */
const farewelled = new Set<string>();

/**
 * Your-party card(s): solid lime, one 76px row per party you're in, most urgent first, swiped sideways or
 * paged with the dot buttons when there are several. Rendered as the first item of Home's bottom stack, so it floats just
 * above the controls, over the list and under sheets. It slides up when a party first appears; tap opens
 * the party's status page. `hidden` (while the search field is focused) fades it out, and it fades back in.
 * A party you've collected since its card was last on screen shows as "Collected" for a moment once Home is
 * visible, then leaves with an exit (the whole dock exits when it was the only one). Home stays mounted but
 * hidden while you're on other pages (Next's Activity), and effects only run while it is visible, so the
 * card is held in `onScreen` until then and the exit plays where you can see it.
 */
export function YourPartyDock({
  parties: active,
  collected,
  hidden = false,
}: {
  parties: HomeParty[];
  collected: HomeParty[];
  hidden?: boolean;
}) {
  const activeIds = active.map((p) => p.request.id);
  // Card ids last shown while Home was visible (plus, on a fresh mount, collected cards seen earlier this session).
  const [onScreen, setOnScreen] = useState(() => [
    ...collected.filter((p) => introduced.has(p.request.id) && !farewelled.has(p.request.id)).map((p) => p.request.id),
    ...activeIds,
  ]);
  const departing = collected.filter((p) => onScreen.includes(p.request.id) && !activeIds.includes(p.request.id));
  const parties = [...departing, ...active];
  const ids = parties.map((p) => p.request.id).join(" ");
  const activeKey = activeIds.join(" ");
  const departingKey = departing.map((p) => p.request.id).join(" ");
  const fresh = parties.some((p) => !introduced.has(p.request.id));
  const [hiddenOnce, setHiddenOnce] = useState(hidden);
  if (hidden && !hiddenOnce) setHiddenOnce(true);
  const ulRef = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion();
  const lead = parties[0] ? `${parties[0].request.id}:${parties[0].request.status}:${parties[0].request.round}` : "";

  /** Scrolls card `i` into place, for the page dots (a mouse can't swipe the row). */
  const show = (i: number) => {
    const ul = ulRef.current;
    const li = ul?.children[i] as HTMLElement | undefined;
    if (!ul || !li) return;
    // 16 = the row's px-4 / scroll-px-4 inset.
    const left = ul.scrollLeft + li.getBoundingClientRect().left - ul.getBoundingClientRect().left - 16;
    ul.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
  };

  useEffect(() => {
    for (const id of ids.split(" ")) if (id) introduced.add(id);
  }, [ids]);

  // Runs only while Home is visible: collected cards leave after a beat, everything else follows `active`.
  useEffect(() => {
    const leaving = departingKey ? departingKey.split(" ") : [];
    for (const id of leaving) farewelled.add(id);
    const timer = window.setTimeout(
      () => setOnScreen(activeKey ? activeKey.split(" ") : []),
      leaving.length > 0 ? FAREWELL_DELAY_MS : 0,
    );
    return () => window.clearTimeout(timer);
  }, [activeKey, departingKey]);

  // Jumps back to card 1 when a different party (or the same one at a new stage) becomes most urgent.
  // Card 1 always sits at scrollLeft 0 because of the px-4 / scroll-px-4 inset.
  const shownLead = useRef(lead);
  useEffect(() => {
    if (shownLead.current === lead) return;
    shownLead.current = lead;
    ulRef.current?.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [lead, reduceMotion]);

  return (
    <AnimatePresence>
      {parties.length > 0 && !hidden && (
        <motion.div
          key="dock"
          initial={fresh ? { y: ENTER_OFFSET } : hiddenOnce ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0, transition: SPRING }}
          exit={{ opacity: 0, y: 16, transition: EXIT }}
        >
          {/* Bleeds to the column edges with a 16px gap, so neighbouring cards sit fully off-screen; pads around the card so its shadow isn't clipped by the scroller. */}
          <ul
            ref={ulRef}
            aria-label="Your parties"
            className="no-scrollbar -mx-4 -mt-2 -mb-5 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 pt-2 pb-5 [touch-action:pan-x_pan-y]"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {parties.map((p, i) => (
                <motion.li
                  key={p.request.id}
                  layout="position"
                  className="relative w-full shrink-0 snap-center"
                  exit={{ opacity: 0, y: 16, transition: EXIT }}
                  transition={SPRING}
                >
                  <YourPartyCard party={p} />
                  {parties.length > 1 && (
                    <PageDots
                      index={i}
                      count={parties.length}
                      onSelect={show}
                      className={p.request.status === "open" ? "right-[63px]" : "right-[47px]"}
                    />
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function YourPartyCard({ party }: { party: HomeParty }) {
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
      className="flex items-center gap-3 rounded-[22px] bg-accent py-2 pr-4 pl-3 text-ink shadow-float transition-[scale,background-color] duration-100 ease-out active:scale-[0.97] active:bg-accent-strong"
      style={{ minHeight: CARD_HEIGHT }}
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
        {/* pr-14 keeps the eyebrow clear of the page dots, which sit over its right end. */}
        <div className="flex items-center pr-14">
          <span className="text-caption font-semibold tracking-[0.06em] text-ink/70 uppercase">
            Your party{host ? " · Host" : ""}
          </span>
        </div>
        <Marquee as="p" className="text-emphasis font-semibold">
          {restaurant.name}
        </Marquee>
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
  const { request, progress, me } = party;
  const base = "tnum mt-0.5 text-meta text-ink/80";

  if (request.status === "open") {
    return (
      <Marquee as="p" className={base}>
        <span className="font-semibold text-ink">{formatPrice(progress.left, { trim: true })} left</span>
        {" · "}
        <Countdown until={request.expiresAt} now={now} suffix="left" urgentBelowMs={0} />
      </Marquee>
    );
  }

  if (request.status === "deal_achieved") {
    if (!me?.paid) {
      // --offer on lime fails contrast, so the urgent line sits on a white chip.
      return (
        <p className="tnum mt-1 flex">
          <span className="inline-flex h-5 items-center rounded-full bg-surface px-2 text-caption font-bold whitespace-nowrap text-offer">
            Accept and pay ·&nbsp;
            <Countdown until={request.acceptDeadline ?? now} now={now} urgentBelowMs={0} />
          </span>
        </p>
      );
    }
    const waiting = request.participants.filter((p) => p.userId !== ME.userId && !p.paid && !p.declined).length;
    return (
      <Marquee as="p" className={base}>
        Paid · {waiting > 0 ? `waiting for ${waiting} ${waiting === 1 ? "other" : "others"}` : "placing your order"}
      </Marquee>
    );
  }

  if (hasCollected(request)) {
    return (
      <Marquee as="p" className={base}>
        <Check aria-hidden className="mr-1 inline size-3.5 align-[-2px]" strokeWidth={2.5} />
        <span className="font-semibold text-ink">Collected</span> · enjoy your meal
      </Marquee>
    );
  }

  if (request.status === "delivered") {
    return (
      <Marquee as="p" className={base}>
        <span className="font-semibold text-ink">Ready to collect</span> · PIN{" "}
        <span className="font-mono font-semibold text-ink">{me?.collectionCode}</span>
      </Marquee>
    );
  }

  // Preparing and on its way both read "On its way" with the simulated arrival countdown, as on the status page.
  const label = request.status === "confirmed" ? "Order placed" : "On its way";
  const readyAt = request.confirmedAt !== undefined ? request.confirmedAt + DELIVERED_AFTER_MS : undefined;
  return (
    <Marquee as="p" className={base}>
      <span className="font-semibold text-ink">{label}</span>
      {readyAt !== undefined && (
        <>
          {" · arrives in "}
          <Countdown until={readyAt} now={now} urgentBelowMs={0} />
        </>
      )}
    </Marquee>
  );
}

/**
 * Page dots as buttons, laid over the right end of the card's eyebrow line (outside the card's link). Each dot
 * has a 16x24 hit area; `className` sets the right offset, which clears the card's pie or chevron.
 */
function PageDots({
  index,
  count,
  onSelect,
  className,
}: {
  index: number;
  count: number;
  onSelect: (i: number) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Your parties" className={cn("absolute top-1.5 flex", className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Show party ${i + 1} of ${count}`}
          aria-current={i === index ? "true" : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(i);
          }}
          className="grid h-6 w-4 place-items-center"
        >
          <span
            className={cn("size-1.5 rounded-full transition-colors duration-150", i === index ? "bg-ink" : "bg-ink/25")}
          />
        </button>
      ))}
    </div>
  );
}
