/**
 * Section intro. Pass `as="h1"` when this is the page's primary heading
 * (every inner page leads with one), otherwise it renders an h2.
 */
export function SectionHeading({ eyebrow, title, description, as: Heading = "h2" }) {
  return (
    <header className="mb-12 max-w-3xl lg:mb-16">
      <p className="mb-3 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1 text-tag uppercase text-[var(--color-accent)]">
        {eyebrow}
      </p>
      <Heading className="text-balance text-section-head text-[var(--color-text)]">{title}</Heading>
      {description ? <p className="mt-5 max-w-[68ch] text-pretty text-lead text-[var(--color-text-muted)]">{description}</p> : null}
    </header>
  );
}
