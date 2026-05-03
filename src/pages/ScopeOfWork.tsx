import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { StepList } from "@/components/content/StepList";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";
import { CheckCircle, XCircle } from "lucide-react";
import { PRICING } from "@/lib/pricing";

const toc = [
  { id: "engagement-overview", label: "Engagement Overview" },
  { id: "inputs-required", label: "Inputs Required" },
  { id: "procedures", label: "Procedures Performed" },
  { id: "deliverables", label: "Deliverables" },
  { id: "out-of-scope", label: "Out of Scope" },
  { id: "diy-vs-dfy", label: "DIY vs Done-For-You" },
  { id: "timeline", label: "Timeline & Cost" },
  { id: "pricing", label: "Pricing" },
  { id: "related", label: "Related" },
];

const required = ["Trial Balance", "Chart of Accounts", "Bank Statements", "General Ledger"];
const recommended = [
  "AR & AP Aging",
  "Payroll Reports",
  "Fixed Asset Schedule",
  "Tax Returns (3 years)",
  "Journal Entries",
  "Credit Card Statements",
  "Customer & Vendor Lists",
  "Inventory Records",
  "Debt Schedule",
  "Material Contracts & Leases",
  "Supporting Documents",
  "Job Cost Reports / WIP Schedule",
];
const optional = ["Income Statements", "Balance Sheets", "Cash Flow Statements", "CIM / Offering Memo"];

