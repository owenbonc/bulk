"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { cn } from "./cn";
import { IconButton } from "./IconButton";

export interface SheetProps {
  /** Controlled open state. Omit both `open` and `onOpenChange` and pass `trigger` for an uncontrolled sheet. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the sheet (rendered as-is, must be a single focusable element such as a button). */
  trigger?: ReactNode;
  /** Sheet heading; always announced to screen readers. */
  title: string;
  /** Hide the heading visually (it stays accessible). */
  hideTitle?: boolean;
  /** One line under the title. */
  description?: ReactNode;
  /** Pinned below the scrolling body, e.g. a full-width "Apply" button. */
  footer?: ReactNode;
  /** Show the close X in the header. */
  showClose?: boolean;
  /** Allow drag, scrim tap and Escape to dismiss. */
  dismissible?: boolean;
  /** Called after the close animation finishes (useful to reset state). */
  onClosed?: () => void;
  /** Classes for the scrolling body. */
  className?: string;
  children?: ReactNode;
}

/**
 * Bottom sheet (vaul Drawer): handle, dimming scrim, title, optional description and footer, safe-area
 * padding, and a body that scrolls on its own. Focus is trapped while open and Escape closes it.
 */
export function Sheet({
  open,
  onOpenChange,
  trigger,
  title,
  hideTitle = false,
  description,
  footer,
  showClose = true,
  dismissible = true,
  onClosed,
  className,
  children,
}: SheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      onAnimationEnd={(isOpen) => {
        if (!isOpen) onClosed?.();
      }}
    >
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <Drawer.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-column flex-col rounded-t-sheet bg-surface shadow-sheet outline-none"
        >
          <Drawer.Handle
            preventCycle
            className="mt-2 mb-1 shrink-0"
            style={{ width: 36, height: 5, background: "var(--line-strong)", opacity: 1 }}
          />
          <header
            className={cn(
              "flex shrink-0 items-start gap-3 px-5 pt-2",
              hideTitle && !showClose ? "pb-1" : "pb-3",
              hideTitle && "min-h-0",
            )}
          >
            <div className={cn("min-w-0 flex-1", hideTitle ? "sr-only" : "pt-1.5")}>
              <Drawer.Title className="font-display text-section font-semibold text-ink">{title}</Drawer.Title>
              {description && (
                <Drawer.Description className="mt-1 text-body text-ink-2">{description}</Drawer.Description>
              )}
            </div>
            {showClose && dismissible && (
              <Drawer.Close asChild>
                <IconButton aria-label="Close" size="sm" variant="soft" className="-mr-1.5 ml-auto">
                  <X />
                </IconButton>
              </Drawer.Close>
            )}
          </header>
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5",
              footer ? "pb-4" : "pb-[max(20px,env(safe-area-inset-bottom))]",
              className,
            )}
          >
            {children}
          </div>
          {footer && (
            <div className="shrink-0 border-t border-line px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
