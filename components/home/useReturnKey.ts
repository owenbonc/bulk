"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * A key that changes when Home is shown again after `value` changed while it was hidden. With
 * cacheComponents, Next keeps Home mounted but hidden (React <Activity>) while you're on another screen: it
 * keeps rendering, but no effects run, so an exit that begins while it's hidden never finishes. Keying an
 * AnimatePresence with this remounts it on return, before paint, which drops that frozen exit. A return
 * after nothing changed keeps everything as it was (carousel positions, loaded images).
 */
export function useReturnKey(value: string): number {
  const [key, setKey] = useState(0);
  // Layout effects run only while Home is visible: they are cleaned up when it is hidden and all run again,
  // in this order and before paint, each time it is shown.
  const latest = useRef(value);
  const hiddenWith = useRef<string | null>(null);
  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);
  useLayoutEffect(() => {
    if (hiddenWith.current !== null && hiddenWith.current !== latest.current) setKey((n) => n + 1);
    return () => {
      hiddenWith.current = latest.current;
    };
  }, []);
  return key;
}
