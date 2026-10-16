// All money values are integer pence.

export type MenuCategory = "main" | "side" | "drink";

export interface MenuItem {
  /** Globally unique, prefixed with the restaurant's abbreviation (e.g. "sh-margherita"). */
  id: string;
  name: string;
  price: number;
  /** One appetising line, shown truncated on tiles. */
  description: string;
  category: MenuCategory;
  /** "/images/items/<id>.jpg" when a photo exists; otherwise render the restaurant emoji tile. */
  image?: string;
  /** Pre-sale price, shown struck through next to `price`. */
  originalPrice?: number;
  topPick?: boolean;
}

export interface Deal {
  /** Long form: "20% off a £40 group order". */
  label: string;
  /** Pill form: "20% off". */
  short: string;
  /** Combined finalised basket total (pence) needed to unlock the deal. */
  minTotal: number;
  discountPct: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  deliveryFee: number;
  deal: Deal;
  menu: MenuItem[];
  /** "/images/restaurants/<id>.jpg" */
  image: string;
  /** Neighbourhood line under the name, e.g. "Bloomsbury". */
  area: string;
  rating: number;
  ratingCount: number;
  /** "Excellent" | "Very good" | "Good" */
  ratingLabel: string;
  /** Estimated delivery window in minutes, e.g. [25, 35]. */
  etaMin: [number, number];
  distanceMiles: number;
  featured?: boolean;
}

export interface PickupPoint {
  id: string;
  name: string;
  /** Where exactly to wait, e.g. "Inside the main doors, by the post room". */
  access: string;
  lat?: number;
  lng?: number;
}

export interface Catalog {
  restaurants: Restaurant[];
  pickupPoints: PickupPoint[];
}

export interface BasketLine {
  itemId: string;
  qty: number;
}

export interface Participant {
  userId: string;
  name: string;
  isBot: boolean;
  basket: BasketLine[];
  /** Finalised = basket locked and counted toward the deal. Unfinalised members are "choosing…". */
  finalised: boolean;
  /** Accepted and paid in the current acceptance round. */
  paid: boolean;
  /** Wants disposable cutlery with their order. */
  cutlery: boolean;
  /** Declined in the current acceptance round; removed when the round resolves. */
  declined?: boolean;
}

export type RequestStatus =
  | "open"
  | "deal_achieved"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "expired"
  | "cancelled";

/** A party. */
export interface OrderRequest {
  id: string;
  restaurantId: string;
  pickupPointId: string;
  hostId: string;
  createdAt: number;
  expiresAt: number;
  status: RequestStatus;
  participants: Participant[];
  /** Acceptance round: 1, or 2 for the single fallback round after someone dropped out. */
  round: 1 | 2;
  /** Everyone who declined or timed out of an acceptance round, in order. */
  removedUserIds: string[];
  removedNames: string[];
  /** Why the party ended without an order (`cancelled` or `expired`). */
  cancelReason?: string;
  /** When the deal was first reached. */
  dealAt?: number;
  /** End of the current acceptance round. */
  acceptDeadline?: number;
  confirmedAt?: number;
  /** When the party became `cancelled` or `expired`. */
  closedAt?: number;
  pin?: string;
}

/** The host's party-in-progress before it is created (create flow). */
export interface Draft {
  restaurantId: string;
  pickupPointId: string;
  durationMin: number;
  basket: BasketLine[];
  cutlery: boolean;
}

export interface DemoSettings {
  botsPaused: boolean;
  botWontAccept: boolean;
}

export interface AppState {
  requests: OrderRequest[];
  demo: DemoSettings;
  draft?: Draft;
  /** User ids you've added as friends. */
  friends: string[];
  /** Keys of global popups already shown (see `pendingAlerts`). */
  seenAlerts: string[];
  /** Pickup point id used as your current location. */
  location: string;
  /** Keys of notifications you've seen (see `notificationsFor`). */
  readNotifications: string[];
}
