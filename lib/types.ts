// All money values are integer pence.

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface Deal {
  label: string;
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
}

export interface PickupPoint {
  id: string;
  name: string;
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
  /** Finalised = basket locked and entered into the queue. */
  finalised: boolean;
  paid: boolean;
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

export interface OrderRequest {
  id: string;
  restaurantId: string;
  pickupPointId: string;
  hostId: string;
  createdAt: number;
  expiresAt: number;
  status: RequestStatus;
  participants: Participant[];
  acceptDeadline?: number;
  confirmedAt?: number;
  pin?: string;
}

export interface DemoSettings {
  botsPaused: boolean;
  botWontAccept: boolean;
}

export interface AppState {
  requests: OrderRequest[];
  demo: DemoSettings;
}
