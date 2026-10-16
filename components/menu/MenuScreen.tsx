"use client";

import { ArrowLeft, Ellipsis, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EASE_OUT, IconButton, SearchField, TopBar, cn, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { basketCount, basketTotal, draftPreview, progressOf } from "@/lib/requests";
import { pickupById, useApp } from "@/lib/store";
import type { Draft, OrderRequest, Restaurant } from "@/lib/types";
import { BasketBubble } from "./BasketBubble";
import { CreateInfoBubble, JoinInfoBubble, type SettingsFocus } from "./InfoBubble";
import { MenuList, TopPicks, type ItemControls } from "./MenuSections";
import { DealSheet, MoreSheet } from "./MenuSheets";
import { PartySettingsSheet } from "./PartySettingsSheet";
import { MenuHero, RestaurantHeader } from "./RestaurantHeader";
import { useHeaderHeight, useScrolledPast } from "./useScrolledPast";

export type MenuScreenProps =
  /** W2/W3: browsing an open party's menu. Adding the first item joins the party. */
  | { mode: "join"; restaurant: Restaurant; party: OrderRequest }
  /** W7/W8: the host building a draft before the party exists. */
  | { mode: "create"; restaurant: Restaurant; draft: Draft };

const DOCK_IN: Transition = { duration: 0.2, ease: EASE_OUT };
const DOCK_OUT: Transition = { duration: 0.15, ease: EASE_OUT };
/** Lets one sheet finish closing before the next opens. */
const SHEET_HANDOFF_MS = 320;

/**
 * The restaurant menu, shared by joiners and hosts: hero, details, the party info bubble (which docks into
 * the top bar once scrolled past), top picks, the categorised menu with in-place search, and the basket
 * bubble with the Deal pill.
 */
export function MenuScreen(props: MenuScreenProps) {
  const { restaurant, mode } = props;
  const { now, dispatch } = useApp();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // ---- Basket and actions for this mode --------------------------------------------------------
  const me = props.mode === "join" ? props.party.participants.find((p) => p.userId === ME.userId) : undefined;
  const basket = props.mode === "join" ? (me?.basket ?? []) : props.draft.basket;
  const count = basketCount(basket);
  const subtotal = basketTotal(basket, restaurant);
  const pickupPointId = props.mode === "join" ? props.party.pickupPointId : props.draft.pickupPointId;
  const pickup = pickupById(pickupPointId);
  const pickupName = pickup?.name ?? "Collection point";

  const controls: ItemControls = {
    qtyOf: (itemId) => basket.find((l) => l.itemId === itemId)?.qty ?? 0,
    add: (itemId) => {
      if (props.mode === "create") {
        dispatch({ type: "DRAFT_ITEM", itemId, delta: 1 });
        return;
      }
      const requestId = props.party.id;
      if (!me) dispatch({ type: "JOIN", requestId, user: ME });
      dispatch({ type: "ADD_ITEM", requestId, userId: ME.userId, itemId });
    },
    remove: (itemId) => {
      if (props.mode === "create") dispatch({ type: "DRAFT_ITEM", itemId, delta: -1 });
      else dispatch({ type: "REMOVE_ITEM", requestId: props.party.id, userId: ME.userId, itemId });
    },
  };

  const progress = props.mode === "join" ? progressOf(props.party, restaurant) : draftPreview(props.draft, restaurant).progress;
  const completesDeal = props.mode === "join" && subtotal > 0 && progress.total + subtotal >= progress.target;

  // ---- Sheets ----------------------------------------------------------------------------------
  const [dealOpen, setDealOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFocus, setSettingsFocus] = useState<SettingsFocus>("duration");
  const editSettings = (focus: SettingsFocus) => {
    setSettingsFocus(focus);
    setSettingsOpen(true);
  };

  // ---- Scroll-driven chrome --------------------------------------------------------------------
  const barRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const barHeight = useHeaderHeight(barRef);
  const pastHero = useScrolledPast(heroRef, barHeight);
  const docked = useScrolledPast(bubbleRef, barHeight);

  // ---- Search ----------------------------------------------------------------------------------
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searching = searchOpen && query.trim().length > 0;

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  /** Scroll so the top of the menu sits just under the top bar. */
  const alignMenu = (behavior: ScrollBehavior, onlyIf: "below" | "above") => {
    const menu = menuRef.current;
    const header = barRef.current?.querySelector("header");
    if (!menu || !header) return;
    const top = menu.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 12;
    if (onlyIf === "below" ? top > window.scrollY : top < window.scrollY) window.scrollTo({ top, behavior });
  };

  // Opening search brings the menu up under the bar so results appear where you're looking.
  useEffect(() => {
    if (!searchOpen) return;
    const id = window.requestAnimationFrame(() => alignMenu(reduceMotion ? "auto" : "smooth", "below"));
    return () => window.cancelAnimationFrame(id);
  }, [searchOpen, reduceMotion]);

  // Top picks hide while a query is active, which pulls the list upwards; keep its top in view.
  useLayoutEffect(() => {
    if (searching) alignMenu("auto", "above");
  }, [searching]);

  const material = pastHero || docked || searchOpen;
  const buttonVariant = material ? "plain" : "glass";

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push(mode === "join" ? "/" : "/create");
  };

  const canLeave = props.mode === "join" && !!me && !me.finalised && props.party.hostId !== ME.userId;
  const leave = () => {
    if (props.mode !== "join") return;
    dispatch({ type: "LEAVE", requestId: props.party.id, userId: ME.userId });
    setMoreOpen(false);
    toast("You left the party");
    router.push("/");
  };

  // ---- Info bubble (full on the page, compact when docked) -------------------------------------
  const infoBubble = (compact: boolean) =>
    props.mode === "join" ? (
      <JoinInfoBubble progress={progress} pickupName={pickupName} expiresAt={props.party.expiresAt} now={now} compact={compact} />
    ) : (
      <CreateInfoBubble durationMin={props.draft.durationMin} pickupName={pickupName} onEdit={editSettings} compact={compact} />
    );

  return (
    <main className="relative pb-8">
      <div ref={barRef} className="contents">
        <TopBar
          position="fixed"
          material={material}
          left={
            <IconButton aria-label="Back" variant={buttonVariant} onClick={back}>
              <ArrowLeft />
            </IconButton>
          }
          center={
            <AnimatePresence initial={false}>
              {docked && (
                <motion.div
                  key="docked"
                  className="flex w-full min-w-0 justify-center px-1"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: DOCK_IN }}
                  exit={{ opacity: 0, y: 6, transition: DOCK_OUT }}
                >
                  {infoBubble(true)}
                </motion.div>
              )}
            </AnimatePresence>
          }
          right={
            <>
              <IconButton
                aria-label={searchOpen ? "Close search" : "Search the menu"}
                aria-expanded={searchOpen}
                variant={buttonVariant}
                onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
              >
                {searchOpen ? <X /> : <Search />}
              </IconButton>
              <AnimatePresence initial={false} mode="popLayout">
                {!docked && (
                  <motion.span
                    key="more"
                    className="inline-flex"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1, transition: DOCK_IN }}
                    exit={{ opacity: 0, scale: 0.95, transition: DOCK_OUT }}
                  >
                    <IconButton aria-label="More about this party" aria-haspopup="dialog" variant={buttonVariant} onClick={() => setMoreOpen(true)}>
                      <Ellipsis />
                    </IconButton>
                  </motion.span>
                )}
              </AnimatePresence>
            </>
          }
        >
          {searchOpen ? (
            <SearchField
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={`Search ${restaurant.name}`}
              label="Search the menu"
              tone="translucent"
              onKeyDown={(e) => {
                if (e.key === "Escape" && !query) closeSearch();
              }}
            />
          ) : undefined}
        </TopBar>
      </div>

      <MenuHero ref={heroRef} restaurant={restaurant} />

      {/* The page lifts over the photo like a sheet. */}
      <div className="relative -mt-6 flex flex-col gap-8 rounded-t-sheet bg-bg px-4 pt-6">
        <div className="flex flex-col gap-4">
          <RestaurantHeader restaurant={restaurant} />
          <div ref={bubbleRef} className={cn("transition-opacity duration-200 ease-out", docked ? "opacity-0" : "opacity-100")}>
            {infoBubble(false)}
          </div>
        </div>

        {!searching && <TopPicks restaurant={restaurant} controls={controls} />}

        <div ref={menuRef} className={cn(searchOpen && "min-h-dvh")}>
          <MenuList restaurant={restaurant} controls={controls} query={searchOpen ? query : ""} onClearQuery={() => setQuery("")} />
        </div>
      </div>

      <BasketBubble
        count={count}
        subtotal={subtotal}
        label={mode === "join" ? "View basket" : "Create party"}
        note={completesDeal ? "your basket unlocks the deal" : "deal not added yet"}
        href={props.mode === "join" ? `/party/${props.party.id}/basket` : `/create/${restaurant.id}/basket`}
        dealLabel={restaurant.deal.short}
        onDealClick={() => setDealOpen(true)}
      />

      <DealSheet open={dealOpen} onOpenChange={setDealOpen} mode={mode} restaurant={restaurant} progress={progress} mine={subtotal} />

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        restaurant={restaurant}
        pickup={pickup}
        party={
          props.mode === "join"
            ? { expiresAt: props.party.expiresAt, size: props.party.participants.length }
            : undefined
        }
        now={now}
        onEditSettings={
          props.mode === "create"
            ? () => {
                setMoreOpen(false);
                window.setTimeout(() => editSettings("duration"), SHEET_HANDOFF_MS);
              }
            : undefined
        }
        onLeave={canLeave ? leave : undefined}
      />

      {props.mode === "create" && (
        <PartySettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          durationMin={props.draft.durationMin}
          pickupPointId={props.draft.pickupPointId}
          focus={settingsFocus}
          onApply={(next) => {
            const draft = props.draft;
            if (next.durationMin === draft.durationMin && next.pickupPointId === draft.pickupPointId) return;
            dispatch({ type: "DRAFT_SET", durationMin: next.durationMin, pickupPointId: next.pickupPointId });
          }}
        />
      )}
    </main>
  );
}
