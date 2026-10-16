# Bulk components

Catalogue of the design-system primitives. Import everything from `@/components/ui`:

```tsx
import { Button, IconButton, Rating, Sheet, Stepper, toast } from "@/components/ui";
```

Icons come from `lucide-react`. A `LucideProvider` in the root layout makes every icon 20px with stroke 1.75, so just write `<MapPin />`. Override with a class (`className="size-4"`) only when a primitive doesn't size it for you.

## Tokens and utilities (app/globals.css)

| Kind | Classes |
| --- | --- |
| Colour | `bg-bg` `bg-bg-desk` `bg-surface` `bg-surface-hover` `bg-surface-2` `bg-surface-2-hover` `text-ink` `text-ink-2` `text-ink-3` `border-line` `border-line-strong` `bg-track` `bg-accent` `bg-accent-hover` `bg-accent-strong` `bg-accent-soft` `text-accent-ink` `text-on-accent` `bg-offer` `bg-offer-strong` `text-on-offer` `text-offer` `bg-offer-soft` `text-offer-ink` `text-success` `bg-success-soft` `bg-scrim` |
| Offer reds | `--offer` #c93a22: deal pills (solid, `--on-offer` white text 5.1:1), sale prices, urgent timers on white/cream. `--offer-ink` #a32a15: offer-coloured **text on tinted surfaces** (6.3:1 on `--accent-soft`, 6:1 on `--offer-soft`, 7.2:1 on `--surface`); `--offer` only reaches 4.46:1 on `--accent-soft`. `--offer-strong`: pressed deal pill. |
| Type | `text-caption` 12 · `text-meta` 13 · `text-body` 15 · `text-emphasis` 17 · `text-section` 20 · `text-title` 26 · `text-hero` 34 (section/title/hero carry their tracking and line-height). `font-display` = Bricolage Grotesque, `font-sans` = Geist (default), `font-mono` = Geist Mono. `h1`–`h4` default to the display face. |
| Numbers | `tnum` (tabular lining numerals) for prices, timers, PINs, counts. `Price`, `Countdown`, `Pill` already apply it. |
| Radius | `rounded-chip` 12 · `rounded-card` 18 · `rounded-sheet` 24 · `rounded-popup` 28 · `rounded-full` |
| Depth | `shadow-float` (bottom bubble, floating buttons) · `shadow-sheet` · `shadow-popup`. Cards on the page get `border border-line`, never a shadow. |
| Material | `material` = translucent cream + blur for floating chrome: top bars, bottom bar, sticky info bubble (solid under reduced transparency / more contrast). |
| Glass | `glass` = clear glass for controls: 50% white, `blur(20px) saturate(180%)`, 1px white edge with a brighter top highlight, floating shadow; hover/pressed washes built in; solid white with a `--line` edge under reduced transparency / more contrast. The edge is an inset shadow (no border), so it never changes a control's size, and it composes with `ring-*` (focus rings still show). Used by `IconButton` (default), `Button variant="glass"`, `SearchField tone="glass"` and the empty `Stepper variant="glass"`. Don't add `shadow-*` to it; it carries its own. Not for the menu's "View basket" bubble or the your-party card. |
| Layout | `max-w-column` (430px phone column) · `desk:` breakpoint (431px+, wider than the column: the page turns `--bg-desk` sand and the column gets `shadow-column` side hairlines; one breakpoint for both) · `pb-safe` / `pt-safe` (safe-area padding) · `no-scrollbar` (carousels) |
| Motion | `ease-out` / `ease-in-out` are the strong curves; `ease-drawer`. `animate-ring` = the bell wobble for the "Party filled!" popup (off under reduced motion). JS springs: `SPRING`, `SPRING_SNAPPY`, `SPRING_FILL`, `EXIT` from `@/components/ui`. |

Hover classes (`hover:`) only apply with a fine pointer, so they never stick on touch. Press feedback is built into every interactive primitive. `MotionConfig reducedMotion="user"` is set globally, so `motion` transforms fall back to fades for users who ask for reduced motion.

Helpers: `cn(...classes)`, `formatPrice(pence, { trim?, negative? })` → "£7.29" / "£24" / "−£4.00", `formatDuration(ms)` → "12:04", `describeDuration(ms)` → "12 minutes 4 seconds".

---

## Button

