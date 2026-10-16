import { CATALOG } from "./data";
import type { Catalog, OrderRequest, PickupPoint, Restaurant } from "./types";

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_MILES = 3958.8;

/** Straight-line (great-circle) distance in miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Restaurant to collection point, in miles to one decimal (as shown: "0.4 mi"). */
export function restaurantMiles(restaurant: Restaurant, point: PickupPoint): number {
  return Math.round(haversineMiles(restaurant, point) * 10) / 10;
}

/** Streets add roughly a third to the straight line on foot, and about 40% by bike. */
const WALK_DETOUR = 1.3;
const WALK_MIN_PER_MILE = 20; // 3 mph
const RIDE_DETOUR = 1.4;
const RIDE_MIN_PER_MILE = 6; // 10 mph courier bike
/** Courier pick-up and hand-over at the collection point. */
const HANDOVER_MIN = 3;
/** Width of the delivery window shown ("18–28 min"). */
const ETA_SPREAD_MIN = 10;

/** Delivery window in minutes from a restaurant to a collection point: prep, the ride, the hand-over. */
export function deliveryEta(restaurant: Restaurant, point: PickupPoint): [number, number] {
  const ride = haversineMiles(restaurant, point) * RIDE_DETOUR * RIDE_MIN_PER_MILE;
  const lo = Math.round(restaurant.prepMin + ride + HANDOVER_MIN);
  return [lo, lo + ETA_SPREAD_MIN];
}

/** Whole minutes on foot between two places (0 for the same place). */
export function walkMinutes(from: LatLng, to: LatLng): number {
  return Math.ceil(haversineMiles(from, to) * WALK_DETOUR * WALK_MIN_PER_MILE);
}

/** Parties collecting this many minutes' walk away or closer count as near you. */
export const NEARBY_WALK_MIN = 9;

/** Each mile away costs this many percentage points of discount in "Best deals near you". */
const DEAL_MILE_PENALTY = 10;

/**
 * "Best deals near you" order from a collection point: the discount minus a distance penalty (nearest good
 * deals first), then the lower threshold, then the nearer restaurant.
 */
export function byBestDealFrom(point: PickupPoint) {
  const miles = (r: Restaurant) => haversineMiles(r, point);
  const score = (r: Restaurant) => r.deal.discountPct - DEAL_MILE_PENALTY * miles(r);
  return (a: Restaurant, b: Restaurant): number =>
    score(b) - score(a) || a.deal.minTotal - b.deal.minTotal || miles(a) - miles(b);
}

/** Where a party collects, seen from your location. */
export interface PartyPlace {
  point?: PickupPoint;
  /** The party collects at your own location. */
  here: boolean;
  /** Minutes on foot from your location (0 when `here`). */
  walkMin: number;
  /** Within NEARBY_WALK_MIN of your location. */
  nearby: boolean;
}

export function placeOf(request: OrderRequest, locationId: string, catalog: Catalog = CATALOG): PartyPlace {
  const point = catalog.pickupPoints.find((p) => p.id === request.pickupPointId);
  const location = catalog.pickupPoints.find((p) => p.id === locationId);
  const here = request.pickupPointId === locationId;
  const walkMin = here ? 0 : point && location ? walkMinutes(location, point) : Infinity;
  return { point, here, walkMin, nearby: walkMin <= NEARBY_WALK_MIN };
}

/** Nearest first: your own collection point, then by walk, then closing soonest. */
export function byNearest(a: { request: OrderRequest; place: PartyPlace }, b: { request: OrderRequest; place: PartyPlace }): number {
  return Number(b.place.here) - Number(a.place.here) || a.place.walkMin - b.place.walkMin || a.request.expiresAt - b.request.expiresAt;
}

/**
 * Open parties collecting near a location (at it, or within NEARBY_WALK_MIN on foot), nearest first. Parties
 * whose timer has run out are left out when `now` is given.
 */
export function partiesNear(
  requests: OrderRequest[],
  locationId: string,
  now?: number,
  catalog: Catalog = CATALOG,
): { request: OrderRequest; place: PartyPlace }[] {
  return requests
    .filter((r) => r.status === "open" && (now === undefined || r.expiresAt > now))
    .map((request) => ({ request, place: placeOf(request, locationId, catalog) }))
    .filter((p) => p.place.nearby)
    .sort(byNearest);
}
