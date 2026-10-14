# Bulk: group food orders for halls

Phase 1 barebones build for the Claude hackathon ("Specification SIMPLE NEW"). Students near each other pool food orders to unlock restaurant group deals and share one delivery fee.

**Journey:** Home (a stack of active "parties") → tap a party to join → Choose food → Finalise queue entry → Deal achieved → Notification → Accept & pay → Delivery to the host's pickup point. Or **Create order request** → pick a restaurant → build your basket and choose the pickup point and duration → your party goes live.

Everything runs in the browser. Other participants are simulated bots, and payment and delivery are simulated. No real money is involved.

## Run it

```bash
npm install
npm run build && npm start   # http://localhost:3000
```

`npm run dev` works too. If the repo lives in a OneDrive folder, OneDrive syncing `node_modules` makes the dev server's file watcher very slow. Use `build` + `start` for demos, or move the repo out of OneDrive.

```bash
npm test        # Vitest: request state machine, cost split, bot behaviour
npm run lint
```

## Rules (Phase 1)

| | |
|---|---|
| Order request ("party") | Created via **Create order request**: pick a restaurant, build your basket, choose the pickup point and open duration (15/30/60 min). The creator is host, and their basket goes straight into the queue. |
| Home | Lists every active party (restaurant, time left, pickup point, progress to the deal). Tap one to join. |
| Deal achieved | The request's combined **finalised** baskets reach the restaurant's £ threshold. Anyone still choosing food at that moment is dropped. |
| Time runs out first | Request **expires**. Nobody is charged. |
| Accept & pay | Everyone has 60s. If anyone hasn't paid, the **whole order is cancelled** and nobody is charged. |
| Cost split | Discount in proportion to each person's items. Delivery fee split equally. Exact to the penny. |
| Delivery | Simulated timeline, ending at the pickup point with a 4-digit PIN. |

## Demo script

Use the **Demo** button (bottom right) to steer the bots:

1. **Create path:** Create order request → pick a restaurant → add food, pick the pickup point and 15 min → Create. Bots join and the deal is achieved. Accept & pay, then watch delivery.
2. **Join path:** tap a bot-hosted party on Home → choose food → Finalise → finish the flow.
3. **Cancellation:** tick *A bot won't accept* before the deal. After 60s the order cancels.
4. **Expiry:** tick *Pause bots joining*, join and finalise, then *Expire this request in 5s*.
5. **Reset demo** restores the seeded restaurants and requests. State persists across refreshes in `localStorage`.

## Code map

- `lib/requests.ts`: pure order-request state machine (reducer)
- `lib/split.ts`: per-person cost split
- `lib/simulation.ts`: bot participants (pure, tested)
- `lib/store.tsx`: React provider, 1s heartbeat, persistence
- `lib/data.ts`: seed restaurants, menus, deals, pickup points
- `app/`: screens (`/` parties, `/create` restaurants, `/create/[restaurantId]` basket, `/req/[reqId]/order` joiner's basket, `/req/[reqId]` party status)
- `docs/superpowers/specs/`: design spec for this phase
