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

## Rules

| | |
|---|---|
| Party | One open party per restaurant. Whoever creates it is the **host**: they pick the restaurant, collection point and how long it stays open. That's their only role. |
| Leaving | Anyone, **the host included**, can leave while the party is filling, including after committing their basket (**Leave queue** on the party page). Their basket is removed, everyone else's estimates are recalculated, and **the party stays open** with the same collection point. Nobody is promoted. An empty party stays joinable until its timer runs out. |
| Deal | The party's combined **finalised** baskets reach the restaurant's £ threshold. Anyone still choosing food at that moment is dropped. |
| Pricing | The deal's discount applies **only once the threshold is met**, split in proportion to each person's food. Delivery is split equally between the orders in the party (the "÷ n" shown). Exact to the penny. Before the deal, the basket shows the offer as *not yet eligible* with how much more is needed and the rough saving, and the estimate is what you'd pay if the party stopped there. |
| Accept & pay | Everyone accepts the exact price within 60s (demo payment). Each answer names its round, so double taps or old answers can't count twice or carry over to a new price. |
| One second round | If anyone declines, doesn't answer, or their demo payment fails, they're taken out with their basket kept. If the rest still meet the threshold they get **one** repriced round 2 (everyone accepts again). Otherwise, or if round 2 fails (including as soon as anyone declines it), the attempt ends. |
| Keep queueing or cancel | When an attempt ends (timer ran out, or the order fell through) everyone's basket is kept and each person chooses: **Keep queueing** (pick 15/30/60 min; a fresh party just for them, same basket and collection point) or **Cancel** (no charge). Nothing happens automatically, and nobody else is moved. Refused if the restaurant already has an open party. |
| Collection | Each person gets their **own 4-digit pickup PIN** (different for everyone in the order) for their own labelled bag. A demo driver handover on the status page finds the bag by PIN, rejects unknown or repeated PINs, and the order is complete once every bag is collected. |
| Saved state | `localStorage` key `bulk-demo-v3` with a version number; older saved data is replaced with a fresh demo instead of crashing. |

Payment, delivery and the handover are all simulated.

## Demo script

Open the demo controls (press **d**, or from the account sheet). Tick **Pause bots** for a controlled run; **Reset demo** between runs.

1. **Happy path:** create a party (e.g. Kumo Ramen), add food and open the basket: the deal shows *not yet eligible*. Create → **Fill this party now** → accept and pay → watch delivery → type your PIN in the driver handover → **Find bag** → **Hand over** → **Simulate the others** → Order complete.
2. **Second round:** tick **A bot won't accept**, fill the party, accept: one bot declines and you get a repriced **Second round**. Accept again and the order is placed. Add **…and declines again** to see round 2 fail.
3. **Timeout / payment:** **A bot never answers** + **End the accept window in 5s**, or **My payment fails** before accepting.
4. **Keep queueing:** with bots paused, create a party → **Expire this party in 5s** → **Keep queueing or cancel** → pick a window → Keep queueing (attempt 2).
5. **Host leaves:** as host of a filling party, ⓘ → Leave party: the party stays on Home for others.

## Code map

- `lib/requests.ts`: pure order-request state machine (reducer)
- `lib/split.ts`: per-person cost split
- `lib/simulation.ts`: bot participants (pure, tested)
- `lib/store.tsx`: React provider, 1s heartbeat, persistence
- `lib/data.ts`: seed restaurants, menus, deals, pickup points
- `app/`: screens (`/` home, `/create` restaurants, `/create/[restaurantId]` menu and basket, `/party/[id]` menu and basket for joiners, `/party/[id]/status` party status)
- `components/status/RetryChoice.tsx`, `DriverHandover.tsx`: keep-queueing-or-cancel choice and the demo handover
- `docs/superpowers/specs/`: design spec for this phase
