"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "./cn";

export interface MarqueeProps {
  children: ReactNode;
  /** Element to render: a span by default, or the heading or paragraph the text belongs in. */
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4";
  /** Scroll speed in px per second. */
  speed?: number;
  /** Rest at each end, in ms. */
  pause?: number;
  /** Width of the soft edge fade while the text overflows, in px. */
  fade?: number;
  /** Typography and layout. The Marquee is a block-level box that shrinks in flex rows (min-width 0). */
  className?: string;
}

/**
 * Single-line text that never truncates with "…". Text that fits renders static. Text that overflows rests
 * 1.5s, scrolls slowly (30px/s) to reveal its end, rests, scrolls back and repeats, with soft edge fades on
 * whichever side is cut off. It pauses while off screen and while its card, row or button is hovered or
 * focused, and resumes afterwards. Under reduced motion it wraps onto more lines instead. The text is in the
 * DOM once, so screen readers read it normally.
 */
export function Marquee({ children, as: Tag = "span", speed = 30, pause = 1500, fade = 12, className }: MarqueeProps) {
  const outerRef = useRef<HTMLElement | null>(null);
  const setOuter = useCallback((node: HTMLElement | null) => {
    outerRef.current = node;
  }, []);
  const innerRef = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [overflow, setOverflow] = useState(0);

  // Layout px on both sides (unaffected by the laptop frame's scale), re-measured when either box resizes.
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || reduce) return;
    const measure = () => setOverflow(Math.max(0, inner.offsetWidth - outer.clientWidth));
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    measure();
    return () => observer.disconnect();
  }, [reduce]);

  const moving = !reduce && overflow > 1;

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!moving || !outer || !inner) return;

    const travel = (overflow / speed) * 1000;
    const rest = "translateX(0)";
    const shifted = `translateX(${-overflow}px)`;
    // Rest, scroll out, rest, scroll back. data-edge puts the fade on whichever side is cut off.
    const phases: { from: string; to: string; duration: number; edge: "end" | "both" | "start" }[] = [
      { from: rest, to: rest, duration: pause, edge: "end" },
      { from: rest, to: shifted, duration: travel, edge: "both" },
      { from: shifted, to: shifted, duration: pause, edge: "start" },
      { from: shifted, to: rest, duration: travel, edge: "both" },
    ];

    let cancelled = false;
    let current: Animation | null = null;
    const paused = new Set<"offscreen" | "hover" | "focus">();
    const sync = () => {
      if (!current) return;
      if (paused.size > 0) current.pause();
      else current.play();
    };

    const run = (index: number) => {
      if (cancelled) return;
      const phase = phases[index];
      outer.dataset.edge = phase.edge;
      const previous = current;
      current = inner.animate([{ transform: phase.from }, { transform: phase.to }], {
        duration: phase.duration,
        fill: "forwards",
        easing: "linear",
      });
      previous?.cancel();
      sync();
      current.onfinish = () => run((index + 1) % phases.length);
    };

    const toggle = (reason: "offscreen" | "hover" | "focus", on: boolean) => {
      if (on) paused.add(reason);
      else paused.delete(reason);
      sync();
    };

    // The default root clips by the phone's scroll containers, so a Marquee scrolled out of view pauses.
    const observer = new IntersectionObserver(([entry]) => toggle("offscreen", !entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(outer);

    const host = outer.closest<HTMLElement>("a,button,li,[role=button]") ?? outer;
    const onPointerEnter = () => toggle("hover", true);
    const onPointerLeave = () => toggle("hover", false);
    const onFocusIn = () => toggle("focus", true);
    const onFocusOut = (e: FocusEvent) => {
      if (!host.contains(e.relatedTarget as Node | null)) toggle("focus", false);
    };
    host.addEventListener("pointerenter", onPointerEnter);
    host.addEventListener("pointerleave", onPointerLeave);
    host.addEventListener("focusin", onFocusIn);
    host.addEventListener("focusout", onFocusOut);

    run(0);

    return () => {
      cancelled = true;
      current?.cancel();
      current = null;
      delete outer.dataset.edge;
      observer.disconnect();
      host.removeEventListener("pointerenter", onPointerEnter);
      host.removeEventListener("pointerleave", onPointerLeave);
      host.removeEventListener("focusin", onFocusIn);
      host.removeEventListener("focusout", onFocusOut);
    };
  }, [moving, overflow, speed, pause]);

  return (
    <Tag
      ref={setOuter}
      className={cn(
        "block max-w-full min-w-0",
        reduce ? "whitespace-normal" : "overflow-x-clip whitespace-nowrap",
        moving && "marquee-mask",
        className,
      )}
      style={moving ? ({ "--marquee-fade": `${fade}px` } as CSSProperties) : undefined}
    >
      <span ref={innerRef} className={reduce ? undefined : "inline-block"}>
        {children}
      </span>
    </Tag>
  );
}
