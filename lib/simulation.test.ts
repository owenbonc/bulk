import { describe, expect, it } from "vitest";
import { CATALOG, DEFAULT_LOCATION, ME, seedState } from "./data";
import { type Action, queueTotal, reduce, stubbornBot } from "./requests";
import { botAcceptActions, botJoinActions } from "./simulation";
import type { AppState, OrderRequest } from "./types";

const T0 = 1_000_000;
const always = () => 0; // rand() → 0: first main plus first extra, always respond
const halfway = () => 0.5;

function run(state: AppState, actions: Action[]): AppState {
  return actions.reduce((s, a) => reduce(s, a, CATALOG), state);
}

function party(s: AppState, id = "r1"): OrderRequest {
  return s.requests.find((r) => r.id === id)!;
}

function emptyState(demo: Partial<AppState["demo"]> = {}): AppState {
  return {
    requests: [],
    demo: { botsPaused: false, botWontAccept: false, ...demo },
    friends: [],
    seenAlerts: [],
    location: DEFAULT_LOCATION,
    readNotifications: [],
  };
}

/** You host a Slice House party with one pepperoni (£13.50), optionally finalised. */
function withMyParty(finalise: boolean, demo: Partial<AppState["demo"]> = {}): AppState {
  const s = run(emptyState(demo), [
    { type: "CREATE_REQUEST", id: "r1", restaurantId: "slice-house", pickupPointId: "student-centre", durationMin: 15, user: ME, now: T0 },
    { type: "ADD_ITEM", requestId: "r1", userId: ME.userId, itemId: "sh-pepperoni" },
  ]);
  return finalise ? run(s, [{ type: "FINALISE_ENTRY", requestId: "r1", userId: ME.userId, now: T0 }]) : s;
}

function fillWithBots(s: AppState, rand: () => number, id = "r1"): AppState {
  for (let i = 0; i < 20 && party(s, id).status === "open"; i++) s = run(s, botJoinActions(s, T0 + i, rand));
  return s;
}

/** Lets bots respond once a second for `seconds` seconds. */
function respond(s: AppState, seconds: number, at = T0 + 1000): AppState {
  for (let i = 0; i < seconds; i++) s = run(s, botAcceptActions(s, at + i * 1000, always));
  return s;
}

describe("botJoinActions", () => {
  it("waits until you've finalised your entry", () => {
    expect(botJoinActions(withMyParty(false), T0, always)).toEqual([]);
  });

  it("does nothing while bots are paused", () => {
    expect(botJoinActions(withMyParty(true, { botsPaused: true }), T0, always)).toEqual([]);
  });

  it("leaves seeded parties you're not in alone", () => {
    expect(botJoinActions(seedState(T0), T0, always)).toEqual([]);
  });

  it("adds a finalised bot entry to your party", () => {
    const s = withMyParty(true);
    const bot = party(run(s, botJoinActions(s, T0, always))).participants[1];
    expect(bot).toMatchObject({ isBot: true, finalised: true });
    expect(bot.basket.length).toBeGreaterThan(0);
  });

  it("bots eventually fill the party to a deal", () => {
    for (const rand of [always, halfway]) expect(party(fillWithBots(withMyParty(true), rand)).status).toBe("deal_achieved");
  });

  it("with 'a bot won't accept' on, they fill so the deal survives the stubborn bot leaving", () => {
    for (const rand of [always, halfway]) {
      const r = party(fillWithBots(withMyParty(true, { botWontAccept: true }), rand));
      const restaurant = CATALOG.restaurants.find((x) => x.id === r.restaurantId)!;
      const stubborn = stubbornBot(r, restaurant)!;
      expect(r.status).toBe("deal_achieved");
      expect(queueTotal({ ...r, participants: r.participants.filter((p) => p !== stubborn) }, restaurant)).toBeGreaterThanOrEqual(
        restaurant.deal.minTotal,
      );
    }
  });
});

describe("botAcceptActions", () => {
  function dealState(demo: Partial<AppState["demo"]> = {}) {
    return fillWithBots(withMyParty(true, demo), always);
  }

  it("bots accept and pay", () => {
    const s = dealState();
    const after = run(s, botAcceptActions(s, T0 + 1000, always));
    expect(party(after).participants.filter((p) => p.isBot).every((p) => p.paid)).toBe(true);
  });

  it("everyone paying confirms the order", () => {
    const s = run(dealState(), [{ type: "ACCEPT_AND_PAY", requestId: "r1", userId: ME.userId, now: T0 + 500 }]);
    expect(party(respond(s, 1)).status).toBe("confirmed");
  });

  it("bots also accept in parties you're not in", () => {
    const s = run(seedState(T0), [{ type: "FILL_PARTY", requestId: "seed-burger-yard", now: T0 }]);
    expect(party(respond(s, 1), "seed-burger-yard").status).toBe("confirmed");
  });

  it("with 'a bot won't accept' on, exactly one bot declines in round 1 and round 2 succeeds", () => {
    let s = dealState({ botWontAccept: true });
    const r1 = party(s);
    const restaurant = CATALOG.restaurants.find((x) => x.id === r1.restaurantId)!;
    const stubborn = stubbornBot(r1, restaurant)!;

    s = respond(s, 3);
    expect(party(s).status).toBe("deal_achieved");
    expect(party(s).participants.filter((p) => p.declined).map((p) => p.userId)).toEqual([stubborn.userId]);

    // You pay last: the round resolves early and the fallback round starts without the stubborn bot.
    s = run(s, [{ type: "ACCEPT_AND_PAY", requestId: "r1", userId: ME.userId, now: T0 + 5000 }]);
    expect(party(s)).toMatchObject({ status: "deal_achieved", round: 2, removedNames: [stubborn.name] });

    // In round 2 every bot accepts, so your payment completes the order.
    s = respond(s, 2, T0 + 6000);
    expect(party(s).participants.filter((p) => p.isBot).every((p) => p.paid)).toBe(true);
    s = run(s, [{ type: "ACCEPT_AND_PAY", requestId: "r1", userId: ME.userId, now: T0 + 9000 }]);
    expect(party(s).status).toBe("confirmed");
  });

  it("declines through the stubborn bot are the only ones", () => {
    const s = dealState({ botWontAccept: true });
    const declines = botAcceptActions(s, T0 + 1000, always).filter((a) => a.type === "DECLINE");
    expect(declines).toHaveLength(1);
  });
});

