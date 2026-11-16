import Link from "next/link";
import { experience } from "@/data/experience";
import { IconChevronRight } from "./icons";
import { textLink } from "@/lib/ui";

/**
 * Compact career sequence for the home page: every role, newest first, with its
 * lead responsibility. The order is the information, so it renders as an <ol>.
 */
export function ExperienceTimeline() {
  const roles = experience.flatMap((employer) =>
    employer.roles.map((role) => ({
      key: `${employer.company}-${role.period}`,
      company: employer.company,
      title: role.title,
      period: role.period,
      summary: role.highlights[0],
    })),
  );

  return (
    <section aria-labelledby="timeline-heading" className="border-b border-[var(--color-border)]">
      <div className="container-px mx-auto grid max-w-6xl gap-10 py-20 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <div className="min-w-0">
          <h2 id="timeline-heading" className="text-balance text-section-head text-[var(--color-text)]">
            From closing tickets to owning delivery.
          </h2>
          <p className="mt-5 max-w-[42ch] text-pretty text-base leading-relaxed text-[var(--color-text-muted)]">
            Shipping production work since 2022 and leading teams since 2023: planning, code reviews, releases, and
            the hands-on work when it matters.
          </p>
          <Link
            href="/experience"
            className={`${textLink} mt-4`}
          >
            Full experience
            <IconChevronRight />
          </Link>
        </div>

        <ol className="relative min-w-0 border-l border-[var(--color-border-strong)]">
          {roles.map((role, i) => (
            <li key={role.key} className="relative pb-10 pl-7 last:pb-0 sm:pl-9">
              <span
                className={`absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full ${
                  i === 0 ? "bg-[var(--color-accent)]" : "border border-[var(--color-border-strong)] bg-[var(--color-bg)]"
                }`}
                aria-hidden
              />
              <p className="font-mono text-[13px] tabular-nums text-[var(--color-text-muted)]">{role.period}</p>
              <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-[var(--color-text)]">
                {role.title}
                <span className="text-[var(--color-text-muted)]"> · {role.company}</span>
              </h3>
              <p className="mt-2 max-w-[60ch] text-pretty text-sm leading-relaxed text-[var(--color-text-muted)]">
                {role.summary}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
