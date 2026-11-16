import { btnPrimary, btnSecondary } from "@/lib/ui";
import Link from "next/link";
import { site } from "@/data/site";
import { Reveal } from "./Reveal";
import { SectionShell } from "./SectionShell";

function whatsappLink(phone) {
  if (!phone) return "";
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `https://wa.me/${digits.replace("+", "")}` : "";
}

export function ContactCTA() {
  const emailHref = site.email ? `mailto:${site.email}` : "";
  const whatsappHref = whatsappLink(site.phone);

  return (
    <SectionShell id="contact" variant="muted" className="border-b-0">
      <Reveal>
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[0_20px_60px_-40px_color-mix(in_oklch,var(--color-accent)_55%,transparent)] sm:p-8 lg:p-10">
          <p className="text-tag uppercase text-[var(--color-accent)]">Contact</p>
          <h2 className="mt-3 max-w-2xl text-section-head text-[var(--color-text)]">
            Need someone who can own the build and the delivery?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            I can help plan, build, review, and ship production web systems across frontend, backend, CMS, APIs,
            integrations, performance, and technical SEO.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/start-a-project"
              className={btnPrimary}
            >
              Start a Project
            </Link>
            {emailHref ? (
              <a
                href={emailHref}
                className={btnSecondary}
              >
                Email Me
              </a>
            ) : null}
            {site.linkedin ? (
              <a
                href={site.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={btnSecondary}
              >
                LinkedIn
              </a>
            ) : null}
            {site.cvPath ? (
              <Link
                href={site.cvPath}
                download
                className={btnSecondary}
              >
                Download CV
              </Link>
            ) : null}
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={btnSecondary}
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </Reveal>
    </SectionShell>
  );
}
