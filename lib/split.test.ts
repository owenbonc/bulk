import { describe, expect, it } from "vitest";
import { CATALOG } from "./data";
import { splitCosts } from "./split";
import type { OrderRequest, Participant } from "./types";

const pizza = CATALOG.restaurants.find((r) => r.id === "slice-house")!; // 20% off, £3.99 delivery

function p(userId: string, basket: Participant["basket"]): Participant {
  return { userId, name: userId, isBot: false, basket, finalised: true, paid: false };
}

function request(participants: Participant[]): OrderRequest {
  return {
    id: "r1",
    restaurantId: pizza.id,
    pickupPointId: "hall-a",
    hostId: participants[0].userId,
    createdAt: 0,
    expiresAt: 1,
    status: "deal_achieved",
    participants,
  };
}

describe("splitCosts", () => {
  it("splits discount by items and delivery equally", () => {
    const split = splitCosts(
      request([p("a", [{ itemId: "margherita", qty: 2 }]), p("b", [{ itemId: "margherita", qty: 2 }])]),
      pizza,
    );
    // £36 group subtotal, 20% = £7.20 discount, £3.99 delivery
    expect(split.group).toEqual({ subtotal: 3600, discount: 720, delivery: 399, total: 3279 });
    expect(split.people.a).toMatchObject({ subtotal: 1800, discount: 360 });
    expect(split.people.a.delivery + split.people.b.delivery).toBe(399);
  });

  it("per-person totals always add up to the group total (no rounding loss)", () => {
    const split = splitCosts(
      request([
        p("a", [{ itemId: "pepperoni", qty: 1 }]),
        p("b", [{ itemId: "cola", qty: 1 }]),
        p("c", [{ itemId: "garlic-bread", qty: 1 }, { itemId: "veggie", qty: 1 }]),
      ]),
      pizza,
    );
    const people = Object.values(split.people);
    for (const key of ["subtotal", "discount", "delivery", "total"] as const) {
      expect(people.reduce((sum, x) => sum + x[key], 0)).toBe(split.group[key]);
    }
  });

  it("ignores participants who have not finalised", () => {
    const notFinal = { ...p("b", [{ itemId: "margherita", qty: 5 }]), finalised: false };
    const split = splitCosts(request([p("a", [{ itemId: "margherita", qty: 1 }]), notFinal]), pizza);
    expect(split.group.subtotal).toBe(900);
    expect(split.people.b).toBeUndefined();
  });
});
