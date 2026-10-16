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
 * whichever side is cut off. Under reduced motion it wraps onto more lines instead. The text is in the DOM
 * once, so screen readers read it normally.
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
    const total = 2 * pause + 2 * travel;
    // Phase boundaries as offsets: rest at the start, scroll out, rest at the end, scroll back.
    const outStart = pause / total;
    const outEnd = (pause + travel) / total;
    const backStart = (2 * pause + travel) / total;
    // The fades swap sides over the first and last fifth of each scroll.
    const ramp = (0.2 * travel) / total;
    const timing: KeyframeAnimationOptions = { duration: total, iterations: Infinity };
    const shifted = `translateX(${-overflow}px)`;

    const scroll = inner.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(0)", offset: outStart, easing: "linear" },
        { transform: shifted, offset: outEnd },
        { transform: shifted, offset: backStart, easing: "linear" },
        { transform: "translateX(0)", offset: 1 },
      ],
      timing,
    );

    const at = (start: number, end: number, offset: number): Keyframe => ({
      "--marquee-fade-start": `${start}px`,
      "--marquee-fade-end": `${end}px`,
      offset,
    });
    const edges = outer.animate(
      [
        at(0, fade, 0),
        at(0, fade, outStart),
        at(fade, fade, outStart + ramp),
        at(fade, fade, outEnd - ramp),
        at(fade, 0, outEnd),
        at(fade, 0, backStart),
        at(fade, fade, backStart + ramp),
        at(fade, fade, 1 - ramp),
        at(0, fade, 1),
      ],
      timing,
    );

    return () => {
      scroll.cancel();
      edges.cancel();
    };
  }, [moving, overflow, speed, pause, fade]);

  return (
    <Tag
      ref={setOuter}
      className={cn(
        "block max-w-full min-w-0",
        reduce ? "whitespace-normal" : "overflow-x-clip whitespace-nowrap",
        moving && "marquee-mask",
        className,
      )}
      style={moving ? ({ "--marquee-fade-end": `${fade}px` } as CSSProperties) : undefined}
    >
      <span ref={innerRef} className={reduce ? undefined : "inline-block"}>
        {children}
      </span>
    </Tag>
  );
}
