import { Hero } from "@/components/Hero";
import { WorkShowcase } from "@/components/WorkShowcase";
import { ExperienceTimeline } from "@/components/ExperienceTimeline";
import { ContactCTA } from "@/components/ContactCTA";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/data/site";

const base = pageMetadata({ path: "/", title: `${site.name} | ${site.title}`, description: site.description });

export const metadata = { ...base, title: { absolute: `${site.name} | ${site.title}` } };

export default function HomePage() {
  return (
    <>
      <Hero />
      <WorkShowcase />
      <ExperienceTimeline />
      <ContactCTA />
    </>
  );
}
