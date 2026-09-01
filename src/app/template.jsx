"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Route-change entrance — the brand spec's "page/section transition" tier
 * (ease-out, 8-12px upward translate) applied on every navigation. Skipped on
 * "/", which already has its own richer HeroSequence load-in; this only fills
 * the gap on every other route, which previously had no entrance at all.
 */
export default function Template({ children }) {
  const pathname = usePathname();
  const ref = useRef(null);
  const isHome = pathname === "/";

  useEffect(() => {
    const el = ref.current;
    if (!el || isHome || prefersReducedMotion()) return;

    animate(el, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 360,
      ease: "out(3)",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div ref={ref} className={isHome ? "" : "page-enter"}>
      {children}
    </div>
  );
}
