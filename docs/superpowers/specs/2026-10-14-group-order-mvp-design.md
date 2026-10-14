# Plan: Barebones group food-ordering app (Phase 1, "Specification SIMPLE NEW")

## Context
Claude hackathon project (Notion › Hack hub › Claude hack). Problem: UK students in halls miss group discounts and shared delivery savings when ordering alone. The agreed Phase 1 scope ("Specification SIMPLE NEW") is one flow only:

**Home → Restaurant → Join lobby → Choose food → Add to basket → Finalise queue entry → Deal achieved → Notification → Accept & pay → Delivery to host's collection point**

The repo (`bulk/`) is empty apart from README.md, so this is a new project. Done = a full demo of that journey. Everything else in the larger design doc (friends/crews, strikes, OCR deals, platform linking, partner restaurants) is out of scope. "Collection sorting, advanced matchmaking, recommendations" are excluded by the spec.

### Decisions made with the user
| Question | Decision |
|---|---|
| Who hosts | A **"Create order request"** button. The creator (host) chooses the **restaurant, pickup point, and duration** (15 / 30 / 60 min presets). The button is on Home (restaurant picker in the form) and on each restaurant screen (restaurant preselected). |
| Lobby | A restaurant can have **several open requests**. Its screen lists them with pickup point, time left and progress toward the deal. You join one or create a new one. |
| Deal achieved | The request's **combined finalised basket total reaches the restaurant's £ threshold** (e.g. "20% off a £40 group order") |
| Request times out before the deal | **Expires, nobody charged**, baskets discarded |
| Someone doesn't accept/pay | **Whole order cancels** when the accept window ends; nobody is charged |
| Multi-user | **Single device, simulated other participants** (bots create requests, join, add items, accept) |
| Payment / delivery | **Fully simulated**: fake "pay" sheet, delivery status timeline, pickup PIN |
| Stack | **Next.js (App Router) + TypeScript + Tailwind**, no backend or database yet |
| UI | **Mobile-first**, clean but plain |

Small defaults I chose (easy to change): accept window 60s, bot actions every 2–4s, demo panel can fast-forward request timers, cost split per design doc B4 (discount in proportion to items, delivery fee split equally), and state persisted to `localStorage`.

## Architecture
All client-side. Pure domain logic lives in `lib/` and is unit-tested. A React context holds the state, and one hook runs the bot simulation.

```
app/
  layout.tsx                 phone-width shell, header, deal-notification banner slot
  page.tsx                   1. Home: restaurant boxes (name, cuisine, deal, # open requests)
                                + "Create order request" button
  r/[id]/page.tsx            2. Restaurant + lobby: deal details, list of open requests
                                (pickup point, time left, £ progress, members) → "Join";
                                "Create order request" (restaurant preselected)
  create/page.tsx            Create form: restaurant (preselected via ?restaurant=), pickup point
                                (curated list), duration 15/30/60 → creates request, you = host
  req/[reqId]/order/page.tsx 3. Menu + basket: add/remove items, subtotal, "Finalise queue entry"
  req/[reqId]/page.tsx       4–7. Phase-driven screen: queue (progress, countdown, members) →
                                deal achieved → accept & pay (countdown, fake pay sheet) →
                                delivery timeline + PIN; or expired / cancelled states
components/                  RestaurantCard, RequestCard, ProgressBar, Countdown, MemberList,
                             BasketSummary, PaySheet, DeliveryTimeline, NotificationBanner, DemoControls
lib/
  types.ts                   Restaurant, MenuItem, Deal, PickupPoint, Participant, OrderRequest, RequestStatus
  data.ts                    seed: ~4 fictional restaurants near halls, menus, £-threshold deals,
                             curated pickup points (Hall A reception, Student Union, Library entrance),
                             bot names, and a few bot-hosted open requests with partial baskets
  requests.ts                pure reducer / state machine (below)
  split.ts                   per-person cost split (subtotal, discount share, delivery share, total)
  store.tsx                  AppProvider: useReducer(requests.ts) + localStorage persistence + hooks
  simulation.ts              useSimulation(): timers dispatching bot actions + TICK
```

### Order request state machine (`lib/requests.ts`)
`open` (until `expiresAt`) → finalised basket total ≥ threshold → `deal_achieved` (accept deadline set)
→ all participants paid → `confirmed` → `preparing` → `out_for_delivery` → `delivered`
- `open` and `expiresAt` passes → `expired` (nobody charged)
- `deal_achieved` and accept deadline passes with anyone unpaid → `cancelled` (nobody charged)

Actions: `CREATE_REQUEST { restaurantId, pickupPointId, durationMin, hostId }` (host auto-joins), `JOIN`, `ADD_ITEM` / `REMOVE_ITEM` (only before your entry is finalised), `FINALISE_ENTRY` (locks your basket; only finalised baskets count toward the deal), `LEAVE` (only while `open`), `ACCEPT_AND_PAY`, `TICK(now)` (expiry, accept deadline, delivery stages), `RESET`.

### Simulation (`lib/simulation.ts`)
Bots join open requests the user is in and finalise baskets until the threshold is met. Once the deal is reached, they accept at random times within the window. The **DemoControls** panel (collapsible) has **"A bot won't accept"** (shows the cancellation), **"Pause bots / fast-forward timer"** (shows expiry), and **"Reset demo"**.

### Notification (step 5)
When a request you're in becomes `deal_achieved`, an in-app banner appears on every screen ("Deal achieved at Pizza Place! Accept within 60s"). The browser Notification API is used too if permission is granted. No push backend.

## Implementation steps
1. Scaffold: `npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir`, add Vitest. Save this design to `docs/superpowers/specs/2026-10-14-group-order-mvp-design.md`. Work on a feature branch.
2. TDD the pure logic: `lib/requests.ts` (create/host, threshold on finalised baskets only, expiry, accept/cancel, delivery progression) and `lib/split.ts`.
3. `lib/data.ts` seed data and `lib/store.tsx` provider with persistence.
4. Screens in journey order: Home → Restaurant/lobby → Create form → Order/basket → Request phases.
5. `lib/simulation.ts`, DemoControls and the notification banner.
6. Phone-width polish; README with run and demo instructions; commit.

## Verification
- `npm test`: Vitest covers the reducer transitions (creator is host with the chosen pickup point and duration, threshold counts only finalised baskets, `open`→`expired` on timeout, all paid → `confirmed`, accept timeout → `cancelled`) and the split maths (per-person totals add up to the group total, no rounding loss).
- `npm run build` and `npm run lint` are clean.
- Manual end-to-end at phone width (Chrome tools):
  1. **Create path:** Home → Create order request → pick restaurant, pickup point and 15 min → add food → finalise → the bots fill it → deal banner → Accept & pay → timeline ends "Delivered to Hall A reception, PIN ####".
  2. **Join path:** Home → restaurant → its lobby lists several open requests → join a bot-hosted one; its pickup point is shown read-only → finish the flow.
  3. **Expiry:** pause bots and fast-forward → "Expired, deal not reached, nobody charged".
  4. **Cancel:** "A bot won't accept" → deal achieved → you accept → window ends → "Order cancelled, nobody was charged".
  5. Refresh mid-flow and confirm the state persists. Reset demo clears it.
