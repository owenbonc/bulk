"use client";

import { Suspense, useLayoutEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "./cn";
import {
  PortalContainerProvider,
  ScrollRootProvider,
  scrollRootProps,
  useFrame,
  useStatusBarToneValue,
} from "./frame";

/**
 * The app shell. On a phone it is the page (full screen; a centred column on wide touch screens). On the
 * laptop it draws an iPhone 16 Pro: a 402×874 screen with 55px corners, a thin black bezel and titanium rim,
 * centred on sand and scaled down to fit the window. The screen is the containing block for every fixed
 * layer and holds the portal layer for sheets, popups and toasts, so nothing escapes the phone; a fake iOS
 * status bar and home indicator sit on top. Mounted once in the root layout.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const { framed, scale } = useFrame();
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  return (
    <div className="device-stage">
      <div className="device-phone" style={framed ? ({ "--frame-scale": scale } as CSSProperties) : undefined}>
        <div className="device-screen">
          <ScrollRootProvider value={scroller}>
            <PortalContainerProvider value={portal}>
              <div ref={setScroller} {...scrollRootProps} className="device-scroll">
                {children}
              </div>
            </PortalContainerProvider>
          </ScrollRootProvider>
          <Suspense fallback={null}>
            <ScrollTopOnRoute framed={framed} scroller={scroller} />
          </Suspense>
          {/* Sheets and popups portal here: inside the phone, above the app, under the status bar. */}
          <div ref={setPortal} data-portal-root="" />
          <StatusBar />
          <HomeIndicator />
        </div>
      </div>
    </div>
  );
}

/**
 * Each route opens at the top. In the frame the app scrolls in one persistent element that Next's
 * document-based scroll handling doesn't reset. This renders after the page subtree, so its layout effect
 * runs after Next's and also overrides Next's scrollIntoView of the new page. It reads the pathname inside
 * <Suspense> so the root layout stays prerenderable.
 */
function ScrollTopOnRoute({ framed, scroller }: { framed: boolean; scroller: HTMLElement | null }) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (framed && scroller) scroller.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, framed, scroller]);
  return null;
}

// ---- Status bar ----------------------------------------------------------------------------------

function formatClock(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** Ticks on each minute boundary, and again when the tab becomes visible after sleeping. */
function subscribeClock(notify: () => void) {
  let timer = 0;
  const schedule = () => {
    timer = window.setTimeout(() => {
      notify();
      schedule();
    }, 60_000 - (Date.now() % 60_000) + 20);
  };
  schedule();
  document.addEventListener("visibilitychange", notify);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", notify);
  };
}

const serverClock = () => "";

/** The viewer's real time, 24-hour ("01:47"). */
function useClock(): string {
  return useSyncExternalStore(subscribeClock, formatClock, serverClock);
}

/**
 * Fake iOS status bar (frame mode only): 62px tall; the clock and location arrow centred in the left ear,
 * the Dynamic Island (125×37, 11px from the top), and cellular, Wi-Fi and a 65% battery centred in the right
 * ear, all on the island's centre line. Glyphs are ink over cream and white over photos (useStatusBarTone).
 */
function StatusBar() {
  const tone = useStatusBarToneValue();
  const time = useClock();

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-[65] hidden h-[62px] font-system select-none frame:block",
        "transition-colors duration-300 ease-out",
        tone === "light" ? "text-on-photo" : "text-ink",
      )}
    >
      <div className="absolute inset-x-0 top-[11px] flex h-[37px] items-center">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-[3px] pl-[6px]">
          <span className="tnum text-[17px] leading-none font-semibold tracking-[-0.025em]">{time}</span>
          <LocationArrow />
        </div>
        <div className="w-[125px] shrink-0" />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-[6px] pr-[2px]">
          <CellularGlyph />
          <WifiGlyph />
          <BatteryGlyph level={0.65} />
        </div>
      </div>
      <div className="absolute top-[11px] left-1/2 h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-island" />
    </div>
  );
}

/** Location Services arrow beside the clock. */
function LocationArrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" className="mt-[1px] shrink-0">
      <path
        d="M9.9 1.1 1.5 4.6c-.5.2-.4.9.1 1L4.9 6l.4 3.3c.1.5.8.6 1 .1L9.9 1.1Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Four cellular bars, full signal. */
function CellularGlyph() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" className="shrink-0">
      <rect x="0" y="7.6" width="3.1" height="4.4" rx="1" fill="currentColor" />
      <rect x="4.95" y="5.4" width="3.1" height="6.6" rx="1" fill="currentColor" />
      <rect x="9.9" y="2.9" width="3.1" height="9.1" rx="1" fill="currentColor" />
      <rect x="14.85" y="0.4" width="3.1" height="11.6" rx="1" fill="currentColor" />
    </svg>
  );
}

/** Wi-Fi fan: a small wedge and two arcs on a common centre, full strength. */
function WifiGlyph() {
  // Centre of the fan and the ±45° spread of each band.
  const cx = 8.5;
  const cy = 11.4;
  const k = Math.SQRT1_2;
  const arc = (r: number) => `M${cx - r * k} ${cy - r * k}A${r} ${r} 0 0 1 ${cx + r * k} ${cy - r * k}`;
  const wedge = 3.4;
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" className="shrink-0">
      <path d={arc(9.9)} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d={arc(6.55)} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path
        d={`M${cx} ${cy}L${cx - wedge * k} ${cy - wedge * k}A${wedge} ${wedge} 0 0 1 ${cx + wedge * k} ${cy - wedge * k}Z`}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Battery: translucent outline and cap with a solid fill at `level` (0–1). */
function BatteryGlyph({ level }: { level: number }) {
  const inner = 21;
  return (
    <svg width="28" height="13" viewBox="0 0 28 13" className="shrink-0">
      <rect x="0.5" y="0.5" width="24" height="12" rx="3.8" fill="none" stroke="currentColor" strokeOpacity="0.38" />
      <path d="M25.9 4.4v4.2c.8-.3 1.3-1.1 1.3-2.1s-.5-1.8-1.3-2.1Z" fill="currentColor" fillOpacity="0.45" />
      <rect x="2" y="2" width={inner * level} height="9" rx="2.4" fill="currentColor" />
    </svg>
  );
}

/** The home indicator (frame mode only): 134×5, 8px from the bottom edge, over every layer. */
function HomeIndicator() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-2 left-1/2 z-[65] hidden h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink frame:block"
    />
  );
}
