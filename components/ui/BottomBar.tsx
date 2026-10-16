"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, type ReactNode } from "react";
import { cn } from "./cn";
import { EXIT, SPRING } from "./motion";

export interface BottomBarProps {
  children: ReactNode;
  /** Slides up 12px and fades in when true, back down when false. */
  show?: boolean;
  /** Translucent material behind the whole bar. Turn off when the content brings its own floating surface. */
  material?: boolean;
  /** Hairline along the top edge (only with material). */
  divider?: boolean;
  /** Classes for the inner row (padding, gap, layout). */
  className?: string;
}

/**
 * Fixed bottom bar, the width of the phone column, padded clear of the home indicator. It reserves its
 * own height in the page flow, so content never hides underneath.
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
            <div className={cn("relative px-4 pt-3 pb-safe", !material && "[&>*]:pointer-events-auto", className)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
