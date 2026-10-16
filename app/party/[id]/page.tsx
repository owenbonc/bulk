"use client";

import { House, UtensilsCrossed } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MenuScreen } from "@/components/menu";
import { Button } from "@/components/ui";
import { myEntry, restaurantById, useRequest } from "@/lib/store";

/** W2/W3: an open party's menu. Anyone not finalised in it can browse and add; the first item joins. */
export default function PartyMenuPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const party = useRequest(id);
  const me = myEntry(party);
  const restaurant = party && restaurantById(party.restaurantId);
  const settled = !!party && (party.status !== "open" || !!me?.finalised);

  useEffect(() => {
    if (settled) router.replace(`/party/${id}/status`);
  }, [settled, id, router]);

  if (settled) return null;

  if (!party || !restaurant) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-8 pt-safe pb-safe text-center">
        <span aria-hidden className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-2">
          <UtensilsCrossed className="size-6" />
        </span>
        <h1 className="text-section font-semibold text-ink">This party isn&apos;t around any more</h1>
        <p className="text-body text-ink-2">It may have filled or closed. There are plenty of others nearby.</p>
        <Button href="/" variant="secondary" icon={<House />}>
          Back to home
        </Button>
      </main>
    );
  }

  return <MenuScreen mode="join" restaurant={restaurant} party={party} />;
}
