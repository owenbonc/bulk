"use client";

import { ArrowLeft, Timer, UsersRound, UtensilsCrossed, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PartyExistsPopup } from "@/components/create/PartyExistsPopup";
import { Button, Countdown, Divider, IconButton, Switch, TopBar } from "@/components/ui";
import { DEFAULT_DURATION_MIN, ME } from "@/lib/data";
import type { Preview } from "@/lib/requests";
import {
  draftPreview,
  myEntry,
  newPartyId,
  openPartyFor,
  pickupById,
  previewSplit,
  restaurantById,
  useApp,
  useRequest,
} from "@/lib/store";
import type { BasketLine, Draft, PickupPoint, Restaurant } from "@/lib/types";
import { AddOns } from "./AddOns";
import { BasketCta } from "./BasketCta";
import { BasketLines } from "./BasketLines";
import { BasketSummary } from "./BasketSummary";
import { PriceBreakdown } from "./PriceBreakdown";

export type BasketScreenProps = { mode: "join"; partyId: string } | { mode: "host"; restaurantId: string };

/**
 * W4 "Your order". Join mode reviews your basket in an open party and finalises your entry; host mode
 * reviews the create-flow draft and creates the party from it.
 */
export function BasketScreen(props: BasketScreenProps) {
  return props.mode === "join" ? <JoinBasket partyId={props.partyId} /> : <HostBasket restaurantId={props.restaurantId} />;
}

/** Asks once for permission to send "Party filled!" notifications, at the moment you commit to a party. */
function askNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
}

// ---------------------------------------------------------------------------
// Join mode: your basket in an existing party
// ---------------------------------------------------------------------------

function JoinBasket({ partyId }: { partyId: string }) {
  const { now, dispatch } = useApp();
  const router = useRouter();
  const request = useRequest(partyId);
  const me = myEntry(request);
  const restaurant = request && restaurantById(request.restaurantId);
  const menuHref = `/party/${partyId}`;
  const statusHref = `/party/${partyId}/status`;

  const submitted = useRef(false);
  const [busy, setBusy] = useState(false);
  const closed = !!request && (request.status !== "open" || !!me?.finalised);

  // A party that has moved on (or an entry already in) belongs on the status page.
  useEffect(() => {
    if (closed && !submitted.current) router.replace(statusHref);
  }, [closed, router, statusHref]);

  if (!request || !restaurant) {
    return <Missing title="This party isn't around any more" body="It may have closed or been cancelled." />;
  }

  const basket = me?.basket ?? [];
  const preview = previewSplit(request, restaurant, ME.userId, basket);
  const people = request.participants.length;

  const add = (itemId: string) => {
    if (closed) return;
    if (!me) dispatch({ type: "JOIN", requestId: partyId, user: ME });
    dispatch({ type: "ADD_ITEM", requestId: partyId, userId: ME.userId, itemId });
  };
  const remove = (itemId: string) => dispatch({ type: "REMOVE_ITEM", requestId: partyId, userId: ME.userId, itemId });

  const join = () => {
    if (!me || closed || basket.length === 0) return;
    askNotificationPermission();
    submitted.current = true;
    setBusy(true);
    dispatch({ type: "FINALISE_ENTRY", requestId: partyId, userId: ME.userId, now: Date.now() });
    router.replace(statusHref);
  };

  return (
    <BasketLayout
      restaurant={restaurant}
      pickup={pickupById(request.pickupPointId)}
      partyIcon={<UsersRound aria-hidden />}
      partyLine={
        <>
          <span className="tnum">{people}</span> in party · closes in{" "}
          <Countdown until={request.expiresAt} now={now} className="font-medium" />
        </>
      }
      basket={basket}
      preview={preview}
      locked={closed}
      onAdd={add}
      onRemove={remove}
      menuHref={menuHref}
      cutlery={me?.cutlery ?? false}
      cutleryDisabled={!me || closed}
      onCutlery={(cutlery) => me && dispatch({ type: "SET_CUTLERY", requestId: partyId, userId: ME.userId, cutlery })}
      ctaLabel="Join party"
      ctaEmptyLabel="Add something to join"
      ctaDisabled={closed && !busy}
      busy={busy}
      onSubmit={join}
    />
  );
}

// ---------------------------------------------------------------------------
// Host mode: the create-flow draft
// ---------------------------------------------------------------------------

