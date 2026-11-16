import Link from "next/link";
import Image from "next/image";
import { mainNav } from "@/data/nav";
import { site } from "@/data/site";
import { withBase } from "@/lib/asset";
import { IconChevronRight, IconLinkedIn } from "./icons";
import { btnPrimary, btnSecondary } from "@/lib/ui";

/**
 * Mobile-first footer: brand + one line + the two actions, then the site map as a
 * two-column grid of full-size tap targets on phones (a single row on desktop),
 * then a slim legal bar with a back-to-top link.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const links = [{ href: "/", label: "Home" }, ...mainNav];

  return (
    <footer className="relative border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="container-px mx-auto max-w-6xl pt-12 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pt-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-16">
          <div className="min-w-0">
            <Link href="/" aria-label={`${site.name} home`} className="inline-flex">
              <Image
                src={withBase("/logos/kr-lockup.svg")}
                alt=""
                width={800}
                height={397}
                className="h-14 w-auto sm:h-16"
              />
            </Link>
            <p className="mt-5 max-w-[38ch] text-pretty text-base leading-relaxed text-[var(--color-text-muted)]">
              Full-stack developer and technical lead. I build production web systems and see them through launch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/start-a-project"
                className={`${btnPrimary} flex-1 sm:flex-none`}
              >
                Start a project
                <IconChevronRight />
              </Link>
              {site.linkedin ? (
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnSecondary}
                >
                  <IconLinkedIn className="h-4 w-4" />
                  LinkedIn
                </a>
              ) : null}
            </div>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-4 border-t border-[var(--color-border)] pt-4 md:flex md:flex-wrap md:justify-end md:gap-x-1 md:border-0 md:pt-0">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex min-h-12 items-center text-tag uppercase text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] md:min-h-11 md:px-3"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="py-2 text-sm text-[var(--color-text-muted)]">
            © {year} {site.name}
          </p>
          <a
            href="#main-content"
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:self-auto"
          >
            Back to top
            <IconChevronRight className="-rotate-90" />
          </a>
        </div>
      </div>
    </footer>
  );
}
