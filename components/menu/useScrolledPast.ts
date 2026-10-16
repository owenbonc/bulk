"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True once `ref` has scrolled fully above a line `offset` px from the top of the viewport (the bottom edge
 * of the fixed top bar). Driven by an IntersectionObserver, so it costs nothing while scrolling.
 */
export function useScrolledPast(ref: RefObject<HTMLElement | null>, offset: number): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < offset),
      { rootMargin: `-${Math.round(offset)}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, offset]);

  return past;
}

/** Live height of the first <header> inside `ref` (the TopBar, including its safe-area padding). */
export function useHeaderHeight(ref: RefObject<HTMLElement | null>, fallback = 56): number {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    const header = ref.current?.querySelector("header");
    if (!header) return;
    const observer = new ResizeObserver(() => setHeight(header.offsetHeight));
    observer.observe(header);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
