import { ProjectDeck } from "./ProjectDeck";
import { SectionHeading } from "./SectionHeading";
import { SectionShell } from "./SectionShell";

export function Projects() {
  return (
    <SectionShell id="work" variant="muted">
      <SectionHeading
        as="h1"
        eyebrow="Case studies"
        title="Work I have stood behind."
        description="Selected production work with business context, technical choices, and measurable delivery outcomes. Scroll through the deck, or open any project for the full story."
      />
      <ProjectDeck />
    </SectionShell>
  );
}
