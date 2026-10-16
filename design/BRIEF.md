# Bulk redesign brief

Lead designer's brief for the front-end redesign. Every agent builds to this file. When this brief and a wireframe disagree, the wireframe wins on layout and the brief wins on tokens, terminology and behaviour. When anything is unclear, choose the option that keeps the demo flow working and note it in your final report.

Wireframes: `design/wireframes/p01.png` … `p14.png` (hand-drawn, numbered as below). Read the ones for your screens before writing code. Red handwriting = behaviour notes; green = sizing notes; yellow = sorting notes.

Reference skills (read the parts relevant to your work): `design/skills/apple-design.md`, `design/skills/emil-design-eng.md`, `design/skills/animate.md`, `design/skills/mobile-native.md`, `design/skills/impeccable/SKILL.md` and `design/skills/impeccable/craft-floor.md`.

This repo runs **Next.js 16** (App Router), React 19, Tailwind v4. APIs differ from older Next versions: read the relevant guide in `node_modules/next/dist/docs/` before using a Next API you are unsure of.

## 1. Product in one line

Students near each other join a **party** at a restaurant, build their own basket, and when the party's combined spend reaches the restaurant's deal threshold everyone confirms and pays (simulated). The order is delivered to the host's collection point.

## 2. Terminology (non-negotiable)

- The group is always a **party**. Never "lobby", "request", "queue" or "group order request" in UI copy.
- Creating one: **"Create a party"**. Joining: **"Join party"**. The creator is the **host**.
- Pickup location: **collection point** (short form "Collect from …" or the place name with a pin icon).
- The discount: **deal** (e.g. "25% off"). Progress copy: "£8 left", "£32 / £40".
- Route names follow the term: `/party/[id]`, never `/req/`.

## 3. Visual identity

Warm, friendly, food-first. Unique without being loud: cream paper background (echoing the wireframes), near-black ink, one lime accent used sparingly for the moments that matter (progress, deal, primary action).

### Colour tokens (define in `app/globals.css` as CSS variables and expose to Tailwind via `@theme`)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#f7f5ec` | App background (warm cream) |
| `--surface` | `#ffffff` | Cards, sheets |
| `--surface-2` | `#efece0` | Inset areas, image placeholders, chips |
| `--ink` | `#1b1d14` | Primary text (tinted near-black, never pure black) |
| `--ink-2` | `#5c5f52` | Secondary text |
| `--ink-3` | `#8c8f80` | Tertiary text, placeholders (check 4.5:1 on its background; darken if not) |
| `--line` | `#e4e1d3` | Hairlines, borders |
| `--accent` | `#b7cd32` | Brand lime: fills (progress, primary buttons, selected stepper, pie fill) |
| `--accent-strong` | `#9db51f` | Pressed state of accent fills |
| `--accent-soft` | `#eef3cf` | Tinted backgrounds (deal pill, highlights) |
| `--accent-ink` | `#4a5706` | Accent-coloured **text and icons** on light backgrounds |
| `--on-accent` | `#1b1d14` | Text on accent fills. **Never white text on lime** (contrast fails) |
| `--offer` | `#c93a22` | **Deal pills (solid fill, white text, 5.1:1)**, sale prices, "Offer" tags, your-contribution slice, urgent timers |
| `--offer-soft` | `#fbe4dd` | Offer tag background |
| `--mine` | `#f2b632` | **Your contribution** (pie slice, progress segment, legend dot): warm yellow at ~70% opacity with a gentle pulse (opacity 0.55↔0.9, 1.6s ease-in-out, infinite); static 0.8 under reduced motion. Never red. |
| `--success` | `#2f7d4f` | Paid ticks |
| `--scrim` | `rgba(27,29,20,0.38)` | Modal/sheet dimming |

Dark mode: not required for the demo. Do not add it.

### Type

