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
  /** Delivered parties you've collected; a card you saw earlier this session leaves with an exit. */
  collected: HomeParty[];
}

/**
 * Home's floating bottom stack, with no bar, strip or blur band behind it: the solid lime your-party card,
 * then the clear-glass account button, live party search and create button, each floating on its own. It
 * sits above the scrolling list (below sheets) and reserves its own height in the page, so the last card
 * always scrolls clear of it. The your-party card steps aside while the search field has focus.
 */
export function HomeBottomBar({ query, onQueryChange, mine, collected }: HomeBottomBarProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <>
      <BottomBar material={false} className="flex flex-col gap-2">
        <YourPartyDock parties={mine} collected={collected} hidden={searchFocused} />
        <div className="flex items-center gap-2">
          <IconButton aria-label="Account and demo controls" aria-haspopup="dialog" onClick={() => setAccountOpen(true)}>
            <UserRound />
          </IconButton>
          {/* Focus moving between the input and its clear button stays "focused", so the card doesn't flicker. */}
          <div
            className="min-w-0 flex-1"
            onFocus={() => setSearchFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setSearchFocused(false);
            }}
          >
            <SearchField
              tone="glass"
              size="lg"
              value={query}
              onValueChange={onQueryChange}
              placeholder="Search parties"
              label="Search parties by restaurant, cuisine or dish"
            />
          </div>
          <IconButton aria-label="Create a party" iconColor="accent" href="/create">
            <Plus className="size-[22px]" strokeWidth={2.25} />
          </IconButton>
        </div>
      </BottomBar>
      <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  );
}
