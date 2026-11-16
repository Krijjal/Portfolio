"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-in reveal as progressive enhancement. The server renders `data-reveal="shown"`,
 * so content is visible without JS. After mount, blocks still below the fold switch to
 * "pending" (hidden via `.js [data-reveal="pending"]` in globals.css) and animate in when
 * they intersect. Blocks already on screen at mount are never hidden.
 */
export function Reveal({ children, className = "" }) {
  const ref = useRef(null);
  const [state, setState] = useState("shown");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    setState("pending");
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState("shown");
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal={state} className={className}>
      {children}
    </div>
  );
}
