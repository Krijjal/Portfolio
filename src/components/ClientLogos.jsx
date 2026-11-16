import { clients, markHeight, markSrc } from "@/data/clients";
import { withBase } from "@/lib/asset";

/**
 * Quiet proof row under the hero: client marks drift past in one color, faded at both
 * edges. The list is rendered twice for a seamless loop; the copy is hidden from
 * assistive tech. Reduced motion: the row stops and wraps instead of scrolling.
 */
export function ClientLogos() {
  return (
    <section aria-labelledby="clients-heading" className="border-b border-[var(--color-border)]">
      <div className="container-px mx-auto flex max-w-6xl flex-col gap-6 py-10 md:flex-row md:items-center md:gap-10">
        <h2
          id="clients-heading"
          className="shrink-0 text-sm leading-snug text-[var(--color-text-muted)] md:w-40"
        >
          Sites built for teams across Saudi Arabia, Syria and beyond
        </h2>
        <div className="logo-marquee min-w-0 flex-1">
          <div className="logo-marquee__track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="logo-marquee__set" aria-hidden={copy === 1 ? true : undefined}>
                {clients.map((client) => (
                  <li key={client.name} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small static marks, recolored by CSS */}
                    <img
                      src={withBase(markSrc(client))}
                      alt={copy === 0 ? client.name : ""}
                      className="logo-marquee__logo"
                      style={{ height: markHeight(client) }}
                      loading="lazy"
                      decoding="async"
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
