import { describe, expect, it } from "vitest";
import { CATALOG, DEFAULT_LOCATION, seedState } from "./data";

const items = CATALOG.restaurants.flatMap((r) => r.menu);

describe("catalog", () => {
  it("has 12 restaurants spread across cuisines, 3 of them featured", () => {
    expect(CATALOG.restaurants).toHaveLength(12);
    expect(new Set(CATALOG.restaurants.map((r) => r.cuisine)).size).toBe(12);
    expect(CATALOG.restaurants.filter((r) => r.featured)).toHaveLength(3);
  });

  it("menu item ids are globally unique", () => {
    expect(new Set(items.map((m) => m.id)).size).toBe(items.length);
  });

  it.each(CATALOG.restaurants)("$name: 7–9 items over mains, sides and drinks, 3 top picks, 1–2 on sale", (r) => {
    expect(r.menu.length).toBeGreaterThanOrEqual(7);
    expect(r.menu.length).toBeLessThanOrEqual(9);
    expect(new Set(r.menu.map((m) => m.category))).toEqual(new Set(["main", "side", "drink"]));
    expect(r.menu.filter((m) => m.topPick)).toHaveLength(3);
    const sale = r.menu.filter((m) => m.originalPrice !== undefined);
    expect(sale.length).toBeGreaterThanOrEqual(1);
    expect(sale.length).toBeLessThanOrEqual(2);
    expect(sale.every((m) => m.originalPrice! > m.price)).toBe(true);
    expect(r.menu.every((m) => m.description.length > 0 && m.description.length <= 60)).toBe(true);
  });

  it.each(CATALOG.restaurants)("$name: deal between 15–25% off with a £35–£55 threshold", (r) => {
    expect(r.deal.discountPct).toBeGreaterThanOrEqual(15);
    expect(r.deal.discountPct).toBeLessThanOrEqual(25);
    expect(r.deal.minTotal).toBeGreaterThanOrEqual(3500);
    expect(r.deal.minTotal).toBeLessThanOrEqual(5500);
    expect(r.deal.short).toBe(`${r.deal.discountPct}% off`);
    expect(r.deal.label).toBe(`${r.deal.discountPct}% off when the party spends £${r.deal.minTotal / 100}`);
  });

  it("follows the image path convention", () => {
    for (const r of CATALOG.restaurants) {
      expect(r.image).toBe(`/images/restaurants/${r.id}.jpg`);
      for (const m of r.menu) {
        if (m.image !== undefined) expect(m.image).toBe(`/images/items/${m.id}.jpg`);
        if (m.topPick || m.category !== "main") expect(m.image).toBeDefined();
      }
    }
  });

  it("has 4 collection points with access notes, the Student Centre first", () => {
    expect(CATALOG.pickupPoints.map((p) => p.name)).toEqual([
      "Student Centre",
      "Main Library",
      "Ramsay Hall",
      "IOE Bedford Way",
    ]);
    expect(CATALOG.pickupPoints.every((p) => p.access.length > 0)).toBe(true);
    expect(DEFAULT_LOCATION).toBe(CATALOG.pickupPoints[0].id);
  });
});

describe("seedState", () => {
  it("only references real restaurants, menu items and collection points", () => {
    const s = seedState(0);
    for (const r of s.requests) {
      const restaurant = CATALOG.restaurants.find((x) => x.id === r.restaurantId)!;
      expect(restaurant).toBeDefined();
      expect(CATALOG.pickupPoints.some((p) => p.id === r.pickupPointId)).toBe(true);
      for (const p of r.participants) for (const line of p.basket) expect(restaurant.menu.some((m) => m.id === line.itemId)).toBe(true);
    }
  });

  it("seeds 6 parties at distinct restaurants, leaving 6 restaurants without one", () => {
    const ids = seedState(0).requests.map((r) => r.restaurantId);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(6);
    expect(CATALOG.restaurants.filter((r) => !ids.includes(r.id))).toHaveLength(6);
  });

  it("starts at the Student Centre with nothing seen, read or drafted", () => {
    const s = seedState(0);
    expect(s).toMatchObject({ location: "student-centre", friends: [], seenAlerts: [], readNotifications: [] });
    expect(s.draft).toBeUndefined();
  });
});
