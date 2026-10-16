"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type MouseEvent } from "react";
import { LocationButton, useLocationSwitch } from "@/components/shared/LocationSheet";
import { Button, EASE_OUT, EXIT, IconButton, SearchField, TopBar, announce } from "@/components/ui";
import { CATALOG, ME } from "@/lib/data";
import { byBestDealFrom, openPartyFor, useApp, useLocation } from "@/lib/store";
import { BestDealsList } from "./BestDealsList";
import { matchesQuery, normalise } from "./bits";
import { FeaturedCarousel, type PartyMarker } from "./FeaturedCarousel";
import { PartyExistsPopup } from "./PartyExistsPopup";

const swap = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: EXIT },
};

/**
 * W6 Create a party: choose a restaurant. Distances, delivery times and the "Best deals near you" order are
 * measured from your location; a restaurant with an open party at your location shows the W13 popup instead.
 */
export function CreateScreen() {
  const { state } = useApp();
  const point = useLocation();
  useLocationSwitch(() => announce(`Distances and delivery times from ${point.name}`));
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [popup, setPopup] = useState<{ open: boolean; partyId?: string; key: number }>({ open: false, key: 0 });

  // Closed whenever the route is hidden, so it never reappears on return; the new key remounts it without an exit frame.
  useEffect(() => () => setPopup((p) => (p.open ? { open: false, key: p.key + 1 } : p)), []);

  const q = normalise(query);
  const featured = q ? [] : CATALOG.restaurants.filter((r) => r.featured);
  const deals = CATALOG.restaurants.filter((r) => matchesQuery(r, q)).sort(byBestDealFrom(point));

  const partyAt = (restaurantId: string): PartyMarker | undefined => {
    const party = openPartyFor(state, restaurantId, state.location);
    return party && { mine: party.participants.some((p) => p.userId === ME.userId) };
  };

  // Restaurants are links to their host menu; one with an open party at your location opens the popup instead.
  const choose = (event: MouseEvent<HTMLAnchorElement>, restaurantId: string) => {
    const party = openPartyFor(state, restaurantId, state.location);
    if (!party) return;
    event.preventDefault();
    setPopup((p) => ({ ...p, open: true, partyId: party.id }));
  };

  const closeSearch = () => {
    setSearching(false);
    setQuery("");
  };

  const announcement = !q
    ? ""
    : deals.length === 0
      ? `No restaurants match ${query.trim()}`
      : `${deals.length} ${deals.length === 1 ? "restaurant" : "restaurants"}`;

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
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </span>

        {deals.length === 0 ? (
          <div className="flex flex-col items-center px-8 pt-12 pb-8 text-center">
            <p className="text-emphasis font-semibold text-pretty break-words text-ink">No restaurants match &lsquo;{query.trim()}&rsquo;</p>
            <p className="mt-1 text-body text-ink-2">Try a cuisine like ramen or curry, or a dish.</p>
            <Button variant="secondary" className="mt-4" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-section pt-2 pb-section">
            {featured.length > 0 && <FeaturedCarousel restaurants={featured} point={point} partyAt={partyAt} onChoose={choose} />}
            <BestDealsList restaurants={deals} point={point} count={q ? deals.length : undefined} partyAt={partyAt} onChoose={choose} />
          </div>
        )}
      </main>

      <PartyExistsPopup
        key={popup.key}
        open={popup.open}
        partyId={popup.partyId}
        onOpenChange={(open) => setPopup((p) => ({ ...p, open }))}
      />
    </>
  );
}
