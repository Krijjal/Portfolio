"use client";

import { useEffect, useRef, useState } from "react";

const variants = {
  /** Section/page reveals on scroll: 320-400ms ease-out, small upward translate. */
  section: "duration-[360ms] ease-out translate-y-[10px]",
  /** One hero moment per screen, never repeated: 480ms+ ease-out. */
  emphasis: "duration-[520ms] ease-out translate-y-3",
};

/**
 * Scroll-in reveal. Reduced motion falls back to a crossfade only, no translation.
 */
export function Reveal({ children, className = "", variant = "section" }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  const timing = variants[variant] ?? variants.section;
  const [durationClass, easeClass, translateClass] = timing.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] ${durationClass} ${easeClass} motion-reduce:translate-y-0 motion-reduce:duration-200 motion-reduce:ease-linear ${
        show ? `translate-y-0 opacity-100` : `${translateClass} opacity-0 motion-reduce:translate-y-0`
      }`}
    >
      {children}
    </div>
  );
}
