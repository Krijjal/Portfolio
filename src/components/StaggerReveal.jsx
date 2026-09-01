"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll, stagger } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Staggers its `.stagger-item` descendants in together once the group scrolls
 * into view — one authored group animation instead of per-item Reveal + manual
 * Tailwind delay classes.
 */
export function StaggerReveal({ children, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll(".stagger-item");
    if (!items.length || prefersReducedMotion()) return;

    animate(items, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 360,
      ease: "out(3)",
      delay: stagger(70),
      autoplay: onScroll({ target: el, enter: "bottom-=40 top", repeat: false }),
    });
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
