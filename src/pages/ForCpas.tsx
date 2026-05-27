import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { ArrowRight, Briefcase, Users } from "lucide-react";

const toc = [
  { id: "two-paths", label: "Two ways CPAs use shepi" },
  { id: "diy", label: "Path A — Use shepi for your clients" },
  { id: "reviewer", label: "Path B — Join the reviewer network" },
  { id: "who", label: "Who the reviewer network is for" },
  { id: "how", label: "How reviewing works" },
  { id: "what-you-do", label: "What reviewers actually do" },
  { id: "what-this-is-not", label: "What this is not" },
  { id: "compensation", label: "Reviewer compensation" },
  { id: "faq", label: "FAQ" },
];

const faqItems = [
  {
    question: "How much time does a typical review take?",
    answer:
      "Most engagements take 2–4 hours of focused review work, depending on the size and complexity of the target. You see the scope before you claim.",
  },
  {
    question: "How and when do I get paid?",
    answer:
      "Reviewers are paid per engagement after the completion summary is submitted and accepted. Payment is issued via ACH on a regular cadence shared at onboarding. You're an independent contractor; Shepi issues a 1099-NEC at year end where applicable.",
  },
  {
    question: "Do I sign the work? Am I issuing an opinion?",
    answer:
      "You sign your professional judgment on each adjustment — confirm, modify, or reject with reasoning — and that signed reviewer record is part of the DFY deliverable the buyer receives. What you are NOT doing is issuing a formal attestation, audit opinion, review report under SSARS, or any other CPA-firm-branded attest report. Shepi is analytical software, not a CPA firm, and does not produce attest deliverables through the platform.",
  },
  {
    question: "Can I work on Shepi alongside my firm job?",
    answer:
      "Only if your primary employer's policy permits outside engagements. You'll disclose this during application and it's your responsibility to keep it accurate.",
  },
  {
    question: "What if I have a conflict with the target or buyer?",
    answer:
      "Disclose it before claiming. Each engagement shows the buyer and target up front so you can run an independence and conflict check. If there's a conflict, pass on the match — there's no obligation to claim.",
  },
  {
    question: "How is the target's financial data handled?",
    answer:
      "All review happens inside Shepi. Target data stays on the platform — you don't need to download files locally. You're bound by Shepi's reviewer NDA, which covers buyer, target, and engagement-specific information.",
  },
  {
    question: "What if I disagree with an AI-generated adjustment?",
    answer:
      "That's exactly the point of the review. Modify or reject any adjustment with a short note explaining your reasoning. The final deliverable reflects your confirmed judgment, not the AI's draft — your review is what makes the DFY output defensible.",
  },
  {
    question: "How quickly do I need to respond when matched to a project?",
    answer:
      "Initial claim or pass within a reasonable window. Once claimed, engagements have SLAs we share during onboarding. You can always pass on a match.",
  },
  {
    question: "Can I be removed from the reviewer network?",
    answer:
      "Yes. Grounds include license lapse or discipline, repeated missed SLAs, low-quality reviews flagged in QA, or breach of the provider agreement. We share the quality bar transparently at onboarding.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url: "https://shepi.ai/for-cpas",
  name: "For CPAs — Use Shepi for Your Clients or Review Adjustments",
  description:
    "Two ways CPAs work with Shepi: use the platform as a tool to deliver QoE work to your own clients (DIY), or join the reviewer network for Shepi's Done-For-You engagements.",
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function ForCpas() {
  return (
    <ContentPageLayout
      title="Two Ways CPAs Use Shepi."
      seoTitle="For CPAs — Use Shepi for Your Clients or Review Adjustments"
      seoDescription="CPAs use Shepi two ways: as a tool to produce QoE work for your own clients with optional firm branding, or as a reviewer in Shepi's Done-For-You network. Pick the path that fits."
      canonical="https://shepi.ai/for-cpas"
      breadcrumbs={[{ label: "For CPAs" }]}
      toc={toc}
      jsonLd={jsonLd}
      heroAccent
    >
      <HeroCallout>
        Use shepi as a tool inside your own practice, or sign up to review
        adjustments for shepi's Done-For-You clients. Two distinct paths — pick
        the one that fits.
      </HeroCallout>

      <h2 id="two-paths">Two ways CPAs use shepi</h2>

      <div className="not-prose grid gap-6 md:grid-cols-2 my-8">
        <div className="rounded-2xl border border-border bg-background p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-serif text-foreground">Path A — Use shepi for your clients</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            You hold the client engagement. You use shepi as the analytical
            tool to produce the QoE workpapers and deliverables, optionally
            branded with your firm name and logo. Same pricing as any other
            user — no special CPA tier.
          </p>
          <ul className="text-sm text-foreground space-y-2 mb-6">
            <li>• Per-project ($2,000) or Monthly ($5,000, 3 concurrent)</li>
            <li>• Optional firm name + logo on PDF/XLSX deliverables</li>
            <li>• "Powered by shepi" footer stays on every export</li>
            <li>• Your engagement letter, your client relationship</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              See pricing <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#diy"
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-serif text-foreground">Path B — Join the reviewer network</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            When a buyer purchases shepi's Done-For-You tier, a licensed CPA
            reviews the AI-generated adjustments before delivery. You can
            apply to review those engagements on a per-project basis as
            side work.
          </p>
          <ul className="text-sm text-foreground space-y-2 mb-6">
            <li>• Paid per engagement (1099, independent contractor)</li>
            <li>• Typical review: a few focused hours per deal</li>
            <li>• Claim engagements that match your industry &amp; capacity</li>
            <li>• Not an attest engagement — see scope below</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <Link
              to="/cpa-partners"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Apply to review <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#reviewer"
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </div>

      <h2 id="diy">Path A — Use shepi for your clients</h2>
      <p>
        If you run your own practice or work inside a firm and want to deliver
        QoE work to your clients faster, shepi is built to be that tool. You
        sign your own engagement letter with your client, you do the
        professional judgment work, and shepi handles the heavy analytical
        plumbing — trial-balance ingestion, adjustment scaffolding, working
        capital analysis, schedules, narrative drafts, and the final PDF +
        XLSX export package.
      </p>

      <h3>How CPAs use shepi as a tool</h3>
      <StepList
        steps={[
          {
            title: "Buy a project (or a monthly seat)",
            description:
              "Same pricing as any other user. Per-project at $2,000 if you're occasional. Monthly at $5,000 for 3 concurrent if you're running multiple client engagements at once.",
          },
          {
            title: "Turn on firm branding (optional)",
            description:
              "In Project Setup, toggle 'I'm a professional running this for a client.' Upload your firm logo, set your firm name, and add a 'Prepared by' line. These appear on every PDF cover page and XLSX setup tab for that project.",
          },
          {
            title: "Run the engagement",
            description:
              "Upload the target's financials, walk through the workflow, apply your professional judgment on every adjustment. The platform does the structural work; you supply the analyst.",
          },
          {
            title: "Deliver branded output to your client",
            description:
              "Export the PDF report and XLSX workbook from the Export Center. Your firm name and logo appear on the cover; a small 'Powered by shepi' footer stays on each export.",
          },
        ]}
      />

      <p>
        <strong>What you're not getting:</strong> shepi does not issue
        attestation reports, audit opinions, or SSARS review reports. The
        platform is analytical software you use inside your own engagement.
        See the{" "}
        <Link to="/terms#professional-use" className="text-primary hover:underline">
          Professional Use addendum
        </Link>{" "}
        on our Terms of Service for the full scope.
      </p>

      <h2 id="reviewer">Path B — Join the reviewer network</h2>
      <p>
        Shepi is analytical Quality of Earnings software used by searchers, PE
        firms, lenders, and advisors. When a client buys our Done-For-You
        tier, a licensed CPA reviews the AI-generated adjustments before
        delivery. We're building a network of CPAs to handle that review work
        on a per-engagement basis.
      </p>

      <h2 id="who">Who the reviewer network is for</h2>
      <p>
        Independent CPAs, small-firm partners with capacity between client work, and
        QoE-experienced professionals who want flexible, project-based work without
        the overhead of business development.
      </p>
      <BenefitGrid
        benefits={[
          {
            title: "Active CPA license",
            description:
              "You must hold a current CPA license in good standing in at least one US state.",
          },
          {
            title: "QoE or financial-analysis background",
            description:
              "Comfort with adjustments, normalizations, working capital, and reading a general ledger.",
          },
          {
            title: "Side-work permitted",
            description:
              "Your primary employer must allow outside engagements (or you're independent).",
          },
          {
            title: "Capacity for 1–3 concurrent reviews",
            description:
              "Each engagement is bounded — typically a few hours of focused review.",
          },
        ]}
      />

      <h2 id="how">How reviewing works</h2>
      <StepList
        steps={[
          {
            title: "Apply",
            description:
              "Submit a short application with your license details, background, and any conflicts disclosure. We review within a few business days.",
          },
          {
            title: "Onboard",
            description:
              "Upload your license verification and a W-9. Acknowledge the provider agreement.",
          },
          {
            title: "Claim an engagement",
            description:
              "When a new Done-For-You project matches your industry, you'll see it in your queue. Claim it if you have capacity.",
          },
          {
            title: "Review adjustments",
            description:
              "Walk through each AI-flagged adjustment. Confirm, modify, or reject — with a short note explaining your judgment.",
          },
          {
            title: "Submit & get paid",
            description:
              "Send your completion summary. Payment is issued per engagement.",
          },
        ]}
      />

      <h2 id="what-you-do">What reviewers actually do</h2>
      <p>
        Shepi's platform ingests the target's financials, identifies adjustment
        candidates, gathers supporting evidence, and drafts narrative explanations.
        Your job is the part software can't do credibly: applying professional
        judgment to whether each adjustment is reasonable and supportable.
      </p>
      <p>
        For each adjustment proposal, you'll see the AI's rationale, the supporting
        evidence, and the proposed dollar impact. You decide: <strong>confirm</strong>{" "}
        (the adjustment stands as-is), <strong>modify</strong> (adjust the amount or
        period allocation with a note), or <strong>reject</strong> (with a reason).
        That's the review work — disciplined, bounded, and focused on judgment.
      </p>

      <h2 id="what-this-is-not">What this is not</h2>
      <p>
        We're explicit about scope to protect you and the platform. Reviewing
        adjustments on Shepi is <strong>not</strong>:
      </p>
      <ul>
        <li>
          An attest or audit engagement. You are not issuing an audit opinion, a
          review report under SSARS, or any other form of formal attestation through
          the platform.
        </li>
        <li>
          A signed CPA report. Shepi does not produce CPA-firm-branded reports through
          DFY. The deliverable is the Shepi analysis, with your review captured as
          confirmed professional judgment on each adjustment.
        </li>
        <li>
          A client-of-yours relationship. The Shepi customer is the buyer; you are
          contracted by Shepi to provide review services on the platform.
        </li>
      </ul>
      <p>
        This keeps the work inside the scope defined by Shepi's terms of service
        and keeps you clear of unauthorized-practice and scope-creep risk.
      </p>

      <h2 id="compensation">Reviewer compensation</h2>
      <p>
        Reviewers are paid per engagement. Rates are competitive for the time involved
        — most reviews take a few focused hours. Specific rates are shared during
        onboarding and may vary by engagement complexity.
      </p>

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={faqItems} />

      <div className="mt-12 grid gap-6 md:grid-cols-2 not-prose">
        <div className="rounded-2xl border border-border bg-secondary/40 p-8 text-center">
          <h3 className="text-xl font-serif mb-3">Use shepi for your clients</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Sign up, run a project, turn on firm branding.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            See pricing →
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-secondary/40 p-8 text-center">
          <h3 className="text-xl font-serif mb-3">Join the reviewer network</h3>
          <p className="text-sm text-muted-foreground mb-5">
            About 5 minutes. We respond within a few business days.
          </p>
          <Link
            to="/cpa-partners"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start your application →
          </Link>
        </div>
      </div>
    </ContentPageLayout>
  );
}
