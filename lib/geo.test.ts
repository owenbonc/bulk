import { describe, expect, it } from "vitest";
import { CATALOG, seedState } from "./data";
import {
  NEARBY_WALK_MIN,
  byBestDealFrom,
  deliveryEta,
  haversineMiles,
  partiesNear,
  placeOf,
  restaurantMiles,
  walkMinutes,
} from "./geo";

const T0 = 1_000_000;
const point = (id: string) => CATALOG.pickupPoints.find((p) => p.id === id)!;
const restaurant = (id: string) => CATALOG.restaurants.find((r) => r.id === id)!;

describe("distance", () => {
  it("haversine: zero for the same place, symmetric, and right for a known span", () => {
    const sc = point("student-centre");
    expect(haversineMiles(sc, sc)).toBe(0);
    expect(haversineMiles(sc, point("ramsay-hall"))).toBeCloseTo(haversineMiles(point("ramsay-hall"), sc), 10);
    // One degree of latitude is ~69.1 miles.
    expect(haversineMiles({ lat: 51, lng: 0 }, { lat: 52, lng: 0 })).toBeCloseTo(69.09, 1);
  });

  it("restaurant distance is rounded to one decimal and changes with your location", () => {
    const by = restaurant("burger-yard");
    const fromSc = restaurantMiles(by, point("student-centre"));
    const fromRh = restaurantMiles(by, point("ramsay-hall"));
    expect(Number.isInteger(fromSc * 10)).toBe(true);
    expect(fromSc).toBeLessThan(fromRh);
  });

  it("delivery window is prep plus a distance-based ride, ten minutes wide", () => {
    const by = restaurant("burger-yard");
    const [lo, hi] = deliveryEta(by, point("student-centre"));
    expect(hi - lo).toBe(10);
    expect(lo).toBeGreaterThan(by.prepMin);
    expect(deliveryEta(by, point("ramsay-hall"))[0]).toBeGreaterThan(lo);
  });

  it("walking minutes: 0 for the same point, a few minutes across campus", () => {
    expect(walkMinutes(point("main-library"), point("main-library"))).toBe(0);
    expect(walkMinutes(point("student-centre"), point("main-library"))).toBeLessThanOrEqual(3);
    expect(walkMinutes(point("ramsay-hall"), point("ioe-bedford-way"))).toBeGreaterThan(NEARBY_WALK_MIN);
  });
});

describe("best deals near you", () => {
  it("weighs the deal against distance, so the order changes with location", () => {
    const order = (id: string) => [...CATALOG.restaurants].sort(byBestDealFrom(point(id))).map((r) => r.id);
    const sc = order("student-centre");
    expect(sc).toHaveLength(CATALOG.restaurants.length);
    expect(order("ramsay-hall")).not.toEqual(sc);
    // The top pick from each point is a 20%+ deal within half a mile.
    for (const p of CATALOG.pickupPoints) {
      const top = restaurant(order(p.id)[0]);
      expect(top.deal.discountPct).toBeGreaterThanOrEqual(20);
      expect(restaurantMiles(top, p)).toBeLessThanOrEqual(0.5);
    }
  });
});

describe("parties near you", () => {
  it("lists your point's parties first, then others within a short walk by distance, leaving far ones out", () => {
    const { requests } = seedState(T0);
    const near = partiesNear(requests, "student-centre", T0);
    const here = near.filter((p) => p.place.here);
    expect(here.length).toBeGreaterThan(0);
    expect(near.slice(0, here.length).every((p) => p.request.pickupPointId === "student-centre")).toBe(true);
    const walks = near.map((p) => p.place.walkMin);
    expect(walks).toEqual([...walks].sort((a, b) => a - b));
    expect(walks.every((w) => w <= NEARBY_WALK_MIN)).toBe(true);
    // Ramsay Hall is a ten-minute walk from the Student Centre: its parties aren't shown there.
    expect(near.some((p) => p.request.pickupPointId === "ramsay-hall")).toBe(false);
  });

  it("every location shows a different set or order, with something at your own point", () => {
    const { requests } = seedState(T0);
    const sets = CATALOG.pickupPoints.map((p) => partiesNear(requests, p.id, T0).map((x) => x.request.id).join(","));
    expect(new Set(sets).size).toBe(CATALOG.pickupPoints.length);
    for (const p of CATALOG.pickupPoints) {
      const near = partiesNear(requests, p.id, T0);
      expect(near[0].request.pickupPointId).toBe(p.id);
      expect(near.length).toBeLessThanOrEqual(requests.length);
    }
    expect(partiesNear(requests, "ramsay-hall", T0).length).toBeLessThan(requests.length);
  });

  it("leaves out parties that are no longer open or whose timer has run out", () => {
    const { requests } = seedState(T0);
    const [first, ...rest] = requests;
    const closed = [{ ...first, status: "expired" as const }, ...rest];
    expect(partiesNear(closed, first.pickupPointId, T0).some((p) => p.request.id === first.id)).toBe(false);
    expect(partiesNear(requests, first.pickupPointId, first.expiresAt).some((p) => p.request.id === first.id)).toBe(false);
  });

  it("placeOf: here, walking minutes and nearby", () => {
    const r = seedState(T0).requests.find((x) => x.pickupPointId === "main-library")!;
    expect(placeOf(r, "main-library")).toMatchObject({ here: true, walkMin: 0, nearby: true });
    const fromSc = placeOf(r, "student-centre");
    expect(fromSc.here).toBe(false);
    expect(fromSc.walkMin).toBeGreaterThan(0);
    expect(fromSc.nearby).toBe(true);
    expect(fromSc.point?.name).toBe("Main Library");
  });
});
