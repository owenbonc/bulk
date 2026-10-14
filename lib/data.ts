import type { AppState, Catalog, OrderRequest, Participant } from "./types";

export const ME = { userId: "me", name: "You" };

export const BOT_NAMES = ["Aisha", "Tom", "Priya", "Kwame", "Sophie", "Liam", "Mei", "Omar", "Hannah", "Jake"];

export const CATALOG: Catalog = {
  pickupPoints: [
    { id: "hall-a", name: "Hall A reception" },
    { id: "hall-b", name: "Hall B reception" },
    { id: "su", name: "Student Union front desk" },
    { id: "library", name: "Library entrance" },
  ],
  restaurants: [
    {
      id: "slice-house",
      name: "Slice House",
      cuisine: "Pizza",
      emoji: "🍕",
      deliveryFee: 399,
      deal: { label: "20% off a £40 group order", minTotal: 4000, discountPct: 20 },
      menu: [
        { id: "margherita", name: "Margherita", price: 900 },
        { id: "pepperoni", name: "Pepperoni", price: 1050 },
        { id: "veggie", name: "Garden Veggie", price: 1000 },
        { id: "garlic-bread", name: "Garlic bread", price: 450 },
        { id: "cola", name: "Cola", price: 200 },
      ],
    },
    {
      id: "wok-this-way",
      name: "Wok This Way",
      cuisine: "Chinese",
      emoji: "🥡",
      deliveryFee: 349,
      deal: { label: "25% off a £50 group order", minTotal: 5000, discountPct: 25 },
      menu: [
        { id: "chow-mein", name: "Chicken chow mein", price: 850 },
        { id: "sweet-sour", name: "Sweet & sour pork", price: 900 },
        { id: "tofu", name: "Salt & pepper tofu", price: 800 },
        { id: "egg-rice", name: "Egg fried rice", price: 350 },
        { id: "spring-rolls", name: "Spring rolls (4)", price: 400 },
      ],
    },
    {
      id: "burger-yard",
      name: "Burger Yard",
      cuisine: "Burgers",
      emoji: "🍔",
      deliveryFee: 299,
      deal: { label: "15% off a £35 group order", minTotal: 3500, discountPct: 15 },
      menu: [
        { id: "classic", name: "Classic burger", price: 950 },
        { id: "chicken", name: "Crispy chicken burger", price: 950 },
        { id: "vegan", name: "Vegan burger", price: 1000 },
        { id: "fries", name: "Fries", price: 350 },
        { id: "shake", name: "Milkshake", price: 450 },
      ],
    },
    {
      id: "curry-corner",
      name: "Curry Corner",
      cuisine: "Indian",
      emoji: "🍛",
      deliveryFee: 349,
      deal: { label: "20% off a £45 group order", minTotal: 4500, discountPct: 20 },
      menu: [
        { id: "tikka", name: "Chicken tikka masala", price: 1050 },
        { id: "korma", name: "Vegetable korma", price: 900 },
        { id: "naan", name: "Garlic naan", price: 300 },
        { id: "rice", name: "Pilau rice", price: 300 },
        { id: "samosa", name: "Samosas (2)", price: 400 },
      ],
    },
  ],
};

const MIN = 60_000;

function bot(name: string, basket: Participant["basket"]): Participant {
  return { userId: `bot-${name.toLowerCase()}`, name, isBot: true, basket, finalised: true, paid: false };
}

function seedRequest(
  id: string,
  restaurantId: string,
  pickupPointId: string,
  now: number,
  minsLeft: number,
  participants: Participant[],
): OrderRequest {
  return {
    id,
    restaurantId,
    pickupPointId,
    hostId: participants[0].userId,
    createdAt: now - 5 * MIN,
    expiresAt: now + minsLeft * MIN,
    status: "open",
    participants,
  };
}

/** Initial demo state: a few bot-hosted requests so lobbies aren't empty. */
export function seedState(now: number): AppState {
  return {
    demo: { botsPaused: false, botWontAccept: false },
    requests: [
      seedRequest("seed-slice-1", "slice-house", "hall-a", now, 25, [
        bot("Aisha", [{ itemId: "pepperoni", qty: 1 }, { itemId: "cola", qty: 1 }]),
        bot("Tom", [{ itemId: "margherita", qty: 1 }]),
      ]),
      seedRequest("seed-slice-2", "slice-house", "library", now, 50, [
        bot("Mei", [{ itemId: "veggie", qty: 1 }, { itemId: "garlic-bread", qty: 1 }]),
      ]),
      seedRequest("seed-wok-1", "wok-this-way", "su", now, 40, [
        bot("Kwame", [{ itemId: "chow-mein", qty: 1 }, { itemId: "spring-rolls", qty: 1 }]),
        bot("Sophie", [{ itemId: "tofu", qty: 1 }, { itemId: "egg-rice", qty: 1 }]),
      ]),
      seedRequest("seed-curry-1", "curry-corner", "hall-b", now, 12, [
        bot("Omar", [{ itemId: "tikka", qty: 1 }, { itemId: "naan", qty: 1 }]),
      ]),
    ],
  };
}
