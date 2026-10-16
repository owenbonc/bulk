"use client";

import { SearchX } from "lucide-react";
import { Button, ImageFrame, Marquee, Price, SectionHeader, Stepper } from "@/components/ui";
import type { MenuCategory, MenuItem, Restaurant } from "@/lib/types";

/** How the screen reads and changes your quantities, whichever basket (party or draft) backs it. */
export interface ItemControls {
  qtyOf: (itemId: string) => number;
  add: (itemId: string) => void;
  remove: (itemId: string) => void;
}

const CATEGORIES: { key: MenuCategory; title: string }[] = [
  { key: "main", title: "Mains" },
  { key: "side", title: "Sides" },
  { key: "drink", title: "Drinks" },
];

/** Case-insensitive match on name, description or category. */
export function matchesQuery(item: MenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const category = CATEGORIES.find((c) => c.key === item.category)?.title ?? "";
  return [item.name, item.description, category].some((s) => s.toLowerCase().includes(q));
}

// ---------------------------------------------------------------------------
// Top picks: horizontal row of square tiles
// ---------------------------------------------------------------------------

export function TopPicks({ restaurant, controls }: { restaurant: Restaurant; controls: ItemControls }) {
  const picks = restaurant.menu.filter((m) => m.topPick);
  if (picks.length === 0) return null;

  return (
    <section aria-labelledby="top-picks" className="flex flex-col gap-group">
      <SectionHeader title="Top picks" id="top-picks" />
      <ul className="no-scrollbar -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto overscroll-x-contain px-gutter pb-1 [touch-action:pan-x_pan-y]">
        {picks.map((item) => (
          <li key={item.id} className="w-[140px] shrink-0 snap-start">
            <ImageFrame src={item.image} alt={item.name} ratio="1/1" radius="card" emoji={restaurant.emoji} sizes="140px">
              <Stepper
                qty={controls.qtyOf(item.id)}
                label={item.name}
                size="sm"
                variant="glass"
                onAdd={() => controls.add(item.id)}
                onRemove={() => controls.remove(item.id)}
                className="absolute right-2 bottom-2"
              />
            </ImageFrame>
            <Marquee as="h3" className="mt-2 font-sans text-body leading-snug font-semibold text-ink">
              {item.name}
            </Marquee>
            <p className="text-meta font-semibold text-ink">
              <Price pence={item.price} originalPence={item.originalPrice} />
            </p>
            <p className="mt-0.5 text-meta text-ink-2 text-pretty">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Full menu grouped by category
// ---------------------------------------------------------------------------

export interface MenuListProps {
  restaurant: Restaurant;
  controls: ItemControls;
  query: string;
  onClearQuery: () => void;
}

export function MenuList({ restaurant, controls, query, onClearQuery }: MenuListProps) {
  const groups = CATEGORIES.map((c) => ({ ...c, items: restaurant.menu.filter((m) => m.category === c.key && matchesQuery(m, query)) })).filter(
    (g) => g.items.length > 0,
  );

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 pt-10 text-center">
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-surface-2 text-ink-2">
          <SearchX />
        </span>
        <p className="text-body text-ink-2">
          No dishes match &lsquo;<span className="font-semibold text-ink">{query.trim()}</span>&rsquo;
        </p>
        <Button variant="secondary" size="sm" onClick={onClearQuery}>
          Clear search
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`menu-${group.key}`}>
          <SectionHeader title={group.title} count={group.items.length} id={`menu-${group.key}`} />
          <ul className="divide-y divide-line">
            {group.items.map((item) => (
              <MenuRow key={item.id} item={item} controls={controls} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MenuRow({ item, controls }: { item: MenuItem; controls: ItemControls }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-body leading-snug font-semibold text-ink">{item.name}</h3>
        {/* Reserves the width the expanded stepper grows over. */}
        <p className="mt-0.5 pr-[76px] text-meta text-ink-2 text-pretty">{item.description}</p>
        <p className="mt-1 text-body font-medium text-ink">
          <Price pence={item.price} originalPence={item.originalPrice} />
        </p>
      </div>
      <Stepper
        qty={controls.qtyOf(item.id)}
        label={item.name}
        onAdd={() => controls.add(item.id)}
        onRemove={() => controls.remove(item.id)}
      />
    </li>
  );
}