function HostBasket({ restaurantId }: { restaurantId: string }) {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const restaurant = restaurantById(restaurantId);

  const draft = state.draft?.restaurantId === restaurantId ? state.draft : undefined;
  // One party per restaurant per collection point: the party already collecting where this draft would.
  const existing = openPartyFor(state, restaurantId, draft?.pickupPointId ?? state.location);
  const hosting = !draft && existing && myEntry(existing) ? existing : undefined;

  const submitted = useRef(false);
  const [busy, setBusy] = useState(false);
  const [clash, setClash] = useState<{ open: boolean; partyId?: string }>({ open: false });

  // No draft and already in the party here (e.g. back from its status page): go to it. Otherwise make sure
  // there is a draft to edit.
  useEffect(() => {
    if (submitted.current || !restaurant) return;
    if (hosting) router.replace(`/party/${hosting.id}/status`);
    else if (!draft) dispatch({ type: "DRAFT_START", restaurantId });
  }, [hosting, draft, restaurant, restaurantId, router, dispatch]);

  if (!restaurant) {
    return <Missing title="We couldn't find that restaurant" body="Pick another one to start a party." href="/create" cta="Choose a restaurant" />;
  }

  // Until DRAFT_START lands, show the draft it will create so nothing flashes.
  const view: Draft = draft ?? {
    restaurantId,
    pickupPointId: state.location,
    durationMin: DEFAULT_DURATION_MIN,
    basket: [],
    cutlery: false,
  };
  const preview = draftPreview(view, restaurant, ME.userId);

  const create = () => {
    if (!draft || draft.basket.length === 0) return;
    // The collection point already has a party here (it opened while you were choosing, or you picked that
    // point in the settings): offer it instead (W13).
    if (existing) {
      setClash({ open: true, partyId: existing.id });
      return;
    }
    askNotificationPermission();
    submitted.current = true;
    setBusy(true);
    const id = newPartyId();
    dispatch({ type: "CREATE_FROM_DRAFT", id, user: ME, now: Date.now() });
    router.replace(`/party/${id}/status`);
  };

  return (
    <>
      <BasketLayout
        restaurant={restaurant}
        pickup={pickupById(view.pickupPointId)}
        partyIcon={<Timer aria-hidden />}
        partyLine={
          <>
            Party lasts <span className="tnum">{view.durationMin}</span> min
          </>
        }
        basket={view.basket}
        preview={preview}
        locked={busy}
        onAdd={(itemId) => dispatch({ type: "DRAFT_ITEM", itemId, delta: 1 })}
        onRemove={(itemId) => dispatch({ type: "DRAFT_ITEM", itemId, delta: -1 })}
        menuHref={`/create/${restaurantId}`}
        cutlery={view.cutlery}
        cutleryDisabled={!draft}
        onCutlery={(cutlery) => dispatch({ type: "DRAFT_SET", cutlery })}
        ctaLabel="Create party"
        ctaEmptyLabel="Add something to create a party"
        busy={busy}
        onSubmit={create}
      />
      <PartyExistsPopup open={clash.open} partyId={clash.partyId} onOpenChange={(open) => setClash((c) => ({ ...c, open }))} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

interface BasketLayoutProps {
  restaurant: Restaurant;
  pickup?: PickupPoint;
  partyIcon: ReactNode;
  partyLine: ReactNode;
  basket: BasketLine[];
  preview: Preview;
  /** Quantities can't change (party closed or submitting). */
  locked: boolean;
  onAdd: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  /** The menu this basket belongs to: back and "Add items" always go here. */
  menuHref: string;
  cutlery: boolean;
  cutleryDisabled: boolean;
  onCutlery: (cutlery: boolean) => void;
  ctaLabel: string;
  ctaEmptyLabel: string;
  ctaDisabled?: boolean;
  busy: boolean;
  onSubmit: () => void;
}

function BasketLayout({
  restaurant,
  pickup,
  partyIcon,
  partyLine,
  basket,
  preview,
  locked,
  onAdd,
  onRemove,
  menuHref,
  cutlery,
  cutleryDisabled,
  onCutlery,
  ctaLabel,
  ctaEmptyLabel,
  ctaDisabled,
  busy,
  onSubmit,
}: BasketLayoutProps) {
  const empty = basket.length === 0;

  return (
    <>
      <TopBar
        left={
          <IconButton aria-label="Back to menu" href={menuHref}>
            <ArrowLeft />
          </IconButton>
        }
        title="Your order"
        right={
          <IconButton aria-label="Close and go home" href="/">
            <X />
          </IconButton>
        }
      />

      <main className="px-gutter pt-2">
        <BasketSummary restaurant={restaurant} pickup={pickup} partyIcon={partyIcon} partyLine={partyLine} preview={preview} />

        <Divider className="mt-section" />
        <div className="py-section">
          <BasketLines
            restaurant={restaurant}
            basket={basket}
            locked={locked}
            onAdd={onAdd}
            onRemove={onRemove}
            menuHref={menuHref}
          />
        </div>

        <Divider />
        <div className="py-section">
          <AddOns restaurant={restaurant} basket={basket} locked={locked} onAdd={onAdd} onRemove={onRemove} />
        </div>

        <Divider />
        <div className="py-1.5">
          <Switch
            label={
              <span className="flex items-center gap-2">
                <UtensilsCrossed aria-hidden className="size-4 shrink-0 text-ink-3" />
                Add disposable cutlery
              </span>
            }
            description={cutleryDisabled && empty ? "Add something first" : "Leave it off to skip the plastic"}
            checked={cutlery}
            disabled={cutleryDisabled}
            onCheckedChange={onCutlery}
          />
        </div>
        <Divider />

        {!empty && (
          <div className="pt-section pb-group">
            <PriceBreakdown restaurant={restaurant} preview={preview} />
          </div>
        )}
      </main>

      <BasketCta
        label={ctaLabel}
        emptyLabel={ctaEmptyLabel}
        total={preview.total}
        empty={empty}
        disabled={ctaDisabled}
        busy={busy}
        onPress={onSubmit}
      />
    </>
  );
}

function Missing({ title, body, href = "/", cta = "Back to home" }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-8 text-center">
      <h1 className="text-section font-semibold text-ink">{title}</h1>
      <p className="text-body text-ink-2">{body}</p>
      <Button href={href} variant="secondary" className="mt-4">
        {cta}
      </Button>
    </main>
  );
}
