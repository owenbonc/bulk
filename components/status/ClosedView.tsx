"use client";

import { House } from "lucide-react";
import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import { BottomBar, Button, cn } from "@/components/ui";

const FocusTitle = createContext<() => void>(() => {});

/**
 * Moves focus to the closed view's heading, for a card inside it that goes away (e.g. "No thanks") so focus
 * doesn't fall to <body>. A ref rather than an id: with cacheComponents a hidden copy of another party's status
 * page can still be in the document.
 */
export function useFocusClosedTitle(): () => void {
  return useContext(FocusTitle);
}

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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusTitle = useCallback(() => titleRef.current?.focus({ preventScroll: true }), []);
  return (
    <FocusTitle value={focusTitle}>
      <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
        <div
          aria-hidden
          className={cn(
            "grid size-20 place-items-center rounded-full [&_svg]:size-10 [&_svg]:stroke-[1.5]",
            tone === "offer" ? "bg-offer-soft text-offer" : "bg-surface-2 text-ink-2",
          )}
        >
          {icon}
        </div>
        <h1 ref={titleRef} tabIndex={-1} className="mt-5 font-display text-title font-semibold text-ink">
          {title}
        </h1>
        <p className="mt-2 max-w-[32ch] text-body text-ink-2">{reason}</p>
        {reassurance && <p className="mt-1 text-body font-semibold text-ink">{reassurance}</p>}
        {children && <div className="mt-5 w-full">{children}</div>}
      </div>

      <BottomBar material={false}>
        <Button variant="glass" block icon={<House />} href="/">
          Back to home
        </Button>
      </BottomBar>
    </FocusTitle>
  );
}
