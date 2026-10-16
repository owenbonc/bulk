"use client";

import { ShoppingBag, Store } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { MenuScreen } from "@/components/menu";
import { Button, Popup } from "@/components/ui";
import { DEFAULT_DURATION_MIN } from "@/lib/data";
import { openPartyFor, restaurantById, useApp } from "@/lib/store";
import type { Draft } from "@/lib/types";

/** W7/W8: the host's menu. Items go into the draft; the party is created from the basket page. */
export default function CreateMenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const restaurant = restaurantById(restaurantId);
  const existingId = openPartyFor(state, restaurantId)?.id;
  const hasDraft = state.draft?.restaurantId === restaurantId;
  // A non-empty basket from another restaurant is only replaced once the host confirms.
  const otherRestaurant =
    state.draft && !hasDraft && state.draft.basket.length > 0 ? restaurantById(state.draft.restaurantId) : undefined;
  const otherDraft = otherRestaurant ? state.draft : undefined;

  // One party per restaurant: if there already is one, send the host to it.
  useEffect(() => {
    if (existingId) router.replace(`/party/${existingId}`);
  }, [existingId, router]);

  useEffect(() => {
    if (restaurant && !existingId && !hasDraft && !otherDraft) dispatch({ type: "DRAFT_START", restaurantId });
  }, [restaurant, existingId, hasDraft, otherDraft, restaurantId, dispatch]);

  if (existingId) return null;

  if (!restaurant) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-8 pt-safe pb-safe text-center">
        <span aria-hidden className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-2">
          <Store className="size-6" />
        </span>
        <h1 className="text-section font-semibold text-ink">We couldn&apos;t find that restaurant</h1>
        <Button href="/create" variant="secondary">
          Choose a restaurant
        </Button>
      </main>
    );
  }

  // Until DRAFT_START lands, render the same empty draft it will create, so the screen never flashes.
  const draft: Draft =
    hasDraft && state.draft
      ? state.draft
      : { restaurantId, pickupPointId: state.location, durationMin: DEFAULT_DURATION_MIN, basket: [], cutlery: false };

  return (
    <>
      <MenuScreen mode="create" restaurant={restaurant} draft={draft} />
      <Popup
        open={!!otherDraft && !!otherRestaurant}
        onOpenChange={() => {}}
        dismissible={false}
        icon={<ShoppingBag />}
        iconTone="accent"
        title={`Start a party at ${restaurant.name}?`}
        description={otherRestaurant ? `Your ${otherRestaurant.name} basket will be cleared.` : undefined}
        action={
          otherRestaurant && (
            <>
              <Button block size="lg" onClick={() => dispatch({ type: "DRAFT_START", restaurantId })}>
                Start new party
              </Button>
              <Button block size="lg" variant="secondary" onClick={() => router.replace(`/create/${otherRestaurant.id}`)}>
                Keep {otherRestaurant.name}
              </Button>
            </>
          )
        }
      />
    </>
  );
}
