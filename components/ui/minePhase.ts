/**
 * Ref callback for elements carrying `animate-mine`: pins their mine-pulse to the document timeline's origin,
 * so every contribution slice, segment and legend dot breathes in phase whenever it mounts.
 */
export function lockMinePhase(el: Element | null) {
  if (!el) return;
  for (const a of el.getAnimations()) {
    if (a instanceof CSSAnimation && a.animationName === "mine-pulse") a.startTime = 0;
  }
}
