/**
 * Client marks, shown in the home logo marquee and beside a project in "Selected work".
 *
 * Every file in /logos/clients is trimmed tight to the mark (no padding), so marks line up
 * the same way wherever they appear. `ratio` is each file's width / height; it lets
 * `markHeight` give wide wordmarks and square symbols the same visual weight.
 * Marks render as white silhouettes, so filled logos use outline versions (`*-outline`).
 * `projectIds` links a mark to entries in projects.js (one brand can cover several sites).
 */
export const clients = [
  { name: "Kreston Sindi Batterjee", slug: "kreston", ratio: 2.77, projectIds: ["kreston-ksa"] },
  { name: "Tarek Bin Ziad (TBZ)", slug: "tbz", ratio: 1.18, projectIds: ["tbz"] },
  { name: "SB Consulting", slug: "sb-consulting", ratio: 4.74, projectIds: ["sb-consulting"] },
  { name: "Cham Clinic", slug: "cham-clinic", ratio: 2.25, projectIds: ["cham-clinic"] },
  { name: "TGMENA", slug: "tgmena", ratio: 0.96, projectIds: ["tgmena"] },
  { name: "Peace City World", slug: "peace-city", ratio: 1, projectIds: ["peace-city-world"] },
  { name: "Oppolia", slug: "oppolia", ratio: 3.2, projectIds: ["oppolia-ksa", "oppolia-online"] },
  { name: "Elite Edition", slug: "elite-edition", ratio: 4.92, projectIds: ["elite-edition"] },
  { name: "Tarta de Amor", slug: "tarta-de-amor", ratio: 1.54, projectIds: ["tarta-de-amor"] },
  { name: "ToysLab KSA", slug: "toyslab-outline", ratio: 0.99, projectIds: ["toyslab-ksa"] },
  { name: "Kraken Production", slug: "kraken", ratio: 0.96, projectIds: ["kraken-production"] },
  { name: "Hadiha", slug: "hadiha-outline", ratio: 1.06, projectIds: ["hadiha"] },
  { name: "AI Syria", slug: "ai-syria", ratio: 3.06, projectIds: ["ai-syria"] },
  { name: "Gravity Wrestling Academy", slug: "gravity", ratio: 0.84, projectIds: ["gravity-wrestling"] },
];

/** projectId -> client mark, for projects that have one. */
export const clientByProject = Object.fromEntries(
  clients.flatMap((client) => client.projectIds.map((id) => [id, client])),
);

/** Public path of a client's mark. */
export function markSrc(client) {
  return `/logos/clients/${client.slug}.webp`;
}

/**
 * Optical sizing: give every mark roughly the same ink area (`area`, in rem²) instead of
 * the same height, so a 5:1 wordmark doesn't tower over a square symbol or vice versa.
 * Returns a CSS length.
 */
export function markHeight(client, area = 6.5, min = 1.1, max = 2.6) {
  const height = Math.min(max, Math.max(min, Math.sqrt(area / client.ratio)));
  return `${height.toFixed(2)}rem`;
}
