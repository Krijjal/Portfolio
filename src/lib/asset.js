/** GitHub Pages serves the site under /Portfolio; next.config.mjs exposes that prefix at build time. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix a /public path (e.g. "/logos/tbz.svg") with the deploy base path. */
export function withBase(path) {
  return `${BASE_PATH}${path}`;
}