/** Small deterministic PRNG so the end-to-end runs are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Drives the store's heartbeat: TICK, a bot join every 3s, bot responses, and you paying at a random moment. */
function playOut(s: AppState, id: string, rand: () => number): AppState {
  for (let sec = 1; sec <= 600; sec++) {
    const now = T0 + sec * 1000;
    s = run(s, [{ type: "TICK", now }]);
    if (sec % 3 === 0) s = run(s, botJoinActions(s, now, rand));
    s = run(s, botAcceptActions(s, now, rand));
    const r = party(s, id);
    const mine = r.participants.find((p) => p.userId === ME.userId);
    if (r.status === "deal_achieved" && mine && !mine.paid && rand() < 0.3) {
      s = run(s, [{ type: "ACCEPT_AND_PAY", requestId: id, userId: ME.userId, now }]);
    }
    if (party(s, id).status === "delivered" || party(s, id).status === "cancelled" || party(s, id).status === "expired") break;
  }
  return s;
}

/**
 * Without "a bot won't accept", every run ends delivered in round 1. With it, the run ends
 * delivered in round 2, unless the baskets left after the refusal can't meet the threshold
 * (e.g. one bot closed the deal on its own), in which case it is cancelled with a reason.
 */
function expectDemoOutcome(r: OrderRequest, botWontAccept: boolean, label: string): "round1" | "round2" | "cancelled" {
  if (!botWontAccept) {
    expect([r.status, r.round], label).toEqual(["delivered", 1]);
    return "round1";
  }
  if (r.status === "cancelled") {
    const restaurant = CATALOG.restaurants.find((x) => x.id === r.restaurantId)!;
    const left = { ...r, participants: r.participants.filter((p) => !r.removedUserIds.includes(p.userId)) };
    expect(r.cancelReason, label).toBe("Not enough people accepted to keep the deal.");
    expect(queueTotal(left, restaurant), label).toBeLessThan(restaurant.deal.minTotal);
    return "cancelled";
  }
  expect([r.status, r.round, r.removedNames.length], label).toEqual(["delivered", 2, 1]);
  return "round2";
}

describe("end-to-end demo runs", () => {
  it("hosting a party ends delivered, via round 2 when a bot won't accept", () => {
    const outcomes: string[] = [];
    for (let seed = 0; seed < 120; seed++) {
      const rand = mulberry32(seed);
      const botWontAccept = seed % 2 === 1;
      const restaurant = ["kumo-ramen", "levant-kitchen"][seed % 4 < 2 ? 0 : 1];
      const menu = CATALOG.restaurants.find((r) => r.id === restaurant)!.menu;
      let s: AppState = { ...seedState(T0), demo: { botsPaused: false, botWontAccept } };
      s = run(s, [
        { type: "DRAFT_START", restaurantId: restaurant },
        ...Array.from({ length: 1 + Math.floor(rand() * 3) }, (): Action => ({ type: "DRAFT_ITEM", itemId: menu[Math.floor(rand() * menu.length)].id, delta: 1 })),
        { type: "CREATE_FROM_DRAFT", id: "mine", user: ME, now: T0 },
      ]);
      outcomes.push(expectDemoOutcome(party(playOut(s, "mine", rand), "mine"), botWontAccept, `seed ${seed}`));
    }
    // Bots fill so the refusal leaves enough behind: round 2 is the norm, not the exception.
    expect(outcomes.filter((o) => o === "round2").length).toBeGreaterThanOrEqual(50);
  });

  it("joining a seeded party ends delivered, via round 2 when a bot won't accept and the numbers allow", () => {
    const seeded = seedState(T0).requests.map((r) => r.id);
    for (let seed = 0; seed < 120; seed++) {
      const rand = mulberry32(1000 + seed);
      const botWontAccept = seed % 2 === 1;
      const id = seeded[seed % seeded.length];
      let s: AppState = { ...seedState(T0), demo: { botsPaused: false, botWontAccept } };
      const menu = CATALOG.restaurants.find((r) => r.id === party(s, id).restaurantId)!.menu;
      s = run(s, [
        { type: "JOIN", requestId: id, user: ME },
        { type: "ADD_ITEM", requestId: id, userId: ME.userId, itemId: menu[Math.floor(rand() * menu.length)].id },
        { type: "FINALISE_ENTRY", requestId: id, userId: ME.userId, now: T0 },
      ]);
      expectDemoOutcome(party(playOut(s, id, rand), id), botWontAccept, `seed ${seed}`);
    }
  });
});
