"use client";

import { useEffect, useState, type RefObject } from "react";
import { getScrollTop, scrollTopOf, subscribeScroll } from "@/components/ui";

/**
 * True once the bottom edge of `ref` has scrolled above a line `offset` px from the top of the phone screen
 * (e.g. the bottom of the floating top bar). Measured in the app's scroll coordinates, so it works in the
 * laptop phone frame (scaled, scrolling inside the frame) and on a phone (the document scrolls).
 */
export function useScrolledPast(ref: RefObject<HTMLElement | null>, offset: number): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setPast(getScrollTop() + offset >= scrollTopOf(el) + el.offsetHeight);
    update();
    const unsubscribe = subscribeScroll(update);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      unsubscribe();
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref, offset]);

  return past;
}

export interface HeaderMetrics {
  /** Height of the bar including its status-bar padding, in CSS px. */
  height: number;
  /** The status bar's safe area (--safe-top) the bar is padded by, in CSS px. */
  safeTop: number;
}

/** Live size of the first <header> inside `ref` (the TopBar, including its --safe-top padding). */
export function useHeaderMetrics(ref: RefObject<HTMLElement | null>): HeaderMetrics {
  const [metrics, setMetrics] = useState<HeaderMetrics>({ height: 110, safeTop: 62 });

  useEffect(() => {
    const header = ref.current?.querySelector("header");
    if (!header) return;
    const measure = () => {
      const safeTop = Number.parseFloat(getComputedStyle(header).paddingTop) || 0;
      const height = header.offsetHeight;
      setMetrics((m) => (m.height === height && m.safeTop === safeTop ? m : { height, safeTop }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  return metrics;
}
