"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "./cn";
import { getScrollTop, subscribeScroll } from "./frame";
import { Marquee } from "./Marquee";

const getScrolled = () => getScrollTop() > 2;
const getServerScrolled = () => false;

/** True once the app has scrolled off the top (the phone frame's scroller on the laptop, the page on a phone). */
export function useScrolled(): boolean {
  return useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled);
}

export interface TopBarProps {
  /** Leading slot, usually a back/close IconButton or the LocationButton. */
  left?: ReactNode;
  /** Short centred title; scrolls (Marquee) if it doesn't fit. Use `center` for anything richer. */
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
 * Screen top bar: a 48px row of left / centre / right slots 16px from the edges, under the status bar
 * (--safe-top, at least 8px), on translucent material that also covers the status bar area. Content scrolls
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
        "top-0 z-30 w-full pt-[max(8px,var(--safe-top))]",
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
        <div className="relative grid h-12 grid-cols-[minmax(max-content,1fr)_minmax(0,max-content)_minmax(max-content,1fr)] items-center gap-2 px-4">
          <div className="flex items-center justify-self-start">{left}</div>
          <Marquee className="text-center font-display text-emphasis font-semibold tracking-[-0.01em] text-ink">{title}</Marquee>
          <div className="flex items-center gap-2 justify-self-end">{right}</div>
        </div>
      ) : (
        <div className="relative flex h-12 items-center gap-2 px-4">
          {left !== undefined && <div className="flex min-w-0 shrink items-center">{left}</div>}
          <div className="flex min-w-0 flex-1 items-center justify-center">{center}</div>
          {right !== undefined && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </div>
      )}

      {children !== undefined && <div className="relative px-4 pb-3">{children}</div>}
    </header>
  );
}
