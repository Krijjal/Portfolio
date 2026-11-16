"use client";

import { usePathname } from "next/navigation";

/**
 * Route-change entrance: Next remounts this template on every navigation, so the
 * CSS `.page-enter` keyframe (globals.css) replays per route with no JS animation
 * and no hidden-until-hydrated state. Skipped on "/", which has its own hero stagger.
 */
export default function Template({ children }) {
  const isHome = usePathname() === "/";
  return <div className={isHome ? "" : "page-enter"}>{children}</div>;
}
