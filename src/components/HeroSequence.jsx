"use client";

import { useEffect, useRef } from "react";
import { createTimeline, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Orchestrates the hero's load-in as a single authored timeline (the brand's one
 * emphasis moment per screen), replacing the per-block Reveal fades used elsewhere.
 * Headline gets a longer, distinct beat; everything else staggers in around it.
 */
export function HeroSequence({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll(".hero-item");
    if (!items.length) return;

    if (prefersReducedMotion()) {
      items.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const timeline = createTimeline({ defaults: { ease: "out(3)" } });
    timeline.add(items, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: (_el, i) => (i === 1 ? 560 : 420),
      delay: stagger(90),
    });

    return () => timeline.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}
