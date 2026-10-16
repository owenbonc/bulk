"use client";

import { useSyncExternalStore } from "react";

/*
 * One polite live region for the whole app, so a change made from any control is announced once even when
 * the same item has controls in several places on screen.
 */
let message = "";
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const getMessage = () => message;
const getServerMessage = () => "";

/**
 * Announces `text` through the shared live region. The region is cleared first and filled on the next
 * frame, so repeating the same message announces it again.
 */
export function announce(text: string) {
  message = "";
  notify();
  requestAnimationFrame(() => {
    message = text;
    notify();
  });
}

/** The shared polite live region. Mounted once, in DeviceFrame. */
export function Announcer() {
  const text = useSyncExternalStore(subscribe, getMessage, getServerMessage);
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {text}
    </div>
  );
}
