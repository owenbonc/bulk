# Bulk: group food orders for halls

Phase 1 barebones build for the Claude hackathon ("Specification SIMPLE NEW"). Students near each other pool food orders to unlock restaurant group deals and share one delivery fee.

**Journey:** Home (the parties near you) → tap a party → choose food → Join party → deal reached → notification → accept & pay → delivery to the party's collection point → show your PIN and collect. Or **Create a party** → pick a restaurant → build your basket and choose the collection point and how long it lasts → your party goes live.

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
| Party | Created from **Create a party**: pick a restaurant, build your basket, choose the collection point and how long it stays open (10/15/30/60 min). Whoever creates it is the **host**: they pick the restaurant, collection point and how long it stays open. That's their only role. |
| Home | Lists the parties collecting near your location (yours first, then others within a short walk, with "Here" or "5 min walk"), plus every party you're in. Change location from the pin at the top left. Tap one to join. |
| One party per place | A restaurant can have one open party per collection point. Distances and delivery estimates are computed from your location (`lib/geo.ts`). |
| Leaving | Anyone, **the host included**, can leave while the party is filling, including after committing their basket (**Leave party** on the party page, with a confirmation). Their basket is removed, everyone else's estimates are recalculated, and **the party stays open** with the same collection point. Nobody is promoted; the Host tag still marks who created it while they're in it. An empty party stays joinable until its timer runs out. |
| Deal | The party's combined **finalised** baskets reach the restaurant's £ threshold. Anyone still choosing food at that moment is dropped. |
| Pricing | The deal's discount applies **only once the threshold is met**, split in proportion to each person's food. Delivery is split equally between the orders in the party (the "÷ n" shown). Exact to the penny. Before the deal, the deal row reads "Unlocks at £50 · £11 to go" with "−£2.88 when it unlocks", and the estimate is your price if the party stopped now. |
| Accept & pay | Everyone accepts the exact price within 60s (demo payment). Each answer names its round, so double taps or old answers can't count twice or carry over to a new price. |
| One second round | If anyone declines, doesn't answer, or their demo payment fails, they're taken out with their basket kept. If the rest still meet the threshold they get **one** repriced round 2 (everyone accepts again). Otherwise, or if round 2 fails (including as soon as anyone declines it), the attempt ends. |
| Start a new party with your basket | When an attempt ends for you (timer ran out, the order fell through, or you were taken out) your basket is saved. One card offers **Start new party** (15/30/60 min; a fresh party just for you, same basket, restaurant and collection point) or **No thanks**. Nothing happens automatically, and nobody else is moved. If the restaurant already has an open party at that collection point, the card points you to it instead. |
| Invite friends | While a party is filling, **Invite friends** on the party page lists your friends (added with the + next to someone in a party; the demo starts you with three: Chloe, Maya, Nina). Invite each once; they show as *invited…* in the party list. In the demo, invited friends are simulated: they accept about 4 seconds later and join with their own basket at the party's collection point, even with bots paused. **Copy invite link** shares the party. |
| Collection | Each person gets their **own 4-digit pickup PIN** for their own labelled bag. When the food arrives, "Your food is ready!" (or the notification) → **Collect my order** → the handover sheet shows your PIN to the courier → "Code accepted" hands over your bag, and the party leaves your Home. The order is `collected` once every bag has been handed over. |
| Saved state | `localStorage` key `bulk-demo-v4` with a version number; older saved data is replaced with a fresh demo instead of crashing. |

Payment, delivery and the handover are all simulated.

## Demo script

Open the demo controls (press **d**, or from the account sheet). Tick **Pause bots** for a controlled run; **Reset demo** between runs.

1. **Happy path:** create a party (e.g. Kumo Ramen at the Student Centre), add food and open the basket: the deal row shows "Unlocks at £35 · … to go". Create → **Fill this party now** → accept and pay → go Home → **Your food is ready!** with your PIN → **Collect my order** → Code accepted. Then in the demo panel's **Driver handover** (presenter tool), **Simulate the others** (or type a PIN → **Find bag** → **Hand over**; unknown and repeated PINs are refused) → the order is collected.
2. **Second round:** tick **A bot won't accept**, fill the party, accept: one bot declines and you get a repriced **Second round**. Accept again and the order is placed. Add **…and declines again** to see round 2 fail.
3. **Timeout / payment:** **A bot never answers** + **End the accept window in 5s**, or **My payment fails** before accepting.
4. **Start a new party:** with bots paused, create a party → **Expire this party in 5s** → the popup's **Start a new party** → pick a length → **Start new party**.
5. **Invite friends:** with bots paused, create a party → **Invite friends** → invite Chloe and Maya → they join a few seconds later and the party fills up.
6. **Host leaves:** as host of a filling party, **Leave party** (or ⓘ → Leave party): the party stays on Home for others.
7. **Locations:** switch location on Home to see each collection point's parties (three seeded at each, ids like `seed-burger-yard-student-centre`). Kumo Ramen has a party at Ramsay Hall but none at the Student Centre, so it's the one to host from the default location.

## Code map

- `lib/requests.ts`: pure party state machine (reducer), saved-state parsing, notifications and popups
- `lib/split.ts`: per-person cost split and deal eligibility
- `lib/simulation.ts`: bot participants and invited friends (pure, tested)
- `lib/store.tsx`: React provider, 1s heartbeat, persistence
- `lib/data.ts`: seed restaurants, menus, deals, collection points (with coordinates)
- `lib/geo.ts`: distances, delivery estimates, walking times and the "near you" selection
- `app/`: screens (`/` home, `/create` restaurants, `/create/[restaurantId]` menu and basket, `/party/[id]` menu and basket for joiners, `/party/[id]/status` party status)
- `components/status/NewPartyCard.tsx`, `HandoverSheet.tsx`, `InviteSheet.tsx`: start a new party with your basket, show your PIN to the courier, invite friends
- `components/demo/DriverHandoverTool.tsx`: the presenter's driver handover in the demo panel
- `docs/superpowers/specs/`: design spec for this phase
