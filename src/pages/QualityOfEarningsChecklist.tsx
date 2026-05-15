import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";
import { PRICING } from "@/lib/pricing";

const toc = [
  { id: "data-request", label: "1. Data Request" },
  { id: "revenue", label: "2. Revenue Quality" },
  { id: "ebitda", label: "3. EBITDA Adjustments" },
  { id: "working-capital", label: "4. Working Capital" },
  { id: "proof-cash", label: "5. Proof of Cash" },
  { id: "gl-review", label: "6. General Ledger Review" },
  { id: "risks", label: "7. Risk Flags" },
  { id: "deliverables", label: "8. Deliverables" },
  { id: "faq", label: "FAQ" },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is on a Quality of Earnings checklist?", acceptedAnswer: { "@type": "Answer", text: "A complete QoE checklist covers eight sections: data request (TB, GL, bank statements, AR/AP aging), revenue quality, EBITDA adjustments, working capital schedule, proof of cash, GL anomaly review, risk flags, and final deliverables (report, Excel workbook, audit trail)." } },
    { "@type": "Question", name: "What documents are needed for Quality of Earnings?", acceptedAnswer: { "@type": "Answer", text: "Minimum data set: 3 years of trial balances plus TTM, full general ledger, bank statements for the same periods, AR and AP aging reports, payroll registers, and customer/vendor lists." } },
    { "@type": "Question", name: "How many transactions should a QoE review?", acceptedAnswer: { "@type": "Answer", text: "Traditional CPA QoE samples 10–20% of GL transactions. AI-powered QoE software like Shepi reviews 100% of transactions to surface anomalies and add-back candidates." } },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Quality of Earnings Checklist: 8-Section M&A Due Diligence Guide",
  description: "Free Quality of Earnings checklist covering data request, revenue, EBITDA, working capital, proof of cash, GL review, risk flags, and deliverables.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-05-15",
  mainEntityOfPage: "https://shepi.ai/quality-of-earnings-checklist",
};

