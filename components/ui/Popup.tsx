"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { IconButton } from "./IconButton";
import { isPassThrough } from "./layers";
import { EASE_OUT, EXIT, SPRING } from "./motion";

export type PopupIconTone = "accent" | "offer" | "none";

const iconTones: Record<PopupIconTone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  offer: "bg-offer-soft text-offer",
  none: "text-ink",
};

export interface PopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Large illustration icon, sized to 88px for you, e.g. `<BellRing className="animate-ring" />`. */
  icon?: ReactNode;
  /** Tinted disc behind the icon. */
  iconTone?: PopupIconTone;
  title: string;
  /** Supporting copy under the title. */
  description?: ReactNode;
  /** Extra body content under the description. */
  children?: ReactNode;
  /** The action(s), e.g. `<Button block size="lg">Go to order</Button>`. Receives focus on open. */
  action?: ReactNode;
  /** Allow the close X, Escape and scrim tap. */
  dismissible?: boolean;
}

/**
 * Centred dialog over a blurred, dimmed backdrop: close X top-left, icon, title, body, action.
 * Focus is trapped while open, Escape closes, and the card springs in from 0.95.
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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[60] bg-scrim backdrop-blur-[8px] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.25, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: EXIT }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center p-4">
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
              >
                <motion.div
                  className="pointer-events-auto relative w-full max-w-[358px] rounded-popup bg-surface px-6 pt-12 pb-6 text-center shadow-popup outline-none"
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.95 }}
                  animate={{ opacity: 1, scale: 1, transition: reduce ? { duration: 0.2 } : SPRING }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 0.97, transition: EXIT }}
                >
                  {icon && (
                    <div
                      aria-hidden
                      className={cn(
                        "mx-auto mb-6 grid size-36 place-items-center rounded-full [&_svg]:size-[88px]",
                        iconTones[iconTone],
                      )}
                    >
                      {icon}
                    </div>
                  )}
                  <Dialog.Title className="font-display text-title font-semibold text-ink">{title}</Dialog.Title>
                  {description && (
                    <Dialog.Description asChild>
                      <div className="mx-auto mt-2 max-w-[30ch] text-body text-pretty text-ink-2">{description}</div>
                    </Dialog.Description>
                  )}
                  {children && <div className="mt-4">{children}</div>}
                  {action && <div className="mt-7 flex flex-col gap-2">{action}</div>}
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
