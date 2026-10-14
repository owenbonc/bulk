import { describe, expect, it } from "vitest";
import { CATALOG } from "./data";
import { ACCEPT_WINDOW_MS, DELIVERY_STAGES, type Action, queueTotal, reduce } from "./requests";
import type { AppState, OrderRequest } from "./types";

const T0 = 1_000_000;
const me = { userId: "me", name: "You" };
const bob = { userId: "bot-bob", name: "Bob", isBot: true };
const pizza = CATALOG.restaurants.find((r) => r.id === "slice-house")!; // £40 threshold

const empty: AppState = { requests: [], demo: { botsPaused: false, botWontAccept: false } };

function run(state: AppState, ...actions: Action[]): AppState {
  return actions.reduce((s, a) => reduce(s, a, CATALOG), state);
}

function req(state: AppState, id = "r1"): OrderRequest {
  return state.requests.find((r) => r.id === id)!;
}

const create: Action = {
  type: "CREATE_REQUEST",
  id: "r1",
  restaurantId: "slice-house",
  pickupPointId: "hall-a",
  durationMin: 15,
  user: me,
  now: T0,
};

/** Adds `qty` margheritas (£9 each) to a user's basket. */
function addMargheritas(userId: string, qty: number): Action[] {
  return Array.from({ length: qty }, () => ({ type: "ADD_ITEM", requestId: "r1", userId, itemId: "margherita" }) as Action);
}

/** Request where me (£18) and bob (£27) are both finalised: £45 ≥ £40 threshold. */
function dealState(): AppState {
  return run(
    empty,
    create,
    ...addMargheritas("me", 2),
    { type: "FINALISE_ENTRY", requestId: "r1", userId: "me", now: T0 + 1000 },
    { type: "JOIN", requestId: "r1", user: bob },
    ...addMargheritas("bot-bob", 3),
    { type: "FINALISE_ENTRY", requestId: "r1", userId: "bot-bob", now: T0 + 2000 },
  );
}

describe("CREATE_REQUEST", () => {
  it("makes the creator host with chosen pickup point and duration", () => {
    const r = req(run(empty, create));
    expect(r.hostId).toBe("me");
    expect(r.pickupPointId).toBe("hall-a");
    expect(r.expiresAt).toBe(T0 + 15 * 60_000);
    expect(r.status).toBe("open");
    expect(r.participants.map((p) => p.userId)).toEqual(["me"]);
  });
});

describe("JOIN / LEAVE", () => {
  it("adds a participant once only", () => {
    const s = run(empty, create, { type: "JOIN", requestId: "r1", user: bob }, { type: "JOIN", requestId: "r1", user: bob });
    expect(req(s).participants).toHaveLength(2);
  });

  it("lets a non-host leave while open, but not the host", () => {
    const s = run(
      empty,
      create,
      { type: "JOIN", requestId: "r1", user: bob },
      { type: "LEAVE", requestId: "r1", userId: "bot-bob" },
      { type: "LEAVE", requestId: "r1", userId: "me" },
    );
    expect(req(s).participants.map((p) => p.userId)).toEqual(["me"]);
  });
});

describe("basket", () => {
  it("adds and removes items, and locks after finalising", () => {
    let s = run(empty, create, ...addMargheritas("me", 2), { type: "REMOVE_ITEM", requestId: "r1", userId: "me", itemId: "margherita" });
    expect(req(s).participants[0].basket).toEqual([{ itemId: "margherita", qty: 1 }]);

    s = run(s, { type: "FINALISE_ENTRY", requestId: "r1", userId: "me", now: T0 }, ...addMargheritas("me", 1));
    expect(req(s).participants[0].basket).toEqual([{ itemId: "margherita", qty: 1 }]);
  });

  it("cannot finalise an empty basket", () => {
    const s = run(empty, create, { type: "FINALISE_ENTRY", requestId: "r1", userId: "me", now: T0 });
    expect(req(s).participants[0].finalised).toBe(false);
  });
});