- Display and headings: **Bricolage Grotesque** (via `next/font/google`, variable weights), tight tracking (`-0.02em` at ≥24px, `-0.01em` at 18–22px), line-height 1.1.
- Body/UI: **Geist** (already loaded), tracking 0, line-height 1.45.
- All prices, timers, PINs and counts: `font-variant-numeric: tabular-nums`. Timers and PINs may use Geist Mono.
- Scale (px), **compact, Deliveroo-like density**: 11 caption, 12 meta, 14 body, 15 emphasis, 18 section title, 24 screen title, 28 hero numbers (timers, PIN). Emphasise with weight before size.
- Body text min 14px; inputs 16px (prevents iOS zoom). Tighter spacing to match: card padding 12px, section gaps 24px, round buttons 40px visible with a 44px hit area.
- **No truncation with "…"**: any single-line text that overflows its container (location name in the location pill, collection points, restaurant and item names on cards, etc.) uses the shared `Marquee` primitive: if it overflows, it pauses ~1.5s, scrolls slowly (~30px/s) to reveal the end, pauses, scrolls back, repeats; text that fits never moves. Under `prefers-reduced-motion` it wraps instead.

### Shape, space, depth

- Radii: 12px (chips, steppers), 18px (cards), 24px (sheets, image tiles), 999px (pills, round buttons).
- Spacing on a 4px grid. Screen side padding 16px. Sections separated by 28–32px; groups inside a section 12px.
- Shadows only on floating layers (bottom bar, sheets, popups, floating bubbles): soft, offset downward, e.g. `0 8px 24px -8px rgba(27,29,20,0.18), 0 2px 6px -2px rgba(27,29,20,0.08)`. Cards on the page use a 1px `--line` border, no shadow.
- **Glass controls.** Every round icon button (account, create +, bell, location, back, search, info), the Home search bar, and the big action buttons (Join party, Create party, Accept and pay) are **clear glass**: `background: rgba(255,255,255,0.5); backdrop-filter: blur(20px) saturate(180%)`, a 1px `rgba(255,255,255,0.75)` border with a brighter top edge (inset highlight `inset 0 1px 0 rgba(255,255,255,0.9)`), and the floating shadow. Icons and labels are `--ink`; the create button's `+` is `--accent-ink` so it still reads as primary. Big glass action buttons stay prominent through size (56px tall), bold 17px label and a lime price chip on the right ("£7.29" on `--accent`). Solid fallback under `prefers-reduced-transparency`. The menu's "View basket" bubble and the your-party card are **not** glass.
- **Deal pills** are solid `--offer` red with white bold text everywhere (cards, menu, create page).
- Floating chrome (top bars, bottom bar, sticky info bubble) is **translucent material**: `background: rgba(247,245,236,0.78); backdrop-filter: blur(20px) saturate(160%)` with content scrolling underneath, per apple-design §12. Provide a solid fallback under `prefers-reduced-transparency: reduce`.
- Hairline dividers between menu rows, not boxes around every row (avoid cards inside cards).

### Icons

Use `lucide-react` (install it) at 20px, stroke 1.75, `currentColor`. No emoji in UI chrome. Emoji may remain only as image fallbacks.

### Images

Every restaurant has a hero `image` and most menu items have an `image` under `public/images/`. Always render images with `next/image` (or `<img>` with explicit width/height) inside a fixed aspect-ratio frame with `--surface-2` background and `object-fit: cover`, so a missing file never breaks layout. If an item has no image, use a tinted tile with the restaurant's emoji centred.

### Logo (wireframe 14)

A "big mouth" mark: a bold, open C-shaped mouth (think a wide, round chomp shape opening to the right, with a single tooth notch or tongue curve so it reads as a mouth, not the letter C), filled `--accent` with an `--ink` outline or vice versa, beside a heavy rounded **BULK** wordmark in Bricolage Grotesque ExtraBold with tight tracking. Build it as an inline SVG React component `components/brand/Logo.tsx` with props `size` and `variant: "full" | "mark"`. Also produce `app/icon.svg` (the mark) so it becomes the favicon, and remove `app/favicon.ico`.

## 4. Motion (from animate.md / apple-design.md)