export default function QualityOfEarningsChecklist() {
  return (
    <ContentPageLayout
      title="Quality of Earnings Checklist for M&A Due Diligence"
      seoTitle="Quality of Earnings Checklist: 8-Section M&A Due Diligence Guide (2026) | Shepi"
      seoDescription="Free Quality of Earnings checklist covering data request, revenue, EBITDA, working capital, proof of cash & deliverables. Download the 8-section PDF."
      canonical="https://shepi.ai/quality-of-earnings-checklist"
      breadcrumbs={[{ label: "Quality of Earnings Checklist" }]}
      toc={toc}
      jsonLd={[faqSchema, articleSchema]}
      modifiedDate="May 2026"
      heroAccent
    >
      <HeroCallout>
        The complete QoE checklist used by deal teams, PE firms, and lenders. Walk through every section of a professional Quality of Earnings analysis — or let Shepi run all 8 sections for you.
      </HeroCallout>

      <StatRow stats={[
        { value: "8", label: "Diligence sections" },
        { value: "100%", label: "GL coverage required" },
        { value: PRICING.perProject.display, label: "Done-for-you alternative" },
      ]} />

      <p>
        A <strong>Quality of Earnings (QoE) checklist</strong> is the working document deal teams use to verify a target company's reported earnings before closing an acquisition. A complete checklist walks through eight diligence sections: the data request, revenue quality, EBITDA adjustments, working capital, proof of cash, general ledger anomalies, risk flags, and final deliverables. Use the checklist below as a free standalone resource, or download the PDF for offline use.
      </p>

      <div className="not-prose my-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-5">
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-1">Download the 8-section QoE checklist (PDF)</p>
          <p className="text-sm text-muted-foreground">Print-ready, share with your deal team. No email required.</p>
        </div>
        <a href="/qoe-checklist.pdf" download>
          <Button size="lg" className="gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </a>
      </div>

      <h2 id="data-request">1. Data Request Checklist</h2>
      <p>
        Before any analysis begins, the deal team must collect a complete data set covering at least three full years plus the trailing twelve months. Missing or incomplete data is the single largest cause of QoE delays — request everything below at kickoff to avoid costly back-and-forth later.
      </p>
      <ul>
        <li>☐ Trial balances — 3 years plus TTM (monthly preferred)</li>
        <li>☐ General ledger — full detail for the same periods</li>
        <li>☐ Bank statements — all operating accounts for proof of cash</li>
        <li>☐ AR aging — current and 12-month historical snapshots</li>
        <li>☐ AP aging — current and 12-month historical snapshots</li>
        <li>☐ Payroll register — for owner comp normalization</li>
        <li>☐ Customer revenue detail — for concentration analysis</li>
        <li>☐ Vendor spend detail — for related-party identification</li>
        <li>☐ Tax returns — 3 years for book-to-tax reconciliation</li>
        <li>☐ Loan agreements & lease schedules</li>
        <li>☐ Capex history — to normalize maintenance vs growth</li>
      </ul>

      <h2 id="revenue">2. Revenue Quality Checklist</h2>
      <p>
        Revenue quality is about more than the top-line number — it tests whether reported revenue is recurring, properly recognized, and concentrated in a healthy mix of customers. Pay particular attention to <Link to="/guides/customer-concentration-risk">customer concentration risk</Link>, which is the most common deal-killer surfaced in this section.
      </p>
      <BenefitGrid benefits={[
        { title: "Recognition policy review", description: "Confirm revenue is recognized when earned, not when billed or collected" },
        { title: "Recurring vs non-recurring", description: "Classify each revenue stream — one-time projects distort run-rate" },
        { title: "Customer concentration", description: "Top 10 customer % of revenue and trend over 3 years" },
        { title: "Pricing & volume trends", description: "Decompose revenue growth into price vs volume drivers" },
        { title: "AR aging quality", description: "Aging bucket trends and collectability of >90 day balances" },
        { title: "Channel & geography mix", description: "Identify shifts that affect future run-rate" },
      ]} />

      <h2 id="ebitda">3. EBITDA Adjustments Checklist</h2>
      <p>
        Adjusted EBITDA is the headline number every deal is priced on. Standard categories of <Link to="/guides/ebitda-adjustments">EBITDA adjustments</Link> include owner compensation, personal expenses, and one-time items. The largest single add-back on most lower-middle-market deals is <Link to="/guides/owner-compensation-normalization">owner compensation normalization</Link> — review it line by line.
      </p>
      <ul>
        <li>☐ Owner compensation normalization (above/below market)</li>
        <li>☐ Personal expenses run through the business</li>
        <li>☐ Non-recurring revenue (one-time projects, COVID grants)</li>
        <li>☐ Non-recurring expenses (legal settlements, restructuring)</li>
        <li>☐ Related-party transactions at non-market terms</li>
        <li>☐ Run-rate adjustments for new contracts and lost customers</li>
        <li>☐ Accounting cleanup (out-of-period entries, accruals)</li>
        <li>☐ Stock-based compensation</li>
        <li>☐ Rent normalization (owner-occupied real estate)</li>
      </ul>

      <h2 id="working-capital">4. Working Capital Checklist</h2>
      <p>
        The working capital peg drives the dollar-for-dollar purchase-price adjustment at close — getting it wrong means leaving cash on the table or underfunding operations day one. The full methodology is in our <Link to="/guides/working-capital-analysis">working capital analysis guide</Link>; the section-level checklist is below.
      </p>
      <BenefitGrid benefits={[
        { title: "Trailing 12-month NWC", description: "Build monthly NWC schedule covering at least the last 12 months" },
        { title: "Turnover ratios", description: "DSO, DPO, and DIO trends to identify deteriorating quality" },
        { title: "Seasonality adjustments", description: "Identify and normalize seasonal swings that distort the peg" },
        { title: "Peg calculation", description: "Compute the normalized NWC peg used in the purchase agreement" },
        { title: "Excluded items", description: "Cash, debt-like items, and deferred revenue treatment" },
      ]} />

      <h2 id="proof-cash">5. Proof of Cash Checklist</h2>
      <p>
        Proof of cash is the section where commingled expenses, unrecorded liabilities, and cash-basis surprises surface. Tying every bank deposit and disbursement back to the GL is non-negotiable — see the <Link to="/guides/cash-proof-analysis">proof of cash analysis guide</Link> for the full reconciliation methodology.
      </p>
      <ul>
        <li>☐ Reconcile total bank deposits to GL revenue + other receipts</li>
        <li>☐ Reconcile total disbursements to GL expenses + other payments</li>
        <li>☐ Identify unrecorded liabilities (checks not yet posted)</li>
        <li>☐ Identify commingled personal expenses</li>
        <li>☐ Verify intercompany / related-party transfer treatment</li>
        <li>☐ Confirm period-end cut-off accuracy</li>
      </ul>

      <h2 id="gl-review">6. General Ledger Review Checklist</h2>
      <p>
        Sampling 10–20% of GL transactions misses most red flags. A modern QoE reviews 100% of journal entries against a panel of anomaly tests — round dollars, period-end clustering, duplicates, manual entries to revenue, and unexplained account drift. Each test below should be run across the full GL, not a sample.
      </p>
      <BenefitGrid benefits={[
        { title: "Round-dollar transactions", description: "Large round-number entries that often signal estimates or accruals" },
        { title: "Period-end clustering", description: "Spike in entries on the last day of a period — earnings management signal" },
        { title: "Duplicate detection", description: "Same vendor + amount + date patterns" },
        { title: "Unusual journal entries", description: "Manual entries to revenue, COGS, or accruals" },
        { title: "Threshold flags", description: "Transactions over materiality reviewed individually" },
        { title: "Account drift", description: "Accounts with sudden activity changes year-over-year" },
      ]} />

      <h2 id="risks">7. Risk Flags Checklist</h2>
      <p>
        Risk flags are the qualitative findings that sit alongside the quantitative adjustments. Any single flag below can re-trade or kill a deal — surface them early so the buyer's reps & warranties insurance, escrow, and indemnity terms can be negotiated against real evidence.
      </p>
      <ul>
        <li>☐ Customer concentration over 20% of revenue</li>
        <li>☐ Vendor concentration creating supply risk</li>
        <li>☐ Key person / employee dependency</li>
        <li>☐ Recent loss of major customer or contract</li>
        <li>☐ Outstanding litigation or regulatory issues</li>
        <li>☐ Tax exposure (sales tax nexus, payroll tax)</li>
        <li>☐ Going-concern indicators</li>
        <li>☐ Quality of accounting controls</li>
      </ul>

      <h2 id="deliverables">8. Final Deliverables Checklist</h2>
      <p>
        The deliverable set is what the lender, buyer, and IC actually read. A defensible QoE ships a narrative PDF, supporting Excel workbook, and a transaction-level audit trail — all anchored to the <Link to="/guides/ebitda-bridge">adjusted EBITDA bridge</Link> that walks reported earnings to the closing number.
      </p>
      <ul>
        <li>☐ QoE report (PDF, lender-ready)</li>
        <li>☐ Adjusted EBITDA bridge (Excel)</li>
        <li>☐ Working capital schedule (Excel)</li>
        <li>☐ Proof of cash reconciliation (Excel)</li>
        <li>☐ Customer concentration analysis</li>
        <li>☐ Flagged transactions with audit trail</li>
        <li>☐ Full Excel workbook for buyer/lender review</li>
      </ul>

      <p>
        Running through this checklist manually takes 4–8 weeks and $20K+. Shepi runs every section automatically from your QuickBooks file — starting at {PRICING.perProject.display}.
      </p>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "What is on a Quality of Earnings checklist?", answer: "Data request, revenue quality, EBITDA adjustments, working capital, proof of cash, GL anomaly review, risk flags, and final deliverables." },
        { question: "What documents are needed for QoE?", answer: "3 years of trial balances plus TTM, full GL, bank statements, AR/AP aging, payroll register, customer/vendor detail, and tax returns." },
        { question: "How many transactions should a QoE review?", answer: "Traditional CPA QoE samples 10–20%. AI-powered QoE reviews 100% of transactions." },
        { question: "How long does the checklist take to complete manually?", answer: "4–8 weeks of senior analyst time for a typical lower middle market deal." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/due-diligence-checklist", label: "Full Due Diligence Checklist" },
        { to: "/quality-of-earnings-template", label: "QoE Report Template" },
        { to: "/quality-of-earnings-cost", label: "QoE Cost Guide" },
        { to: "/quality-of-earnings-software", label: "QoE Software" },
      ]} />
    </ContentPageLayout>
  );
}
