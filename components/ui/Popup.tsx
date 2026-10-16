"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "./cn";
import { usePortalContainer } from "./frame";
import { IconButton } from "./IconButton";
import { isPassThrough } from "./layers";
import { EASE_OUT, EXIT, SPRING } from "./motion";

export type PopupIconTone = "accent" | "offer" | "none";

const FOCUSABLE = "a[href]:not([inert]), button:not([disabled]):not([inert])";

const iconTones: Record<PopupIconTone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  offer: "bg-offer-soft text-offer",
  none: "text-ink",
};

export interface PopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Large illustration icon, sized to 76px on a 120px disc for you, e.g. `<BellRing className="animate-ring" />`. */
  icon?: ReactNode;
  /** Tinted disc behind the icon. */
  iconTone?: PopupIconTone;
  title: string;
  /** Supporting copy under the title. */
  description?: ReactNode;
  /** Extra body content under the description. */
  children?: ReactNode;
  /** The action(s), e.g. `<Button block size="lg">Go to order</Button>`. Its first enabled button or link receives focus on open. */
  action?: ReactNode;
  /** Allow the close X, Escape and scrim tap. */
  dismissible?: boolean;
}

/**
 * Centred dialog over a blurred, dimmed backdrop: close X top-left, icon, title, body, action. Renders
 * inside the phone (the frame's portal layer). Focus moves to the first action on open (the close X when
 * there is none), is trapped while open, and returns to the element that opened it on close. Escape closes,
 * and the card springs in from 0.95.
 */
export function Popup({
  open,
  onOpenChange,
  icon,
  iconTone = "accent",
  title,
  description,
  children,
  action,
  dismissible = true,
}: PopupProps) {
  const reduce = useReducedMotion();
  const container = usePortalContainer();
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount container={container}>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[60] bg-scrim backdrop-blur-[8px] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: EXIT }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center px-4 pt-[calc(var(--safe-top)+8px)] pb-[max(16px,var(--safe-bottom))]">
              <Dialog.Content
                asChild
                forceMount
                {...(description ? {} : { "aria-describedby": undefined })}
                onEscapeKeyDown={(e) => {
                  if (!dismissible) e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                  if (!dismissible || isPassThrough(e.target)) e.preventDefault();
                }}
                onOpenAutoFocus={(e) => {
                  const active = document.activeElement;
                  returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
                  e.preventDefault();
                  const root = e.currentTarget as HTMLElement;
                  const target =
                    root.querySelector<HTMLElement>(`[data-popup-actions] :is(${FOCUSABLE})`) ??
                    root.querySelector<HTMLElement>(FOCUSABLE) ??
                    root;
                  target.focus({ preventScroll: true });
                }}
                onCloseAutoFocus={(e) => {
                  const el = returnFocusRef.current;
                  returnFocusRef.current = null;
                  e.preventDefault();
                  if (el?.isConnected) el.focus({ preventScroll: true });
                }}
              >
                <motion.div
                  className="pointer-events-auto relative w-full max-w-[358px] rounded-popup bg-surface px-5 pt-11 pb-5 text-center shadow-popup outline-none"
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.95 }}
                  animate={{ opacity: 1, scale: 1, transition: reduce ? { duration: 0.2, ease: EASE_OUT } : SPRING }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 0.97, transition: EXIT }}
                >
                  {icon && (
                    <div
                      aria-hidden
                      className={cn(
                        "mx-auto mb-5 grid size-30 place-items-center rounded-full [&_svg]:size-[76px]",
                        iconTones[iconTone],
                      )}
                    >
                      {icon}
                    </div>
                  )}
                  <Dialog.Title className="font-display text-title font-semibold text-ink">{title}</Dialog.Title>
                  {description && (
                    <Dialog.Description asChild>
                      <div className="mx-auto mt-1.5 max-w-[32ch] text-body text-pretty text-ink-2">{description}</div>
                    </Dialog.Description>
                  )}
                  {children && <div className="mt-3">{children}</div>}
                  {action && <div data-popup-actions className="mt-6 flex flex-col gap-2">{action}</div>}
                  {dismissible && (
                    <Dialog.Close asChild>
                      <IconButton aria-label="Close" size="sm" variant="soft" className="absolute top-3 left-3">
                        <X />
                      </IconButton>
                    </Dialog.Close>
                  )}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
