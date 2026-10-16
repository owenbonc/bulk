"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, type ReactNode } from "react";
import { cn } from "./cn";
import { EXIT, SPRING } from "./motion";

export interface BottomBarProps {
  children: ReactNode;
  /** Slides up 12px and fades in when true, back down when false. */
  show?: boolean;
  /**
   * `true` (default): a translucent material bar on the bottom edge, padded clear of the home indicator.
   * `false`: floating mode. No strip, border or blur band: each child floats on its own (clear-glass buttons,
   * the basket bubble) just above the home indicator, and the gaps between them let taps reach the page.
   */
  material?: boolean;
  /** Hairline along the top edge (material bars only). */
  divider?: boolean;
  /** Classes for the inner row (gap, layout). */
  className?: string;
}

/**
 * Fixed bottom bar, the width of the phone, safe-area aware (--safe-bottom: the 34px home indicator in the
 * laptop frame, the device inset on a phone). It reserves its own height in the page flow, so the last
 * content always scrolls clear of it.
 */
export function BottomBar({ children, show = true, material = true, divider = true, className }: BottomBarProps) {
  const [height, setHeight] = useState(0);

  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(() => setHeight(node.offsetHeight));
    observer.observe(node);
    return () => {
      observer.disconnect();
      setHeight(0);
    };
  }, []);

  return (
    <>
      <div aria-hidden style={{ height }} />
      <AnimatePresence>
        {show && (
          <motion.div
            ref={measure}
            className={cn("fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-column", !material && "pointer-events-none")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: SPRING }}
            exit={{ opacity: 0, y: 12, transition: EXIT }}
          >
            {material && <div aria-hidden className="material pointer-events-none absolute inset-0" />}
            {material && divider && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line" />}
            <div
              className={cn(
                "relative px-4",
                material ? "pt-2.5 pb-safe" : "pt-2 pb-safe-float [&>*]:pointer-events-auto",
                className,
              )}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
