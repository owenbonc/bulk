"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { IconButton } from "@/components/ui";
import { DemoControlsPanel } from "./DemoControlsPanel";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/**
 * Press "d" anywhere (outside text fields) to toggle a floating demo-controls panel. Keyboard-driven and
 * used constantly while presenting, so it appears and disappears instantly.
 */
export function DemoHotkey() {
  const [open, setOpen] = useState(false);

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

  return (
    <aside
      aria-label="Demo controls"
      className="fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-[70] w-[300px] max-w-[calc(100vw-24px)] rounded-card bg-surface p-4 pt-3 shadow-popup ring-1 ring-line min-[900px]:top-6 min-[900px]:right-auto min-[900px]:bottom-auto min-[900px]:left-[calc(50%+239px)]"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-emphasis font-semibold text-ink">Demo controls</h2>
        <div className="flex items-center gap-1">
          <span className="text-caption text-ink-3">
            <kbd className="rounded-md bg-surface-2 px-1.5 py-0.5 text-caption text-ink-2">D</kbd> to hide
          </span>
          <IconButton aria-label="Close demo controls" size="sm" onClick={() => setOpen(false)}>
            <X />
          </IconButton>
        </div>
      </div>
      <DemoControlsPanel />
    </aside>
  );
}
