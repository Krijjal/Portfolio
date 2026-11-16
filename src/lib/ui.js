/**
 * Shared interactive styles, so every button and link moves the same way:
 * one duration, one easing (both from globals.css), and a small press-down.
 * Append layout-only classes at the call site, e.g. `${btnPrimary} w-full`.
 */
const btnBase =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-[background-color,border-color,color,transform] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

/** Filled accent pill: the one primary action in a group. */
export const btnPrimary = `${btnBase} bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent-hover)]`;

/** Outlined pill: secondary actions next to a primary one. */
export const btnSecondary = `${btnBase} border border-[var(--color-border-strong)] text-[var(--color-text)] hover:border-[var(--color-accent)]`;

/** Accent text link with a full-size tap target (e.g. "All case studies ›"). */
export const textLink =
  "inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)] underline-offset-4 transition-colors hover:underline";