- Library: `motion` (import from `motion/react`) for springs, layout animation, exits. Bottom sheets: `vaul` (`Drawer`). Both are installed.
- Default spring: `{ type: "spring", bounce: 0, duration: 0.4 }`. Sheets/drawers: `{ type: "spring", bounce: 0.15, duration: 0.35 }` only when dragged.
- Press feedback on every tappable: `active:scale-[0.97]` with `transition-transform duration-100 ease-out`. Hover styles only inside `@media (hover: hover) and (pointer: fine)`.
- Enter = ease-out; never `ease-in` on entrances; never animate from `scale(0)` (start at 0.95 + opacity 0).
- **The authored moments** (spend the delight budget here, nowhere else): (1) the "Party filled!" popup, (2) the progress bar/pie filling as people join, (3) the item `+` morphing into the `− n +` stepper, (4) the info bubble docking into the top bar on scroll, (5) the courier moving on the live map. Everything else is quiet.
- Respect `prefers-reduced-motion: reduce`: replace movement with short opacity cross-fades.
- Mobile-native fixes (mobile-native.md): `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` on buttons, `user-select: none` on buttons, `100dvh`, `overscroll-behavior-y: none` on body, safe-area insets on bottom bars (`padding-bottom: max(12px, env(safe-area-inset-bottom))`), `viewport-fit=cover`, `theme-color` `#f7f5ec`.
- Theme browser surfaces: `::selection` in `--accent-soft`, focus ring `2px solid var(--accent-ink)` offset 2px via `:focus-visible`, caret `--accent-ink`.

## 5. App shell

