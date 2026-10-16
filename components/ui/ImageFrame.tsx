"use client";

import Image from "next/image";
import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "./cn";

export type ImageRadius = "none" | "chip" | "card" | "tile";

const radii: Record<ImageRadius, string> = {
  none: "rounded-none",
  chip: "rounded-chip",
  card: "rounded-card",
  tile: "rounded-sheet",
};

export interface ImageFrameProps {
  /** Path under /public, e.g. "/images/items/margherita.jpg". Missing or failing images fall back to the emoji tile. */
  src?: string;
  /** Describe the food; use "" for purely decorative repeats. */
  alt: string;
  /** CSS aspect ratio: "1/1", "4/3", "16/10"… Ignored when the frame is sized by className (e.g. `size-24`). */
  ratio?: string;
  /** Shown centred on the tinted tile when there is no image. */
  emoji?: string;
  /** Corner radius: none (full-bleed hero), chip 12, card 18, tile 24 (default). */
  radius?: ImageRadius;
  /** next/image `sizes`. Pass the rendered width for small tiles, e.g. "96px" or "45vw". */
  sizes?: string;
  /**
   * Above-the-fold image (the hero, the first carousel cards): loads eagerly with high fetch priority and is
   * preloaded from the document head. Passed to next/image as `priority`.
   */
  priority?: boolean;
  /** Same as `priority`. */
  preload?: boolean;
  className?: string;
  /** Overlays inside the frame (buttons, badges), positioned by you. The frame clips its content. */
  children?: ReactNode;
}

/**
 * Fixed aspect-ratio image with object-fit cover on a --surface-2 tile. Images are served as-is (the files
 * are pre-sized JPEGs and `images.unoptimized` is set), fade in over 150ms on first load, appear at once
 * when cached, and fall back to the emoji when the file is missing, so layout never shifts or breaks.
 */
export function ImageFrame({
  src,
  alt,
  ratio = "4/3",
  emoji,
  radius = "tile",
  sizes = "(min-width: 500px) 402px, 100vw",
  priority = false,
  preload = false,
  className,
  children,
}: ImageFrameProps) {
  const style: CSSProperties = { aspectRatio: ratio };
  return (
    <div className={cn("@container relative isolate overflow-hidden bg-surface-2", radii[radius], className)} style={style}>
      {src ? (
        <FrameImage key={src} src={src} alt={alt} emoji={emoji} sizes={sizes} priority={priority || preload} />
      ) : (
        <Fallback emoji={emoji} label={alt} />
      )}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-ink/[0.06] ring-inset" />
      {children}
    </div>
  );
}

function FrameImage({ src, alt, emoji, sizes, priority }: { src: string; alt: string; emoji?: string; sizes: string; priority: boolean }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");
  // A cached image can finish before React attaches onLoad; show it straight away instead of fading.
  const settle = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setStatus("loaded");
  }, []);
  if (status === "failed") return <Fallback emoji={emoji} label={alt} />;
  return (
    <Image
      ref={settle}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      draggable={false}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("failed")}
      className={cn(
        "object-cover transition-opacity duration-150 ease-out select-none",
        status === "loaded" ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

function Fallback({ emoji, label }: { emoji?: string; label: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className="absolute inset-0 grid place-items-center"
    >
      {emoji && (
        <span aria-hidden className="text-[clamp(20px,34cqw,72px)] leading-none select-none">
          {emoji}
        </span>
      )}
    </span>
  );
}