Pill button. Variants `primary` (lime) · `secondary` (white + hairline) · `ghost` · `danger` (quiet tomato text) · `glass` (clear glass big action: Join party, Create party, Accept and pay). Sizes `sm` 36 (44 hit area) · `md` 48 · `lg` 56. Pass `href` to render a Next `Link`.

| Prop | Type | Notes |
| --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "danger" \| "glass"` | default `primary` |
| `size` | `"sm" \| "md" \| "lg"` | default `md`; `lg` (56) for `glass` |
| `block` | `boolean` | full width |
| `icon` | `ReactNode` | before the label |
| `trailing` | `ReactNode` | pinned right as plain text, e.g. the price on a lime CTA |
| `chip` | `ReactNode` | lime price chip pinned right (40px, bold 17px on `--accent`); the label moves left. Sand while disabled. Made for `glass` |
| `loading` | `boolean` | spinner, keeps width, ignores presses |
| `disabled` | `boolean` | quiet sand fill |
| `href` | `string` | renders a Link |

Glass action: 56px, bold 17px `--ink` label on the left, lime price chip on the right.

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

Round icon-only button, 44px, **clear glass by default** (account, create, bell, location, back, search, info, more: on the page and over photos). `aria-label` is required by the type.

| Prop | Type | Notes |
| --- | --- | --- |
| `aria-label` | `string` | required |
| `variant` | `"glass" \| "plain" \| "soft" \| "outline" \| "accent"` | default `glass`; `soft` = sand disc for close buttons inside sheets and popups; `outline` = white + hairline (section arrows, add-friend); `plain` = no surface; `accent` = solid lime disc |
| `iconColor` | `"ink" \| "accent"` | overrides the variant's icon colour; `accent` = `--accent-ink`, so the glass create button still reads as primary |
| `size` | `"sm" \| "md" \| "lg"` | 36 (44 hit) · 44 · 48 |
| `badge` | `boolean` | accent dot (unread notifications) |
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

`Pill`: static label. Tones `neutral` · `outline` (Host) · `accent` · `soft` (You're in) · `offer` (Offer) · `success` (Paid) · `ink` (Added). Sizes `sm` 24 · `md` 28. Optional `icon`.

```tsx
<Pill tone="outline">Host</Pill>
<Pill tone="soft">You're in</Pill>
<Pill tone="success" icon={<Check />}>Paid</Pill>
<Pill tone="offer" icon={<Tag />}>Offer</Pill>
```

`DealPill`: the "25% off" badge, **solid `--offer` red with bold white (`--on-offer`) text everywhere** (cards, menu, create page, bottom bubble). `label` (use `restaurant.deal.short`), `size` `sm` 24 · `md` 32 · `lg` 44 (bottom bubble), `withIcon` (percent badge). With `onClick` it becomes a button (opens the deal sheet; pressed `--offer-strong`). Add `ring-3 ring-bg` (or `ring-surface` on a card) when it overlaps an image edge. No colour overrides needed.

```tsx
<DealPill label={restaurant.deal.short} size="sm" className="absolute -bottom-3 right-3 ring-3 ring-surface" />
<DealPill label={restaurant.deal.short} size="lg" onClick={() => setDealOpen(true)} />
```

## ProgressBar

Fill springs to new values (first paint is static).

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `number` | same unit as `max` |
| `max` | `number` | default 100, so `value={pct}` works |
| `size` | `"hairline" \| "sm" \| "md"` | 3px · 6px · 10px |
| `tone` | `"accent" \| "ink" \| "offer"` | |
| `label`, `valueText` | `string` | accessible name and spoken value |

```tsx
const p = progressOf(request, restaurant);
<ProgressBar value={p.total} max={p.target} label="Deal progress" valueText={`${formatPrice(p.total, { trim: true })} of ${formatPrice(p.target, { trim: true })}`} />
```

## ProgressPie

SVG pie from 12 o'clock, lime fill; optional `--offer` "your contribution" slice at the end of the progress.

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `number` | progress including your contribution |
| `max` | `number` | default 100 |
| `contribution` | `number` | your basket's share, same unit |
| `size` | `number` | px, default 28 |
| `label` | `string` | default "75% filled" |

```tsx
<ProgressPie value={p.total} max={p.target} />                                  // card
<ProgressPie value={preview.total} max={p.target} contribution={myBasket} size={56} />  // basket deal card
```

## Countdown

Live `m:ss` (or `h:mm:ss`) with tabular digits; turns urgent under 60s. Pass `now` from `useApp()`. The urgent colour wins over a text colour in `className` (it is applied through `data-urgent`), so `className="text-ink"` stays ink until the last minute.

```tsx
const { now } = useApp();
<Countdown until={request.expiresAt} now={now} suffix="left" />
<Countdown until={request.acceptDeadline!} now={now} className="text-hero font-semibold" />
<Countdown until={deadline} now={now} urgentTone="offer-ink" />  // on --accent-soft or another tint
```

Props: `until`, `now`, `suffix?`, `urgentBelowMs?` (default 60000, 0 = never), `urgentTone?` (`offer` default, on white/cream · `offer-ink` on tinted surfaces), `mono?`, `className?`.

## Price

```tsx
<Price pence={item.price} originalPence={item.originalPrice} />  // "£8.59 £14.00" (sale in --offer, original struck)
<Price pence={discount} negative />                             // "−£4.00"
<Price pence={p.left} trim />                                    // "£8"
```

Props: `pence`, `originalPence?`, `trim?`, `negative?`, `className?`, `originalClassName?`.

## Rating

Restaurant rating, one size (13px) and colour on every screen: filled `--accent-ink` star, number (semibold ink), optional label and review count (`--ink-2`). Read aloud as "Rated 4.6 out of 5, Good, 250 reviews".

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

Bottom sheet (vaul): handle, scrim, title, optional description and pinned footer, body scrolls on its own, safe-area padding, focus trap, Escape and drag to close. Constrained to the phone column.

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

Centred dialog over a blurred, dimmed backdrop. Close X top-left, large icon on a tinted disc (icon sized to 88px for you), title, description, action. Focus trapped (lands on the action), Escape closes, card springs in from 0.95. Use for W11, W12 and W13.

| Prop | Type | Notes |
| --- | --- | --- |
| `open`, `onOpenChange` | | controlled |
| `icon` | `ReactNode` | e.g. `<BellRing className="animate-ring" />` |
| `iconTone` | `"accent" \| "offer" \| "none"` | disc colour |
| `title` | `string` | |
| `description` | `ReactNode` | |
| `children` | `ReactNode` | extra body |
| `action` | `ReactNode` | buttons |
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

Item quantity control (W3). `+` adds the first one and fills lime with the count; tapping the count expands to `− n +` (trash at 1). Collapses after 3s idle or when another Stepper is used. Grows leftward from its right edge without pushing layout, so give it a right-aligned spot. Buttons enter and leave from scale 0.95 + opacity.

Hit areas: collapsed, the circle's target extends to 44px all round. Expanded, each button widens (sm 40px, md 44px) and extends vertically to 44px, and `−` / `+` reach 4px past the pill's ends, so `−` and `+` are 44px wide in both sizes (sm count 40px). Expanded width: sm 120px, md 132px. The pill does not clip, so focus rings and hit areas are whole; leave room for the hit area past the pill's edge (an `ImageFrame` clips it at the tile edge).

| Prop | Type | Notes |
| --- | --- | --- |
| `qty` | `number` | your quantity |
| `onAdd`, `onRemove` | `() => void` | dispatch ADD_ITEM / REMOVE_ITEM (or DRAFT_ITEM) |
| `label` | `string` | item name for screen readers |
| `size` | `"sm" \| "md"` | 32 over tiles · 36 in rows |
| `variant` | `"outline" \| "glass"` | look of the empty `+` (clear glass over photos) |
| `disabled` | `boolean` | |

```tsx
<Stepper qty={qtyOf(item.id)} label={item.name} onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />
```

## Switch

iOS-style toggle (`role="switch"`). With `label` the whole row is tappable.

```tsx
<Switch label="Add disposable cutlery" checked={cutlery} onCheckedChange={setCutlery} />
<Switch aria-label="Pause bots" checked={paused} onCheckedChange={setPaused} />
```

Props: `checked`, `onCheckedChange`, `label?`, `description?`, `aria-label?`, `disabled?`, `className?`.

## TopBar

Sticky translucent bar with left / centre / right slots, safe-area aware. A hairline fades in once content scrolls under it.

| Prop | Type | Notes |
| --- | --- | --- |
| `left`, `right` | `ReactNode` | buttons |
| `title` | `ReactNode` | short centred title, truncates |
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

`useScrolled()` returns true once the window has scrolled off the top.

## BottomBar

Fixed bar the width of the phone column, padded clear of the home indicator. Reserves its own height in the flow so content never hides under it. `show` slides it up 12px and fades it in.

| Prop | Type | Notes |
| --- | --- | --- |
| `show` | `boolean` | default true |
| `material` | `boolean` | default true; false when the content is its own floating bubble |
| `divider` | `boolean` | top hairline (with material) |
| `className` | `string` | inner row classes |

```tsx
<BottomBar className="flex items-center gap-2">
  <IconButton aria-label="Account" onClick={openAccount}><UserRound /></IconButton>
  <SearchField tone="glass" value={q} onValueChange={setQ} placeholder="Search parties" className="flex-1" />
  <IconButton aria-label="Create a party" iconColor="accent" href="/create"><Plus /></IconButton>
