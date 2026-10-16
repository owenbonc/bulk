"use client";

import { createContext, useContext, useId, useLayoutEffect, useSyncExternalStore } from "react";

/*
 * The laptop demo renders the app inside an iPhone 16 Pro frame; a phone renders it full screen. This module
 * is the runtime side of that: whether the frame is showing and at what scale, the element sheets and popups
 * portal into, the app's scroll container, and the status bar's glyph tone.
 */

/** Frame mode: a wide window with a precise pointer. Keep in sync with the `frame` variant in globals.css. */
export const FRAME_QUERY = "(min-width: 500px) and (pointer: fine)";

/** iPhone 16 Pro viewport and the hardware drawn around it, in CSS px (matches the --frame-* tokens). */
export const FRAME = { width: 402, height: 874, bezel: 11, margin: 24, safeTop: 62, safeBottom: 34 } as const;

const SCROLL_ROOT_ATTR = "data-scroll-root";

// ---- Frame mode and scale ----------------------------------------------------------------------

function subscribeViewport(notify: () => void) {
  const query = window.matchMedia(FRAME_QUERY);
  query.addEventListener("change", notify);
  window.addEventListener("resize", notify);
  return () => {
    query.removeEventListener("change", notify);
    window.removeEventListener("resize", notify);
  };
}

/** True when the app is drawn inside the phone frame (read at call time, outside React). */
export function isFramed(): boolean {
  return typeof window !== "undefined" && window.matchMedia(FRAME_QUERY).matches;
}

/** How much the phone is scaled down to fit the window (1 on a phone or when the window is tall enough). */
export function getFrameScale(): number {
  if (!isFramed()) return 1;
  const fitHeight = (window.innerHeight - 2 * FRAME.margin) / (FRAME.height + 2 * FRAME.bezel);
  const fitWidth = (window.innerWidth - 2 * FRAME.margin) / (FRAME.width + 2 * FRAME.bezel);
  return Math.max(0.1, Math.min(1, fitHeight, fitWidth));
}

const serverFalse = () => false;
const serverOne = () => 1;

export interface FrameInfo {
  /** The app is inside the laptop phone frame. */
  framed: boolean;
  /** The frame's scale (1 on a phone). Divide screen-space measurements (getBoundingClientRect) by it. */
  scale: number;
}

/** Whether the phone frame is showing and its current scale; updates on resize. */
export function useFrame(): FrameInfo {
  const framed = useSyncExternalStore(subscribeViewport, isFramed, serverFalse);
  const scale = useSyncExternalStore(subscribeViewport, getFrameScale, serverOne);
  return { framed, scale };
}

// ---- Portal container --------------------------------------------------------------------------

const PortalContext = createContext<HTMLElement | null>(null);
export const PortalContainerProvider = PortalContext.Provider;

/**
 * The element overlays portal into: a layer inside the phone screen, so sheets, popups and anything else a
 * screen portals stay inside the phone in the laptop frame. Null until the frame has mounted (portals then
 * fall back to <body>).
 */
export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContext);
}

// ---- Scroll container --------------------------------------------------------------------------

const ScrollRootContext = createContext<HTMLElement | null>(null);
export const ScrollRootProvider = ScrollRootContext.Provider;

/** Props that mark the frame's scroll container (spread onto it by DeviceFrame). */
export const scrollRootProps = { [SCROLL_ROOT_ATTR]: "" } as const;

/**
 * The element the app scrolls in: the phone screen's scroller in the laptop frame, the document's scrolling
 * element on a phone. Use it instead of `window` for scroll positions and `scrollTo`.
 */
export function getScrollRoot(): HTMLElement {
  if (isFramed()) {
    const root = document.querySelector<HTMLElement>(`[${SCROLL_ROOT_ATTR}]`);
    if (root) return root;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/**
 * The scroll container as an IntersectionObserver `root`: the frame's scroller in the laptop frame, null (the
 * viewport) on a phone. Recreate observers when it changes.
 */
export function useScrollRoot(): HTMLElement | null {
  const { framed } = useFrame();
  const root = useContext(ScrollRootContext);
  return framed ? root : null;
}

/** Calls `notify` whenever the app (or anything inside it) scrolls. Returns the unsubscribe function. */
export function subscribeScroll(notify: () => void): () => void {
  // Scroll events don't bubble, but a capturing listener on the document sees the document's and every element's.
  document.addEventListener("scroll", notify, { capture: true, passive: true });
  return () => document.removeEventListener("scroll", notify, { capture: true });
}

/** How far the app has scrolled, in CSS px. */
export function getScrollTop(): number {
  return getScrollRoot().scrollTop;
}

/** Scrolls the app (window.scrollTo for the frame-aware world). */
export function scrollRootTo(options: ScrollToOptions): void {
  getScrollRoot().scrollTo(options);
}

/**
 * The top of `element` in the scroll container's content coordinates (unscaled CSS px), so
 * `scrollRootTo({ top: scrollTopOf(el) - headerHeight })` brings it under the header in either mode.
 */
export function scrollTopOf(element: Element): number {
  const root = getScrollRoot();
  const isDocument = root === document.scrollingElement || root === document.documentElement;
  const rootTop = isDocument ? 0 : root.getBoundingClientRect().top + root.clientTop * getFrameScale();
  return (element.getBoundingClientRect().top - rootTop) / getFrameScale() + root.scrollTop;
}

// ---- Status bar tone ---------------------------------------------------------------------------

export type StatusBarTone = "dark" | "light";

const toneEntries: Array<{ id: string; tone: StatusBarTone }> = [];
const toneListeners = new Set<() => void>();

function emitTone() {
  toneListeners.forEach((notify) => notify());
}

function subscribeTone(notify: () => void) {
  toneListeners.add(notify);
  return () => {
    toneListeners.delete(notify);
  };
}

const getTone = (): StatusBarTone => toneEntries[toneEntries.length - 1]?.tone ?? "dark";
const getServerTone = (): StatusBarTone => "dark";

/**
 * Sets the fake status bar's glyphs while the calling component is mounted: `light` (white) while a photo is
 * under the status bar, `dark` (ink, the default) over cream. Pass the current value on every render, e.g.
 * `useStatusBarTone(heroUnderStatusBar ? "light" : "dark")`. The most recent caller wins.
 */
export function useStatusBarTone(tone: StatusBarTone): void {
  const id = useId();
  useLayoutEffect(() => {
    toneEntries.push({ id, tone });
    emitTone();
    return () => {
      const index = toneEntries.findIndex((entry) => entry.id === id);
      if (index !== -1) toneEntries.splice(index, 1);
      emitTone();
    };
  }, [id, tone]);
}

/** The status bar's current glyph tone (read by the status bar). */
export function useStatusBarToneValue(): StatusBarTone {
  return useSyncExternalStore(subscribeTone, getTone, getServerTone);
}
