"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton, PASS_THROUGH_ATTR } from "@/components/ui";
import { DemoControlsPanel } from "./DemoControlsPanel";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/**
 * While a sheet or popup is open its focus trap pulls focus back as soon as it lands outside, which would
 * shut the party picker the moment it opens. Focus moves into or inside the panel are stopped at the window
 * before the trap's document listeners see them. Pointer presses inside the panel are ignored by Sheet and
 * Popup through the pass-through attribute.
 */
function useFocusPassThrough(panel: HTMLElement | null) {
  useEffect(() => {
    if (!panel) return;
    const inside = (t: EventTarget | null) => t instanceof Node && panel.contains(t);
    const onFocusIn = (e: FocusEvent) => {
      if (inside(e.target)) e.stopImmediatePropagation();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (inside(e.relatedTarget)) e.stopImmediatePropagation();
    };
    window.addEventListener("focusin", onFocusIn, true);
    window.addEventListener("focusout", onFocusOut, true);
    return () => {
      window.removeEventListener("focusin", onFocusIn, true);
      window.removeEventListener("focusout", onFocusOut, true);
    };
  }, [panel]);
}

/**
 * Press "d" anywhere (outside text fields) to toggle a floating demo-controls panel, the one place the
 * bag-by-bag driver handover tool appears. Keyboard-driven and used constantly while presenting, so it
 * appears and disappears instantly. Portalled to <body>: on the laptop that puts it outside the phone frame,
 * in the bottom-right corner of the window, so it never covers the phone; on a phone it floats above the
 * bottom controls. Kept clickable while a vaul sheet or Radix dialog is open (those set pointer-events: none
 * on the body).
 */
export function DemoHotkey() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  useFocusPassThrough(open ? panel : null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key.toLowerCase() !== "d" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return createPortal(
    <aside
      ref={setPanel}
      aria-label="Demo controls"
      {...{ [PASS_THROUGH_ATTR]: "" }}
      className="pointer-events-auto fixed right-3 bottom-[calc(var(--safe-bottom)+88px)] z-[70] max-h-[calc(100dvh-var(--safe-bottom)-112px)] w-[300px] max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-card bg-surface p-4 pt-3 shadow-popup ring-1 ring-line frame:right-6 frame:bottom-6 frame:max-h-[calc(100dvh-48px)]"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-emphasis font-semibold text-ink">Demo controls</h2>
        <div className="flex items-center gap-1">
          <span className="text-caption text-ink-3">
            <kbd className="rounded-md bg-surface-2 px-1.5 py-0.5 text-caption text-ink-2">D</kbd> to hide
          </span>
          <IconButton aria-label="Close demo controls" size="sm" variant="soft" onClick={() => setOpen(false)}>
            <X />
          </IconButton>
        </div>
      </div>
      <DemoControlsPanel driverTool />
    </aside>,
    document.body,
  );
}
