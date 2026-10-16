"use client";

import { House } from "lucide-react";
import type { ReactNode } from "react";
import { BottomBar, Button, cn } from "@/components/ui";

export interface ClosedViewProps {
  icon: ReactNode;
  tone: "offer" | "neutral";
  title: string;
  /** Why it ended, one line. */
  reason: ReactNode;
  /** Reassurance line in ink, e.g. "Nobody was charged." */
  reassurance?: string;
  /** Optional detail under the copy. */
  children?: ReactNode;
}

/**
 * End state for a party that didn't become an order for you: expired, cancelled, you were removed,
 * or the party can't be found. One icon, one reason, one way home.
 */
export function ClosedView({ icon, tone, title, reason, reassurance, children }: ClosedViewProps) {
  return (
    <>
      <div className="flex flex-col items-center px-6 pt-14 pb-8 text-center">
        <div
          aria-hidden
          className={cn(
            "grid size-24 place-items-center rounded-full [&_svg]:size-12 [&_svg]:stroke-[1.5]",
            tone === "offer" ? "bg-offer-soft text-offer" : "bg-surface-2 text-ink-2",
          )}
        >
          {icon}
        </div>
        <h1 className="mt-6 font-display text-title font-semibold text-ink">{title}</h1>
        <p className="mt-2 max-w-[32ch] text-body text-ink-2">{reason}</p>
        {reassurance && <p className="mt-1 text-body font-semibold text-ink">{reassurance}</p>}
        {children && <div className="mt-6 w-full">{children}</div>}
      </div>

      <BottomBar>
        <Button size="lg" block icon={<House />} href="/">
          Back to home
        </Button>
      </BottomBar>
    </>
  );
}
