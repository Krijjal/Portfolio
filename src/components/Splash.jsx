"use client";

import { useEffect, useRef, useState } from "react";
import { animate, svg } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";
import { MARK_PATH } from "./KrMark";

/**
 * First-load splash: draws the KR mark large and centered, then flies it into
 * the navbar's mark position (FLIP: translate + scale between measured rects)
 * before fading out to reveal the real, always-static header mark underneath.
 * Once per browser session; skipped entirely under reduced motion.
 */
export function Splash() {
  const [active, setActive] = useState(false);
  const overlayRef = useRef(null);
  const markWrapRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    let alreadyShown = true;
    try {
      alreadyShown = sessionStorage.getItem("kr-splash-shown") === "1";
    } catch {
      // sessionStorage unavailable — skip the splash rather than risk it replaying every load.
    }

    if (alreadyShown || prefersReducedMotion()) return;

    try {
      sessionStorage.setItem("kr-splash-shown", "1");
    } catch {
      // ignore
    }

    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;

    const overlay = overlayRef.current;
    const markWrap = markWrapRef.current;
    const pathEl = pathRef.current;
    const headerMark = document.querySelector("header [data-kr-mark]");
    if (!overlay || !markWrap || !pathEl || !headerMark) {
      setActive(false);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    pathEl.setAttribute("fill-opacity", "0");
    pathEl.setAttribute("stroke", "var(--color-text)");
    pathEl.setAttribute("stroke-width", "2");
    pathEl.setAttribute("stroke-opacity", "1");

    const [drawable] = svg.createDrawable(pathEl);

    animate(drawable, {
      draw: ["0 0", "0 1"],
      duration: 650,
      ease: "inOutSine",
      onComplete: () => {
        animate(pathEl, {
          fillOpacity: [0, 1],
          strokeOpacity: [1, 0],
          duration: 220,
          ease: "outQuad",
          onComplete: flyToHeader,
        });
      },
    });

    function flyToHeader() {
      const startRect = markWrap.getBoundingClientRect();
      const endRect = headerMark.getBoundingClientRect();
      const dx = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
      const dy = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);
      const scale = endRect.width / startRect.width;

      animate(markWrap, {
        translateX: dx,
        translateY: dy,
        scale,
        duration: 550,
        delay: 100,
        ease: "inOut(2)",
        onComplete: () => {
          animate(overlay, {
            opacity: [1, 0],
            duration: 280,
            ease: "outQuad",
            onComplete: () => {
              document.body.style.overflow = prevOverflow;
              setActive(false);
            },
          });
        },
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg)]"
      aria-hidden="true"
    >
      <div ref={markWrapRef} className="h-16 w-auto sm:h-20 lg:h-24">
        <svg viewBox="0 0 441.1 287.76" className="h-full w-auto" fill="none">
          <path ref={pathRef} d={MARK_PATH} fillRule="evenodd" fill="var(--color-text)" />
        </svg>
      </div>
    </div>
  );
}
