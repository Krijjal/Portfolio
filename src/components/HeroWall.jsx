"use client";

import { useEffect, useRef } from "react";
import { orderedProjects } from "@/lib/projectOrder";
import { useScrollFrame } from "@/lib/useScrollFrame";

const projects = orderedProjects();
const ROWS = 4;
const TILES_PER_ROW = 8;

/** Small 16:10 wall textures generated next to each screenshot (public/projects/thumbs). */
function thumb(imageUrl) {
  return imageUrl.replace("/projects/", "/projects/thumbs/");
}

// Each row starts at a different project so neighbouring rows never line up.
const rows = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: TILES_PER_ROW }, (_, i) => projects[(r * 3 + i) % projects.length]),
);

/**
 * Signature hero background: every live project as a tilted, slowly drifting 3D wall.
 * Rows drift in alternating directions (CSS). Scrolling through the hero writes
 * --wall-p (0..1) to the section, which tips the wall toward flat, pushes it closer
 * and fades it out as the work showcase arrives. Decorative only (aria-hidden).
 * Reduced motion: a still, tilted wall with no drift and no scroll coupling.
 */
export function HeroWall() {
  const ref = useRef(null);

  // Stop drifting while the hero is off screen.
  useEffect(() => {
    const wall = ref.current;
    const hero = wall?.closest("section");
    if (!wall || !hero) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      wall.dataset.paused = entry.isIntersecting ? "false" : "true";
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  // Scroll progress through the hero drives the wall's tilt, scale and fade.
  useScrollFrame(() => {
    const hero = ref.current?.closest("section");
    if (!hero) return undefined;
    return () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight * 0.9)));
      hero.style.setProperty("--wall-p", progress.toFixed(3));
    };
  });

  return (
    <div ref={ref} className="hero-wall" aria-hidden="true">
      <div className="hero-wall__plane">
        {rows.map((row, r) => (
          <div key={r} className="hero-wall__row" data-reverse={r % 2 === 1 ? "true" : undefined}>
            <div className="hero-wall__track" style={{ "--wall-speed": `${110 + r * 18}s` }}>
              {/* Two identical runs so the -50% loop is seamless. */}
              {[0, 1].map((copy) =>
                row.map((project, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- decorative textures, pre-sized thumbs
                  <img
                    key={`${copy}-${i}`}
                    src={thumb(project.imageUrl)}
                    alt=""
                    width={640}
                    height={400}
                    decoding="async"
                    loading={r < 3 ? "eager" : "lazy"}
                    className="hero-wall__tile"
                  />
                )),
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="hero-wall__scrim" />
    </div>
  );
}
