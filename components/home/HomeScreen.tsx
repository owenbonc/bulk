"use client";

import { Plus, SearchX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, SectionHeader, TopBar } from "@/components/ui";
import { LocationButton } from "@/components/shared/LocationSheet";
import { Highlights } from "./Highlights";
import { HomeBottomBar } from "./HomeBottomBar";
import { NotificationsButton } from "./NotificationsSheet";
import { LIST_ITEM_TOP, PartyListCard } from "./PartyListCard";
import { useHomeParties } from "./useHomeParties";
import { DOCK_SPACE, YourPartyDock } from "./YourPartyDock";

/** W1 Home: highlights, other parties, your party, and the search / create bar. */
export function HomeScreen() {
  const [query, setQuery] = useState("");
  const [barHeight, setBarHeight] = useState(0);
  const { highlights, others, mine, totalCount } = useHomeParties(query);
  const searching = query.trim().length > 0;
  const nothingMatches = highlights.length === 0 && others.length === 0;

  return (
    <>
      <TopBar left={<LocationButton variant="stacked" className="-ml-1" />} right={<NotificationsButton />} className="[&>div]:px-3" />

      <main className="flex flex-col gap-7 pt-3 pb-6">
        {highlights.length > 0 && <Highlights parties={highlights} />}

        {others.length > 0 && (
          <section aria-labelledby="others-title" className="px-4">
            <SectionHeader id="others-title" title={highlights.length > 0 ? "Other parties" : "Parties near you"} count={others.length} />
            <ul className="mt-1 flex flex-col gap-2">
              {others.map((p) => (
                <li key={p.request.id} style={{ paddingTop: LIST_ITEM_TOP }}>
                  <PartyListCard party={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {nothingMatches &&
          (searching && totalCount > 0 ? (
            <EmptyState
              icon={<SearchX />}
              title={`No parties match ‘${query.trim()}’`}
              body="Try a restaurant, a cuisine like pizza, or a dish."
              action={
                <Button variant="secondary" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No parties near you right now"
              body="Start one and students nearby can join in."
              action={
                <Button href="/create" icon={<Plus />}>
                  Create a party
                </Button>
              }
            />
          ))}
      </main>

      {mine.length > 0 && <div aria-hidden style={{ height: DOCK_SPACE }} />}
      <YourPartyDock parties={mine} barHeight={barHeight} />
      <HomeBottomBar query={query} onQueryChange={setQuery} onHeight={setBarHeight} />
    </>
  );
}

function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center px-8 pt-16 pb-8 text-center">
      {icon && (
        <span aria-hidden className="mb-4 grid size-12 place-items-center rounded-full bg-surface-2 text-ink-2">
          {icon}
        </span>
      )}
      <h2 className="max-w-[24ch] font-display text-section font-semibold break-words text-ink">{title}</h2>
      <p className="mt-2 max-w-[32ch] text-body text-ink-2">{body}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}
