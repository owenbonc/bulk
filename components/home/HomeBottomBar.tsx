"use client";

import { Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { BottomBar, IconButton, SearchField } from "@/components/ui";
import { AccountSheet } from "./AccountSheet";
import type { HomeParty } from "./useHomeParties";
import { YourPartyDock } from "./YourPartyDock";

export interface HomeBottomBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Parties you're in, most urgent first, shown as the your-party card above the controls. */
  mine: HomeParty[];
}

/**
 * Home's floating bottom stack, with no bar behind it: the your-party card, then the clear-glass account
 * button, live party search and create button. It sits above the scrolling list (below sheets) and reserves
 * its own height in the page, so the last card always scrolls clear of it.
 */
export function HomeBottomBar({ query, onQueryChange, mine }: HomeBottomBarProps) {
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <>
      <BottomBar material={false} className="flex flex-col gap-2">
        <YourPartyDock parties={mine} />
        <div className="flex items-center gap-2">
          <IconButton aria-label="Account and demo controls" aria-haspopup="dialog" onClick={() => setAccountOpen(true)}>
            <UserRound />
          </IconButton>
          <SearchField
            tone="glass"
            value={query}
            onValueChange={onQueryChange}
            placeholder="Search parties"
            label="Search parties by restaurant, cuisine or dish"
            className="flex-1"
          />
          <IconButton aria-label="Create a party" iconColor="accent" href="/create">
            <Plus className="size-[22px]" strokeWidth={2.25} />
          </IconButton>
        </div>
      </BottomBar>
      <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  );
}
