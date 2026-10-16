"use client";

import { Plus, SearchX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, SectionHeader, TopBar } from "@/components/ui";
import { LocationButton } from "@/components/shared/LocationSheet";
import { Highlights } from "./Highlights";
import { HomeBottomBar } from "./HomeBottomBar";
import { NotificationsButton } from "./NotificationsSheet";
import { PartyListCard } from "./PartyListCard";
import { useHomeParties } from "./useHomeParties";

/** List cards at the top of "Other parties" whose images load eagerly. */
const PRIORITY_CARDS = 2;

/** W1 Home: highlights, other parties, and the floating your-party card and search / create controls. */
export function HomeScreen() {
  const [query, setQuery] = useState("");
  const { highlights, others, mine, collected, totalCount } = useHomeParties(query);
  const searching = query.trim().length > 0;
  const resultCount = highlights.length + others.length;
  const nothingMatches = resultCount === 0;
  const announcement = !searching
    ? ""
    : resultCount === 0
      ? `No parties match ${query.trim()}`
      : `${resultCount} ${resultCount === 1 ? "party" : "parties"}`;

  return (
    <>
      <TopBar left={<LocationButton variant="stacked" className="glass" />} right={<NotificationsButton />} className="[&>div]:px-4" />

      <main className="flex flex-col gap-section pt-3 pb-6">
        <h1 className="sr-only">Food parties near you</h1>
        {highlights.length > 0 && <Highlights parties={highlights} />}

        {others.length > 0 && (
          <section aria-labelledby="others-title" className="px-gutter">
            <SectionHeader id="others-title" title={highlights.length > 0 ? "Other parties" : "Parties near you"} count={others.length} />
            <ul className="mt-2 flex flex-col gap-3">
              {others.map((p, i) => (
                <li key={p.request.id}>
                  <PartyListCard party={p} priority={i < PRIORITY_CARDS} />
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
                <div className="flex flex-col items-center gap-2">
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                  <Button variant="ghost" href="/create" icon={<Plus />}>
                    Create a party
                  </Button>
                </div>
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

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </main>

      <HomeBottomBar query={query} onQueryChange={setQuery} mine={mine} collected={collected} />
    </>
  );
}

function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 pt-16 pb-8 text-center">
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