- Phone-first. On a real phone the app fills the screen. On wider screens (the laptop demo) the app renders inside an **iPhone 16 Pro frame: a 402×874 viewport** with ~55px rounded corners and a thin dark bezel, centred on a sand background, scaled down uniformly (CSS transform) when the window is too short to fit it with margins. The frame is the containing block for everything fixed (`transform` on the frame) and the portal container for vaul sheets, dialogs/popups and toasts, so nothing escapes the phone.
- **Fake iOS status bar inside the frame** (frame mode only; on a real phone use `env(safe-area-inset-top)` instead): 62px top safe area; left: live 24h clock (e.g. "01:47", the viewer's real time) + location arrow; centre: Dynamic Island pill (~125×37px, black, 11px from top); right: signal bars, Wi-Fi, battery (65%). It overlays content at the top of the frame. Full-bleed heroes (menu restaurant image) extend under it; every top bar and screen content starts below the 62px safe area. Status bar glyph colour adapts: white over photos (screens report this, e.g. the menu while the hero is under it), `--ink` over cream. Sheets and popups render beneath the status bar.
- No global header: each screen owns its top bar (the wireframes differ per screen).
- `components/PartyAlerts.tsx` is mounted once in the layout and renders the global popups (wireframes 11 and 12) on any screen.
- Demo controls move **off the main screens**: they live inside the account sheet (bottom-left button on Home) under a "Demo controls" section, and are also toggled by pressing the `d` key anywhere. Keep the existing controls (pause bots, a bot won't accept, expire this party in 5s, reset demo) and add "Fill this party now" (bots join until the deal is reached) for a fast happy-path demo.
- Every simulated thing is labelled once where it matters: the pay sheet says "Simulated payment, no real money"; the live map says "Simulated delivery"; the account sheet says "Demo: sample restaurants and offers".

## 6. Screens (wireframe number → route → spec)

### W1 Home — `/`
- Top bar (translucent): left = location button: pin icon + current location name ("UCL Student Centre" default, label "Current location" above it in 12px `--ink-2`) + chevron; opens a bottom sheet listing 4 locations (the collection points) with "Current location" first. Right = bell button with an accent dot when there are unread notifications; opens a notifications sheet (deal reached, payment needed, order placed, on its way, ready to collect, cancelled), newest first, each linking to its party.
- **Highlights · n** (horizontal snap carousel, `scroll-snap-type: x mandatory`, `touch-action: pan-x pan-y`): parties at ≥75% of their deal. Card ~72% screen width: food image (top, 4:3) with a deal pill overlapping the image's bottom-right edge ("25% off", `--accent` fill, `--on-accent` text); below: restaurant name, "4.6 ★ (250)", est. delivery "25–35 min"; right side "£5 left" in bold with a small progress pie. Arrow button top-right of the section scrolls the carousel.
- **Other parties · n** (vertical list): wide card, food image left (square, ~96px), right column: timer "12:04 left", "3 in party", then the red deal pill directly **under the party count** (no tab on the card's top edge, so cards stack with even gaps); below image: restaurant name, "5.0 ★ (500) · 20–30 min"; right: "£24 / £50" and the progress pie.
- Parties you are already in stay in the lists with a small "You're in" pill and route to their status page.
- **Your-party card** (not in the hand-drawn wireframes; lead designer's spec): floats directly above the bottom bar for anyone in a non-terminal party (host or joiner). Same anatomy as an "Other parties" card (image left, details, progress pie right) but compact (one 76px row) and **solid `--accent` lime with `--ink` text**, radius 22px, floating shadow. Eyebrow 11px uppercase "Your party · Host" (or "Your party"); restaurant name 15px semibold; status line 13px that changes with the party: open → "£8 left · 12:04 left"; deal reached → "Accept and pay · 0:47" (in `--offer`, bold); paid waiting → "Paid · waiting for 2 others"; preparing/on its way → "On its way · arrives 19:40"; delivered → "Ready to collect · PIN 4821". Right side: progress pie (open) or chevron. Tap → `/party/[id]/status`. Multiple parties: show the most urgent first (pay now > on its way > ready > filling) with page dots; swipe sideways (scroll-snap) for the others. Enters with a spring slide-up when you join/create; a single soft pulse when its status changes. List bottom padding accounts for it.
- Top bars stay as translucent bars (title + buttons inside the bar); only bottom controls float.
- Bottom controls: **no bar**. No background strip, border or blur band; the three controls float individually over the scrolling content as separate clear-glass objects (fixed, safe-area aware, stay while scrolling): account button (left, round), search field (centre, pill, filters the lists live by restaurant, cuisine or dish name; empty state "No parties match 'xyz'"), create button (right, round, `--accent` fill, `+` icon) → `/create`.
- Empty state for no parties: illustration-free, one line + "Create a party" button.

### W2–W3 Party menu (join) — `/party/[id]`
- Hero: restaurant image full-bleed (16:10) with floating round buttons over it: back (left), search (right) and more "…" (right; opens a sheet with deal terms, collection point details/access notes, and "Leave party" if you're in it).
- Under the hero: restaurant name (26px display), location/area line, "★ 4.1 Good (20)", truck icon "Delivers in 25–35 min".
- **Info bubble** (pill card): left "£X left" with a thin accent progress bar under the amount (bar = how much is left to unlock the deal), divider, pin + collection point, divider, live countdown. When it scrolls past the top, a **compact copy floats at the top as its own clear-glass pill** between floating glass back and search buttons (no bar strip behind them), and the "…" button disappears (W3). Same for the host pills on W8. This is the one exception to "top bars stay bars". Implement with an IntersectionObserver sentinel; the docked version animates in with opacity + 6px translateY, 200ms ease-out.
- **Top picks**: horizontal row of item tiles (square image, round `+` button bottom-right of the image, name, price, optional sale price in `--offer` with the original struck through, one-line description truncated).
- Full menu list grouped by category (Mains, Sides, Drinks): name, price, optional description; `+` on the right.
- Item control (W3): `+` (outline) → tap adds 1 and the button fills with `--accent` showing the count; tapping the filled count expands into a `− n +` stepper (motion layout animation); `−` shows a trash icon when qty is 1. The stepper collapses back to the count bubble after 3s idle or when another item is tapped.
- Search (top bar button) filters the menu in place.
- **Bottom bubble** appears (slide up 12px + fade, spring) once your basket has items: left segment `[n] View basket · £10.00` with sub-label "deal not added yet" (or "deal unlocks at £40"); right segment is the **Deal pill** ("25% off") which opens a small sheet explaining the deal: "25% off when the party spends £50. £14 to go. Discount is applied to everyone's food when the party fills."
- If you are not yet in the party, adding the first item joins you (dispatch JOIN then ADD_ITEM). Removing your last item before finalising leaves the party automatically (backend handles it).
- If the party is no longer open, redirect to its status page.

### W4 Basket — `/party/[id]/basket` (join) and `/create/[restaurantId]/basket` (host draft)
- Top bar: back (left), "Your order" title (centre), close X (right, back to Home).
- Summary block: restaurant name, pin + collection point, clock + "Est. delivery 25–35 min", people icon + "4 in party · closes in 5:37" (live). Right: deal card "25% off" with a **contribution pie**: the pie shows the party's progress towards the threshold *including your basket*, with your basket's share as an `--offer` slice and the rest `--accent`; label "75%".
- "Your basket": rows `1×  Name ……… £9.00` with tap to edit quantity (same stepper), "+ Add items" button (back to menu).
- "Add ons": horizontal tiles of sides/drinks with `+`.
- "Add disposable cutlery" with a switch (stored per participant).
- Price breakdown (small, above the CTA): Food, Group deal (25% off, "when the party fills"), Delivery share (£3.49 ÷ n), **Estimated total**. Note under it: "Final total is confirmed when the party fills."
- Bottom CTA (full-width, accent): join mode **"Join party · £7.29"**; host draft mode **"Create party · £7.29"** (creates the party with the draft's collection point and duration, finalises the host's basket, goes to status).
- Empty basket → CTA disabled with "Add something to join".

### W5 Party status: filling — `/party/[id]/status`
- Top bar: home button (left), restaurant name, **info button** (right, lucide `Info` icon, aria-label "More information"): sheet with party details (restaurant, deal terms, collection point + access note), "How it works" (party fills → 60s to accept and pay → one second round if someone drops out → otherwise cancelled, nobody charged), then actions: "Share party link" (copies URL, toast), "Report a problem" (simulated: "Thanks, we've logged this" toast), "Leave party" (only while open and not host).
- Section "Filling the party" with "📍 Collection point name" on the right (pin icon, not emoji).
- Timer card: big countdown (34px tabular) left, "75% filled" + progress pie right.
- Caption: "We'll notify you when the deal is reached."
- "Order": your items with prices; then Group deal (25% off) −£x, Delivery share £x, **Total** (projected; label "Estimated").
- "Party" section (never "Group"): members with "Host" tag; you shown as "You"; members still choosing shown as "choosing…". **If you are the host and nobody else has joined, hide the whole Party section**; it appears (animated in) when the first person joins. Same rule on W9 and W10.
- Bottom: "Back to home" button (secondary, with home icon).

### W9 Party status: deal reached, accept and pay — same route, status `deal_achieved`
- Card at top: tag icon + "Deal reached!" and "Everyone must accept in 0:47" (live countdown). If this is the fallback round, the card instead says "Second round: Aisha didn't accept. Totals updated, accept again in 0:47."
- "Order" breakdown with exact totals.
- "Party": members with "Paid ✓" (`--success`) or "Pending"; pending members sort to the bottom.
- Bottom: **"Accept and pay · £7.29"** opens the simulated pay sheet (vaul drawer): "Simulated payment, no real money", demo card •••• 4242, "Pay £7.29", and a quiet "Decline" text button (declining removes you; confirm first).
- After you pay: CTA becomes "Paid, waiting for 2 others".

### W10 Party status: paid, on its way — statuses `confirmed`, `preparing`, `out_for_delivery`, `delivered`
- Top bar: restaurant name, help button.
- Status row: current status text ("Order placed" → "Preparing" → "On its way" → "Ready to collect") and "Arrives ~19:40" right; thin segmented progress bar under it (4 segments).
- **Live map** (only while `out_for_delivery`, slides open above "Collect from"): a stylised SVG map (cream streets on `--surface-2`, no real tiles), restaurant marker, collection-point marker, a dashed route, and a courier dot moving along the route driven by `deliveryProgress(request, now)`. Corner label "Simulated delivery".
- "Collect from" + pin + collection point name + access note; right: **pickup PIN** as 4 digit tiles.
- "Order": items × qty, price line ("You paid £7.29").
- "Party": members with Host tag; `+` button on each non-friend member → becomes an "Added" pill (ADD_FRIEND). No button on yourself.
- Bottom-right: "Home" button.
- When `delivered`: title "Ready to collect" and a short line "Show your PIN at the collection point."

### W6 Create a party: choose restaurant — `/create`
- Top bar: close X (left), location name with chevron (centre-left, same location sheet as Home), search button (right) filtering the lists.
- **Featured** horizontal carousel (restaurants with `featured: true`): image tile with deal pill on its bottom edge, name, one meta line. Arrow button top-right.
- **Best deals near you**: list rows: square image left; name, "★ 4.7 · 0.4 mi", "Est. 25–35 min", red tag icon + "Offer: 25% off £50".
- Tapping a restaurant that already has an open party shows the **W13 popup** instead of opening the menu.

### W7–W8 Create a party: host menu — `/create/[restaurantId]`
- Same layout as W2/W3 (reuse the same components), but the info bubble is **interactive**: "Party lasts · 15 minutes ⌄" | "Collect from · Student Centre entrance ⌄". Tapping either opens a bottom sheet (W7) that dims the rest: "Party lasts" options 10/15/30/60 min; "Collection point" radio list of the 4 points with access notes; full-width "Apply" button. The docked compact bubble in the top bar (W8) shows both values and stays tappable.
- Items go into the **draft** basket (not a party yet).
- Bottom bubble: `[n] Create party · £10.00` with "deal not added yet", plus Deal pill. Tapping goes to the basket in host mode (`/create/[restaurantId]/basket`).

### W11 Popup: party filled — global
- Shown once per party when a party you're in reaches `deal_achieved`. Centred card over a blurred, dimmed background (`backdrop-filter: blur(8px)` on the scrim). Close X top-left. Large bell illustration (lucide `BellRing` at 88px in `--accent-ink` on an `--accent-soft` circle) that rings once (a 600ms rotate wobble, the delight moment). Title "Party filled!", sub "Confirm and pay within 0:58 to lock in 25% off." Button **"Go to order"** → `/party/[id]/status`.
- Also fire a browser Notification if permission was granted (existing behaviour).

### W12 Popup: order cancelled — global
- Same popup frame. Large X-in-circle icon (`--offer`). Title "Order cancelled". One line with the reason from `request.cancelReason`. "Nobody was charged." Button "Close" (→ Home if you're on that party's page). Shown once per party for `cancelled` or `expired` (expired title: "Party closed": "The deal wasn't reached before the timer ran out.").

### W13 Popup: party already exists — in the create flow
- Same popup frame. Large "!" in an `--accent-soft` circle. Title "There's already a party here". Sub "Join Slice House's party instead. It's £8 from the deal." Button "See party" → `/party/[id]`.

## 7. Data and state contract (backend agent implements, everyone codes against it)

All money integer pence. Existing helpers stay unless noted.

```ts
// lib/types.ts additions
interface Deal { label: string; short: string; minTotal: number; discountPct: number } // short: "25% off"
interface MenuItem { id; name; price; description: string; category: "main" | "side" | "drink"; image?: string; originalPrice?: number; topPick?: boolean }
interface Restaurant { id; name; cuisine; emoji; deliveryFee; deal; menu; image: string; area: string /* "Bloomsbury" */; rating: number; ratingCount: number; ratingLabel: string /* "Good" */; etaMin: [number, number] /* [25,35] */; distanceMiles: number; featured?: boolean }
interface PickupPoint { id; name; access: string /* "Inside the main doors, by the post room" */; lat?; lng? }
interface Participant { ...existing; cutlery: boolean; declined?: boolean }
type RequestStatus = existing union (unchanged)
interface OrderRequest { ...existing; round: 1 | 2; removedUserIds: string[]; removedNames: string[]; cancelReason?: string }
interface Draft { restaurantId: string; pickupPointId: string; durationMin: number; basket: BasketLine[]; cutlery: boolean }
interface AppState { requests; demo; draft?: Draft; friends: string[]; seenAlerts: string[]; location: string /* pickup point id used as "current location" */; readNotifications: string[] }
```

Actions (new or changed):
- `ADD_ITEM` / `REMOVE_ITEM` unchanged signature. **REMOVE_ITEM that empties an unfinalised non-host basket removes that participant.**
- `SET_CUTLERY { requestId, userId, cutlery }`.
- `DECLINE { requestId, userId, now }` during `deal_achieved`.
- `DRAFT_START { restaurantId }`, `DRAFT_ITEM { itemId, delta }`, `DRAFT_SET { pickupPointId?, durationMin?, cutlery? }`, `DRAFT_CLEAR`.
- `CREATE_FROM_DRAFT { id, user, now }`: creates the party from the draft, host basket finalised, clears draft. **Refuses (no-op) if the restaurant already has an open party.**
- `FILL_PARTY { requestId, now }` (demo): bots join with baskets until the threshold is reached.
- `ADD_FRIEND { userId }`, `MARK_ALERT_SEEN { key }`, `MARK_NOTIFICATIONS_READ`, `SET_LOCATION { pickupPointId }`.

Rules:
- **One party per restaurant**: `openPartyFor(state, restaurantId)` returns the open party or undefined.
- **Acceptance round (Google Doc spec §5)**: when the deal is reached everyone has `ACCEPT_WINDOW_MS` (60s) to accept and pay. The round resolves early once everyone has paid or declined. At resolution, if anyone declined or timed out: remove them (record ids/names). If this was round 1 **and** the remaining finalised spend still meets the threshold **and** someone remains, start **round 2**: reset everyone's `paid`, recompute totals (delivery share changes), new deadline. Otherwise status `cancelled` with `cancelReason` ("Not enough people accepted to keep the deal." / "The second round didn't complete."). If everyone pays → `confirmed` as today. Never more than one fallback round.
- `expired` keeps meaning "timer ran out before the deal was reached"; set `cancelReason` "The deal wasn't reached before the timer ran out."
- Delivery stages after `confirmed`: preparing at 4s, out_for_delivery at 10s, delivered at 30s (gives the live map ~20s).
- Selectors/helpers exported from `lib/`: `openPartyFor`, `progressOf(request, restaurant)` → `{ total, target, left, pct }`, `previewSplit(request, restaurant, userId, basket)` (cost as if your basket were finalised), `draftPreview(draft, restaurant)`, `deliveryProgress(request, now)` (0–1 within out_for_delivery), `notificationsFor(state)` → `{ key, requestId, title, body, at }[]`, `isHighlight(request, restaurant)` (pct ≥ 75 and open).
- Storage key bumps to `bulk-demo-v2`.

## 8. Seed data (backend agent)

8 restaurants near UCL with real-looking names (fictional), cuisines spread (pizza, ramen, burgers, curry, poke, Mexican, Chinese, Middle Eastern), each with 7–9 menu items across mains/sides/drinks, 3 marked `topPick`, 1–2 with `originalPrice` sale prices, short appetising descriptions. Deals range 15–25% off with £35–£55 thresholds. 6 open parties seeded with bots (1 per restaurant): 2 at ≥75% (highlights), 4 between 25% and 70%, timers 9–50 minutes. 2 restaurants without a party (for create). 3 restaurants `featured`. Collection points: "UCL Student Centre entrance", "Main Library entrance", "Ramsay Hall reception", "IOE Bedford Way lobby", each with an access note. Default location: Student Centre.

Images: source real, freely licensed food photos (Wikimedia Commons public-domain or CC-BY/CC-BY-SA, found via WebSearch/WebFetch of commons.wikimedia.org, downloading the `upload.wikimedia.org` file URL). One hero per restaurant (8) and one per top-pick item (~24, reuse is fine where dishes match). Resize to max 1200px wide hero / 600px items with `sips -Z`, convert to JPEG quality ~75 (`sips -s format jpeg -s formatOptions 75`), save under `public/images/restaurants/` and `public/images/items/`. Write `public/images/CREDITS.md` (file, source URL, author, licence). If a download fails, leave `image` undefined for that item (the UI falls back gracefully). Do not hotlink.

## 9. Engineering rules for every agent

- Only edit files you own (listed in your task). Do not edit `lib/` unless you are the backend agent. If you need something from another owner, code against the contract in §7 and note it in your report.
- Do **not** run `next build`, `next dev` or `next start` (other agents share this working tree). You may run `npx tsc --noEmit` and `npx eslint <your files>`; ignore errors in files you don't own. The backend agent runs `npx vitest run`.
- Do **not** commit. The lead designer reviews and commits.
- Client components use `useApp()` from `@/lib/store`. Keep pages thin; put screen parts in `components/<area>/`.
- Accessibility: every icon-only button has an `aria-label`; sheets/popups trap focus (vaul does for sheets; use a dialog element or focus management for popups) and close on Escape; tap targets ≥44px.
- No new dependencies beyond `lucide-react` (design-system agent installs it) without noting why.
- Write the current state only in comments; no "previously"/"changed from" comments.
