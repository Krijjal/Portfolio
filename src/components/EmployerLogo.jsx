"use client";

import { useState } from "react";
import { projectLogoStyles } from "@/lib/projectLogo";
import { IconChevronRight } from "./icons";

/** Employer logo chip + site link, for the experience page */
export function EmployerLogo({ company, websiteUrl, localLogoUrl, logoTreatment }) {
  const [logoFailed, setLogoFailed] = useState(false);
  // Local logos only: the old remote fallback (Clearbit) is retired; a failed logo is hidden.
  const activeLogo = !logoFailed ? localLogoUrl ?? "" : "";
  const { wrap: logoWrapClass, img: logoImgClass } = projectLogoStyles(logoTreatment);

  if (!websiteUrl || !activeLogo) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
      <a
        href={websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`mb-1 inline-flex overflow-hidden rounded-md border border-[var(--color-border)] ${logoWrapClass}`}
        title={`Visit ${company}`}
      >
        {/* Native img: public folder paths like /logos/file.png resolve reliably; avoids Next/Image src edge cases */}
        <img
          src={activeLogo}
          alt={`${company} logo`}
          width={96}
          height={44}
          className={`h-11 w-24 ${logoImgClass}`}
          onError={() => setLogoFailed(true)}
        />
      </a>
      <a
        href={websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline"
      >
        Visit site
        <IconChevronRight className="opacity-80" />
      </a>
    </div>
  );
}
