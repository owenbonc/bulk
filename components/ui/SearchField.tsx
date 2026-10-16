"use client";

import { Search, X } from "lucide-react";
import { useRef, type ComponentPropsWithRef } from "react";
import { cn } from "./cn";

export interface SearchFieldProps
  extends Omit<ComponentPropsWithRef<"input">, "value" | "onChange" | "type" | "size" | "defaultValue" | "ref"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name; defaults to the placeholder. */
  label?: string;
  /** md 44px (default), lg 48px. */
  size?: "md" | "lg";
  /** Surface: white on the page, translucent white inside material bars, or clear glass (the Home search bar). */
  tone?: "surface" | "translucent" | "glass";
}

/** Pill search input with a leading magnifier and a clear button. 16px text so iOS never zooms. */
export function SearchField({
  value,
  onValueChange,
  label,
  placeholder = "Search",
  size = "md",
  tone = "surface",
  className,
  ...rest
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "relative flex min-w-0 items-center rounded-full transition-shadow duration-150",
        "focus-within:ring-2 focus-within:ring-accent-ink",
        size === "lg" ? "h-12" : "h-11",
        tone === "glass" ? "glass" : "ring-1 ring-line ring-inset",
        tone === "surface" && "bg-surface",
        tone === "translucent" && "bg-surface/70",
        className,
      )}
    >
      <Search aria-hidden className="pointer-events-none absolute left-3.5 size-[18px] text-ink-3" />
      <input
        {...rest}
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-label={label ?? placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onValueChange("");
          }
          rest.onKeyDown?.(e);
        }}
        className="h-full w-full min-w-0 rounded-full bg-transparent pr-10 pl-10 text-ink outline-none focus-visible:outline-none"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onValueChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-1.5 grid size-8 place-items-center rounded-full bg-surface-2 text-ink-2 transition-[scale,background-color] duration-100 ease-out before:absolute before:-inset-1.5 active:scale-[0.9] active:bg-line"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
