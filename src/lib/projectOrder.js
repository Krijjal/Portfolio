import { projects } from "@/data/projects";

/** Projects shown first, in this order; everything else keeps its order in projects.js. */
const FEATURED_FIRST = ["tbz", "cham-clinic", "oppolia-online", "tgmena"];

export function orderedProjects() {
  return [...projects].sort((a, b) => {
    const aIdx = FEATURED_FIRST.indexOf(a.id);
    const bIdx = FEATURED_FIRST.indexOf(b.id);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

/** "https://www.cham.clinic/en" -> "cham.clinic" for the browser-frame address bar. */
export function displayDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
