/** Shared reduced-motion check for anime.js-driven effects (Hero timeline, KR mark draw-on, Impact counters). */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
