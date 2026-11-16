/** Browser-style frame around a project screenshot; the address bar shows the real live domain. */
export function SiteFrame({ domain, children, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[0_40px_90px_-50px_color-mix(in_oklch,var(--color-accent)_70%,transparent)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-[var(--color-bg)] px-3 py-1 text-center font-mono text-[12px] text-[var(--color-text-muted)]">
          {domain}
        </span>
      </div>
      {children}
    </div>
  );
}
