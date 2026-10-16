# Bulk components

Catalogue of the design-system primitives. Import everything from `@/components/ui`:

```tsx
import { Button, IconButton, Rating, Sheet, Stepper, toast } from "@/components/ui";
```

Icons come from `lucide-react`. A `LucideProvider` in the root layout makes every icon 20px with stroke 1.75, so just write `<MapPin />`. Override with a class (`className="size-4"`) only when a primitive doesn't size it for you.

## Tokens and utilities (app/globals.css)

| Kind | Classes |
| --- | --- |
| Colour | `bg-bg` `bg-bg-desk` `bg-surface` `bg-surface-hover` `bg-surface-2` `bg-surface-2-hover` `text-ink` `text-ink-2` `text-ink-3` `border-line` `border-line-strong` `bg-track` `bg-accent` `bg-accent-hover` `bg-accent-strong` `bg-accent-soft` `text-accent-ink` `text-on-accent` `bg-offer` `bg-offer-strong` `text-on-offer` `text-offer` `bg-offer-soft` `text-offer-ink` `bg-mine` `text-success` `bg-success-soft` `bg-scrim` `text-on-photo` |
| Palette | Lime-tinted neutrals derived from the accent: `--bg` #f4f5ee (app background) · `--surface` #ffffff (cards, sheets) · `--surface-2` #eaeddf (tiles, soft discs) · `--surface-hover` #fafbf6 · `--surface-2-hover` #e3e7d6 · `--line` #dfe3d2 · `--line-strong` #cfd4bf · `--track` #d8dccb (Switch off). `--accent` #b7cd32 lime with `--on-accent` ink (9.6:1), `--accent-ink` #4a5706 for lime-family text and icons. `--ink-3` #686b5d clears 4.5:1 on `--bg` (4.97:1) and `--surface-2` (4.59:1). The desk around the phone is deep olive `--bg-desk` #1f2318 with a faint `--bg-desk-glow` radial highlight behind the phone and `--desk-line` hairlines (`shadow-column`). |
| Your contribution | `--mine` #f2b632: your basket's share of the deal progress (pie slice, bar segment, legend dot). Always drawn with `animate-mine`: opacity 0.55↔0.9, 1.6s ease-in-out, infinite; static 0.8 under reduced motion. Never red. `ProgressPie`/`ProgressBar` `contribution` and `LegendDot` do this for you. |
| Offer reds | `--offer` #c93a22: deal pills (solid, `--on-offer` white text 5.1:1), sale prices, urgent timers on `--surface` or `--bg`. `--offer-ink` #a32a15: offer-coloured **text on tinted surfaces** (6.1:1 on `--surface-2`, 6.3:1 on `--accent-soft`, 6:1 on `--offer-soft`, 7.2:1 on `--surface`); `--offer` only reaches 4.3:1 on `--surface-2` and 4.46:1 on `--accent-soft`. `--offer-strong`: pressed deal pill. |
| Type | Compact, Deliveroo-like: `text-caption` 11 · `text-meta` 12 · `text-body` 14 (page default) · `text-emphasis` 15 · `text-section` 19 · `text-title` 24 · `text-hero` 28 (timers, PIN). Each carries its line-height (caption 1.3, meta 1.35, body 1.45, emphasis 1.35, section 1.2, title 1.1, hero 1.05) and tracking (caption +0.01em, section −0.01em, title/hero −0.02em). Typical: restaurant title `text-title`, item and restaurant names `text-body`/`text-emphasis` semibold, meta lines `text-meta`. Emphasise with weight before size. Inputs stay 16px (iOS zoom). `font-display` = Bricolage Grotesque, `font-sans` = Figtree (default; its digits are proportional, so every changing number needs `tnum`), `font-mono` = Geist Mono (PIN and timer tiles only). `h1`–`h4` default to the display face. |
| Spacing | 4px grid. Role tokens: `px-gutter` 16 (screen sides) · `p-card` 12 (card padding, `Card` default) · `gap-group` 12 (groups inside a section) · `gap-section` / `mt-section` 24 (between sections). Round buttons 40px visible, 44px hit area. |
| Numbers | `tnum` (tabular lining numerals) for prices, timers, PINs, counts. `Price`, `Countdown`, `Pill` and the `Stepper` count already apply it. Figtree's default digits are proportional, so a number that ticks without `tnum` jitters. |
| Radius | `rounded-chip` 12 · `rounded-card` 18 · `rounded-sheet` 24 · `rounded-popup` 28 · `rounded-full` |
| Depth | `shadow-float` (bottom bubble, floating buttons) · `shadow-sheet` · `shadow-popup`. Cards on the page get `border border-line`, never a shadow. |
| Material | `material` = translucent `--bg` (78%) + blur for floating chrome: top bars, bottom bar, sticky info bubble (solid under reduced transparency / more contrast). |
| Glass | `glass` = clear glass for controls: 50% white, `blur(20px) saturate(180%)`, 1px white edge with a brighter top highlight, floating shadow; hover/pressed washes built in; solid white with a `--line` edge under reduced transparency / more contrast. The edge is an inset shadow (no border), so it never changes a control's size, and it composes with `ring-*` (focus rings still show). Used by `IconButton` (default), `Button variant="glass"`, `SearchField tone="glass"` and the empty `Stepper variant="glass"`. Don't add `shadow-*` to it; it carries its own. Not for the menu's "View basket" bubble or the your-party card. |
| Layout | `max-w-column` (430px phone column) · `desk:` breakpoint (431px+: on wide touch screens the column sits on the olive `--bg-desk` with `--desk-line` side hairlines) · `frame:` variant (the laptop phone frame is showing: ≥500px wide with a precise pointer) · `pt-safe` (clears the status bar) · `pb-safe` (bars on the bottom edge, ≥12px) · `pb-safe-float` (controls floating just above the home indicator) · `min-h-app` / `h-app` (the app's viewport height: 874px in the frame, `100dvh` on a phone; `min-h-dvh` and `h-dvh` are mapped to it inside the frame) · `no-scrollbar` (carousels) |
| Safe areas | CSS variables `--safe-top` / `--safe-bottom` (62px / 34px in the frame, `env(safe-area-inset-*)` on a phone) and `--app-height`. TopBar, BottomBar, Sheet, Popup and toasts already use them; use them for anything else pinned to an edge. |
| Motion | `ease-out` / `ease-in-out` are the strong curves; `ease-drawer`. `animate-ring` = the bell wobble for the "Party filled!" popup (off under reduced motion). `animate-mine` = the your-contribution pulse. JS springs: `SPRING`, `SPRING_SNAPPY`, `SPRING_FILL`, `EXIT` from `@/components/ui`. |

Hover classes (`hover:`) only apply with a fine pointer, so they never stick on touch. Press feedback is built into every interactive primitive. `MotionConfig reducedMotion="user"` is set globally, so `motion` transforms fall back to fades for users who ask for reduced motion.

Helpers: `cn(...classes)`, `formatPrice(pence, { trim?, negative? })` → "£7.29" / "£24" / "−£4.00", `formatDuration(ms)` → "12:04", `describeDuration(ms)` → "12 minutes 4 seconds".

---

## Device frame (app shell)

`DeviceFrame` (`@/components/ui/DeviceFrame`, mounted once in the root layout) is the app shell:

- **Phone** (narrower than 500px, or a touch screen): no frame. The app fills the screen, the document scrolls, fixed layers sit on the viewport, safe areas come from the device.
- **Laptop** (`frame:`, ≥500px wide with a precise pointer): an **iPhone 16 Pro** (402×874 screen, 55px corners, thin black bezel, titanium rim with side buttons) centred on the deep olive `--bg-desk` (with a faint radial highlight) and scaled down uniformly to fit the window with 24px margins (recomputed on resize). The screen is the **containing block for every `position: fixed` layer** (TopBar `fixed`, BottomBar, sheets, popups, toasts all stay inside the phone) and the app scrolls inside it, not the window. A fake **iOS status bar** sits on top: live 24h clock (the viewer's time) with the location arrow, the Dynamic Island (125×37, 11px from the top), cellular, Wi-Fi and a 65% battery. A home indicator (134×5, 8px from the bottom) sits over everything. The "d" demo panel renders outside the phone, bottom-right of the window.

Layers above the app inside the phone: sheets `z-50` · toasts `z-[55]` · popups `z-[60]` · status bar and home indicator `z-[65]`.

### Status bar tone

```tsx
useStatusBarTone(heroUnderStatusBar ? "light" : "dark"); // white glyphs while a photo is under the status bar
```

`dark` (ink) is the default. Call it on every render with the current value; the most recent caller wins and it resets when the component unmounts. Full-bleed heroes extend under the status bar (start at `top: 0`, and push their content down with `pt-safe` or `var(--safe-top)`).

### Scrolling (use these instead of `window`)

In the laptop frame the window never scrolls; the phone screen's scroller does. These helpers work in both modes:

| Helper | Use |
| --- | --- |
| `useScrolled()` | true once the app has scrolled off the top |
| `getScrollRoot()` | the element that scrolls (frame scroller, or `document.scrollingElement`) |
| `getScrollTop()` | replaces `window.scrollY` |
| `scrollRootTo({ top, behavior })` | replaces `window.scrollTo` |
| `scrollTopOf(element)` | element's top in scroll coordinates, e.g. `scrollRootTo({ top: scrollTopOf(menu) - headerHeight })` |
| `subscribeScroll(notify)` | listens to the app's (and any element's) scroll; returns unsubscribe |
| `useScrollRoot()` | IntersectionObserver `root`: the frame scroller, or `null` (viewport) on a phone |
| `useFrame()` | `{ framed, scale }`; divide `getBoundingClientRect()` lengths by `scale` to get CSS px inside the phone (`getFrameScale()` outside React) |

```tsx
const root = useScrollRoot();
useEffect(() => {
  const io = new IntersectionObserver(cb, { root, rootMargin: `-${headerHeight}px 0px 0px 0px` });
  io.observe(sentinel.current!);
  return () => io.disconnect();
}, [root, headerHeight]);
```

### Portals

`usePortalContainer()` returns the layer inside the phone screen. `Sheet`, `Popup` and the toaster already render there; pass it as `container` to anything else you portal (e.g. `createPortal(node, container ?? document.body)`).

---

## Button

Pill button. Variants `primary` (lime) · `secondary` (white + hairline) · `ghost` · `danger` (quiet tomato text) · `glass` (clear glass big action: Join party, Create party, Accept and pay). Sizes `sm` 32 (12px label, 44 hit area) · `md` 44 (14px) · `lg` 52 (15px). A label too long for the button scrolls (Marquee), never "…". Pass `href` to render a Next `Link`.

| Prop | Type | Notes |
| --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger" \| "glass"` | default `primary` |
| `size` | `"sm" \| "md" \| "lg"` | default `md`; `lg` (52) for `glass` |
| `block` | `boolean` | full width |
| `icon` | `ReactNode` | before the label |
| `trailing` | `ReactNode` | pinned right as plain text, e.g. the price on a lime CTA |
| `chip` | `ReactNode` | lime price chip pinned right (36px, bold 15px on `--accent`, ink text); the label moves left. `--surface-2` while disabled. Made for `glass` |
| `loading` | `boolean` | spinner, keeps width, ignores presses |
| `disabled` | `boolean` | quiet `--surface-2` fill |
| `href` | `string` | renders a Link |

Glass action: 52px, bold 15px `--ink` label on the left, lime price chip on the right.

```tsx
<Button variant="glass" block chip={formatPrice(729)} onClick={join}>Join party</Button>
<Button variant="glass" block chip="£7.29" onClick={openPay}>Accept and pay</Button>
<Button size="lg" block trailing={formatPrice(729)} onClick={join}>Join party</Button>
<Button size="lg" block disabled>Add something to join</Button>
<Button variant="secondary" icon={<House />} href="/">Back to home</Button>
<Button variant="danger" size="sm" onClick={decline}>Decline</Button>
```

`buttonClasses({ variant, size, block })` returns the class string for custom elements.

## IconButton

Round icon-only button, **40px visible with a 44px hit area** (an invisible `::before` ring), **clear glass by default** (account, create, bell, location, back, search, info, more: on the page and over photos). `aria-label` is required by the type.

| Prop | Type | Notes |
| --- | --- | --- |
| `aria-label` | `string` | required |
| `variant` | `"glass" \| "plain" \| "soft" \| "outline" \| "accent"` | default `glass`; `soft` = `--surface-2` disc for close buttons inside sheets and popups; `outline` = white + hairline (add-friend); `plain` = no surface; `accent` = solid lime disc |
| `iconColor` | `"ink" \| "accent"` | overrides the variant's icon colour; `accent` = `--accent-ink`, so the glass create button still reads as primary |
| `size` | `"sm" \| "md" \| "lg"` | 32 · 40 (default) · 44; every size has a 44px hit area |
| `badge` | `boolean` | lime dot with an `--accent-ink` edge (unread notifications) |
| `href` | `string` | renders a Link |

```tsx
<IconButton aria-label="Back" onClick={() => router.back()}><ArrowLeft /></IconButton>
<IconButton aria-label="Notifications" badge={unread > 0} onClick={openNotifications}><Bell /></IconButton>
<IconButton aria-label="Create a party" iconColor="accent" href="/create"><Plus strokeWidth={2.25} /></IconButton>
<IconButton aria-label="More" className="absolute top-3 right-3"><Ellipsis /></IconButton>
<IconButton aria-label="Close" size="sm" variant="soft"><X /></IconButton>
```

Passing `absolute` / `fixed` / `sticky` in `className` positions it (Button, IconButton, DealPill and Stepper all respect this).

## Pill / DealPill

`Pill`: static label. Tones `neutral` · `outline` (Host) · `accent` · `soft` (You're in) · `offer` (Offer) · `success` (Paid) · `ink` (Added). Sizes `sm` 20 (11px) · `md` 24 (12px). Optional `icon`.

```tsx
<Pill tone="outline">Host</Pill>
<Pill tone="soft">You're in</Pill>
<Pill tone="success" icon={<Check />}>Paid</Pill>
<Pill tone="offer" icon={<Tag />}>Offer</Pill>
```

`DealPill`: the "25% off" badge, **solid `--offer` red with bold white (`--on-offer`) text everywhere** (cards, menu, create page, bottom bubble). `label` (use `restaurant.deal.short`), `size` `sm` 20 (11px, cards) · `md` 28 (12px, default) · `lg` 36 (14px), `withIcon` (percent badge). With `onClick` it becomes a button (opens the deal sheet; pressed `--offer-strong`; 44px tall hit area). Add `ring-3 ring-bg` (or `ring-surface` on a card) when it overlaps an image edge. No colour overrides needed.

```tsx
<DealPill label={restaurant.deal.short} size="sm" className="absolute -bottom-3 right-3 ring-3 ring-surface" />
<DealPill label={restaurant.deal.short} size="lg" onClick={() => setDealOpen(true)} />
```

## ProgressBar

Fill springs to new values (first paint is static). With `contribution`, your share continues the fill as a pulsing `--mine` segment.
When the total passes `max`, the party's share keeps its true size and your contribution fills the rest up to 100%.

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `number` | total including your contribution, same unit as `max` |
| `max` | `number` | default 100, so `value={pct}` works |
| `contribution` | `number` | your basket's share (the last part of `value`), drawn in `--mine` |
| `size` | `"hairline" \| "sm" \| "md"` | 3px · 6px · 8px |
| `tone` | `"accent" \| "ink" \| "offer"` | |
| `label`, `valueText` | `string` | accessible name and spoken value |

```tsx
const p = progressOf(request, restaurant);
<ProgressBar value={p.total} max={p.target} label="Deal progress" valueText={`${formatPrice(p.total, { trim: true })} of ${formatPrice(p.target, { trim: true })}`} />
<ProgressBar value={preview.total} max={p.target} contribution={myBasket} size="md" label="Deal progress" />
```

## ProgressPie

SVG pie from 12 o'clock: the party's spend in lime, then **your contribution** as a pulsing `--mine` yellow slice (never red).
When the total passes `max`, the party's share keeps its true size and your contribution fills the rest up to 100%.

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `number` | progress including your contribution |
| `max` | `number` | default 100 |
| `contribution` | `number` | your basket's share, same unit, drawn in `--mine` |
| `size` | `number` | px, default 28 |
| `label` | `string` | default "75% filled" |

```tsx
<ProgressPie value={p.total} max={p.target} />                                  // card
<ProgressPie value={preview.total} max={p.target} contribution={myBasket} size={56} />  // basket deal card
```

`LegendDot` (8px) labels the segments: `tone` `mine` (pulsing yellow, default) · `accent` · `track`.

Every `--mine` pulse (pie slice, bar segment, legend dot) is phase-locked to the document timeline, so all of them breathe together whenever they mount.

```tsx
<span className="flex items-center gap-1.5 text-meta text-ink-2"><LegendDot />Your basket £9.00</span>
```

## Marquee

Single-line text that never truncates with "…". If it fits it is static. If it overflows it rests 1.5s, scrolls at 30px/s (linear) to reveal the end, rests, scrolls back, and repeats, with soft edge fades only on the side that is cut off (only while overflowing). It pauses while off screen and while its card, row or button is hovered or focused, and resumes afterwards. Under reduced motion it wraps onto more lines instead. The text is in the DOM once. Use it for any single line that matters: location and collection-point names, restaurant and item names on cards, titles. `TopBar` titles, `Button` labels and `LocationButton` already use it.

```tsx
<Marquee as="h3" className="text-emphasis font-semibold text-ink">{restaurant.name}</Marquee>
<Marquee className="text-meta text-ink-2">{pickup.name}</Marquee>
```

Props: `children`, `as?` (`span` default, `p`, `div`, `h1`–`h4`), `className?` (typography and layout; it is a block that shrinks in flex rows), `speed?` (px/s, 30), `pause?` (ms, 1500), `fade?` (px, 12). Put it in a parent that constrains its width (`min-w-0` flex child).

## Countdown

Live `m:ss` (or `h:mm:ss`) with tabular digits; turns urgent under 60s. Pass `now` from `useApp()`. The urgent colour wins over a text colour in `className` (it is applied through `data-urgent`), so `className="text-ink"` stays ink until the last minute.

```tsx
const { now } = useApp();
<Countdown until={request.expiresAt} now={now} suffix="left" />
<Countdown until={request.acceptDeadline!} now={now} className="text-hero font-semibold" />
<Countdown until={deadline} now={now} urgentTone="offer-ink" />  // on --accent-soft or another tint
```

Props: `until`, `now`, `suffix?`, `urgentBelowMs?` (default 60000, 0 = never), `urgentTone?` (`offer` default, on `--surface` or `--bg` · `offer-ink` on tinted surfaces), `mono?`, `className?`.

## Price

```tsx
<Price pence={item.price} originalPence={item.originalPrice} />  // "£8.59 £14.00" (sale in --offer, original struck)
<Price pence={discount} negative />                             // "−£4.00"
<Price pence={p.left} trim />                                    // "£8"
```

Props: `pence`, `originalPence?`, `trim?`, `negative?`, `className?`, `originalClassName?`.

The struck original renders at `text-caption` (11px) in `--ink-3`; `originalClassName` overrides it (e.g. `text-meta` next to larger prices).

## Rating

Restaurant rating, one size (12px) and colour on every screen: filled `--accent-ink` star, number (semibold ink), optional label and review count (`--ink-2`). Read aloud as "Rated 4.6 out of 5, Good, 250 reviews".

```tsx
<Rating value={r.rating} count={r.ratingCount} />                      // ★ 4.6 (250)   cards
<Rating value={r.rating} label={r.ratingLabel} count={r.ratingCount} /> // ★ 4.1 Good (20)   menu header
<Rating value={r.rating} />                                             // ★ 4.7   create rows
```

Props: `value`, `count?`, `label?`, `className?` (layout only; don't restyle size or colour).

## ImageFrame

Fixed aspect-ratio image (next/image, cover) on a `--surface-2` tile. Files are served as-is (`images.unoptimized` in next.config.ts; they are pre-sized JPEGs), fade in over 150ms on first load and appear at once when cached; missing or broken files show the `emoji` centred instead. Clips its children, so wrap it in a `relative` div if something must overlap its edge.

| Prop | Type | Notes |
| --- | --- | --- |
| `src` | `string?` | path under /public |
| `alt` | `string` | |
| `ratio` | `string` | CSS ratio, default `"4/3"` (`"1/1"`, `"16/10"`) |
| `emoji` | `string?` | fallback |
| `radius` | `"none" \| "chip" \| "card" \| "tile"` | default `tile` (24) |
| `sizes` | `string` | pass the rendered width for small tiles (`"96px"`) |
| `priority` | `boolean` | above the fold (hero, first carousel cards): eager, high fetch priority, preloaded. Passed to next/image as `priority` |
| `preload` | `boolean` | same as `priority` |
| `children` | | overlays, positioned by you |

```tsx
<ImageFrame src={restaurant.image} alt={restaurant.name} ratio="16/10" radius="none" emoji={restaurant.emoji} priority />
<ImageFrame src={item.image} alt={item.name} ratio="1/1" emoji={restaurant.emoji} sizes="160px">
  <Stepper qty={qty} label={item.name} size="sm" variant="glass" onAdd={add} onRemove={remove} className="absolute right-2 bottom-2" />
</ImageFrame>
```

## Sheet

Bottom sheet (vaul): handle, scrim, title (18px), optional description and pinned footer, body scrolls on its own, focus trap, Escape and drag to close. Renders inside the phone (portal layer), stops 8px below the status bar and pads clear of the home indicator. Body and header gutters are 20px (`-mx-5` bleeds a row to the sheet edges).

| Prop | Type | Notes |
| --- | --- | --- |
| `open`, `onOpenChange` | | controlled |
| `trigger` | `ReactNode` | for uncontrolled use |
| `title` | `string` | required (announced) |
| `hideTitle` | `boolean` | visually hidden title |
| `description` | `ReactNode` | one line under the title |
| `footer` | `ReactNode` | pinned below the body |
| `showClose` | `boolean` | default true |
| `dismissible` | `boolean` | default true |
| `onClosed` | `() => void` | after the close animation |
| `className` | `string` | body classes |

```tsx
<Sheet
  open={open}
  onOpenChange={setOpen}
  title="Party lasts"
  footer={<Button block size="lg" onClick={apply}>Apply</Button>}
>
  …options…
</Sheet>
```

## Popup

Centred dialog over a blurred, dimmed backdrop, inside the phone. Close X top-left, large icon on a 120px tinted disc (icon sized to 76px for you), title (24px), description, action. Focus moves to the first action on open (the close X when there is none), is trapped while open, and returns to the element that opened it on close. Escape closes, card springs in from 0.95. Use for W11, W12 and W13.

| Prop | Type | Notes |
| --- | --- | --- |
| `open`, `onOpenChange` | | controlled |
| `icon` | `ReactNode` | e.g. `<BellRing className="animate-ring" />` |
| `iconTone` | `"accent" \| "offer" \| "none"` | disc colour |
| `title` | `string` | |
| `description` | `ReactNode` | |
| `children` | `ReactNode` | extra body |
| `action` | `ReactNode` | buttons; the first enabled button or link receives focus on open |
| `dismissible` | `boolean` | default true |

```tsx
<Popup
  open={open}
  onOpenChange={setOpen}
  icon={<BellRing className="animate-ring" />}
  title="Party filled!"
  description={<>Confirm and pay within <Countdown until={deadline} now={now} /> to lock in {deal.short}.</>}
  action={<Button block size="lg" href={`/party/${id}/status`}>Go to order</Button>}
/>
<Popup open={cancelled} onOpenChange={close} icon={<CircleX />} iconTone="offer" title="Order cancelled" description={reason}
  action={<Button block size="lg" variant="secondary" onClick={close}>Close</Button>} />
```

## Stepper

Item quantity control (W3). `+` adds the first one and fills lime with the count; tapping the count expands to `− n +` (trash at 1). Collapses after 3s idle (never while keyboard focus is inside), when focus leaves it, when another Stepper opens or a first item is added elsewhere, on Escape, and when the last one is removed. Quantity changes are announced once through the shared `announce()` live region mounted in `DeviceFrame` (`Announcer` and `announce` are exported from `@/components/ui`), so a dish shown in two places announces once. Grows leftward from its right edge without pushing layout, so give it a right-aligned spot. Buttons enter and leave from scale 0.95 + opacity.

Open state can be **controlled** so a row tap opens it: pass `open` + `onOpenChange` (the stepper still asks to close through `onOpenChange(false)` in every case above). `defaultOpen` opens an uncontrolled stepper on mount. Open only applies while `qty > 0`.

Sizes: `sm` 28px (over image tiles), `md` 32px (rows). Hit areas: collapsed, the circle's target extends to 44px all round. Expanded, each button is 36px (sm) / 40px (md) wide with a 44px tall target, and `−` / `+` reach past the pill's ends to 44px wide. Expanded width: sm 108px, md 120px. The pill does not clip, so focus rings and hit areas are whole; leave room for the hit area past the pill's edge (an `ImageFrame` clips it at the tile edge).

| Prop | Type | Notes |
| --- | --- | --- |
| `qty` | `number` | your quantity |
| `onAdd`, `onRemove` | `() => void` | dispatch ADD_ITEM / REMOVE_ITEM (or DRAFT_ITEM) |
| `label` | `string` | item name for screen readers |
| `size` | `"sm" \| "md"` | 28 over tiles · 32 in rows |
| `open`, `onOpenChange` | `boolean`, `(open) => void` | controlled expanded state |
| `defaultOpen` | `boolean` | uncontrolled initial expanded state |
| `variant` | `"outline" \| "glass"` | look of the empty `+` (clear glass over photos) |
| `disabled` | `boolean` | |

```tsx
<Stepper qty={qtyOf(item.id)} label={item.name} onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />

// Basket row: tapping the row opens the stepper.
const [editing, setEditing] = useState<string | null>(null);
<button onClick={() => setEditing(line.itemId)}>…</button>
<Stepper qty={line.qty} label={name} onAdd={add} onRemove={remove}
  open={editing === line.itemId} onOpenChange={(o) => setEditing(o ? line.itemId : null)} />
```

## Switch

iOS-style toggle (`role="switch"`). With `label` the whole row is tappable.

```tsx
<Switch label="Add disposable cutlery" checked={cutlery} onCheckedChange={setCutlery} />
<Switch aria-label="Pause bots" checked={paused} onCheckedChange={setPaused} />
```

Props: `checked`, `onCheckedChange`, `label?`, `description?`, `aria-label?`, `disabled?`, `className?`.

## TopBar

Sticky translucent bar: a 48px row of left / centre / right slots below the status bar (`--safe-top`, at least 8px), its material also covering the status bar area. A hairline fades in once content scrolls under it. Buttons in the slots are 8px apart, 16px from the edges (the screen gutter).

| Prop | Type | Notes |
| --- | --- | --- |
| `left`, `right` | `ReactNode` | buttons |
| `title` | `ReactNode` | short centred title (15px display semibold); scrolls (Marquee) if it doesn't fit |
| `center` | `ReactNode` | flexible centre content (docked info bubble) |
| `position` | `"sticky" \| "fixed"` | `fixed` floats over a hero |
| `material` | `boolean` | default true; set false while floating over a hero, true once docked |
| `divider` | `"scroll" \| "always" \| "never"` | default `scroll` |
| `children` | `ReactNode` | optional second row |

```tsx
<TopBar left={<LocationButton />} right={<IconButton aria-label="Notifications" badge={unread}><Bell /></IconButton>} />
<TopBar left={backButton} title="Your order" right={closeButton} />
<TopBar position="fixed" material={docked} left={back} center={docked ? <CompactBubble /> : null} right={…} />
```

`useScrolled()` returns true once the app has scrolled off the top (frame-aware, see Device frame).

## BottomBar

Fixed to the bottom of the phone, safe-area aware (`--safe-bottom`). Reserves its own height in the flow so content always scrolls clear of it. It renders in place on mount (no entrance on navigation or status view changes); turning `show` from false to true slides it up 12px and fades it in, and turning it false slides it back down. Two modes:

- **Material bar** (default): translucent strip with a top hairline, content padded clear of the home indicator.
- **Floating** (`material={false}`): no strip, border or blur band. Each child floats on its own just above the home indicator (clear-glass buttons, the Home search field, the basket bubble, a glass action button), and taps between them reach the page. Home's account / search / create row and every big glass action use this.

| Prop | Type | Notes |
| --- | --- | --- |
| `show` | `boolean` | default true |
| `material` | `boolean` | default true; `false` = floating mode |
| `divider` | `boolean` | top hairline (with material) |
| `className` | `string` | inner row classes |

```tsx
<BottomBar material={false} className="flex items-center gap-2">
  <IconButton aria-label="Account" onClick={openAccount}><UserRound /></IconButton>
  <SearchField tone="glass" value={q} onValueChange={setQ} placeholder="Search parties" className="flex-1" />
  <IconButton aria-label="Create a party" iconColor="accent" href="/create"><Plus /></IconButton>
</BottomBar>

<BottomBar show={count > 0} material={false}>
  <div className="flex h-14 items-center rounded-full bg-ink text-bg shadow-float">…View basket… <DealPill … /></div>
</BottomBar>

<BottomBar material={false}>
  <Button variant="glass" block chip={formatPrice(729)} onClick={join}>Join party</Button>
</BottomBar>
```

## Divider

`<Divider />` 1px `--line` hairline between rows; `inset` indents 16px; `orientation="vertical"` for the info bubble separators.

## SectionHeader

```tsx
<SectionHeader title="Highlights" count={highlights.length} onArrowClick={scrollNext} arrowLabel="Next highlight" />
<SectionHeader title="Your basket" action={<Button size="sm" variant="secondary" icon={<Plus />}>Add items</Button>} />
```

Props: `title`, `count?`, `onArrowClick?`, `arrowLabel?`, `action?`, `as?` (`h2`/`h3`), `id?`, `className?`.

The trailing arrow is a default IconButton: 40px clear glass with a 44px hit area.

## Avatar

Initial in a tinted circle (32px default); the initial is sized at 42% of the diameter with an 11px minimum; tint (one of the `--tint-1` … `--tint-6` bg/fg token pairs) is stable per name. `you` renders lime.

```tsx
<Avatar name={p.name} you={p.userId === ME.userId} />
```

Props: `name`, `size?` (32), `you?`, `className?`.

## Card / SummaryRow

`Card`: white, 1px line border, 18px radius, 12px padding (`p-card`; `padded={false}` to remove). `SummaryRow`: one price-breakdown line (14px; `strong` total 15px semibold).

```tsx
<Card className="flex flex-col gap-2">
  <SummaryRow label="Food" value={<Price pence={food} />} />
  <SummaryRow label={`Group deal (${deal.short})`} hint="when the party fills" value={<Price pence={discount} negative />} tone="accent" />
  <SummaryRow label="Delivery share" value={<Price pence={share} />} />
  <Divider className="my-1" />
  <SummaryRow label="Estimated total" value={<Price pence={total} />} strong />
</Card>
```

SummaryRow props: `label`, `value`, `hint?`, `strong?`, `tone?` (`default` · `muted` · `accent` · `offer`).

## SearchField

Pill search input, 16px text (no iOS zoom), clear button, Escape clears. 40px tall by default, matching the round buttons beside it.

```tsx
<SearchField value={q} onValueChange={setQ} placeholder="Search restaurants or dishes" />
```

Props: `value`, `onValueChange`, `placeholder?`, `label?`, `size?` (`md` 40 · `lg` 44), `tone?` (`surface` white + hairline · `translucent` inside material bars · `glass` clear glass, the Home search bar), plus input attributes.

```tsx
<SearchField tone="glass" value={q} onValueChange={setQ} placeholder="Search parties" className="flex-1" />
```

## toast

Sonner, styled as an ink capsule with lime icons, top-centre just below the 48px top bar (--safe-top + 56px), inside the phone. `<Toaster />` is in the root layout.

```tsx
toast("Thanks, we've logged this");
toast.success("Link copied");
```

---

## Brand, shared and demo

- `@/components/brand/Logo`: `<Logo size={28} variant="full" | "mark" />` (mark height in px; the BULK wordmark scales with it). `<LogoMark size />` is the bare SVG. `app/icon.svg` is the favicon.
- `@/components/shared/LocationSheet`: `<LocationButton variant="stacked" | "inline" />` (pin + "Current location" + place name (Marquee) + chevron; opens the sheet). `<LocationSheet open onOpenChange />` lists the collection points, current first, as a radio group: arrow keys and Home/End move the selection (roving tabindex) and dispatch `SET_LOCATION`; tapping, Enter or Space picks a point and closes the sheet.
- `@/components/demo`: `<DemoControlsPanel />` (pause bots, a bot won't accept, a **Party** picker, fill this party now, expire this party in 5s, reset demo). The picker lists every party that hasn't ended ("Slice House · filling · you're in") and defaults to the party in the current `/party/[id]` URL, else the most urgent party you're in (an open one closing soonest, then deal reached, on its way, preparing, placed), else the first open party; a pick holds until you open another page. Fill and expire act on the picked party while it is open, so both work from Home's account sheet. Embed it in the account sheet under a "Demo controls" heading. `<DemoHotkey />` is mounted in the layout: press `d` anywhere outside a text field. Its panel is portalled to `<body>`, so on the laptop it sits **outside the phone**, bottom-right of the window (on a phone it floats above the bottom controls); `pointer-events: auto`, `z-[70]`, and stays usable over an open Sheet or Popup: pressing inside it doesn't dismiss them, and their focus trap doesn't pull focus out of it (so the picker opens).
- `AppProvider` (`@/lib/store`) renders a `--bg` splash filling the screen (`min-h-app`) with the logo centred until the browser has mounted, then the app.
- `components/PartyAlerts.tsx`: mounted once in the root layout as the **default export**; currently a stub returning null.

## Layering

TopBar `z-30` · BottomBar `z-40` · Sheet `z-50` · toasts `z-[55]` · Popup `z-[60]` · fake status bar and home indicator `z-[65]` (all inside the phone). The demo panel `z-[70]` is outside the phone on the laptop.

A floating tool that must stay usable over open sheets and popups carries the `PASS_THROUGH_ATTR` attribute (`data-pass-through-layer`, from `@/components/ui`); `Sheet` and `Popup` ignore pointer presses inside it (`isPassThrough(target)`).
