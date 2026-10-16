"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type MouseEvent } from "react";
import { LocationButton } from "@/components/shared/LocationSheet";
import { Button, EASE_OUT, EXIT, IconButton, SearchField, TopBar } from "@/components/ui";
import { CATALOG, ME } from "@/lib/data";
import { openPartyFor, useApp } from "@/lib/store";
import { BestDealsList } from "./BestDealsList";
import { byBestDeal, matchesQuery, normalise } from "./bits";
import { FeaturedCarousel, type PartyMarker } from "./FeaturedCarousel";
import { PartyExistsPopup } from "./PartyExistsPopup";

const swap = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: EXIT },
};

/** W6 Create a party: choose a restaurant. Restaurants with an open party show the W13 popup instead. */
export function CreateScreen() {
  const { state } = useApp();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [popup, setPopup] = useState<{ open: boolean; partyId?: string }>({ open: false });

  const q = normalise(query);
  const featured = q ? [] : CATALOG.restaurants.filter((r) => r.featured);
  const deals = CATALOG.restaurants.filter((r) => matchesQuery(r, q)).sort(byBestDeal);

  const partyAt = (restaurantId: string): PartyMarker | undefined => {
    const party = openPartyFor(state, restaurantId);
    return party && { mine: party.participants.some((p) => p.userId === ME.userId) };
  };

  // Restaurants are links to their host menu; one with an open party opens the popup instead.
  const choose = (event: MouseEvent<HTMLAnchorElement>, restaurantId: string) => {
    const party = openPartyFor(state, restaurantId);
    if (!party) return;
    event.preventDefault();
    setPopup({ open: true, partyId: party.id });
  };

  const closeSearch = () => {
    setSearching(false);
    setQuery("");
  };

  return (
    <>
      <TopBar
        left={
          <IconButton aria-label="Close" href="/">
            <X />
          </IconButton>
        }
        center={
          <div className="relative flex w-full min-w-0 items-center pl-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {searching ? (
                <motion.div key="search" {...swap} className="w-full min-w-0">
                  <SearchField
                    autoFocus
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Restaurant, cuisine or dish"
                    label="Search restaurants, cuisines or dishes"
                    tone="translucent"
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && !query) closeSearch();
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div key="location" {...swap} className="min-w-0">
                  <LocationButton variant="inline" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
        right={
          searching ? (
            <Button variant="ghost" size="sm" onClick={closeSearch} className="text-body!">
              Cancel
            </Button>
          ) : (
            <IconButton aria-label="Search restaurants" onClick={() => setSearching(true)}>
              <Search />
            </IconButton>
          )
        }
      />

      <main className="pb-safe">
        <h1 className="px-gutter pt-1 text-title font-semibold text-ink">Create a party</h1>

        {deals.length === 0 ? (
          <div role="status" className="flex flex-col items-center px-8 pt-12 pb-8 text-center">
            <p className="text-emphasis font-semibold text-pretty break-words text-ink">No restaurants match &lsquo;{query.trim()}&rsquo;</p>
            <p className="mt-1 text-body text-ink-2">Try a cuisine like ramen or curry, or a dish.</p>
            <Button variant="secondary" className="mt-4" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-section pt-2 pb-section">
            {featured.length > 0 && <FeaturedCarousel restaurants={featured} partyAt={partyAt} onChoose={choose} />}
            <BestDealsList restaurants={deals} count={q ? deals.length : undefined} partyAt={partyAt} onChoose={choose} />
          </div>
        )}
      </main>

      <PartyExistsPopup
        open={popup.open}
        partyId={popup.partyId}
        onOpenChange={(open) => setPopup((p) => ({ ...p, open }))}
      />
    </>
  );
}