export default function ScopeOfWork() {
  return (
    <ContentPageLayout
      title="Statement of Work"
      seoTitle="Statement of Work | Shepi Quality of Earnings Engagement"
      seoDescription="Formal scope of a Shepi QoE engagement: inputs required, procedures performed, deliverables, out-of-scope items, and DIY vs Done-For-You options."
      canonical="https://shepi.ai/scope"
      breadcrumbs={[{ label: "Statement of Work" }]}
      toc={toc}
      heroAccent
    >
      <HeroCallout>
        What Shepi is engaged to deliver, in the format you'd see from a traditional QoE firm — inputs, procedures, deliverables, and what we explicitly do not cover.
      </HeroCallout>

      <h2 id="engagement-overview">Engagement Overview</h2>
      <p>
        Shepi is engaged to perform a data-intensive Quality of Earnings analysis on the target company's financial records. The engagement covers 100% of general-ledger transactions across the historical period, builds an adjusted-EBITDA bridge, and produces a structured 27-tab workbook plus PDF report consistent with the format buyers, lenders, and sellers expect from a QoE deliverable.
      </p>
      <p>
        This engagement is <strong>not</strong> a CPA attestation, audit, or review. It is the analytical foundation that traditional QoE firms produce — minus the attestation letter. See <a href="#out-of-scope">Out of Scope</a> for the full boundary statement.
      </p>

      <h2 id="inputs-required">Inputs Required</h2>
      <p>Most of these come from the seller's data room. Begin with the Required tier; add the rest as received.</p>
      <div className="not-prose grid md:grid-cols-3 gap-6 mb-8">
        <div className="border border-border rounded-lg bg-card p-5">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-destructive mb-3">Required</span>
          <ul className="space-y-2">
            {required.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-border rounded-lg bg-card p-5">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">Recommended</span>
          <ul className="space-y-2">
            {recommended.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-border rounded-lg bg-card p-5">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Optional</span>
          <ul className="space-y-2">
            {optional.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h2 id="procedures">Procedures Performed</h2>
      <StepList steps={[
        { title: "100% GL coverage and account mapping", description: "Every transaction in the general ledger is ingested and mapped to a standardized chart of accounts — not the 10–20% sample a manual team typically reviews." },
        { title: "Anomaly and red-flag detection", description: "AI scans the GL for unusual patterns: round-number entries, weekend postings, duplicate vendors, and other markers consistent with earnings-management or personal-expense activity." },
        { title: "Owner-compensation normalization", description: "Identify owner salary, benefits, and related-party payments; calculate market-rate replacement compensation for the EBITDA bridge." },
        { title: "Personal-expense detection", description: "Surface candidate personal expenses (auto, travel, meals, country club, family payroll) for analyst review and adjustment." },
        { title: "Customer and vendor concentration", description: "Quantify revenue and spend concentration; flag single-customer or single-vendor exposure above standard thresholds." },
        { title: "Working-capital build", description: "Multi-period DSO / DPO / DIO schedule and net working capital target consistent with how buyers structure purchase-price adjustments." },
        { title: "Proof of cash from bank statements", description: "Reconcile reported revenue and operating cash flow to actual bank deposits across the review period." },
        { title: "AI-suggested EBITDA adjustments — every adjustment human-reviewed", description: "AI surfaces candidates with rationale and supporting transactions; you accept, modify, or reject. No adjustment lands in the bridge without human sign-off." },
      ]} />

      <h2 id="deliverables">Deliverables</h2>
      <p>The engagement produces a structured 27-tab workbook plus a formatted PDF report. Headline tabs:</p>
      <BenefitGrid benefits={[
        { title: "Executive Summary", description: "Adjusted EBITDA, key findings, and risk callouts on one page." },
        { title: "EBITDA Bridge", description: "Reported → adjusted EBITDA, with every adjustment categorized and traceable." },
        { title: "Revenue Quality", description: "Revenue by customer, channel, and period with concentration metrics." },
        { title: "Working Capital", description: "DSO / DPO / DIO trend and net working capital target." },
        { title: "Proof of Cash", description: "Reconciliation of P&L revenue and EBITDA to bank deposits." },
        { title: "GL Findings & Red Flags", description: "Anomalies, unusual entries, and items warranting buyer follow-up." },
        { title: "Customer / Vendor Concentration", description: "Top-N tables with exposure thresholds." },
        { title: "Full Audit Trail", description: "Every adjustment links back to source transactions and rationale." },
        { title: "PDF + Excel Export", description: "Formatted PDF report and full Excel workbook for sharing with lenders, partners, or investment committees." },
      ]} />

      <h2 id="out-of-scope">Out of Scope</h2>
      <p>What this engagement does <strong>not</strong> cover:</p>
      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { title: "No CPA attestation or opinion", description: "Shepi does not issue an audit, review, or attest opinion. There is no signed letter from a licensed CPA firm." },
          { title: "No valuation", description: "We do not opine on enterprise value, multiples, or what the business is worth." },
          { title: "No legal or tax advice", description: "Tax exposure, structuring, and legal risk are outside scope. Engage qualified counsel and tax advisors separately." },
          { title: "No fairness opinion or formal audit", description: "This is not a substitute for a fairness opinion, GAAP audit, or any regulatory filing." },
        ].map((b) => (
          <div key={b.title} className="border border-border rounded-lg p-5 bg-muted/20">
            <p className="font-semibold text-foreground mb-1.5 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
              <span>{b.title}</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
          </div>
        ))}
      </div>

      <h2 id="diy-vs-dfy">DIY vs Done-For-You</h2>
      <p>The same scope is available two ways: you run the analysis yourself, or our team runs it for you.</p>
      <ComparisonTable
        headers={["", "Self-Service", "Done-For-You"]}
        rows={[
          ["Who runs the analysis", "You, in the Shepi platform", "Shepi team, with you in review"],
          ["Turnaround", "2–4 hours hands-on", "Days, not weeks"],
          ["CPA review", "Optional add-on", "Included where applicable"],
          ["Onboarding", "Self-serve", "Guided kickoff & data-room walkthrough"],
          ["Ideal for", "Searchers and operators with finance fluency", "Buyers who want the deliverable produced for them"],
          ["Pricing", `${PRICING.perProject.display} per project`, `${PRICING.doneForYou.display} per project`],
        ]}
      />

      <h2 id="timeline">Timeline & Cost</h2>
      <StatRow stats={[
        { value: "2–4 hrs", label: "Self-Service hands-on time" },
        { value: "Days", label: "Done-For-You turnaround" },
        { value: "$20K–$100K", label: "Traditional CPA QoE cost it replaces" },
      ]} />

      <h2 id="pricing">Pricing</h2>
      <p>
        Self-Service is <strong>{PRICING.perProject.display}</strong> per project. Done-For-You is <strong>{PRICING.doneForYou.display}</strong> per project. Monthly subscription available at {PRICING.monthly.display}/month including {PRICING.monthly.includedProjects} projects.
      </p>
      <div className="not-prose mb-8">
        <Link to="/pricing">
          <Button size="lg">See full pricing</Button>
        </Link>
      </div>

      <h2 id="related">Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/quality-of-earnings-cost", label: "How much does a QoE cost?" },
        { to: "/compare/shepi-vs-excel", label: "Shepi vs Excel templates" },
        { to: "/quality-of-earnings-checklist", label: "QoE diligence checklist" },
        { to: "/quality-of-earnings-software", label: "QoE software platform" },
      ]} />
    </ContentPageLayout>
  );
}
