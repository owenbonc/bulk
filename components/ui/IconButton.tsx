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

const sizes: Record<IconButtonSize, string> = {
  // 36px visual, 44px hit area.
  sm: "size-9 before:absolute before:-inset-1 [&_svg]:size-[18px]",
  md: "size-11",
  lg: "size-12 [&_svg]:size-[22px]",
};

interface OwnProps {
  /** Required: icon-only buttons need an accessible name. */
  "aria-label": string;
  /** Default `glass`. */
  variant?: IconButtonVariant;
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

function Badge() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-[7px] right-[7px] size-2.5 rounded-full border border-accent-ink/40 bg-accent ring-2 ring-bg"
    />
  );
}

/** Round icon-only button, 44px, clear glass by default. Pass `href` to render a Next.js Link. */
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
        className={cn(base, positioned(className), variantClasses(variant, iconColor), sizes[size], className)}
      >
        {children}
        {badge && <Badge />}
      </Link>
    );
  }

  const { variant = "glass", size = "md", iconColor, badge, className, children, type = "button", ...rest } = props;
  return (
    <button
      {...rest}
      type={type}
      className={cn(base, positioned(className), variantClasses(variant, iconColor), sizes[size], className)}
    >
      {children}
      {badge && <Badge />}
    </button>
  );
}
