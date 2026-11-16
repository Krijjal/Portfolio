import { site } from "@/data/site";

export const dynamic = "force-static";

/**
 * Note: on a GitHub Pages project site this file is served at /Portfolio/robots.txt,
 * and crawlers only read robots.txt at the host root. Submit the sitemap in Google
 * Search Console directly; this file starts working as-is on a custom domain.
 */
export default function robots() {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
