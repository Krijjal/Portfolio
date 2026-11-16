"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { displayDomain, orderedProjects } from "@/lib/projectOrder";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import { useScrollFrame } from "@/lib/useScrollFrame";
import { IconChevronRight } from "./icons";
import { SiteFrame } from "./SiteFrame";

const projects = orderedProjects();
const pad = (n) => String(n).padStart(2, "0");

/** Full write-up shown in the dialog: context, wrong / did / changed, proof, stack. */
function CaseStudy({ project, onClose }) {
  const facts = [
    { label: "What was wrong", text: project.problem },
    { label: "What I did", text: project.solution },
    { label: "What changed", text: project.outcome },
  ];

  return (
    <article aria-labelledby="case-title">
      <div className="relative aspect-[16/9] w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <Image
          src={project.imageUrl}
          alt={`${project.name} live site`}
          fill
          sizes="(min-width: 960px) 896px, 100vw"
          className="object-cover object-top"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close case study"
          className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg)]/90 text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 sm:p-10">
        <p className="text-tag text-[var(--color-accent)]">
          {project.sector} · {displayDomain(project.liveUrl)}
        </p>
        <h2 id="case-title" className="mt-2 text-balance font-display text-2xl font-bold leading-tight text-[var(--color-text)] sm:text-3xl">
          {project.name}
        </h2>
        <p className="mt-3 max-w-[62ch] text-pretty text-base leading-relaxed text-[var(--color-text-muted)]">
          {project.context}
        </p>

        <dl className="mt-8 grid gap-6 border-t border-[var(--color-border)] pt-8 md:grid-cols-3 md:gap-8">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="text-sm font-semibold text-[var(--color-text)]">{fact.label}</dt>
              <dd className="mt-2 text-pretty text-sm leading-relaxed text-[var(--color-text-muted)]">{fact.text}</dd>
            </div>
          ))}
        </dl>

        {project.proofPoints?.length ? (
          <ul className="mt-8 space-y-2 border-t border-[var(--color-border)] pt-8 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {project.proofPoints.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 flex flex-col gap-5 border-t border-[var(--color-border)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-2" aria-label="Stack">
            {project.stack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-tag text-[var(--color-text)]"
              >
                {tech}
              </li>
            ))}
          </ul>
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnPrimary} shrink-0 self-start`}
            >
              Visit the live site
              <span className="sr-only"> for {project.name}</span>
              <IconChevronRight />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * /work as a stacked deck: on md+ each project card sticks below the header and the
 * next one slides up over it, while the card underneath settles back (slight scale
 * and dim, driven by scroll position). Phones get a plain vertical stack. The full
 * write-up opens in a native <dialog>; /work#id deep-links straight to it.
 */
export function ProjectDeck() {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const cardRefs = useRef([]);
  const [openId, setOpenId] = useState(null);
  const openProject = projects.find((p) => p.id === openId) ?? null;

  const open = useCallback((id, trigger) => {
    triggerRef.current = trigger ?? null;
    setOpenId(id);
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !openId || dialog.open) return;
    dialog.showModal();
    dialog.scrollTop = 0;
    if (window.location.hash !== `#${openId}`) {
      window.history.replaceState(null, "", `#${openId}`);
    }
  }, [openId]);

  // Deep links: /work#tbz opens that case study on arrival and on hash changes.
  useEffect(() => {
    function fromHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (projects.some((p) => p.id === id)) {
        open(id, document.getElementById(`open-${id}`));
      }
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [open]);

  // Depth: as card i+1 slides over card i, push i back (written to --depth, 0..1).
  useScrollFrame(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    return () => {
      const cards = cardRefs.current;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue;
        const next = cards[i + 1];
        let depth = 0;
        if (desktop.matches && next) {
          const top = card.getBoundingClientRect().top;
          const nextTop = next.getBoundingClientRect().top;
          depth = Math.min(1, Math.max(0, 1 - (nextTop - top) / card.offsetHeight));
        }
        card.style.setProperty("--depth", depth.toFixed(3));
      }
    };
  });

  function handleClose() {
    setOpenId(null);
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    triggerRef.current?.focus();
  }

  return (
    <>
      <ol className="deck flex flex-col gap-6 md:gap-[14vh] md:pb-[10vh]">
        {projects.map((project, i) => (
          <li
            key={project.id}
            id={project.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="deck-item md:sticky"
            style={{ "--stack-offset": `${Math.min(i, 4) * 14}px` }}
          >
            <article
              aria-labelledby={`deck-title-${project.id}`}
              className="deck-card relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] md:h-[min(40rem,calc(100dvh-9rem))]"
            >
              <div className="grid h-full gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 lg:p-10">
                <div className="flex min-w-0 flex-col md:order-1">
                  <p className="flex items-center gap-3 text-tag text-[var(--color-text-muted)]">
                    <span className="tabular-nums text-[var(--color-text)]">
                      {pad(i + 1)} / {pad(projects.length)}
                    </span>
                    <span aria-hidden className="h-px w-6 bg-[var(--color-border-strong)]" />
                    <span className="text-[var(--color-accent)]">{project.sector}</span>
                  </p>
                  <h2
                    id={`deck-title-${project.id}`}
                    className="mt-4 text-balance font-display text-2xl font-bold leading-tight text-[var(--color-text)] sm:text-3xl lg:text-4xl"
                  >
                    {project.name}
                  </h2>
                  <p className="mt-4 text-pretty text-base leading-relaxed text-[var(--color-text-muted)] lg:text-lg">
                    {project.tagline}
                  </p>

                  <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                    <p className="text-sm font-semibold text-[var(--color-text)]">What changed</p>
                    <p className="mt-2 line-clamp-4 text-pretty text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {project.outcome}
                    </p>
                  </div>

                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="Stack">
                    {project.stack.slice(0, 4).map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1 text-tag text-[var(--color-text-muted)]"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-2 md:mt-auto md:pt-6">
                    <button
                      type="button"
                      id={`open-${project.id}`}
                      aria-haspopup="dialog"
                      onClick={(event) => open(project.id, event.currentTarget)}
                      className={btnPrimary}
                    >
                      Read the case study
                      <span className="sr-only">: {project.name}</span>
                    </button>
                    {project.liveUrl ? (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnSecondary}
                      >
                        Live site
                        <span className="sr-only"> for {project.name}</span>
                        <IconChevronRight className="opacity-80" />
                      </a>
                    ) : null}
                  </div>
                </div>

                <SiteFrame
                  domain={displayDomain(project.liveUrl)}
                  className="-order-1 flex min-h-0 flex-col md:order-2"
                >
                  <div className="relative aspect-[16/10] w-full md:aspect-auto md:flex-1">
                    <Image
                      src={project.imageUrl}
                      alt={`${project.name} live site`}
                      fill
                      sizes="(min-width: 1024px) 640px, (min-width: 768px) 55vw, 100vw"
                      className="object-cover object-top"
                      priority={i === 0}
                    />
                  </div>
                </SiteFrame>
              </div>
              {/* Dims the card as the next one covers it; opacity follows --depth. */}
              <span aria-hidden className="deck-shade pointer-events-none absolute inset-0 bg-[var(--color-bg)]" />
            </article>
          </li>
        ))}
      </ol>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        onClick={(event) => {
          // Clicking the backdrop (the dialog element itself, outside the panel) closes it.
          if (event.target === event.currentTarget) close();
        }}
        aria-labelledby={openProject ? "case-title" : undefined}
        className="case-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto overscroll-contain rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-0 text-[var(--color-text)]"
      >
        {openProject ? <CaseStudy project={openProject} onClose={close} /> : null}
      </dialog>
    </>
  );
}
