import { services } from "@/data/services";
import { site } from "@/data/site";
import { SectionHeading } from "./SectionHeading";
import { SectionShell } from "./SectionShell";
import { StaggerReveal } from "./StaggerReveal";
import { IconChevronRight, IconLinkedIn } from "./icons";
import { textLink } from "@/lib/ui";

export function Services() {
  return (
    <SectionShell id="services" variant="muted">
      <SectionHeading
        as="h1"
        eyebrow="Services"
        title="Work with me on something that matters."
        description="If you need a senior engineer who can still steer delivery, or a lead who writes real code when it counts, we can start with a clear scope and a handoff you can trust."
      />
      <StaggerReveal className="grid gap-5 sm:grid-cols-2 lg:gap-6">
        {services.map((s) => (
          <article key={s.title} className="stagger-item group flex h-full min-h-full flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 transition-colors hover:border-[var(--color-accent)]/45 sm:p-7">
            <h3 className="font-display text-lg font-bold text-[var(--color-text)]">{s.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{s.description}</p>
            {site.linkedin ? (
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Talk on LinkedIn"
                className={`${textLink} mt-4`}
              >
                <span>Talk on</span>
                <IconLinkedIn className="h-4 w-4" />
                <IconChevronRight className="transition-transform group-hover:translate-x-0.5" />
              </a>
            ) : null}
          </article>
      ))}
      </StaggerReveal>
    </SectionShell>
  );
}
