"use client";

import { Minus, Plus, Trash } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { cn, positioned } from "./cn";
import { SPRING_SNAPPY } from "./motion";

/*
 * Only one stepper is expanded at a time. The shared slot holds the open stepper's id; adding a first item
 * elsewhere writes a token that matches no stepper, which collapses whichever was open.
 */
let expandedId: string | null = null;
const listeners = new Set<() => void>();
function setExpanded(id: string | null) {
  if (expandedId === id) return;
  expandedId = id;
  listeners.forEach((notify) => notify());
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}
const getExpanded = () => expandedId;
const getServerExpanded = () => null;

const IDLE_COLLAPSE_MS = 3000;

export type StepperSize = "sm" | "md";
export type StepperVariant = "outline" | "glass";

/*
 * sm: 28px over image tiles; md: 32px in menu and basket rows. Collapsed ("+" or the count) the circle's hit
 * area extends to 44px all round. Expanded ("− n +") each button is 36px (sm) or 40px (md) wide and its hit
 * area reaches 44px tall; "−" and "+" also reach past the pill's ends to 44px wide.
 */
const dims: Record<
  StepperSize,
  { box: string; btn: string; open: string; hitRound: string; hitY: string; hitStart: string; hitEnd: string; text: string }
> = {
  sm: {
    box: "size-7",
    btn: "size-7 [&_svg]:size-3.5",
    open: "h-7 w-9 [&_svg]:size-3.5",
    hitRound: "before:-inset-2",
    hitY: "before:-inset-y-2",
    hitStart: "before:-left-2 before:right-0",
    hitEnd: "before:-right-2 before:left-0",
    text: "text-meta",
  },
  md: {
    box: "size-8",
    btn: "size-8 [&_svg]:size-4",
    open: "h-8 w-10 [&_svg]:size-4",
    hitRound: "before:-inset-1.5",
    hitY: "before:-inset-y-1.5",
    hitStart: "before:-left-1 before:right-0",
    hitEnd: "before:-right-1 before:left-0",
    text: "text-body",
  },
};

const idle: Record<StepperVariant, string> = {
  outline: "bg-surface text-ink ring-1 ring-line-strong ring-inset",
  glass: "glass text-ink",
};

const tick: Variants = {
  enter: (dir: number) => ({ y: dir * 10, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir * -10, opacity: 0 }),
};

const pop = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.12 } },
};

