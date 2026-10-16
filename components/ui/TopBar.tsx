"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "./cn";

function subscribeScroll(notify: () => void) {
  window.addEventListener("scroll", notify, { passive: true });
  return () => window.removeEventListener("scroll", notify);
}
const getScrolled = () => window.scrollY > 2;
const getServerScrolled = () => false;

/** True once the page has scrolled off the top. */
export function useScrolled(): boolean {
  return useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled);
}

export interface TopBarProps {
  /** Leading slot, usually a back/close IconButton or the LocationButton. */
  left?: ReactNode;
  /** Short centred title; truncates. Use `center` for anything richer. */
  title?: ReactNode;
  /** Flexible centre content (e.g. the docked info bubble). Takes the space between left and right. */
  center?: ReactNode;
  /** Trailing slot, one or two IconButtons. */
  right?: ReactNode;
  /** sticky (default) sits in the flow; fixed floats over content such as a hero image. */
  position?: "sticky" | "fixed";
  /** Translucent material behind the bar. Turn off while floating over a hero, on once content docks. */
  material?: boolean;
  /** Hairline under the bar: only once content scrolls under it (default), always, or never. */
  divider?: "scroll" | "always" | "never";
  /** Optional second row under the bar (e.g. a search field). */
  children?: ReactNode;
  className?: string;
}

/**
 * Screen top bar: left / centre / right slots on translucent material, safe-area aware. Content scrolls
 * underneath; a hairline fades in once it does.
 */
export function TopBar({
  left,
  title,
  center,
  right,
  position = "sticky",
  material = true,
  divider = "scroll",
  children,
  className,
}: TopBarProps) {
  const scrolled = useScrolled();
  const showDivider = material && (divider === "always" || (divider === "scroll" && scrolled));

  return (
    <header
      className={cn(
        "top-0 z-30 w-full pt-safe",
        position === "fixed" ? "fixed inset-x-0 mx-auto max-w-column" : "sticky",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "material pointer-events-none absolute inset-0 transition-opacity duration-200 ease-out",
          material ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line transition-opacity duration-200 ease-out",
          showDivider ? "opacity-100" : "opacity-0",
        )}
      />

      {title !== undefined && center === undefined ? (
        <div className="relative grid h-14 grid-cols-[minmax(max-content,1fr)_minmax(0,max-content)_minmax(max-content,1fr)] items-center gap-2 px-2">
          <div className="flex items-center justify-self-start">{left}</div>
          <div className="min-w-0 truncate text-center font-display text-emphasis font-semibold tracking-[-0.01em] text-ink">
            {title}
          </div>
          <div className="flex items-center gap-1 justify-self-end">{right}</div>
        </div>
      ) : (
        <div className="relative flex h-14 items-center gap-1 px-2">
          {left !== undefined && <div className="flex min-w-0 shrink items-center">{left}</div>}
          <div className="flex min-w-0 flex-1 items-center justify-center">{center}</div>
          {right !== undefined && <div className="flex shrink-0 items-center gap-1">{right}</div>}
        </div>
      )}

      {children !== undefined && <div className="relative px-4 pb-3">{children}</div>}
    </header>
  );
}
