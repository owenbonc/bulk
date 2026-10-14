import { describe, expect, it } from "vitest";
import { CATALOG, ME } from "./data";
import { type Action, reduce } from "./requests";
import { botAcceptActions, botJoinActions, stubbornBot } from "./simulation";
import type { AppState } from "./types";

const T0 = 1_000_000;
const always = () => 0; // rand() → 0: one item, first menu entry, always accept

function run(state: AppState, actions: Action[]): AppState {
  return actions.reduce((s, a) => reduce(s, a, CATALOG), state);
}

function withMyRequest(finalise: boolean, demo: Partial<AppState["demo"]> = {}): AppState {
  let s: AppState = { requests: [], demo: { botsPaused: false, botWontAccept: false, ...demo } };
  s = run(s, [
    { type: "CREATE_REQUEST", id: "r1", restaurantId: "slice-house", pickupPointId: "hall-a", durationMin: 15, user: ME, now: T0 },
    { type: "ADD_ITEM", requestId: "r1", userId: ME.userId, itemId: "pepperoni" },
  ]);
  return finalise ? run(s, [{ type: "FINALISE_ENTRY", requestId: "r1", userId: ME.userId, now: T0 }]) : s;
}

describe("botJoinActions", () => {
  it("waits until you've finalised your entry", () => {
    expect(botJoinActions(withMyRequest(false), T0, always)).toEqual([]);
  });

  it("does nothing while bots are paused", () => {
    expect(botJoinActions(withMyRequest(true, { botsPaused: true }), T0, always)).toEqual([]);
  });

  it("adds a finalised bot entry to your request", () => {
    const s = withMyRequest(true);
    const after = run(s, botJoinActions(s, T0, always));
    const bot = after.requests[0].participants[1];
    expect(bot).toMatchObject({ isBot: true, finalised: true });
    expect(bot.basket.length).toBeGreaterThan(0);
  });

  it("bots eventually fill the request to a deal", () => {
    let s = withMyRequest(true);
    for (let i = 0; i < 10 && s.requests[0].status === "open"; i++) s = run(s, botJoinActions(s, T0 + i, always));
    expect(s.requests[0].status).toBe("deal_achieved");
  });
});

describe("botAcceptActions", () => {
  function dealState(demo: Partial<AppState["demo"]> = {}) {
    let s = withMyRequest(true, demo);
    while (s.requests[0].status === "open") s = run(s, botJoinActions(s, T0, always));
    return s;
  }

  it("bots accept and pay", () => {
    const s = dealState();
    const after = run(s, botAcceptActions(s, T0 + 1000, always));
    expect(after.requests[0].participants.filter((p) => p.isBot).every((p) => p.paid)).toBe(true);
  });

  it("the stubborn bot never accepts when the demo switch is on", () => {
    const s = dealState({ botWontAccept: true });
    const after = run(s, botAcceptActions(s, T0 + 1000, always));
    const stubborn = stubbornBot(after.requests[0])!;
    expect(stubborn.paid).toBe(false);
  });
});