export interface StepperProps {
  /** Quantity of this item in your basket. */
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  /** Item name, used in accessible labels ("Add Margherita"). */
  label: string;
  /** md (32px) for menu and basket rows, sm (28px) over image tiles. */
  size?: StepperSize;
  /** Look of the empty "+": outline on the page, glass when floating over a photo. */
  variant?: StepperVariant;
  /**
   * Expanded ("− n +") state, controlled. Lets a screen open the stepper from a row tap. The stepper still
   * asks to close (onOpenChange(false)) after 3s idle, when another stepper opens, on Escape, and when the
   * last one is removed. Only takes effect while `qty` is above zero.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Initial expanded state when uncontrolled. */
  defaultOpen?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Item quantity control. "+" adds the first one and fills with the count; tapping the count expands
 * into "− n +" (trash at 1). Collapses after 3s idle or when another stepper opens. Grows leftward from its
 * right edge without moving surrounding layout. The pill does not clip, so focus rings and the extended hit
 * areas reach past its edge; only the count clips its rolling digit.
 */
export function Stepper({
  qty,
  onAdd,
  onRemove,
  label,
  size = "md",
  variant = "outline",
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  disabled = false,
  className,
}: StepperProps) {
  const id = useId();
  const current = useSyncExternalStore(subscribe, getExpanded, getServerExpanded);
  const controlled = openProp !== undefined;
  const expanded = qty > 0 && (controlled ? openProp : current === id);
  const state: "add" | "count" | "open" = qty <= 0 ? "add" : expanded ? "open" : "count";
  const [dir, setDir] = useState<1 | -1>(1);
  const [activity, setActivity] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const countRef = useRef<HTMLButtonElement>(null);
  const prevState = useRef(state);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });
  const d = dims[size];

  const setOpen = (next: boolean) => {
    if (next) setExpanded(id);
    else if (getExpanded() === id) setExpanded(null);
    onOpenChangeRef.current?.(next);
  };

  // Uncontrolled: open on mount when asked to (defaultOpen is read once).
  const openOnMount = useRef(!controlled && defaultOpen && qty > 0);
  useEffect(() => {
    if (openOnMount.current) setExpanded(id);
  }, [id]);

  // Controlled: claim the shared slot while open, so any other open stepper collapses.
  useEffect(() => {
    if (controlled && expanded) setExpanded(id);
  }, [controlled, expanded, id]);

  // Controlled: another stepper opened or a first item was added elsewhere, so ask to close. Reads the slot
  // live, after the claim above has run.
  useEffect(() => {
    const holder = getExpanded();
    if (controlled && expanded && holder !== null && holder !== id) onOpenChangeRef.current?.(false);
  }, [controlled, expanded, current, id]);

  // Collapse after a few seconds without interaction.
  useEffect(() => {
    if (state !== "open") return;
    const timer = window.setTimeout(() => {
      if (getExpanded() === id) setExpanded(null);
      onOpenChangeRef.current?.(false);
    }, IDLE_COLLAPSE_MS);
    return () => window.clearTimeout(timer);
  }, [state, activity, id]);

  // Release the shared slot if this stepper unmounts while open.
  useEffect(
    () => () => {
      if (getExpanded() === id) setExpanded(null);
    },
    [id],
  );

  // Keep keyboard focus on the control while its buttons swap.
  useEffect(() => {
    const prev = prevState.current;
    prevState.current = state;
    if (prev === state || state === "open") return;
    const active = document.activeElement;
    if (!active || !wrapperRef.current?.contains(active)) return;
    const target = state === "add" ? addRef.current : countRef.current;
    if (target && target !== active) target.focus({ preventScroll: true });
  }, [state]);

  const add = () => {
    setDir(1);
    setActivity((n) => n + 1);
    onAdd();
  };
  const remove = () => {
    setDir(-1);
    setActivity((n) => n + 1);
    if (qty <= 1) setOpen(false);
    onRemove();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && state === "open") {
      e.stopPropagation();
      setOpen(false);
    }
  };

  const press = "transition-[scale,background-color] duration-100 ease-out active:scale-[0.9]";
  const isOpen = state === "open";

  return (
    <div
      ref={wrapperRef}
      role="group"
      aria-label={`${label} quantity`}
      onKeyDown={onKeyDown}
      className={cn("shrink-0", positioned(className), d.box, className)}
    >
      <motion.div
        layout
        transition={SPRING_SNAPPY}
        style={{ borderRadius: 999 }}
        className={cn(
          "absolute top-0 right-0 flex items-center transition-colors duration-200",
          state === "add" ? idle[variant] : "bg-accent text-on-accent",
          state !== "add" && variant === "glass" && "shadow-float",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {state === "add" && (
            <motion.button
              key="add"
              ref={addRef}
              type="button"
              disabled={disabled}
              aria-label={`Add ${label}`}
              onClick={() => {
                setExpanded(`add:${id}`);
                add();
              }}
              {...pop}
              className={cn(d.btn, "relative grid place-items-center rounded-full before:absolute disabled:opacity-40", d.hitRound, press)}
            >
              <Plus />
            </motion.button>
          )}

          {isOpen && (
            <motion.button
              key="minus"
              type="button"
              aria-label={qty === 1 ? `Remove ${label}` : `Remove one ${label}`}
              onClick={remove}
              {...pop}
              className={cn(d.open, "relative grid place-items-center rounded-full before:absolute active:bg-ink/10", d.hitY, d.hitStart, press)}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={qty === 1 ? "trash" : "minus"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="grid place-items-center"
                >
                  {qty === 1 ? <Trash /> : <Minus />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          )}

          {state !== "add" && (
            <motion.button
              key="count"
              ref={countRef}
              layout="position"
              type="button"
              disabled={disabled}
              aria-expanded={isOpen}
              aria-label={`${qty} ${label} in basket. ${isOpen ? "Done" : "Change quantity"}`}
              onClick={() => {
                setActivity((n) => n + 1);
                setOpen(!isOpen);
              }}
              {...pop}
              className={cn(
                isOpen ? d.open : d.btn,
                d.text,
                "tnum relative grid place-items-center rounded-full font-semibold before:absolute",
                isOpen ? cn("before:inset-x-0", d.hitY) : d.hitRound,
                press,
              )}
            >
              {/* Clips only the rolling digit, so the button's focus ring and hit area stay whole. */}
              <span aria-hidden className="grid size-full place-items-center overflow-hidden rounded-[inherit]">
                <AnimatePresence initial={false} mode="popLayout" custom={dir}>
                  <motion.span
                    key={qty}
                    custom={dir}
                    variants={tick}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={SPRING_SNAPPY}
                  >
                    {qty}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.button>
          )}

          {isOpen && (
            <motion.button
              key="plus"
              type="button"
              aria-label={`Add another ${label}`}
              onClick={add}
              {...pop}
              className={cn(d.open, "relative grid place-items-center rounded-full before:absolute active:bg-ink/10", d.hitY, d.hitEnd, press)}
            >
              <Plus />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
      <span className="sr-only" aria-live="polite">
        {qty > 0 ? `${qty} in basket` : ""}
      </span>
    </div>
  );
}
