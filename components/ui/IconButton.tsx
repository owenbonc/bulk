"use client";

import Link from "next/link";
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { cn, positioned } from "./cn";

export type IconButtonVariant = "plain" | "soft" | "outline" | "accent" | "glass";
export type IconButtonSize = "sm" | "md" | "lg";

const base =
  "inline-grid shrink-0 place-items-center rounded-full select-none " +
  "transition-[scale,background-color,color,box-shadow,opacity] duration-100 ease-out active:scale-[0.94] " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 " +
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:active:scale-100";

const variants: Record<IconButtonVariant, string> = {
  plain: "text-ink active:bg-ink/[0.07] hover:not-disabled:not-aria-disabled:bg-ink/[0.05]",
  // Quiet filled disc for close buttons inside sheets and popups.
  soft: "bg-surface-2 text-ink-2 active:bg-line hover:not-disabled:not-aria-disabled:bg-[#e9e6d9]",
  outline:
    "bg-surface text-ink ring-1 ring-line ring-inset active:bg-surface-2 hover:not-disabled:not-aria-disabled:bg-[#fcfbf7]",
  accent: "bg-accent text-on-accent active:bg-accent-strong hover:not-disabled:not-aria-disabled:bg-[#acc22b]",
  // Translucent disc for floating over photos.
  glass: "material text-ink shadow-float active:bg-[rgb(239_236_224/0.9)]",
};

const sizes: Record<IconButtonSize, string> = {
  // 36px visual, 44px hit area.
  sm: "size-9 before:absolute before:-inset-1 [&_svg]:size-[18px]",
  md: "size-11",
  lg: "size-12 [&_svg]:size-[22px]",
};

interface OwnProps {
  /** Required: icon-only buttons need an accessible name. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
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

/** Round icon-only button, 44px by default. Pass `href` to render a Next.js Link. */
export function IconButton(props: IconButtonProps) {
  if (props.href !== undefined) {
    const { variant = "plain", size = "md", badge, disabled, className, children, href, onClick, ...rest } = props;
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
        className={cn(base, positioned(className), variants[variant], sizes[size], className)}
      >
        {children}
        {badge && <Badge />}
      </Link>
    );
  }

  const { variant = "plain", size = "md", badge, className, children, type = "button", ...rest } = props;
  return (
    <button {...rest} type={type} className={cn(base, positioned(className), variants[variant], sizes[size], className)}>
      {children}
      {badge && <Badge />}
    </button>
  );
}
