"use client";

import Link from "next/link";
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { cn, positioned } from "./cn";

export type IconButtonVariant = "plain" | "soft" | "outline" | "accent" | "glass";
export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonIconColor = "ink" | "accent";

const base =
  "inline-grid shrink-0 place-items-center rounded-full select-none " +
  "transition-[scale,background-color,color,box-shadow,opacity] duration-100 ease-out active:scale-[0.94] " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 " +
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:active:scale-100";

// Surface and default icon colour per variant, kept apart so `iconColor` can swap the colour cleanly.
const variants: Record<IconButtonVariant, { surface: string; text: string }> = {
  // Clear glass disc (the default): every round control on the page and over photos.
  glass: { surface: "glass", text: "text-ink" },
  plain: { surface: "active:bg-ink/[0.07] hover:not-disabled:not-aria-disabled:bg-ink/[0.05]", text: "text-ink" },
  // Quiet filled disc for close buttons inside sheets and popups.
  soft: {
    surface: "bg-surface-2 active:bg-line hover:not-disabled:not-aria-disabled:bg-surface-2-hover",
    text: "text-ink-2",
  },
  outline: {
    surface: "bg-surface ring-1 ring-line ring-inset active:bg-surface-2 hover:not-disabled:not-aria-disabled:bg-surface-hover",
    text: "text-ink",
  },
  accent: {
    surface: "bg-accent active:bg-accent-strong hover:not-disabled:not-aria-disabled:bg-accent-hover",
    text: "text-on-accent",
  },
};

function variantClasses(variant: IconButtonVariant, iconColor: IconButtonIconColor | undefined): string {
  const v = variants[variant];
  return cn(v.surface, iconColor === "accent" ? "text-accent-ink" : iconColor === "ink" ? "text-ink" : v.text);
}

// Every size reaches a 44px hit area: the visible disc plus an invisible ::before ring.
const sizes: Record<IconButtonSize, { box: string; badge: string }> = {
  // 32px: close buttons in sheets and popups.
  sm: { box: "size-8 before:absolute before:-inset-1.5 [&_svg]:size-4", badge: "top-[3px] right-[3px] size-2" },
  // 40px: every round control on a screen (account, create, bell, back, search, info, section arrows).
  md: { box: "size-10 before:absolute before:-inset-0.5", badge: "top-[5px] right-[5px] size-2.5" },
  // 44px.
  lg: { box: "size-11 [&_svg]:size-[22px]", badge: "top-1.5 right-1.5 size-2.5" },
};

interface OwnProps {
  /** Required: icon-only buttons need an accessible name. */
  "aria-label": string;
  /** Default `glass`. */
  variant?: IconButtonVariant;
  /** md 40px (default), sm 32px, lg 44px; all with a 44px hit area. */
  size?: IconButtonSize;
  /** Icon colour; defaults to the variant's. `accent` draws it in --accent-ink so a glass button still reads as the primary action. */
  iconColor?: IconButtonIconColor;
  /** Shows a small accent dot, e.g. unread notifications. */
  badge?: boolean;
  /** The icon. */
  children: ReactNode;
}

type AsButton = OwnProps & Omit<ComponentPropsWithRef<"button">, keyof OwnProps> & { href?: undefined };
type AsLink = OwnProps &
  Omit<ComponentPropsWithRef<typeof Link>, keyof OwnProps | "href"> & { href: string; disabled?: boolean };

export type IconButtonProps = AsButton | AsLink;

function Badge({ size }: { size: IconButtonSize }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full border border-accent-ink bg-accent ring-2 ring-bg",
        sizes[size].badge,
      )}
    />
  );
}

/**
 * Round icon-only button: 40px visible with a 44px hit area, clear glass by default. Pass `href` to render a
 * Next.js Link.
 */
export function IconButton(props: IconButtonProps) {
  if (props.href !== undefined) {
    const { variant = "glass", size = "md", iconColor, badge, disabled, className, children, href, onClick, ...rest } = props;
    return (
      <Link
        {...rest}
        href={href}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : rest.tabIndex}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        className={cn(base, positioned(className), variantClasses(variant, iconColor), sizes[size].box, className)}
      >
        {children}
        {badge && <Badge size={size} />}
      </Link>
    );
  }

  const { variant = "glass", size = "md", iconColor, badge, className, children, type = "button", ...rest } = props;
  return (
    <button
      {...rest}
      type={type}
      className={cn(base, positioned(className), variantClasses(variant, iconColor), sizes[size].box, className)}
    >
      {children}
      {badge && <Badge size={size} />}
    </button>
  );
}
