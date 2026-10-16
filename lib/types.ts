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
  /** Long form: "20% off when the party spends £40". */
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
  /** Where the kitchen is; distance and delivery estimate are measured from here (see `lib/geo.ts`). */
  lat: number;
  lng: number;
  /** Minutes from order to food leaving the kitchen; the ride to the collection point is added on top. */
  prepMin: number;
  featured?: boolean;
}

export interface PickupPoint {
  id: string;
  name: string;
  /** Where exactly to wait, e.g. "Inside the main doors, by the post room". */
  access: string;
  lat: number;
  lng: number;
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
  /** Why they're out of the round: said no, or their demo payment failed. */
  declineReason?: "declined" | "payment_failed";
  /** Their own 4-digit pickup PIN for their labelled bag, issued when the order is placed. */
  collectionCode?: string;
  /** When their bag was handed over at the collection point. */
  collectedAt?: number;
}

export type ReleaseReason = "no_match" | "declined" | "timed_out" | "payment_failed" | "group_fell_through";

/** Someone whose attempt ended. Their basket is kept until they start a new party with it or say no thanks. */
export interface ReleasedEntry {
  userId: string;
  name: string;
  isBot: boolean;
  basket: BasketLine[];
  cutlery: boolean;
  reason: ReleaseReason;
  choice: "pending" | "retried" | "cancelled";
  /** The new party started with their basket. */
  retriedAs?: string;
}

/** A friend you invited to a party. In the demo they're simulated: they accept a few seconds later and join with a basket. */
export interface Invite {
  userId: string;
  name: string;
  /** Who sent it. */
  invitedBy: string;
  at: number;
  status: "pending" | "joined";
}

/** A friend you invited to a party. In the demo they're simulated: they accept a few seconds later and join with a basket. */
export interface Invite {
  userId: string;
  name: string;
  /** Who sent it. */
  invitedBy: string;
  at: number;
  status: "pending" | "joined";
}

export type RequestStatus =
  | "open"
  | "deal_achieved"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "collected"
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
  /** When every bag had been handed over (`collected`). */
  completedAt?: number;
  /** 1 for a new party; starting a new party from a saved basket makes attempt + 1. */
  attempt: number;
  /** The party this one was retried from. */
  retryOf?: string;
  /** People whose attempt ended here, with their baskets kept so they can start a new party or say no thanks. */
  released: ReleasedEntry[];
  /** Friends invited while the party was filling. */
  invites?: Invite[];
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
  /** One bot declines the first quote (bots join with spare capacity, so the fallback can succeed). */
  botWontAccept: boolean;
  /** That bot also declines the fallback quote, so the fallback fails. */
  botDeclinesAgain: boolean;
  /** One bot never answers, so the acceptance window times out. */
  botSilent: boolean;
  /** Your demo payment fails when you accept. */
  myPaymentFails: boolean;
}

export interface AppState {
  /** Persisted-state version. Saved state from another version is replaced with a fresh demo. */
  version: number;
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
