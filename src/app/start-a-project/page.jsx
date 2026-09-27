import { ProposalForm } from "@/components/ProposalForm";
import { InnerPage } from "@/components/InnerPage";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/start-a-project",
  title: "Start a Project",
  description: `Tell ${site.name} about your project and get a proposal.`,
});

export default function StartAProjectPage() {
  return (
    <InnerPage>
      <section className="container-px mx-auto max-w-2xl py-20 sm:py-24">
        <p className="text-tag uppercase text-[var(--color-accent)]">Start a project</p>
        <h1 className="mt-3 text-section-head text-[var(--color-text)]">Tell me about what you&apos;re building</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-text-muted)]">
          Fill this out and I&apos;ll review the details personally, no automated pricing, no bot replies.
          You&apos;ll hear back from me directly.
        </p>
        <div className="mt-10">
          <ProposalForm />
        </div>
      </section>
    </InnerPage>
  );
}
