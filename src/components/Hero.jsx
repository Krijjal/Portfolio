import Link from "next/link";
import { doors } from "@/data/home";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { HeroWall } from "./HeroWall";
import { IconChevronRight } from "./icons";

/**
 * Home hero, "two doors" layout: one statement, then a door per audience
 * (clients start a project, hiring teams see the leadership record).
 * `.hero-item` children stagger in via CSS (globals.css) from a visible default.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] pt-[calc(7rem+env(safe-area-inset-top,0px))] pb-16 sm:pb-20 lg:pt-[calc(8.5rem+env(safe-area-inset-top,0px))] lg:pb-24">
      <HeroWall />

      <div className="container-px relative mx-auto max-w-6xl">
        <p className="hero-item flex flex-wrap items-center gap-x-3 gap-y-1 text-tag uppercase text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden />
            Team Lead at TGMENA
          </span>
          <span aria-hidden>/</span>
          <span>Taking client projects</span>
        </p>

        <h1 className="hero-item mt-6 max-w-4xl text-balance text-hero text-[var(--color-text)]">
          I lead and build production web systems,
          <span className="text-[var(--color-text-muted)]"> from architecture to launch.</span>
        </h1>

        <p className="hero-item mt-6 max-w-[62ch] text-pretty text-lead text-[var(--color-text-muted)]">
          I am {site.name}, a full-stack developer and team lead. I turn business goals into stable releases across
          frontend, backend, CMS, APIs, SEO and performance, and I leave systems the next team can run.
        </p>

        <div className="hero-item mt-12 grid gap-4 md:grid-cols-2 md:gap-5">
          {doors.map((door) => (
            <Link
              key={door.id}
              href={door.href}
              className={`group flex min-w-0 flex-col rounded-[var(--radius-xl)] border p-6 transition-colors sm:p-8 ${
                door.primary
                  ? "border-[var(--color-accent)]/60 bg-[color-mix(in_oklch,var(--color-accent)_10%,var(--color-bg-elevated))] hover:border-[var(--color-accent)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              <span className="text-tag uppercase text-[var(--color-text-muted)]">{door.question}</span>
              {/* The secondary door carries the accent in its type, mirroring the primary door's filled accent. */}
              <span
                className={`mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl ${
                  door.primary ? "text-[var(--color-text)]" : "text-[var(--color-accent)]"
                }`}
              >
                {door.title}
              </span>
              <span className="mt-3 max-w-[48ch] flex-1 text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
                {door.body}
              </span>
              <span
                className={`mt-8 inline-flex min-h-11 w-fit items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors ${
                  door.primary
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)] group-hover:bg-[var(--color-accent-hover)]"
                    : "border border-[var(--color-accent)]/70 text-[var(--color-accent)] group-hover:border-[var(--color-accent)] group-hover:bg-[var(--color-accent)]/10"
                }`}
              >
                {door.cta}
                <IconChevronRight className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <p className="hero-item mt-6 text-sm text-[var(--color-text-muted)]">
          Just looking?{" "}
          <Link
            href="/work"
            className="inline-block py-3 font-semibold text-[var(--color-text)] underline decoration-[var(--color-border-strong)] underline-offset-4 hover:decoration-[var(--color-accent)]"
          >
            Browse {projects.length} shipped projects
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