describe("deal threshold", () => {
  it("counts only finalised baskets", () => {
    const s = run(
      empty,
      create,
      ...addMargheritas("me", 2),
      { type: "FINALISE_ENTRY", requestId: "r1", userId: "me", now: T0 },
      { type: "JOIN", requestId: "r1", user: bob },
      ...addMargheritas("bot-bob", 5), // £45 but not finalised
    );
    expect(queueTotal(req(s), pizza)).toBe(1800);
    expect(req(s).status).toBe("open");
  });

  it("achieves the deal when finalised total reaches the threshold and opens an accept window", () => {
    const r = req(dealState());
    expect(r.status).toBe("deal_achieved");
    expect(r.acceptDeadline).toBe(T0 + 2000 + ACCEPT_WINDOW_MS);
  });

  it("drops participants who had not finalised when the deal locks", () => {
    const s = run(
      empty,
      create,
      ...addMargheritas("me", 2),
      { type: "FINALISE_ENTRY", requestId: "r1", userId: "me", now: T0 },
      { type: "JOIN", requestId: "r1", user: { userId: "bot-x", name: "X", isBot: true } },
      { type: "JOIN", requestId: "r1", user: bob },
      ...addMargheritas("bot-bob", 3),
      { type: "FINALISE_ENTRY", requestId: "r1", userId: "bot-bob", now: T0 },
    );
    expect(req(s).participants.map((p) => p.userId)).toEqual(["me", "bot-bob"]);
  });

  it("rejects joining once the deal is achieved", () => {
    const s = run(dealState(), { type: "JOIN", requestId: "r1", user: { userId: "late", name: "Late" } });
    expect(req(s).participants).toHaveLength(2);
  });
});

describe("expiry", () => {
  it("expires an open request when its time runs out", () => {
    const s = run(empty, create, { type: "TICK", now: T0 + 15 * 60_000 });
    expect(req(s).status).toBe("expired");
  });

  it("SET_EXPIRY moves the deadline (demo fast-forward)", () => {
    const s = run(empty, create, { type: "SET_EXPIRY", requestId: "r1", expiresAt: T0 + 5000 }, { type: "TICK", now: T0 + 5000 });
    expect(req(s).status).toBe("expired");
  });
});

describe("accept and pay", () => {
  it("confirms once everyone has paid and issues a 4-digit PIN", () => {
    const s = run(
      dealState(),
      { type: "ACCEPT_AND_PAY", requestId: "r1", userId: "me", now: T0 + 3000 },
      { type: "ACCEPT_AND_PAY", requestId: "r1", userId: "bot-bob", now: T0 + 4000 },
    );
    const r = req(s);
    expect(r.status).toBe("confirmed");
    expect(r.confirmedAt).toBe(T0 + 4000);
    expect(r.pin).toMatch(/^\d{4}$/);
  });

  it("cancels the whole order if anyone has not paid by the deadline", () => {
    const s = run(dealState(), { type: "ACCEPT_AND_PAY", requestId: "r1", userId: "me", now: T0 + 3000 }, {
      type: "TICK",
      now: T0 + 2000 + ACCEPT_WINDOW_MS,
    });
    expect(req(s).status).toBe("cancelled");
  });

  it("ignores payment outside the accept window", () => {
    const s = run(empty, create, { type: "ACCEPT_AND_PAY", requestId: "r1", userId: "me", now: T0 });
    expect(req(s).participants[0].paid).toBe(false);
  });
});

describe("delivery", () => {
  it("advances through the delivery stages on TICK", () => {
    let s = run(
      dealState(),
      { type: "ACCEPT_AND_PAY", requestId: "r1", userId: "me", now: T0 },
      { type: "ACCEPT_AND_PAY", requestId: "r1", userId: "bot-bob", now: T0 },
    );
    for (const stage of DELIVERY_STAGES) {
      s = run(s, { type: "TICK", now: T0 + stage.afterMs });
      expect(req(s).status).toBe(stage.status);
    }
  });
});
