"use client";

import { Plus, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { BottomBar, IconButton, SearchField } from "@/components/ui";
import { AccountSheet } from "./AccountSheet";

export interface HomeBottomBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Reports the bar's height so the your-party card can float just above it. */
  onHeight: (height: number) => void;
}

/** Account (left), live party search (centre), create a party (right). */
export function HomeBottomBar({ query, onQueryChange, onHeight }: HomeBottomBarProps) {
  const [accountOpen, setAccountOpen] = useState(false);

  // The row's parent is the bar itself (row + padding + safe area).
  const measure = useCallback(
    (row: HTMLDivElement | null) => {
      const bar = row?.parentElement;
      if (!bar) return;
      const observer = new ResizeObserver(() => onHeight(bar.offsetHeight));
      observer.observe(bar);
      return () => observer.disconnect();
    },
    [onHeight],
  );

  return (
    <>
      <BottomBar>
        <div ref={measure} className="flex items-center gap-2">
          <IconButton aria-label="Account and demo controls" aria-haspopup="dialog" variant="glass" onClick={() => setAccountOpen(true)}>
            <UserRound />
          </IconButton>
          <SearchField
            value={query}
            onValueChange={onQueryChange}
            placeholder="Search food or restaurants"
            label="Search parties by restaurant, cuisine or dish"
            tone="translucent"
            className="flex-1 shadow-float"
          />
          <IconButton aria-label="Create a party" variant="accent" href="/create" className="shadow-float">
            <Plus className="size-[22px]" strokeWidth={2.25} />
          </IconButton>
        </div>
      </BottomBar>
      <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  );
}
