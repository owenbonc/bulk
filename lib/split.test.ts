import { describe, expect, it } from "vitest";
import { CATALOG } from "./data";
import { basketCount, draftPreview, formatGBP, formatGBPShort, previewSplit, splitCosts } from "./split";
import type { OrderRequest, Participant } from "./types";

const pizza = CATALOG.restaurants.find((r) => r.id === "slice-house")!; // 20% off a £40 order, £3.49 delivery, margherita £10.50

function p(userId: string, basket: Participant["basket"], finalised = true): Participant {
  return { userId, name: userId, isBot: false, basket, finalised, paid: false, cutlery: false };
}

function request(participants: Participant[]): OrderRequest {
  return {
    id: "r1",
    restaurantId: pizza.id,
    pickupPointId: "student-centre",
    hostId: participants[0].userId,
    createdAt: 0,
    expiresAt: 1,
    status: "open",
    participants,
    round: 1,
    removedUserIds: [],
    removedNames: [],
    attempt: 1,
    released: [],
  };
}

describe("splitCosts", () => {
  it("splits discount by items and delivery equally", () => {
    const split = splitCosts(
      request([p("a", [{ itemId: "sh-margherita", qty: 2 }]), p("b", [{ itemId: "sh-margherita", qty: 2 }])]),
      pizza,
    );
    // £42 group subtotal, 20% = £8.40 discount, £3.49 delivery
    expect(split.group).toEqual({ subtotal: 4200, discount: 840, delivery: 349, total: 3709 });
    expect(split.people.a).toMatchObject({ subtotal: 2100, discount: 420 });
    expect(split.people.a.delivery + split.people.b.delivery).toBe(349);
  });

  it("per-person totals always add up to the group total (no rounding loss)", () => {
    const split = splitCosts(
      request([
        p("a", [{ itemId: "sh-pepperoni", qty: 1 }]),
        p("b", [{ itemId: "sh-cola", qty: 1 }]),
        p("c", [{ itemId: "sh-garlic-knots", qty: 1 }, { itemId: "sh-funghi", qty: 1 }]),
      ]),
      pizza,
    );
    const people = Object.values(split.people);
    for (const key of ["subtotal", "discount", "delivery", "total"] as const) {
      expect(people.reduce((sum, x) => sum + x[key], 0)).toBe(split.group[key]);
    }
  });

  it("ignores participants who have not finalised", () => {
    const split = splitCosts(request([p("a", [{ itemId: "sh-margherita", qty: 1 }]), p("b", [{ itemId: "sh-margherita", qty: 5 }], false)]), pizza);
    expect(split.group.subtotal).toBe(1050);
    expect(split.people.b).toBeUndefined();
  });
});

describe("previewSplit", () => {
  const party = request([p("bob", [{ itemId: "sh-margherita", qty: 2 }]), p("me", [], false)]);

  it("prices your basket as if it were finalised, with delivery shared (no discount until the party reaches £40)", () => {
    const preview = previewSplit(party, pizza, "me", [{ itemId: "sh-margherita", qty: 1 }]);
    expect(preview.members).toBe(2);
    expect(preview.subtotal).toBe(1050);
    // £31.50 < £40: the deal doesn't apply yet.
    expect(preview.discountEligible).toBe(false);
    expect(preview.discount).toBe(0);
    expect(preview.delivery).toBe(174);
    expect(preview.total).toBe(1050 + 174);
    expect(preview.people.me.total).toBe(preview.total);
    expect(preview.group.subtotal).toBe(3150);
  });

  it("applies the discount once your basket takes the party to the threshold", () => {
    const preview = previewSplit(party, pizza, "me", [{ itemId: "sh-margherita", qty: 2 }]);
    expect(preview.group.subtotal).toBe(4200);
    expect(preview.discountEligible).toBe(true);
    expect(preview.discount).toBe(420);
    expect(preview.total).toBe(2100 - 420 + 174);
  });

  it("reports the party's progress including your basket, and your share of the threshold", () => {
    const preview = previewSplit(party, pizza, "me", [{ itemId: "sh-margherita", qty: 1 }]);
    expect(preview.progress).toEqual({ total: 3150, target: 4000, left: 850, pct: 78 });
    expect(preview.share).toBeCloseTo(1050 / 4000);
  });

  it("works when you haven't joined yet, and previews an empty basket as zero", () => {
    const outsider = request([p("bob", [{ itemId: "sh-margherita", qty: 2 }])]);
    expect(previewSplit(outsider, pizza, "me", [{ itemId: "sh-cola", qty: 1 }]).members).toBe(2);
    const empty = previewSplit(outsider, pizza, "me", []);
    expect(empty).toMatchObject({ subtotal: 0, total: 0, members: 1, share: 0 });
    expect(empty.progress.total).toBe(2100);
  });
});

describe("draftPreview", () => {
  it("prices the host's draft as a party of one", () => {
    const preview = draftPreview(
      { restaurantId: pizza.id, pickupPointId: "student-centre", durationMin: 15, basket: [{ itemId: "sh-margherita", qty: 2 }], cutlery: false },
      pizza,
    );
    // £21 alone is below the £40 threshold: no discount yet, full delivery.
    expect(preview).toMatchObject({ subtotal: 2100, discount: 0, delivery: 349, total: 2449, members: 1, discountEligible: false });
    expect(preview.progress).toMatchObject({ total: 2100, left: 1900, pct: 52 });
  });
});

describe("formatting", () => {
  it("formats pence as pounds", () => {
    expect(formatGBP(729)).toBe("£7.29");
    expect(formatGBP(4000)).toBe("£40.00");
    expect(formatGBPShort(4000)).toBe("£40");
    expect(formatGBPShort(725)).toBe("£7.25");
  });

  it("counts items in a basket", () => {
    expect(basketCount([{ itemId: "a", qty: 2 }, { itemId: "b", qty: 1 }])).toBe(3);
  });
});