</BottomBar>

<BottomBar show={count > 0} material={false} className="flex gap-2">
  <button className="material shadow-float flex-1 rounded-full …">…View basket…</button>
  <DealPill label={deal.short} size="lg" onClick={openDeal} className="shadow-float" />
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

## Avatar

Initial in a tinted circle; tint (one of the `--tint-1` … `--tint-6` bg/fg token pairs) is stable per name. `you` renders lime.

```tsx
<Avatar name={p.name} you={p.userId === ME.userId} />
```

Props: `name`, `size?` (36), `you?`, `className?`.

## Card / SummaryRow

`Card`: white, 1px line border, 18px radius, 16px padding (`padded={false}` to remove). `SummaryRow`: one price-breakdown line.

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

Pill search input, 16px text (no iOS zoom), clear button, Escape clears.

```tsx
<SearchField value={q} onValueChange={setQ} placeholder="Search restaurants or dishes" />
```

Props: `value`, `onValueChange`, `placeholder?`, `label?`, `size?` (`md` 44 · `lg` 48), `tone?` (`surface` white + hairline · `translucent` inside material bars · `glass` clear glass, the Home search bar), plus input attributes.

```tsx
<SearchField tone="glass" value={q} onValueChange={setQ} placeholder="Search parties" className="flex-1" />
```

