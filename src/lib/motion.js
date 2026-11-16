/**
 * anime.js counterparts of the CSS motion tokens in globals.css
 * (--ease-out, --duration-fast/base/slow), so JS-driven motion matches CSS motion.
 */
export const MOTION = {
  ease: "out(4)", // ease-out quart, same curve as --ease-out
  fast: 200,
  base: 360,
  slow: 560,
};

/** Shared reduced-motion check for JS-driven effects. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
