"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { mainNav } from "@/data/nav";
import { site } from "@/data/site";
import { IconLinkedIn } from "./icons";
import { KrMark } from "./KrMark";

export function Navbar() {
  const rawPathname = usePathname();
  // next.config.mjs sets trailingSlash: true for the static export, so usePathname()
  // returns "/work/" while mainNav's hrefs are "/work" — normalize before comparing.
  const pathname = rawPathname !== "/" ? rawPathname.replace(/\/$/, "") : rawPathname;
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const itemRefs = useRef(new Map());
  const hasPositioned = useRef(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;

    function positionIndicator(animated) {
      if (!nav || !indicator) return;
      const activeEl = itemRefs.current.get(pathname);
      // Routes outside mainNav ("/", "/start-a-project") have no item to sit under:
      // hide the pill instead of leaving it on the previously visited page.
      if (!activeEl) {
        indicator.style.opacity = "0";
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      const left = itemRect.left - navRect.left;
      const width = itemRect.width;

      if (!animated) {
        indicator.style.transform = `translateX(${left}px)`;
        indicator.style.width = `${width}px`;
        indicator.style.opacity = "1";
        return;
      }
      animate(indicator, { translateX: left, width, opacity: 1, duration: 220, ease: "inOut(2)" });
    }

    positionIndicator(hasPositioned.current);
    hasPositioned.current = true;

    const handleResize = () => positionIndicator(false);
    window.addEventListener("resize", handleResize);
    // Bank Gothic loads with font-display: swap, so item widths change after the first measure.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) positionIndicator(false);
    });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-transparent pt-[env(safe-area-inset-top,0px)] transition-colors">
      <div className="container-px mx-auto flex h-16 max-w-6xl min-h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="min-w-0 flex-1 sm:flex-none"
          aria-label={`${site.name} home`}
        >
          <KrMark className="h-9 w-auto sm:h-10" />
        </Link>

        <nav
          ref={navRef}
          className="relative hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 p-1 md:flex"
          aria-label="Primary"
        >
          <span
            ref={indicatorRef}
            className="pointer-events-none absolute left-0 top-1 h-[calc(100%-0.5rem)] rounded-full bg-[var(--color-text)] opacity-0"
            aria-hidden="true"
          />
          {mainNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.href, el);
                  else itemRefs.current.delete(item.href);
                }}
                className={`relative z-10 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "text-[var(--color-bg)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {site.cvPath ? (
            <a
              href={site.cvPath}
              download
              className="hidden min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] sm:inline-flex"
            >
              CV
            </a>
          ) : null}
          {site.linkedin ? (
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hidden min-h-11 min-w-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-3 text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent-hover)] sm:inline-flex"
            >
              <IconLinkedIn className="h-[1.125rem] w-[1.125rem]" />
            </a>
          ) : null}
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="container-px max-h-[min(70vh,calc(100dvh-env(safe-area-inset-top,0px)-4rem))] overflow-y-auto overscroll-y-contain border-t border-[var(--color-border)] bg-[var(--color-bg)] py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile primary">
            {mainNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`min-h-12 rounded-[var(--radius-md)] border px-3 py-3 text-sm font-semibold leading-snug transition-colors ${
                    active
                      ? "border-[var(--color-accent)] bg-[var(--color-bg-elevated)] text-[var(--color-text)]"
                      : "border-transparent bg-[var(--color-bg-elevated)] text-[var(--color-text)] hover:border-[var(--color-border)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {site.linkedin ? (
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="mt-2 inline-flex min-h-12 min-w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 py-3 text-[var(--color-bg)]"
              >
                <IconLinkedIn className="h-6 w-6" />
              </a>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
