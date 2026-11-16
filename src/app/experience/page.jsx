import { Experience } from "@/components/Experience";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/experience",
  title: "Experience",
  description: `Career timeline of ${site.name}: development team lead roles, full stack delivery ownership, and architecture leadership.`,
});

export default function ExperiencePage() {
  return (
    <>
      <Experience />
    </>
  );
}
