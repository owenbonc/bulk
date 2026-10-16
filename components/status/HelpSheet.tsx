"use client";

import { BadgePercent, ChevronRight, Flag, Link2, LogOut, MapPin, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Divider, Sheet, cn, formatPrice, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { ACCEPT_WINDOW_MS } from "@/lib/requests";
import { useApp } from "@/lib/store";
import type { OrderRequest, PickupPoint, Restaurant } from "@/lib/types";

export interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: OrderRequest;
  restaurant: Restaurant;
  pickup: PickupPoint;
}

/**
 * The status page's "More information" sheet: party details (restaurant, deal terms, collection point and
 * access note), how the party works, then Share, Report and Leave (Leave only while open; the host can leave too).
 */
export function HelpSheet({ open, onOpenChange, request, restaurant, pickup }: HelpSheetProps) {
  const { dispatch } = useApp();
  const router = useRouter();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const me = request.participants.find((p) => p.userId === ME.userId);
  // Anyone can leave while the party is open, the host included; the party stays open for the rest.
  const canLeave = request.status === "open" && !!me;
  const host = request.participants.find((p) => p.userId === request.hostId);
  const seconds = ACCEPT_WINDOW_MS / 1000;
  const threshold = formatPrice(restaurant.deal.minTotal, { trim: true });

  const share = async () => {
    const url = `${window.location.origin}/party/${request.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Party link copied");
    } catch {
      toast("Couldn't copy automatically", { description: url });
    }
    onOpenChange(false);
  };

  const report = () => {
    toast("Thanks, we've logged this");
    onOpenChange(false);
  };

  const leave = () => {
    dispatch({ type: "LEAVE", requestId: request.id, userId: ME.userId });
    onOpenChange(false);
    toast("You left the party");
    router.push("/");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="About this party" onClosed={() => setConfirmLeave(false)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Detail icon={<UtensilsCrossed />} term="Restaurant">
            <span className="font-semibold text-ink">{restaurant.name}</span>
            <span className="text-ink-2"> · {restaurant.cuisine}</span>
            {host && (
              <span className="block text-meta text-ink-2">Hosted by {host.userId === ME.userId ? "you" : host.name}</span>
            )}
          </Detail>
          <Detail icon={<BadgePercent />} term="Deal">
            <span className="font-semibold text-ink">{restaurant.deal.short}</span>
            <span className="block text-meta text-ink-2">
              On everyone&apos;s food once the party spends <span className="tnum">{threshold}</span>. Delivery (
              <span className="tnum">{formatPrice(restaurant.deliveryFee)}</span>) is split between everyone.
            </span>
          </Detail>
          <Detail icon={<MapPin />} term="Collection point">
            <span className="font-semibold text-ink">{pickup.name}</span>
            <span className="block text-meta text-ink-2">{pickup.access}</span>
          </Detail>
        </div>

        <section aria-labelledby="how-title">
          <h3 id="how-title" className="font-display text-emphasis font-semibold text-ink">
            How it works
          </h3>
          <ol className="mt-3 flex flex-col gap-3">
            <Step n={1}>The party fills when everyone&apos;s baskets reach {threshold}.</Step>
            <Step n={2}>Everyone then has {seconds} seconds to accept and pay.</Step>
            <Step n={3}>If someone drops out, the rest get one repriced second round, if they still reach {threshold}.</Step>
            <Step n={4}>Otherwise nobody is charged, and you choose to keep queueing with your basket or cancel.</Step>
          </ol>
        </section>

        <div className="-mx-5 flex flex-col border-t border-line">
          <ActionRow icon={<Link2 />} onClick={share}>
            Share party link
          </ActionRow>
          <Divider className="ml-[68px]" />
          <ActionRow icon={<Flag />} onClick={report}>
            Report a problem
          </ActionRow>
          {canLeave && (
            <>
              <Divider className="ml-[68px]" />
              {confirmLeave ? (
                <div className="flex flex-col gap-3 px-5 py-4">
                  <p className="text-body text-ink-2">
                    Leave the party? Your basket will be removed. The party stays open for everyone else
                    {request.hostId === ME.userId ? ", even though you created it" : ""}. Nothing is charged.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" block onClick={() => setConfirmLeave(false)}>
                      Stay
                    </Button>
                    <Button variant="danger" block icon={<LogOut />} onClick={leave} className="ring-1 ring-offer/30 ring-inset">
                      Leave party
                    </Button>
                  </div>
                </div>
              ) : (
                <ActionRow icon={<LogOut />} tone="offer" onClick={() => setConfirmLeave(true)}>
                  Leave party
                </ActionRow>
              )}
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function Detail({ icon, term, children }: { icon: ReactNode; term: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 [&_svg]:size-[18px]">
        {icon}
      </span>
      <div className="min-w-0 pt-1.5">
        <span className="sr-only">{term}: </span>
        <div className="text-body">{children}</div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-body text-ink">
      <span aria-hidden className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-caption font-semibold text-accent-ink">
        {n}
      </span>
      <span className="min-w-0 pt-px">{children}</span>
    </li>
  );
}

function ActionRow({
  icon,
  tone = "default",
  onClick,
  children,
}: {
  icon: ReactNode;
  tone?: "default" | "offer";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-14 w-full items-center gap-4 px-5 py-3 text-left text-body font-medium transition-colors duration-100 ease-out active:bg-surface-2 hover:bg-surface-hover",
        tone === "offer" ? "text-offer" : "text-ink",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full [&_svg]:size-[18px]",
          tone === "offer" ? "bg-offer-soft text-offer-ink" : "bg-surface-2 text-ink-2",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-3" />
    </button>
  );
}
