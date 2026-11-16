import { Impact } from "@/components/Impact";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/impact",
  title: "Impact",
  description: `How ${site.name} measures impact across SEO, traffic growth, Core Web Vitals, delivery quality, and production handoffs.`,
});

export default function ImpactPage() {
  return (
    <>
      <Impact />
    </>
  );
}
