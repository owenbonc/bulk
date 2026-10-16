import { describe, expect, it } from "vitest";
import { CATALOG, DEFAULT_DEMO, DEFAULT_LOCATION, seedState, STATE_VERSION } from "./data";
import {
  ACCEPT_WINDOW_MS,
  CANCEL_REASONS,
  DELIVERY_STAGES,
  checkHandover,
  splitCosts,
  type Action,
  deliveryProgress,
  hasCollected,
  isActiveFor,
  isHighlight,
  notificationsFor,
  openPartyFor,
  parseSaved,
  pendingAlerts,
  progressOf,
  READY_LINGER_MS,
  queueTotal,
  reduce,
  stubbornBot,
  unreadCount,
} from "./requests";
import type { AppState, OrderRequest } from "./types";

const T0 = 1_000_000;
const me = { userId: "me", name: "You" };
const bob = { userId: "bot-bob", name: "Bob", isBot: true };
const carl = { userId: "bot-carl", name: "Carl", isBot: true };
const pizza = CATALOG.restaurants.find((r) => r.id === "slice-house")!; // 20% off a £40 order, margherita £10.50

function emptyState(demo: Partial<AppState["demo"]> = {}): AppState {
  return {
    version: STATE_VERSION,
    requests: [],
    demo: { ...DEFAULT_DEMO, ...demo },
    friends: [],
    seenAlerts: [],
    location: DEFAULT_LOCATION,
    readNotifications: [],
  };
}

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
  pickupPointId: "student-centre",
  durationMin: 15,
  user: me,
  now: T0,
};

/** Adds `qty` margheritas (£10.50 each) to a user's basket. */
function margheritas(userId: string, qty: number): Action[] {
  return Array.from({ length: qty }, () => ({ type: "ADD_ITEM", requestId: "r1", userId, itemId: "sh-margherita" }) as Action);
}

function finalise(userId: string, now = T0 + 1000): Action {
  return { type: "FINALISE_ENTRY", requestId: "r1", userId, now };
}

/** Accept and pay the given round (1 unless it's the fallback round). */
function pay(userId: string, now: number, round: 1 | 2 = 1): Action {
  return { type: "ACCEPT_AND_PAY", requestId: "r1", userId, round, now };
}

function decline(userId: string, now: number, round: 1 | 2 = 1): Action {
  return { type: "DECLINE", requestId: "r1", userId, round, now };
}

const DEAL_AT = T0 + 2000;

/** me £21 + bob £31.50 = £52.50 ≥ £40: deal reached at DEAL_AT with two members. */
function dealState(): AppState {
  return run(
    emptyState(),
    create,
    ...margheritas("me", 2),
    finalise("me"),
    { type: "JOIN", requestId: "r1", user: bob },
    ...margheritas("bot-bob", 3),
    finalise("bot-bob", DEAL_AT),
  );
}

/**
 * me £10.50 + bob £21 + carl £42 = £73.50. Without bob the party still has £52.50 (round 2
 * possible); without carl it has £31.50 (below the threshold).
 */
function threeWayDeal(): AppState {
  return run(
    emptyState(),
    create,
    ...margheritas("me", 1),
    finalise("me"),
    { type: "JOIN", requestId: "r1", user: bob },
    ...margheritas("bot-bob", 2),
    finalise("bot-bob"),
    { type: "JOIN", requestId: "r1", user: carl },
    ...margheritas("bot-carl", 4),
    finalise("bot-carl", DEAL_AT),
  );
}

describe("CREATE_REQUEST", () => {
  it("makes the creator host with chosen pickup point and duration", () => {
    const r = req(run(emptyState(), create));
    expect(r.hostId).toBe("me");
    expect(r.pickupPointId).toBe("student-centre");
    expect(r.expiresAt).toBe(T0 + 15 * 60_000);
    expect(r.status).toBe("open");
    expect(r.round).toBe(1);
    expect(r.removedUserIds).toEqual([]);
    expect(r.participants.map((p) => p.userId)).toEqual(["me"]);
    expect(r.participants[0].cutlery).toBe(false);
  });
});

