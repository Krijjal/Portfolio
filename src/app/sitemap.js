import { mainNav } from "@/data/nav";
import { site } from "@/data/site";

export const dynamic = "force-static";

/** Every public route, with trailing slashes to match the canonical URLs (trailingSlash: true). */
export default function sitemap() {
  const base = site.url.replace(/\/$/, "");
  const paths = ["", ...mainNav.map((item) => item.href), "/start-a-project"];
  const now = new Date();
  return paths.map((path) => ({
    url: `${base}${path}/`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
