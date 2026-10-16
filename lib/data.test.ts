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
    // Around UCL, Bloomsbury.
    for (const p of [...CATALOG.pickupPoints, ...CATALOG.restaurants]) {
      expect(p.lat).toBeGreaterThan(51.51);
      expect(p.lat).toBeLessThan(51.54);
      expect(p.lng).toBeGreaterThan(-0.15);
      expect(p.lng).toBeLessThan(-0.11);
    }
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

  it("seeds 2–4 parties at every collection point with readable ids", () => {
    const requests = seedState(0).requests;
    for (const point of CATALOG.pickupPoints) {
      const n = requests.filter((r) => r.pickupPointId === point.id).length;
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(4);
    }
    for (const r of requests) expect(r.id).toBe(`seed-${r.restaurantId}-${r.pickupPointId}`);
    expect(new Set(requests.map((r) => r.id)).size).toBe(requests.length);
  });

  it("keeps the demo restaurants: Burger Yard open at the Student Centre, Kumo Ramen free there but open elsewhere", () => {
    const requests = seedState(0).requests;
    const at = (restaurantId: string, pickupPointId: string) =>
      requests.some((r) => r.restaurantId === restaurantId && r.pickupPointId === pickupPointId);
    expect(at("burger-yard", "student-centre")).toBe(true);
    expect(at("kumo-ramen", "student-centre")).toBe(false);
    expect(requests.some((r) => r.restaurantId === "kumo-ramen")).toBe(true);
    expect(CATALOG.restaurants.filter((r) => !requests.some((x) => x.restaurantId === r.id)).length).toBeGreaterThan(0);
  });

  it("bot names are unique across the seed", () => {
    const names = seedState(0).requests.flatMap((r) => r.participants.map((p) => p.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it("starts at the Student Centre with nothing seen, read or drafted, and three demo friends to invite", () => {
    const s = seedState(0);
    expect(s).toMatchObject({ location: "student-centre", seenAlerts: [], readNotifications: [] });
    expect(s.friends).toEqual(["bot-chloe", "bot-maya", "bot-nina"]);
    // The demo friends aren't already in a seeded party.
    expect(s.requests.flatMap((r) => r.participants).some((p) => s.friends.includes(p.userId))).toBe(false);
    expect(s.draft).toBeUndefined();
  });
});
