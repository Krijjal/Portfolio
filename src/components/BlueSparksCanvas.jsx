"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// Slate Mist: ambient motion stays neutral; Indigo Accent is reserved for emphasis.
const PARTICLE_COLOR = "#8B93A7";

/** Narrow viewports: canvas shadows, high DPR and many particles cost real GPU time. */
function getPerformanceProfile(width) {
  const narrow = width < 768;
  const veryNarrow = width < 480;
  return {
    maxDpr: veryNarrow ? 1 : narrow ? 1.25 : 2,
    maxParticles: veryNarrow ? 24 : narrow ? 36 : Math.min(130, Math.floor(width / 12)),
    useShadow: !narrow,
    drawHaze: !narrow,
    useScreenBlend: !narrow,
  };
}

const random = (min, max) => Math.random() * (max - min) + min;

/**
 * Site-wide ambient sparks drifting in from both edges. Decorative only.
 * Off under reduced motion; paused while the tab is hidden.
 */
export default function BlueSparksCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true, desynchronized: true });
    if (!canvas || !ctx) return undefined;

    let width = 0;
    let height = 0;
    let profile = getPerformanceProfile(window.innerWidth);
    let sparks = [];
    let frame = 0;

    function createSpark() {
      const fromLeft = Math.random() > 0.5;
      return {
        x: fromLeft ? random(-80, -20) : random(width + 20, width + 80),
        y: random(height * 0.05, height * 0.95),
        vx: (fromLeft ? 1 : -1) * random(1.4, 4.2),
        vy: random(-1.45, 0.3),
        size: random(0.8, 3.2),
        life: 0,
        maxLife: random(140, 320),
        opacity: random(0.25, 0.9),
        blur: random(4, 14),
      };
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      profile = getPerformanceProfile(width);
      const dpr = Math.min(window.devicePixelRatio || 1, profile.maxDpr);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.mixBlendMode = profile.useScreenBlend ? "screen" : "normal";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sparks = Array.from({ length: profile.maxParticles }, createSpark);
    }

    function drawSpark(spark) {
      const progress = spark.life / spark.maxLife;
      const fadeIn = Math.min(progress * 4, 1);
      const fadeOut = progress < 0.72 ? 1 : 1 - (progress - 0.72) / 0.28;
      const alpha = spark.opacity * fadeIn * fadeOut;
      if (alpha <= 0) return;

      ctx.globalAlpha = alpha;
      if (profile.useShadow) {
        ctx.shadowBlur = spark.blur;
        ctx.shadowColor = PARTICLE_COLOR;
        ctx.fillStyle = PARTICLE_COLOR;
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(178, 184, 199, ${Math.min(1, 0.55 + alpha * 0.35)})`;
      }
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
    }

    function updateSpark(spark) {
      spark.life += 1;
      // Ember drift with a little turbulence so the motion never looks mechanical.
      spark.x += spark.vx + Math.sin(spark.life * 0.03) * 0.32;
      spark.y += spark.vy + Math.cos(spark.life * 0.025) * 0.14;
      spark.vx += random(-0.02, 0.02);
      spark.vy += random(-0.01, 0.01);
      const outOfBounds = spark.x < -220 || spark.x > width + 220 || spark.y < -180 || spark.y > height + 180;
      if (spark.life >= spark.maxLife || outOfBounds) Object.assign(spark, createSpark());
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      if (profile.drawHaze) {
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.2);
        gradient.addColorStop(0, "rgba(139, 147, 167, 0.025)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
      for (const spark of sparks) {
        updateSpark(spark);
        drawSpark(spark);
      }
      frame = requestAnimationFrame(tick);
    }

    function onVisibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    }

    resize();
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