## toast

Sonner, styled as an ink capsule with lime icons, top-centre. `<Toaster />` is in the root layout.

```tsx
toast("Thanks, we've logged this");
toast.success("Link copied");
```

---

## Brand, shared and demo

- `@/components/brand/Logo`: `<Logo size={28} variant="full" | "mark" />` (mark height in px; the BULK wordmark scales with it). `<LogoMark size />` is the bare SVG. `app/icon.svg` is the favicon.
- `@/components/shared/LocationSheet`: `<LocationButton variant="stacked" | "inline" />` (pin + "Current location" + place name + chevron; opens the sheet). `<LocationSheet open onOpenChange />` lists the collection points, current first, and dispatches `SET_LOCATION`.
- `@/components/demo`: `<DemoControlsPanel />` (pause bots, a bot won't accept, a **Party** picker, fill this party now, expire this party in 5s, reset demo). The picker lists every party that hasn't ended ("Slice House · filling · you're in") and defaults to the party in the current `/party/[id]` URL, else the most urgent party you're in (an open one closing soonest, then deal reached, on its way, preparing, placed), else the first open party; a pick holds until you open another page. Fill and expire act on the picked party while it is open, so both work from Home's account sheet. Embed it in the account sheet under a "Demo controls" heading. `<DemoHotkey />` is mounted in the layout: press `d` anywhere outside a text field. Its panel is portalled to `<body>`, `pointer-events: auto`, `z-[70]`, and stays usable over an open Sheet or Popup: pressing inside it doesn't dismiss them, and their focus trap doesn't pull focus out of it (so the picker opens).
- `AppProvider` (`@/lib/store`) renders a full-height cream splash with the logo centred until the browser has mounted, then the app.
- `components/PartyAlerts.tsx`: mounted once in the root layout as the **default export**; currently a stub returning null.

## Layering

TopBar `z-30` · BottomBar `z-40` · Sheet `z-50` · Popup `z-[60]` · demo panel `z-[70]` · toasts above all.

A floating tool that must stay usable over open sheets and popups carries the `PASS_THROUGH_ATTR` attribute (`data-pass-through-layer`, from `@/components/ui`); `Sheet` and `Popup` ignore pointer presses inside it (`isPassThrough(target)`).
