export function SectionHeading({ eyebrow, title, description }) {
  return (
    <header className="mb-12 max-w-3xl lg:mb-16">
      <p className="mb-3 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1 text-tag uppercase text-[var(--color-accent)]">
        {eyebrow}
      </p>
      <h2 className="text-balance text-section-head text-[var(--color-text)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-lead text-[var(--color-text-muted)]">{description}</p>
      ) : null}
    </header>
  );
}
