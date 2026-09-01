"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll, utils } from "animejs";
import { parseCountable } from "@/lib/impactCounter";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Counts up to the stat value once it scrolls into view. Only for numeric stats
 * ("+60%", "#2") — qualitative labels ("Production grade") render as static text.
 */
export function ImpactStatValue({ value, className }) {
  const ref = useRef(null);
  const parsed = parseCountable(value);

  useEffect(() => {
    if (!parsed) return;
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const counter = { value: 0 };
    animate(counter, {
      value: parsed.target,
      duration: 1100,
      ease: "outExpo",
      modifier: utils.round(parsed.decimals),
      onUpdate: () => {
        el.textContent = `${parsed.prefix}${counter.value}${parsed.suffix}`;
      },
      autoplay: onScroll({
        target: el,
        enter: "bottom-=40 top",
        repeat: false,
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p ref={ref} className={className}>
      {value}
    </p>
  );
}
