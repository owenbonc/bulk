"use client";

import { Check, House, MapPin, PiggyBank } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BottomBar, Button, Countdown, EASE_OUT, Marquee, Pill, SPRING, SectionHeader, cn, formatPrice } from "@/components/ui";
import { ME } from "@/lib/data";
import { DELIVERY_STAGES, DELIVERY_STEPS } from "@/lib/requests";
import { deliveryStep, previewSplit, useApp } from "@/lib/store";
import type { RequestStatus } from "@/lib/types";
import { DriverHandover } from "./DriverHandover";
import type { ViewProps } from "./FillingView";
import { LiveMap } from "./LiveMap";
import { MemberList } from "./MemberList";
import { OrderSummary } from "./OrderSummary";
import { PartySection } from "./PartySection";

const SHORT_LABELS: Partial<Record<RequestStatus, string>> = {
  confirmed: "Placed",
  preparing: "Preparing",
  out_for_delivery: "On its way",
  delivered: "Ready",
};

function subline(status: RequestStatus, pickupName: string): string {
  switch (status) {
    case "confirmed":
      return "Everyone paid. The restaurant has your order.";
    case "preparing":
      return "The kitchen is making your food.";
    case "out_for_delivery":
      return `Your courier is heading to ${pickupName}.`;
    case "collected":
      return "Every bag has been handed over. Enjoy!";
    default:
      return "Show your PIN at the collection point.";
  }
}

/** Time from payment to "Ready to collect" in the simulated delivery. */
const DELIVERED_AFTER_MS = DELIVERY_STAGES.find((s) => s.status === "delivered")?.afterMs ?? 0;

/** W10: everyone paid. Delivery progress, live map while on its way, collection PIN, your order, the party. */
export function DeliveryView({ request, restaurant, pickup }: ViewProps) {
  const { now } = useApp();
  const reduce = useReducedMotion();
  const me = request.participants.find((p) => p.userId === ME.userId)!;
  const cost = previewSplit(request, restaurant, ME.userId, me.basket);
  const step = deliveryStep(request.status);
  const collected = request.status === "collected";
  const delivered = request.status === "delivered" || collected;
  const readyAt = request.confirmedAt !== undefined ? request.confirmedAt + DELIVERED_AFTER_MS : undefined;
  const onItsWay = request.status === "out_for_delivery";
  const others = request.participants.length - 1;
  const savedLine =
    others > 0
      ? `You saved ${formatPrice(cost.discount)} with ${others} ${others === 1 ? "other" : "others"}`
      : `You saved ${formatPrice(cost.discount)} with the deal`;

  return (
    <>
      <div className="flex flex-col gap-section px-gutter pt-2 pb-6">
        <section aria-labelledby="delivery-title" className="flex flex-col gap-group">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id="delivery-title" aria-live="polite" className="font-display text-title font-semibold text-ink">
                {collected ? "Order complete" : DELIVERY_STEPS[step]?.label}
              </h1>
              <p className="mt-1 text-body text-ink-2">{subline(request.status, pickup.name)}</p>
              {delivered && cost.discount > 0 && (
                <motion.p
                  className="mt-1.5 flex items-center gap-1.5 text-emphasis font-semibold text-accent-ink"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={SPRING}
                >
                  <PiggyBank aria-hidden className="size-4 shrink-0" />
                  {savedLine}
                </motion.p>
              )}
            </div>
            {delivered ? (
              <Pill tone="success" size="md" icon={<Check strokeWidth={2.5} />} className="mt-1">
                {collected ? "Collected" : "Ready now"}
              </Pill>
            ) : (
              readyAt !== undefined && (
                <p className="mt-1 shrink-0 text-right">
                  <span className="block text-caption text-ink-2">Arrives in</span>
                  <Countdown until={readyAt} now={now} urgentBelowMs={0} className="block text-emphasis font-semibold text-ink" />
                </p>
              )
            )}
          </div>
          <StepBar step={step} />
        </section>

        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {onItsWay && (
              <motion.div
                key="map"
                className="overflow-hidden"
                initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT }}
              >
                <div className="pb-group">
                  <LiveMap request={request} restaurant={restaurant} pickup={pickup} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-section font-semibold text-ink">Collect from</h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-body font-semibold text-ink">
                  <MapPin aria-hidden className="size-4 shrink-0 text-accent-ink" />
                  <span className="sr-only">Collection point: </span>
                  <Marquee>{pickup.name}</Marquee>
                </p>
              </div>
              {me.collectedAt !== undefined ? (
                <Pill tone="success" size="md" icon={<Check strokeWidth={2.5} />} className="mt-1 shrink-0">
                  Collected
                </Pill>
              ) : (
                me.collectionCode && <PinTiles pin={me.collectionCode} ready={delivered} reduce={!!reduce} />
              )}
            </div>
            <p className="text-meta text-ink-2">{pickup.access}</p>
          </div>
        </div>

        {!collected && <DriverHandover request={request} />}

        <section aria-labelledby="order-title" className="flex flex-col gap-group">
          <SectionHeader id="order-title" title="Order" />
          <OrderSummary restaurant={restaurant} basket={me.basket} cost={cost} members={cost.members} mode="paid" />
        </section>

        <PartySection request={request}>
          <MemberList request={request} mode="delivery" />
        </PartySection>
      </div>

      <BottomBar material={false} className="flex justify-end">
        <Button variant="glass" icon={<House />} href="/">
          Home
        </Button>
      </BottomBar>
    </>
  );
}

/** Four-segment delivery progress with short labels under each step. */
function StepBar({ step }: { step: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Delivery progress"
      aria-valuemin={1}
      aria-valuemax={DELIVERY_STEPS.length}
      aria-valuenow={step + 1}
      aria-valuetext={DELIVERY_STEPS[step]?.label}
      className="grid grid-cols-4 gap-1.5"
    >
      {DELIVERY_STEPS.map((s, i) => (
        <div key={s.status} className="flex min-w-0 flex-col gap-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
            <div
              className={cn(
                "h-full rounded-full bg-accent transition-transform duration-300 ease-out motion-reduce:transition-none",
                i <= step ? "translate-x-0" : "-translate-x-full",
              )}
            />
          </div>
          <span aria-hidden className={cn("whitespace-nowrap text-caption", i === step ? "font-semibold text-ink" : i < step ? "text-ink-2" : "text-ink-3")}>
            {SHORT_LABELS[s.status]}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Your own pickup PIN as four digit tiles: it releases only your labelled bag. They turn lime with a single
 * spring entrance once the order is ready to collect.
 */
function PinTiles({ pin, ready, reduce }: { pin: string; ready: boolean; reduce: boolean }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className="text-caption text-ink-2">Pickup PIN</span>
      <motion.div
        key={ready ? "ready" : "waiting"}
        role="img"
        aria-label={`Pickup PIN ${pin.split("").join(" ")}`}
        className="flex gap-1.5"
        initial={ready ? (reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }) : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING}
      >
        {pin.split("").map((digit, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "tnum grid h-11 w-8 place-items-center rounded-chip font-mono text-hero font-semibold",
              ready ? "bg-accent text-on-accent" : "bg-surface-2 text-ink",
            )}
          >
            {digit}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
