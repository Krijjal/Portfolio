"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { clientByProject, markHeight, markSrc } from "@/data/clients";
import { withBase } from "@/lib/asset";
import { displayDomain, orderedProjects } from "@/lib/projectOrder";
import { btnPrimary, btnSecondary, textLink } from "@/lib/ui";
import { IconChevronRight } from "./icons";
import { SiteFrame } from "./SiteFrame";

const projects = orderedProjects();

/** The client's mark from the logo marquee, revealed beside the project when it's active. */
function ClientMark({ client, active }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static marks, recolored by CSS
    <img
      src={withBase(markSrc(client))}
      alt=""
      loading="lazy"
      decoding="async"
      data-active={active ? "true" : "false"}
      className="showcase-logo"
      style={{ height: markHeight(client, 3.4, 1, 1.9) }}
    />
  );
}

/**
 * Home "Selected work": a project index on the left drives a large live-site preview
 * on the right (hover or keyboard focus switches it). On small screens it becomes a
 * swipeable row of framed previews.
 */
export function WorkShowcase() {
  const [active, setActive] = useState(0);
  const current = projects[active];

  return (
    <section aria-labelledby="work-heading" className="border-b border-[var(--color-border)]">
      <div className="container-px mx-auto max-w-6xl py-20 sm:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="min-w-0 max-w-2xl">
            <h2 id="work-heading" className="text-balance text-section-head text-[var(--color-text)]">
              Selected work
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-[var(--color-text-muted)]">
              {projects.length} production sites across healthcare, finance, industry, ecommerce and sport, all live today.
            </p>
          </div>
          <Link
            href="/work"
            className={`${textLink} shrink-0`}
          >
            All case studies
            <IconChevronRight />
          </Link>
        </div>

        {/* Desktop: index + sticky live preview */}
        <div className="mt-12 hidden gap-12 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <ol className="min-w-0 border-t border-[var(--color-border)]">
            {projects.map((project, i) => {
              const isActive = i === active;
              const client = clientByProject[project.id];
              return (
                <li key={project.id} className="border-b border-[var(--color-border)]">
                  <Link
                    href={`/work#${project.id}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-current={isActive ? "true" : undefined}
                    className="group grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-4 py-4 outline-offset-4"
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span
                        className={`font-display text-xl font-bold leading-snug transition-colors ${
                          isActive ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                        }`}
                      >
                        {project.name}
                      </span>
                      <span
                        className={`text-tag transition-colors ${
                          isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        {project.sector}
                      </span>
                    </span>
                    {/* Fixed slot: every mark sits in the same column, centered in the same box. */}
                    <span className="flex h-10 items-center justify-center" aria-hidden>
                      {client ? <ClientMark client={client} active={isActive} /> : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <div className="min-w-0">
            <div className="sticky top-28">
              <SiteFrame domain={displayDomain(current.liveUrl)}>
                <div className="relative aspect-[16/10] w-full bg-[var(--color-bg)]">
                  {projects.map((project, i) => (
                    <Image
                      key={project.id}
                      src={project.imageUrl}
                      alt={i === active ? `${project.name} live site` : ""}
                      aria-hidden={i === active ? undefined : true}
                      fill
                      sizes="(min-width: 1024px) 640px, 100vw"
                      className={`showcase-shot object-cover object-top ${i === active ? "is-active" : ""}`}
                    />
                  ))}
                </div>
              </SiteFrame>
              <div className="mt-6">
                <p className="mb-3 text-tag text-[var(--color-accent)]">{current.sector}</p>
                <p className="text-pretty text-lead text-[var(--color-text)]">{current.tagline}</p>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-[var(--color-text-muted)]">{current.outcome}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/work#${current.id}`}
                    className={btnPrimary}
                  >
                    Read the case study
                    <span className="sr-only">: {current.name}</span>
                  </Link>
                  {current.liveUrl ? (
                    <a
                      href={current.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={btnSecondary}
                    >
                      Live site
                      <span className="sr-only"> for {current.name}</span>
                      <IconChevronRight className="opacity-80" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / tablet: swipeable framed previews */}
        <ul
          className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:thin] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:hidden"
          aria-label="Selected work"
        >
          {projects.map((project) => (
            <li key={project.id} className="w-[82%] shrink-0 snap-start sm:w-[60%]">
              <Link href={`/work#${project.id}`} className="block">
                <SiteFrame domain={displayDomain(project.liveUrl)} className="shadow-none">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={project.imageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 60vw, 82vw"
                      className="object-cover object-top"
                    />
                  </div>
                </SiteFrame>
                <span className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-display text-lg font-bold leading-snug text-[var(--color-text)]">{project.name}</span>
                  <span className="flex h-9 w-24 shrink-0 items-center justify-center" aria-hidden>
                    {clientByProject[project.id] ? <ClientMark client={clientByProject[project.id]} active /> : null}
                  </span>
                </span>
                <span className="mt-1 block text-tag text-[var(--color-accent)]">{project.sector}</span>
                <span className="mt-2 block text-sm leading-relaxed text-[var(--color-text-muted)]">{project.tagline}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
