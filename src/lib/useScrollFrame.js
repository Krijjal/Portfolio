import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion";

/**
 * Runs scroll-linked work at most once per animation frame.
 *
 * `setup` runs once after mount and returns the per-frame `update` function (or
 * nothing to opt out). `update` runs immediately, then on every scroll/resize,
 * batched through requestAnimationFrame. Skipped entirely under reduced motion.
 */
export function useScrollFrame(setup) {
  const setupRef = useRef(setup);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const update = setupRef.current();
    if (typeof update !== "function") return undefined;

    let frame = 0;
    const run = () => {
      frame = 0;
      update();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };

    run();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
}
