import { site } from "@/data/site";

/** Multi-page sitemap. URLs end in "/" to match the canonical tags (trailingSlash: true). */
export const dynamic = "force-static";

export default function sitemap() {
  const base = site.url.replace(/\/$/, "");
  const paths = ["", "/work", "/about", "/impact", "/skills", "/experience", "/services", "/start-a-project"];
  const now = new Date();
  return paths.map((path) => ({
    url: `${base}${path}/`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
