"use client";

import { Minus, Plus, Trash } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { cn, positioned } from "./cn";
import { SPRING_SNAPPY } from "./motion";

/* Only one stepper is expanded at a time: tapping another item collapses the open one. */
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

const dims: Record<StepperSize, { box: string; btn: string; text: string }> = {
  // sm: 32px over image tiles; md: 36px in menu rows. Both extend their hit areas to 44px.
  sm: { box: "size-8", btn: "size-8 [&_svg]:size-4", text: "text-meta" },
  md: { box: "size-9", btn: "size-9 [&_svg]:size-[18px]", text: "text-body" },
};

const idle: Record<StepperVariant, string> = {
  outline: "bg-surface text-ink ring-1 ring-line-strong ring-inset",
  glass: "material text-ink shadow-float",
};

const tick: Variants = {
  enter: (dir: number) => ({ y: dir * 10, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir * -10, opacity: 0 }),
};

const pop = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.12 } },
};

export interface StepperProps {
  /** Quantity of this item in your basket. */
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  /** Item name, used in accessible labels ("Add Margherita"). */
  label: string;
  /** md (36px) for menu rows, sm (32px) over image tiles. */
  size?: StepperSize;
  /** Look of the empty "+": outline on the page, glass when floating over a photo. */
  variant?: StepperVariant;
  disabled?: boolean;
  className?: string;
}

/**
 * Item quantity control. "+" adds the first one and fills with the count; tapping the count expands
 * into "− n +" (trash at 1). Collapses after 3s idle or when another stepper is used. Grows leftward
 * from its right edge without moving surrounding layout.
 */
export function Stepper({ qty, onAdd, onRemove, label, size = "md", variant = "outline", disabled = false, className }: StepperProps) {
  const id = useId();
  const current = useSyncExternalStore(subscribe, getExpanded, getServerExpanded);
  const state: "add" | "count" | "open" = qty <= 0 ? "add" : current === id ? "open" : "count";
  const [dir, setDir] = useState<1 | -1>(1);
  const [activity, setActivity] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const countRef = useRef<HTMLButtonElement>(null);
  const prevState = useRef(state);
  const d = dims[size];

  // Collapse after a few seconds without interaction.
  useEffect(() => {
    if (state !== "open") return;
    const timer = window.setTimeout(() => {
      if (getExpanded() === id) setExpanded(null);
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
    onRemove();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && state === "open") {
      e.stopPropagation();
      setExpanded(null);
    }
  };

  const hit = "relative before:absolute before:-inset-y-1.5";
  const press = "transition-[scale,background-color] duration-100 ease-out active:scale-[0.9]";

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
          "absolute top-0 right-0 flex items-center overflow-hidden transition-colors duration-200",
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
                setExpanded(null);
                add();
              }}
              {...pop}
              className={cn(d.btn, "grid place-items-center rounded-full before:-inset-x-1.5 disabled:opacity-40", hit, press)}
            >
              <Plus />
            </motion.button>
          )}

          {state === "open" && (
            <motion.button
              key="minus"
              type="button"
              aria-label={qty === 1 ? `Remove ${label}` : `Remove one ${label}`}
              onClick={remove}
              {...pop}
              className={cn(d.btn, "grid place-items-center rounded-full active:bg-ink/10", hit, press)}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={qty === 1 ? "trash" : "minus"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
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
              aria-expanded={state === "open"}
              aria-label={`${qty} ${label} in basket. ${state === "open" ? "Done" : "Change quantity"}`}
              onClick={() => {
                setActivity((n) => n + 1);
                setExpanded(state === "open" ? null : id);
              }}
              {...pop}
              className={cn(
                d.btn,
                d.text,
                "tnum relative grid place-items-center overflow-hidden rounded-full font-semibold",
                state === "count" && "before:-inset-x-1",
                hit,
                press,
              )}
            >
              <AnimatePresence initial={false} mode="popLayout" custom={dir}>
                <motion.span
                  key={qty}
                  custom={dir}
                  variants={tick}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={SPRING_SNAPPY}
                  aria-hidden
                >
                  {qty}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          )}

          {state === "open" && (
            <motion.button
              key="plus"
              type="button"
              aria-label={`Add another ${label}`}
              onClick={add}
              {...pop}
              className={cn(d.btn, "grid place-items-center rounded-full active:bg-ink/10", hit, press)}
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