describe("one party per restaurant per collection point", () => {
  it("openPartyFor finds the open party at that point only, and nothing once it has ended", () => {
    let s = run(emptyState(), create);
    expect(openPartyFor(s, "slice-house", "student-centre")?.id).toBe("r1");
    expect(openPartyFor(s, "slice-house", "main-library")).toBeUndefined();
    expect(openPartyFor(s, "burger-yard", "student-centre")).toBeUndefined();
    s = run(s, { type: "TICK", now: T0 + 15 * 60_000 });
    expect(openPartyFor(s, "slice-house", "student-centre")).toBeUndefined();
  });

  it("refuses a second party at a restaurant that already has an open one at the same point", () => {
    const s = run(emptyState(), create, { ...create, id: "r2", user: bob } as Action);
    expect(s.requests.map((r) => r.id)).toEqual(["r1"]);
  });

  it("allows a party at the same restaurant at another collection point", () => {
    const s = run(emptyState(), create, { ...create, id: "r2", user: bob, pickupPointId: "ramsay-hall" } as Action);
    expect(s.requests.map((r) => [r.id, r.pickupPointId])).toEqual([
      ["r1", "student-centre"],
      ["r2", "ramsay-hall"],
    ]);
    expect(openPartyFor(s, "slice-house", "ramsay-hall")?.id).toBe("r2");
  });

  it("allows a new party once the previous one is no longer open", () => {
    const s = run(dealState(), { ...create, id: "r2" } as Action);
    expect(s.requests.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("CREATE_FROM_DRAFT is a no-op while the restaurant has an open party at the draft's point, and keeps the draft", () => {
    const s = run(
      emptyState(),
      { ...create, user: bob } as Action,
      { type: "DRAFT_START", restaurantId: "slice-house" },
      { type: "DRAFT_ITEM", itemId: "sh-margherita", delta: 1 },
      { type: "CREATE_FROM_DRAFT", id: "mine", user: me, now: T0 },
    );
    expect(s.requests.map((r) => r.id)).toEqual(["r1"]);
    expect(s.draft?.basket).toEqual([{ itemId: "sh-margherita", qty: 1 }]);
  });

  it("creates at a point without a party even when the restaurant has one elsewhere", () => {
    // Kumo Ramen collects at Ramsay Hall in the seed, but not at the Student Centre (your default location).
    const seeded = seedState(T0);
    expect(openPartyFor(seeded, "kumo-ramen", "ramsay-hall")?.id).toBe("seed-kumo-ramen-ramsay-hall");
    expect(openPartyFor(seeded, "kumo-ramen", "student-centre")).toBeUndefined();
    const s = run(
      seeded,
      { type: "DRAFT_START", restaurantId: "kumo-ramen" },
      { type: "DRAFT_ITEM", itemId: "kr-tonkotsu", delta: 1 },
      { type: "CREATE_FROM_DRAFT", id: "mine", user: me, now: T0 },
    );
    expect(req(s, "mine")).toMatchObject({ restaurantId: "kumo-ramen", pickupPointId: "student-centre", hostId: "me" });
    expect(openPartyFor(s, "kumo-ramen", "ramsay-hall")?.id).toBe("seed-kumo-ramen-ramsay-hall");
  });

  it("refuses to create at a point that already has a party for the restaurant, keeping the draft to move", () => {
    let s = run(
      seedState(T0),
      { type: "DRAFT_START", restaurantId: "kumo-ramen" },
      { type: "DRAFT_ITEM", itemId: "kr-tonkotsu", delta: 1 },
      { type: "DRAFT_SET", pickupPointId: "ramsay-hall" },
      { type: "CREATE_FROM_DRAFT", id: "mine", user: me, now: T0 },
    );
    expect(s.requests.some((r) => r.id === "mine")).toBe(false);
    expect(s.draft).toMatchObject({ pickupPointId: "ramsay-hall", basket: [{ itemId: "kr-tonkotsu", qty: 1 }] });
    s = run(s, { type: "DRAFT_SET", pickupPointId: "main-library" }, { type: "CREATE_FROM_DRAFT", id: "mine", user: me, now: T0 });
    expect(req(s, "mine").pickupPointId).toBe("main-library");
  });

  it("CREATE_REQUEST also follows the per-point rule", () => {
    const at = (pickupPointId: string, id: string): Action => ({ ...create, id, restaurantId: "kumo-ramen", pickupPointId } as Action);
    const s = run(seedState(T0), at("ramsay-hall", "x1"), at("student-centre", "x2"));
    expect(s.requests.some((r) => r.id === "x1")).toBe(false);
    expect(req(s, "x2").pickupPointId).toBe("student-centre");
  });

  it("the seed has at most one open party per restaurant at each point", () => {
    const keys = seedState(T0).requests.map((r) => `${r.restaurantId}@${r.pickupPointId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("draft → CREATE_FROM_DRAFT", () => {
  it("starts a draft at your current location with a 15 minute party", () => {
    const s = run(emptyState(), { type: "SET_LOCATION", pickupPointId: "ramsay-hall" }, { type: "DRAFT_START", restaurantId: "kumo-ramen" });
    expect(s.draft).toEqual({ restaurantId: "kumo-ramen", pickupPointId: "ramsay-hall", durationMin: 15, basket: [], cutlery: false });
  });

  it("keeps the draft when restarting the same restaurant and replaces it for another", () => {
    let s = run(emptyState(), { type: "DRAFT_START", restaurantId: "kumo-ramen" }, { type: "DRAFT_ITEM", itemId: "kr-miso", delta: 1 });
    s = run(s, { type: "DRAFT_START", restaurantId: "kumo-ramen" });
    expect(s.draft?.basket).toHaveLength(1);
    s = run(s, { type: "DRAFT_START", restaurantId: "levant-kitchen" });
    expect(s.draft).toMatchObject({ restaurantId: "levant-kitchen", basket: [] });
  });

  it("edits the draft basket and settings, ignoring items from other menus", () => {
    const s = run(
      emptyState(),
      { type: "DRAFT_START", restaurantId: "kumo-ramen" },
      { type: "DRAFT_ITEM", itemId: "kr-miso", delta: 1 },
      { type: "DRAFT_ITEM", itemId: "kr-miso", delta: 1 },
      { type: "DRAFT_ITEM", itemId: "kr-gyoza", delta: 1 },
      { type: "DRAFT_ITEM", itemId: "kr-gyoza", delta: -1 },
      { type: "DRAFT_ITEM", itemId: "sh-margherita", delta: 1 },
      { type: "DRAFT_SET", pickupPointId: "main-library", durationMin: 30, cutlery: true },
      { type: "DRAFT_SET", pickupPointId: "nowhere" },
    );
    expect(s.draft).toEqual({
      restaurantId: "kumo-ramen",
      pickupPointId: "main-library",
      durationMin: 30,
      basket: [{ itemId: "kr-miso", qty: 2 }],
      cutlery: true,
    });
  });

  it("creates the party with the host's basket finalised and clears the draft", () => {
    const s = run(
      emptyState(),
      { type: "DRAFT_START", restaurantId: "kumo-ramen" },
      { type: "DRAFT_ITEM", itemId: "kr-tonkotsu", delta: 1 },
      { type: "DRAFT_SET", pickupPointId: "ioe-bedford-way", durationMin: 10, cutlery: true },
      { type: "CREATE_FROM_DRAFT", id: "p1", user: me, now: T0 },
    );
    const r = req(s, "p1");
    expect(s.draft).toBeUndefined();
    expect(r).toMatchObject({ restaurantId: "kumo-ramen", pickupPointId: "ioe-bedford-way", hostId: "me", status: "open", expiresAt: T0 + 10 * 60_000 });
    expect(r.participants).toEqual([
      { userId: "me", name: "You", isBot: false, basket: [{ itemId: "kr-tonkotsu", qty: 1 }], finalised: true, paid: false, cutlery: true },
    ]);
    expect(openPartyFor(s, "kumo-ramen", "ioe-bedford-way")?.id).toBe("p1");
  });

  it("refuses an empty draft basket", () => {
    const s = run(emptyState(), { type: "DRAFT_START", restaurantId: "kumo-ramen" }, { type: "CREATE_FROM_DRAFT", id: "p1", user: me, now: T0 });
    expect(s.requests).toHaveLength(0);
    expect(s.draft).toBeDefined();
  });

  it("reaches the deal straight away if the host's basket alone meets the threshold", () => {
    const s = run(
      emptyState(),
      { type: "DRAFT_START", restaurantId: "kumo-ramen" },
      { type: "DRAFT_ITEM", itemId: "kr-tonkotsu", delta: 3 },
      { type: "CREATE_FROM_DRAFT", id: "p1", user: me, now: T0 },
    );
    expect(req(s, "p1")).toMatchObject({ status: "deal_achieved", dealAt: T0, acceptDeadline: T0 + ACCEPT_WINDOW_MS });
  });

  it("DRAFT_CLEAR discards the draft", () => {
    const s = run(emptyState(), { type: "DRAFT_START", restaurantId: "kumo-ramen" }, { type: "DRAFT_CLEAR" });
    expect(s.draft).toBeUndefined();
  });
});

describe("JOIN / LEAVE", () => {
  it("adds a participant once only", () => {
    const s = run(emptyState(), create, { type: "JOIN", requestId: "r1", user: bob }, { type: "JOIN", requestId: "r1", user: bob });
    expect(req(s).participants).toHaveLength(2);
  });

  it("lets a non-host leave while open", () => {
    const s = run(emptyState(), create, { type: "JOIN", requestId: "r1", user: bob }, { type: "LEAVE", requestId: "r1", userId: "bot-bob" });
    expect(req(s).participants.map((p) => p.userId)).toEqual(["me"]);
  });

  it("the host can leave too; the party stays open for the rest with the same collection point", () => {
    let s = run(emptyState(), create, ...margheritas("me", 1), finalise("me"), { type: "JOIN", requestId: "r1", user: bob }, ...margheritas("bot-bob", 1), finalise("bot-bob"));
    s = run(s, { type: "LEAVE", requestId: "r1", userId: "me" });
    expect(req(s)).toMatchObject({ status: "open", hostId: "me", pickupPointId: "student-centre" });
    expect(req(s).participants.map((p) => p.userId)).toEqual(["bot-bob"]);
    // Delivery is now shared by one order, not two.
    expect(splitCosts(req(s), pizza).people["bot-bob"].delivery).toBe(pizza.deliveryFee);
  });

  it("after the host leaves, others can still join and reach the deal", () => {
    let s = run(emptyState(), create, ...margheritas("me", 1), finalise("me"), { type: "LEAVE", requestId: "r1", userId: "me" });
    expect(req(s)).toMatchObject({ status: "open", participants: [] });
    s = run(s, { type: "JOIN", requestId: "r1", user: bob }, ...margheritas("bot-bob", 4), finalise("bot-bob", DEAL_AT));
    expect(req(s)).toMatchObject({ status: "deal_achieved", round: 1 });
  });

  it("a party the host left still holds its restaurant's spot at that collection point", () => {
    const s = run(emptyState(), create, ...margheritas("me", 1), finalise("me"), { type: "LEAVE", requestId: "r1", userId: "me" });
    expect(openPartyFor(s, "slice-house", "student-centre")?.id).toBe("r1");
    expect(run(s, { ...create, id: "r2" } as Action).requests.map((r) => r.id)).toEqual(["r1"]);
  });

  it("anyone can leave after finalising, while the party is still filling", () => {
    const s = run(emptyState(), create, { type: "JOIN", requestId: "r1", user: bob }, ...margheritas("bot-bob", 1), finalise("bot-bob"), {
      type: "LEAVE",
      requestId: "r1",
      userId: "bot-bob",
    });
    expect(req(s).participants.map((p) => p.userId)).toEqual(["me"]);
  });

  it("nobody can leave once the deal is reached or the order is placed", () => {
    let s = run(dealState(), { type: "LEAVE", requestId: "r1", userId: "me" });
    expect(req(s).participants).toHaveLength(2);
    s = run(s, pay("me", DEAL_AT + 1000), pay("bot-bob", DEAL_AT + 1000), { type: "LEAVE", requestId: "r1", userId: "me" });
    expect(req(s)).toMatchObject({ status: "confirmed" });
    expect(req(s).participants).toHaveLength(2);
  });
});

describe("basket", () => {
  it("adds and removes items, and locks after finalising", () => {
    let s = run(emptyState(), create, ...margheritas("me", 2), { type: "REMOVE_ITEM", requestId: "r1", userId: "me", itemId: "sh-margherita" });
    expect(req(s).participants[0].basket).toEqual([{ itemId: "sh-margherita", qty: 1 }]);

    s = run(s, finalise("me"), ...margheritas("me", 1), { type: "REMOVE_ITEM", requestId: "r1", userId: "me", itemId: "sh-margherita" });
    expect(req(s).participants[0].basket).toEqual([{ itemId: "sh-margherita", qty: 1 }]);
  });

  it("ignores items that are not on this restaurant's menu", () => {
    const s = run(emptyState(), create, { type: "ADD_ITEM", requestId: "r1", userId: "me", itemId: "kr-miso" });
    expect(req(s).participants[0].basket).toEqual([]);
  });

  it("cannot finalise an empty basket", () => {
    const s = run(emptyState(), create, finalise("me"));
    expect(req(s).participants[0].finalised).toBe(false);
  });

  it("removing the last item of an unfinalised guest takes them out of the party", () => {
    const s = run(
      emptyState(),
      create,
      { type: "JOIN", requestId: "r1", user: bob },
      ...margheritas("bot-bob", 1),
      { type: "REMOVE_ITEM", requestId: "r1", userId: "bot-bob", itemId: "sh-margherita" },
    );
    expect(req(s).participants.map((p) => p.userId)).toEqual(["me"]);
  });

  it("the host is treated like anyone when their basket empties: they leave and the party stays open", () => {
    const s = run(emptyState(), create, ...margheritas("me", 1), { type: "REMOVE_ITEM", requestId: "r1", userId: "me", itemId: "sh-margherita" });
    expect(req(s)).toMatchObject({ status: "open", participants: [] });
  });

  it("stores cutlery per participant", () => {
    const s = run(emptyState(), create, { type: "JOIN", requestId: "r1", user: bob }, { type: "SET_CUTLERY", requestId: "r1", userId: "bot-bob", cutlery: true });
    expect(req(s).participants.map((p) => p.cutlery)).toEqual([false, true]);
  });
});

describe("deal threshold", () => {
  it("counts only finalised baskets", () => {
    const s = run(
      emptyState(),
      create,
      ...margheritas("me", 2),
      finalise("me"),
      { type: "JOIN", requestId: "r1", user: bob },
      ...margheritas("bot-bob", 5), // £52.50 but not finalised
    );
    expect(queueTotal(req(s), pizza)).toBe(2100);
    expect(progressOf(req(s), pizza)).toEqual({ total: 2100, target: 4000, left: 1900, pct: 52 });
    expect(req(s).status).toBe("open");
  });

  it("reaches the deal when finalised spend meets the threshold and opens round 1", () => {
    const r = req(dealState());
    expect(r).toMatchObject({ status: "deal_achieved", round: 1, dealAt: DEAL_AT, acceptDeadline: DEAL_AT + ACCEPT_WINDOW_MS });
  });

  it("drops participants who had not finalised when the deal locks", () => {
    const s = run(
      emptyState(),
      create,
      ...margheritas("me", 2),
      finalise("me"),
      { type: "JOIN", requestId: "r1", user: { userId: "bot-x", name: "X", isBot: true } },
      { type: "JOIN", requestId: "r1", user: bob },
      ...margheritas("bot-bob", 3),
      finalise("bot-bob"),
    );
    expect(req(s).participants.map((p) => p.userId)).toEqual(["me", "bot-bob"]);
  });

  it("rejects joining once the deal is reached", () => {
    const s = run(dealState(), { type: "JOIN", requestId: "r1", user: { userId: "late", name: "Late" } });
    expect(req(s).participants).toHaveLength(2);
  });
});

describe("expiry", () => {
  it("expires an open party when its time runs out, with a reason", () => {
    const s = run(emptyState(), create, { type: "TICK", now: T0 + 15 * 60_000 });
    expect(req(s)).toMatchObject({ status: "expired", cancelReason: CANCEL_REASONS.expired, closedAt: T0 + 15 * 60_000 });
    expect(req(s).cancelReason).toBe("The deal wasn't reached before the timer ran out.");
  });

  it("SET_EXPIRY moves the deadline (demo fast-forward)", () => {
    const s = run(emptyState(), create, { type: "SET_EXPIRY", requestId: "r1", expiresAt: T0 + 5000 }, { type: "TICK", now: T0 + 5000 });
    expect(req(s).status).toBe("expired");
  });
});

describe("acceptance round", () => {
  it("confirms once everyone has paid and issues each person their own 4-digit pickup PIN", () => {
    const s = run(dealState(), pay("me", DEAL_AT + 1000), pay("bot-bob", DEAL_AT + 2000));
    const r = req(s);
    expect(r.status).toBe("confirmed");
    expect(r.confirmedAt).toBe(DEAL_AT + 2000);
    const codes = r.participants.map((p) => p.collectionCode);
    codes.forEach((c) => expect(c).toMatch(/^\d{4}$/));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("an answer for the wrong round is ignored, so consent never carries over to a new price", () => {
    expect(req(run(dealState(), pay("me", DEAL_AT + 1000, 2))).participants[0].paid).toBe(false);
    const round2 = run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("bot-bob", DEAL_AT + 3000));
    // A late round-1 acceptance (e.g. a stale bot decision) doesn't count in round 2.
    expect(req(run(round2, pay("bot-carl", DEAL_AT + 4000, 1))).participants.find((p) => p.userId === "bot-carl")!.paid).toBe(false);
  });

  it("repeated accept clicks change nothing", () => {
    const once = run(dealState(), pay("me", DEAL_AT + 1000));
    expect(run(once, pay("me", DEAL_AT + 1100), pay("me", DEAL_AT + 1200))).toEqual(once);
  });

  it("ignores payment outside the accept window", () => {
    expect(req(run(emptyState(), create, pay("me", T0))).participants[0].paid).toBe(false);
    expect(req(run(dealState(), pay("me", DEAL_AT + ACCEPT_WINDOW_MS))).participants[0].paid).toBe(false);
  });

  it("waits while anyone has neither paid nor declined", () => {
    const r = req(run(threeWayDeal(), pay("me", DEAL_AT + 1000), decline("bot-bob", DEAL_AT + 2000)));
    expect(r).toMatchObject({ status: "deal_achieved", round: 1 });
    expect(r.participants.find((p) => p.userId === "bot-bob")?.declined).toBe(true);
  });

  it("a decline resolves the round early once everyone else has paid", () => {
    const at = DEAL_AT + 3000;
    const r = req(run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("bot-bob", at)));
    expect(r).toMatchObject({ status: "deal_achieved", round: 2, acceptDeadline: at + ACCEPT_WINDOW_MS });
    expect(r.removedUserIds).toEqual(["bot-bob"]);
    expect(r.removedNames).toEqual(["Bob"]);
  });

  it("round 2 drops the decliners, resets payments and recomputes the delivery share", () => {
    const r = req(run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("bot-bob", DEAL_AT + 3000)));
    expect(r.participants.map((p) => [p.userId, p.paid])).toEqual([
      ["me", false],
      ["bot-carl", false],
    ]);
    expect(queueTotal(r, pizza)).toBe(1050 + 4200);
  });

  it("people who time out are removed too, starting round 2 at the deadline", () => {
    const deadline = DEAL_AT + ACCEPT_WINDOW_MS;
    const r = req(run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), { type: "TICK", now: deadline }));
    expect(r).toMatchObject({ status: "deal_achieved", round: 2, acceptDeadline: deadline + ACCEPT_WINDOW_MS, removedNames: ["Bob"] });
    expect(r.hostId).toBe("me");
  });

  it("the fallback round succeeds when everyone left pays", () => {
    const at = DEAL_AT + 3000;
    const s = run(
      threeWayDeal(),
      pay("me", DEAL_AT + 1000),
      pay("bot-carl", DEAL_AT + 2000),
      decline("bot-bob", at),
      pay("bot-carl", at + 1000, 2),
      pay("me", at + 2000, 2),
    );
    expect(req(s)).toMatchObject({ status: "confirmed", round: 2, confirmedAt: at + 2000 });
  });

  it("cancels instead of a fallback when the remaining spend is below the threshold", () => {
    const at = DEAL_AT + 3000;
    const r = req(run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-bob", DEAL_AT + 2000), decline("bot-carl", at)));
    expect(r).toMatchObject({ status: "cancelled", round: 1, cancelReason: CANCEL_REASONS.notEnoughAccepted, closedAt: at });
    expect(r.removedNames).toEqual(["Carl"]);
    // Nobody is charged, and everyone involved can still see the party.
    expect(r.participants.every((p) => !p.paid)).toBe(true);
    expect(r.participants).toHaveLength(3);
  });

  it("cancels when the accept window passes with nobody else paying", () => {
    const r = req(run(dealState(), pay("me", DEAL_AT + 1000), { type: "TICK", now: DEAL_AT + ACCEPT_WINDOW_MS }));
    expect(r).toMatchObject({ status: "cancelled", cancelReason: CANCEL_REASONS.notEnoughAccepted });
  });

  it("never runs a third round", () => {
    const at = DEAL_AT + 3000;
    const round2 = run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("bot-bob", at));

    const declined = req(run(round2, pay("me", at + 1000, 2), decline("bot-carl", at + 2000, 2)));
    expect(declined).toMatchObject({ status: "cancelled", round: 2, cancelReason: CANCEL_REASONS.secondRoundFailed });
    expect(declined.removedNames).toEqual(["Bob", "Carl"]);

    const timedOut = req(run(round2, pay("me", at + 1000, 2), { type: "TICK", now: at + ACCEPT_WINDOW_MS }));
    expect(timedOut).toMatchObject({ status: "cancelled", round: 2, cancelReason: CANCEL_REASONS.secondRoundFailed });
  });

  it("a decline in round 2 ends the attempt at once, without waiting for others", () => {
    const at = DEAL_AT + 3000;
    const round2 = run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("bot-bob", at));
    const r = req(run(round2, decline("bot-carl", at + 1000, 2)));
    expect(r).toMatchObject({ status: "cancelled", round: 2, closedAt: at + 1000 });
    // I hadn't answered round 2 yet: not a timeout, the group fell through.
    expect(r.released.find((e) => e.userId === "me")?.reason).toBe("group_fell_through");
  });

  it("a member who paid can't decline, and one who declined can't pay", () => {
    let s = run(threeWayDeal(), pay("me", DEAL_AT + 1000), decline("me", DEAL_AT + 1500));
    expect(req(s).participants[0]).toMatchObject({ paid: true });
    s = run(s, decline("bot-bob", DEAL_AT + 2000), pay("bot-bob", DEAL_AT + 2500));
    expect(req(s).participants.find((p) => p.userId === "bot-bob")).toMatchObject({ paid: false, declined: true });
  });

  /** Bob hosts (£10.50), then me (£10.50) and Carl (£42) join and finalise: deal at DEAL_AT. */
  function bobHostedDeal(): AppState {
    return run(
      emptyState(),
      { ...create, user: bob } as Action,
      ...margheritas("bot-bob", 1),
      finalise("bot-bob"),
      { type: "JOIN", requestId: "r1", user: me },
      ...margheritas("me", 1),
      finalise("me"),
      { type: "JOIN", requestId: "r1", user: carl },
      ...margheritas("bot-carl", 4),
      finalise("bot-carl", DEAL_AT),
    );
  }

  it("the host is just another member: if they decline and the rest still qualify, the rest get round 2", () => {
    const r = req(run(bobHostedDeal(), decline("bot-bob", DEAL_AT + 1000), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 1000)));
    expect(r).toMatchObject({ status: "deal_achieved", round: 2, hostId: "bot-bob" });
    expect(r.participants.map((p) => p.userId)).toEqual(["me", "bot-carl"]);
    expect(r.removedNames).toEqual(["Bob"]);
  });

  it("a host who times out is released like anyone else, and round 2 still runs", () => {
    const r = req(
      run(bobHostedDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 1000), { type: "TICK", now: DEAL_AT + ACCEPT_WINDOW_MS }),
    );
    expect(r).toMatchObject({ status: "deal_achieved", round: 2 });
    expect(r.released.find((e) => e.userId === "bot-bob")?.reason).toBe("timed_out");
  });

  it("a host dropping out of round 2 ends it the same way anyone's would", () => {
    const at = DEAL_AT + 3000;
    const round2 = run(bobHostedDeal(), pay("bot-bob", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("me", at));
    expect(req(round2)).toMatchObject({ status: "deal_achieved", round: 2, hostId: "bot-bob" });

    const declined = req(run(round2, pay("bot-carl", at + 1000, 2), decline("bot-bob", at + 2000, 2)));
    expect(declined).toMatchObject({ status: "cancelled", round: 2, cancelReason: CANCEL_REASONS.secondRoundFailed });
    expect(declined.participants.every((p) => !p.paid)).toBe(true);
  });
});

describe("FILL_PARTY", () => {
  it("bots join with baskets until the deal is reached", () => {
    const s = run(emptyState(), create, ...margheritas("me", 1), finalise("me"), { type: "FILL_PARTY", requestId: "r1", now: T0 + 5000 });
    const r = req(s);
    expect(r).toMatchObject({ status: "deal_achieved", dealAt: T0 + 5000, acceptDeadline: T0 + 5000 + ACCEPT_WINDOW_MS });
    expect(queueTotal(r, pizza)).toBeGreaterThanOrEqual(pizza.deal.minTotal);
    const bots = r.participants.filter((p) => p.isBot);
    expect(bots.length).toBeGreaterThan(0);
    expect(bots.every((p) => p.finalised && p.basket.length > 0)).toBe(true);
    expect(new Set(r.participants.map((p) => p.userId)).size).toBe(r.participants.length);
    expect(r.participants[0].userId).toBe("me");
  });

  it("locks in your basket if you're still choosing, so the deal includes you", () => {
    const s = run(
      seedState(T0),
      { type: "JOIN", requestId: "seed-slice-house-student-centre", user: me },
      { type: "ADD_ITEM", requestId: "seed-slice-house-student-centre", userId: "me", itemId: "sh-margherita" },
      { type: "FILL_PARTY", requestId: "seed-slice-house-student-centre", now: T0 },
    );
    const r = req(s, "seed-slice-house-student-centre");
    expect(r.status).toBe("deal_achieved");
    expect(r.participants.find((p) => p.userId === "me")).toMatchObject({ finalised: true, basket: [{ itemId: "sh-margherita", qty: 1 }] });
  });

  it("fills a seeded party you're not in", () => {
    const s = run(seedState(T0), { type: "FILL_PARTY", requestId: "seed-taqueria-verde-ioe-bedford-way", now: T0 });
    expect(req(s, "seed-taqueria-verde-ioe-bedford-way").status).toBe("deal_achieved");
  });

  it("with 'a bot won't accept' on, the deal survives the stubborn bot dropping out", () => {
    for (const restaurant of CATALOG.restaurants) {
      let s = run(
        emptyState({ botWontAccept: true }),
        { type: "DRAFT_START", restaurantId: restaurant.id },
        { type: "DRAFT_ITEM", itemId: restaurant.menu[0].id, delta: 1 },
        { type: "CREATE_FROM_DRAFT", id: "p1", user: me, now: T0 },
      );
      s = run(s, { type: "FILL_PARTY", requestId: "p1", now: T0 });
      const r = req(s, "p1");
      const stubborn = stubbornBot(r, restaurant)!;
      expect(r.status).toBe("deal_achieved");
      expect(stubborn.userId).not.toBe(r.hostId);
      const rest = { ...r, participants: r.participants.filter((p) => p !== stubborn) };
      expect(queueTotal(rest, restaurant)).toBeGreaterThanOrEqual(restaurant.deal.minTotal);
    }
  });

  it("with 'a bot won't accept' on, the stubborn bot is never a bot host", () => {
    const s = run(
      { ...seedState(T0), demo: { ...seedState(T0).demo, botWontAccept: true } },
      { type: "JOIN", requestId: "seed-slice-house-student-centre", user: me },
      { type: "ADD_ITEM", requestId: "seed-slice-house-student-centre", userId: "me", itemId: "sh-margherita" },
      { type: "FILL_PARTY", requestId: "seed-slice-house-student-centre", now: T0 },
    );
    const r = req(s, "seed-slice-house-student-centre");
    expect(r.participants.find((p) => p.userId === r.hostId)?.isBot).toBe(true);
    expect(stubbornBot(r, pizza)?.userId).not.toBe(r.hostId);
  });

  it("does nothing once the party is no longer open", () => {
    const s = dealState();
    expect(run(s, { type: "FILL_PARTY", requestId: "r1", now: T0 })).toBe(s);
  });
});

describe("delivery", () => {
  function paid(): AppState {
    return run(dealState(), pay("me", T0), pay("bot-bob", T0));
  }

  it("advances through the delivery stages on TICK (4s, 10s, 30s)", () => {
    expect(DELIVERY_STAGES.map((s) => [s.status, s.afterMs])).toEqual([
      ["preparing", 4_000],
      ["out_for_delivery", 10_000],
      ["delivered", 30_000],
    ]);
    let s = paid();
    for (const stage of DELIVERY_STAGES) {
      s = run(s, { type: "TICK", now: T0 + stage.afterMs });
      expect(req(s).status).toBe(stage.status);
    }
  });

  it("deliveryProgress runs 0 → 1 across out_for_delivery", () => {
    const r = req(paid());
    expect(deliveryProgress(r, T0 + 5_000)).toBe(0);
    expect(deliveryProgress(r, T0 + 10_000)).toBe(0);
    expect(deliveryProgress(r, T0 + 20_000)).toBe(0.5);
    expect(deliveryProgress(r, T0 + 40_000)).toBe(1);
    expect(deliveryProgress(req(dealState()), T0)).toBe(0);
  });
});

describe("your handover (the ready popup → show your PIN flow)", () => {
  function delivered(): AppState {
    const s = run(dealState(), pay("me", T0), pay("bot-bob", T0));
    return run(s, ...DELIVERY_STAGES.map((stage) => ({ type: "TICK", now: T0 + stage.afterMs }) as Action));
  }
  const pinOf = (s: AppState, userId: string) => req(s).participants.find((p) => p.userId === userId)!.collectionCode!;
  const showPin = (s: AppState, userId = "me", now = T0 + 31_000): Action => ({ type: "HANDOVER", requestId: "r1", code: pinOf(s, userId), now });

  it("hands over only your own bag, by your own PIN, once the order is ready to collect", () => {
    let s = run(dealState(), pay("me", T0), pay("bot-bob", T0));
    for (const stage of DELIVERY_STAGES.slice(0, -1)) {
      s = run(s, { type: "TICK", now: T0 + stage.afterMs });
      expect(run(s, showPin(s))).toBe(s);
    }
    const ready = delivered();
    expect(pinOf(ready, "me")).not.toBe(pinOf(ready, "bot-bob"));
    const done = run(ready, showPin(ready));
    expect(hasCollected(req(done))).toBe(true);
    expect(hasCollected(req(done), "bot-bob")).toBe(false);
    expect(req(done).status).toBe("delivered");
  });

  it("is idempotent, and ignores PINs from another party", () => {
    const s = delivered();
    const once = run(s, showPin(s));
    expect(run(once, showPin(s))).toBe(once);
    expect(run(s, { type: "HANDOVER", requestId: "nope", code: pinOf(s, "me"), now: T0 })).toBe(s);
  });

  it("the order is collected once every bag has been handed over, whatever the order", () => {
    const s = delivered();
    const bobFirst = run(s, showPin(s, "bot-bob", T0 + 40_000));
    expect(req(bobFirst).status).toBe("delivered");
    const all = run(bobFirst, showPin(s, "me", T0 + 41_000));
    expect(req(all)).toMatchObject({ status: "collected", completedAt: T0 + 41_000 });
  });

  it("raises the ready popup once for a delivered order you haven't collected", () => {
    let s = delivered();
    expect(pendingAlerts(s)).toEqual([{ key: "r1:ready", kind: "ready", requestId: "r1" }]);
    expect(pendingAlerts(run(s, showPin(s)))).toEqual([]);
    s = run(s, { type: "MARK_ALERT_SEEN", key: "r1:ready" });
    expect(pendingAlerts(s)).toEqual([]);
  });

  it("the ready notification carries your own PIN", () => {
    const s = delivered();
    const ready = notificationsFor(s).find((n) => n.kind === "ready")!;
    expect(ready.body).toContain(`PIN ${pinOf(s, "me")}`);
    expect(ready.body).not.toContain(pinOf(s, "bot-bob"));
  });

  it("drops a collected party from your active parties, and nobody else's", () => {
    const s = delivered();
    const at = T0 + 31_000;
    expect(isActiveFor(req(s), at)).toBe(true);
    expect(isActiveFor(req(s), T0 + READY_LINGER_MS + 1)).toBe(false);
    const done = run(s, showPin(s));
    expect(isActiveFor(req(done), at)).toBe(false);
    expect(isActiveFor(req(done), at, "bot-bob")).toBe(true);
    const all = run(done, showPin(s, "bot-bob"));
    expect(isActiveFor(req(all), at, "bot-bob")).toBe(false);
  });

  it("treats live parties you're in as active, and others' as not", () => {
    const s = dealState();
    expect(isActiveFor(req(s), DEAL_AT)).toBe(true);
    expect(isActiveFor(req(s), DEAL_AT, "bot-carl")).toBe(false);
    const open = run(emptyState(), create);
    expect(isActiveFor(req(open), T0)).toBe(true);
    expect(isActiveFor(req(open), T0 + 15 * 60_000)).toBe(false);
  });
});

describe("notificationsFor", () => {
  it("only covers parties you're in", () => {
    expect(notificationsFor(seedState(T0))).toEqual([]);
  });

  it("announces the deal and asks for payment until you've paid", () => {
    let s = dealState();
    expect(notificationsFor(s).map((n) => [n.kind, n.title])).toEqual([
      ["pay", "Payment needed"],
      ["deal", "Deal reached at Slice House"],
    ]);
    s = run(s, pay("me", DEAL_AT + 1000));
    expect(notificationsFor(s).map((n) => n.kind)).toEqual(["deal"]);
  });

  it("asks you to accept again in round 2, naming who dropped out", () => {
    const s = run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("bot-bob", DEAL_AT + 3000));
    const accept = notificationsFor(s).find((n) => n.kind === "pay")!;
    expect(accept.key).toBe("r1:pay-2");
    expect(accept.title).toBe("Accept again");
    expect(accept.body).toMatch(/^Bob didn't accept/);
  });

  it("tracks the order through delivery, newest first", () => {
    const paidAt = DEAL_AT + 1000;
    let s = run(dealState(), pay("me", paidAt), pay("bot-bob", paidAt));
    for (const stage of DELIVERY_STAGES) s = run(s, { type: "TICK", now: paidAt + stage.afterMs });
    const list = notificationsFor(s);
    expect(list.map((n) => n.kind)).toEqual(["ready", "on_its_way", "placed", "deal"]);
    expect(list[0].body).toContain(req(s).participants.find((p) => p.userId === "me")!.collectionCode!);
    expect(list.every((n, i) => i === 0 || list[i - 1].at >= n.at)).toBe(true);
  });

  it("explains cancellations and expiry", () => {
    const cancelled = run(dealState(), pay("me", DEAL_AT + 1000), { type: "TICK", now: DEAL_AT + ACCEPT_WINDOW_MS });
    expect(notificationsFor(cancelled)[0]).toMatchObject({
      kind: "cancelled",
      title: "Order cancelled at Slice House",
      body: `${CANCEL_REASONS.notEnoughAccepted} Nobody was charged.`,
    });
    const expired = run(emptyState(), create, { type: "TICK", now: T0 + 15 * 60_000 });
    expect(notificationsFor(expired)[0]).toMatchObject({ kind: "expired", title: "Party closed at Slice House" });
  });

  it("MARK_NOTIFICATIONS_READ clears the unread count", () => {
    let s = dealState();
    expect(unreadCount(s)).toBe(2);
    s = run(s, { type: "MARK_NOTIFICATIONS_READ" });
    expect(unreadCount(s)).toBe(0);
    s = run(s, { type: "TICK", now: DEAL_AT + ACCEPT_WINDOW_MS });
    expect(unreadCount(s)).toBe(1);
  });
});

describe("pendingAlerts", () => {
  it("shows 'party filled' once per party, then the cancellation", () => {
    let s = dealState();
    expect(pendingAlerts(s)).toEqual([{ key: "r1:filled", kind: "filled", requestId: "r1" }]);
    s = run(s, { type: "MARK_ALERT_SEEN", key: "r1:filled" }, { type: "MARK_ALERT_SEEN", key: "r1:filled" });
    expect(s.seenAlerts).toEqual(["r1:filled"]);
    expect(pendingAlerts(s)).toEqual([]);
    s = run(s, { type: "TICK", now: DEAL_AT + ACCEPT_WINDOW_MS });
    expect(pendingAlerts(s)).toEqual([{ key: "r1:cancelled", kind: "cancelled", requestId: "r1" }]);
  });
});

describe("seed and selectors", () => {
  it.each(CATALOG.pickupPoints)("$name: 2–4 open parties, at least one highlight at 75%+, the rest 25–70%", (point) => {
    const parties = seedState(T0).requests.filter((r) => r.pickupPointId === point.id);
    expect(parties.length).toBeGreaterThanOrEqual(2);
    expect(parties.length).toBeLessThanOrEqual(4);
    expect(parties.every((r) => r.status === "open")).toBe(true);
    const pcts = parties.map((r) => {
      const restaurant = CATALOG.restaurants.find((x) => x.id === r.restaurantId)!;
      return { highlight: isHighlight(r, restaurant), pct: progressOf(r, restaurant).pct };
    });
    expect(pcts.filter((p) => p.highlight).length).toBeGreaterThanOrEqual(1);
    expect(pcts.filter((p) => !p.highlight).every((p) => p.pct >= 25 && p.pct <= 70)).toBe(true);
    expect(new Set(parties.map((r) => r.restaurantId)).size).toBe(parties.length);
  });

  it("seed timers run 8–50 minutes", () => {
    for (const r of seedState(T0).requests) {
      const mins = (r.expiresAt - T0) / 60_000;
      expect(mins).toBeGreaterThanOrEqual(8);
      expect(mins).toBeLessThanOrEqual(50);
    }
  });

  it("ADD_FRIEND and SET_LOCATION", () => {
    const s = run(
      emptyState(),
      { type: "ADD_FRIEND", userId: "bot-aisha" },
      { type: "ADD_FRIEND", userId: "bot-aisha" },
      { type: "SET_LOCATION", pickupPointId: "main-library" },
      { type: "SET_LOCATION", pickupPointId: "nowhere" },
    );
    expect(s.friends).toEqual(["bot-aisha"]);
    expect(s.location).toBe("main-library");
  });

  it("SET_LOCATION moves a draft's collection point with you", () => {
    const s = run(
      emptyState(),
      { type: "DRAFT_START", restaurantId: "kumo-ramen" },
      { type: "DRAFT_ITEM", itemId: "kr-miso", delta: 1 },
      { type: "SET_LOCATION", pickupPointId: "ioe-bedford-way" },
    );
    expect(s.draft).toMatchObject({ pickupPointId: "ioe-bedford-way", basket: [{ itemId: "kr-miso", qty: 1 }] });
  });
});

describe("discount eligibility", () => {
  it("applies the restaurant discount only once the party meets the threshold", () => {
    // me £21 alone: below £40, so no discount and the full delivery fee.
    const below = splitCosts(req(run(emptyState(), create, ...margheritas("me", 2), finalise("me"))), pizza);
    expect(below.discountEligible).toBe(false);
    expect(below.group).toEqual({ subtotal: 2100, discount: 0, delivery: pizza.deliveryFee, total: 2100 + pizza.deliveryFee });

    const met = splitCosts(req(dealState()), pizza);
    expect(met.discountEligible).toBe(true);
    expect(met.group.discount).toBe(Math.round((5250 * pizza.deal.discountPct) / 100));
  });

  it("per-person totals still reconcile to the penny after someone leaves", () => {
    let s = run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("bot-bob", DEAL_AT + 3000));
    const split = splitCosts(req(s), pizza);
    const people = Object.values(split.people);
    for (const key of ["subtotal", "discount", "delivery", "total"] as const) {
      expect(people.reduce((sum, x) => sum + x[key], 0)).toBe(split.group[key]);
    }
    expect(people).toHaveLength(2);
    s = run(s, pay("me", DEAL_AT + 4000, 2));
    expect(req(s).status).toBe("deal_achieved");
  });
});

describe("start a new party with your basket (or no thanks)", () => {
  const retry = (newRequestId = "r2", durationMin = 30, now = T0 + 20 * 60_000): Action => ({
    type: "RETRY_ENTRY",
    requestId: "r1",
    userId: "me",
    newRequestId,
    durationMin,
    now,
  });

  function expiredWithBob(): AppState {
    return run(
      emptyState(),
      create,
      ...margheritas("me", 2),
      finalise("me"),
      { type: "JOIN", requestId: "r1", user: bob },
      ...margheritas("bot-bob", 1),
      finalise("bot-bob"),
      { type: "TICK", now: T0 + 15 * 60_000 },
    );
  }

  it("expiry keeps everyone's basket for an explicit choice", () => {
    const r = req(expiredWithBob());
    expect(r.status).toBe("expired");
    expect(r.released.map((e) => [e.userId, e.reason, e.choice])).toEqual([
      ["me", "no_match", "pending"],
      ["bot-bob", "no_match", "pending"],
    ]);
  });

  it("retry starts a fresh party for just that person, with the same basket and collection point", () => {
    const s = run(expiredWithBob(), retry());
    const fresh = req(s, "r2");
    expect(fresh).toMatchObject({ status: "open", restaurantId: "slice-house", pickupPointId: "student-centre", hostId: "me", attempt: 2, retryOf: "r1" });
    expect(fresh.participants.map((p) => [p.userId, p.basket, p.finalised, p.paid])).toEqual([["me", [{ itemId: "sh-margherita", qty: 2 }], true, false]]);
    expect(req(s).released.map((e) => e.choice)).toEqual(["retried", "pending"]);
  });

  it("double clicks can't create duplicate parties", () => {
    const s = run(expiredWithBob(), retry("r2"), retry("r2"), retry("r3"));
    expect(s.requests.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("is refused while the restaurant already has an open party at that collection point", () => {
    const busy = run(expiredWithBob(), { ...create, id: "other", user: carl } as Action, retry());
    expect(busy.requests.map((r) => r.id)).toEqual(["r1", "other"]);
    expect(req(busy).released[0].choice).toBe("pending");
  });

  it("is allowed while the restaurant's only open party is at another collection point", () => {
    const elsewhere = run(expiredWithBob(), { ...create, id: "other", pickupPointId: "main-library", user: carl } as Action, retry());
    expect(elsewhere.requests.map((r) => r.id)).toEqual(["r1", "other", "r2"]);
    expect(req(elsewhere, "r2").pickupPointId).toBe("student-centre");
  });

  it("starts the new party for 15, 30 or 60 minutes only", () => {
    for (const min of [15, 30, 60]) {
      const s = run(expiredWithBob(), retry("r2", min));
      expect(req(s, "r2").expiresAt - req(s, "r2").createdAt).toBe(min * 60_000);
    }
    expect(run(expiredWithBob(), retry("r2", 10)).requests).toHaveLength(1);
    expect(run(expiredWithBob(), retry("r2", 7)).requests).toHaveLength(1);
    expect(run(expiredWithBob(), retry("r2", 45)).requests).toHaveLength(1);
  });

  it("after a failed acceptance round, the retry carries no stale payment, decline or code", () => {
    const failed = run(dealState(), pay("me", DEAL_AT + 1000), { type: "TICK", now: DEAL_AT + ACCEPT_WINDOW_MS });
    expect(req(failed).released.find((e) => e.userId === "me")?.reason).toBe("group_fell_through");
    const p = req(run(failed, retry()), "r2").participants[0];
    expect(p).toMatchObject({ paid: false, finalised: true });
    expect(p.declined).toBeFalsy();
    expect(p.collectionCode).toBeUndefined();
  });

  it("someone who declines keeps their basket while the rest carry on", () => {
    const s = run(threeWayDeal(), pay("me", DEAL_AT + 1000), pay("bot-carl", DEAL_AT + 2000), decline("bot-bob", DEAL_AT + 3000));
    expect(req(s).released).toMatchObject([{ userId: "bot-bob", reason: "declined", choice: "pending", basket: [{ itemId: "sh-margherita", qty: 2 }] }]);
  });

  it("a failed demo payment is recorded as its own reason", () => {
    const s = run(dealState(), { type: "DECLINE", requestId: "r1", userId: "me", round: 1, now: DEAL_AT + 1000, reason: "payment_failed" }, pay("bot-bob", DEAL_AT + 1000));
    expect(req(s).released.find((e) => e.userId === "me")?.reason).toBe("payment_failed");
  });

  it("no thanks (CANCEL_ENTRY) clears your choice; a later retry does nothing", () => {
    const s = run(expiredWithBob(), { type: "CANCEL_ENTRY", requestId: "r1", userId: "me" }, retry());
    expect(req(s).released[0].choice).toBe("cancelled");
    expect(s.requests).toHaveLength(1);
  });
});

describe("collection handover", () => {
  function delivered(): AppState {
    const paidAt = DEAL_AT + 1000;
    let s = run(dealState(), pay("me", paidAt), pay("bot-bob", paidAt));
    for (const stage of DELIVERY_STAGES) s = run(s, { type: "TICK", now: paidAt + stage.afterMs });
    return s;
  }

  it("PINs stay distinct even in a big party", () => {
    const s = run(seedState(T0), { type: "FILL_PARTY", requestId: "seed-burger-yard-student-centre", now: T0 });
    const r = req(s, "seed-burger-yard-student-centre");
    const paid = run(s, ...r.participants.map((p): Action => ({ type: "ACCEPT_AND_PAY", requestId: r.id, userId: p.userId, round: 1, now: T0 + 1000 })));
    const pins = req(paid, r.id).participants.map((p) => p.collectionCode);
    expect(new Set(pins).size).toBe(pins.length);
    pins.forEach((pin) => expect(pin).toMatch(/^\d{4}$/));
  });

  it("rejects handover before the food arrives", () => {
    const s = run(dealState(), pay("me", DEAL_AT + 1000), pay("bot-bob", DEAL_AT + 1000));
    const code = req(s).participants[0].collectionCode!;
    expect(checkHandover(req(s), code)).toEqual({ ok: false, error: "not_arrived" });
    expect(run(s, { type: "HANDOVER", requestId: "r1", code, now: T0 })).toBe(s);
  });

  it("finds the right bag, rejects unknown and repeated codes, and completes once every bag is collected", () => {
    let s = delivered();
    const [mine, bobs] = req(s).participants;
    expect(checkHandover(req(s), "0000")).toEqual({ ok: false, error: "unknown_code" });
    expect(checkHandover(req(s), mine.collectionCode!)).toMatchObject({ ok: true, participant: { userId: "me" } });

    s = run(s, { type: "HANDOVER", requestId: "r1", code: mine.collectionCode!, now: T0 + 90_000 });
    expect(req(s)).toMatchObject({ status: "delivered" });
    expect(req(s).participants[0].collectedAt).toBe(T0 + 90_000);
    expect(checkHandover(req(s), mine.collectionCode!)).toMatchObject({ ok: false, error: "already_collected" });
    expect(run(s, { type: "HANDOVER", requestId: "r1", code: mine.collectionCode!, now: T0 + 91_000 })).toBe(s);

    s = run(s, { type: "HANDOVER", requestId: "r1", code: bobs.collectionCode!, now: T0 + 92_000 });
    expect(req(s)).toMatchObject({ status: "collected", completedAt: T0 + 92_000 });
    expect(req(run(s, { type: "TICK", now: T0 + 999_000 })).status).toBe("collected");
  });
});

describe("saved state", () => {
  it("restores state saved by this version", () => {
    const s = seedState(T0);
    expect(parseSaved(JSON.stringify(s))).toEqual(s);
  });

  it("resets the demo for missing, unreadable or older saved data", () => {
    const s = seedState(T0);
    expect(parseSaved(null)).toBeNull();
    expect(parseSaved("{not json")).toBeNull();
    expect(parseSaved(JSON.stringify({ ...s, version: 3 }))).toBeNull();
    expect(parseSaved(JSON.stringify({ ...s, version: undefined }))).toBeNull();
    expect(parseSaved(JSON.stringify({ ...s, requests: s.requests.map((r) => ({ ...r, status: "expired" })) }))).toBeNull();
  });
});

describe("invite friends", () => {
  const invite = (friendId: string, userId = "me", now = T0 + 500, requestId = "r1"): Action => ({ type: "INVITE_FRIEND", requestId, userId, friendId, now });
  const withFriends = (s: AppState): AppState => ({ ...s, friends: ["bot-chloe", "bot-ravi"] });

  it("invites a friend to a filling party you're in, once", () => {
    const s = run(withFriends(run(emptyState(), create)), invite("bot-chloe"), invite("bot-chloe"));
    expect(req(s).invites).toEqual([{ userId: "bot-chloe", name: "Chloe", invitedBy: "me", at: T0 + 500, status: "pending" }]);
  });

  it("only friends, only while filling, only from someone in the party, never someone already in it", () => {
    const base = withFriends(run(emptyState(), create, { type: "JOIN", requestId: "r1", user: { userId: "bot-ravi", name: "Ravi", isBot: true } }));
    expect(req(run(base, invite("bot-stranger"))).invites).toBeUndefined();
    expect(req(run(base, invite("bot-ravi"))).invites).toBeUndefined();
    expect(req(run(base, invite("bot-chloe", "bot-nobody"))).invites).toBeUndefined();
    expect(req(run(withFriends(dealState()), invite("bot-chloe"))).invites).toBeUndefined();
  });

  it("joining settles the invite", () => {
    const s = run(withFriends(run(emptyState(), create)), invite("bot-chloe"), { type: "JOIN", requestId: "r1", user: { userId: "bot-chloe", name: "Chloe", isBot: true } });
    expect(req(s).invites?.[0].status).toBe("joined");
  });

  it("an invite is to that party at its collection point: the restaurant's party elsewhere is untouched", () => {
    const s = run(
      withFriends(run(emptyState(), create, { ...create, id: "r2", pickupPointId: "ramsay-hall", user: carl } as Action)),
      invite("bot-chloe"),
    );
    expect(req(s).invites).toHaveLength(1);
    expect(req(s, "r2").invites).toBeUndefined();
    expect(req(run(s, invite("bot-ravi", "me", T0 + 600, "r2")), "r2").invites).toBeUndefined();
  });

  it("the seed gives you three friends to invite", () => {
    expect(seedState(T0).friends).toHaveLength(3);
  });
});
