import { Link } from "react-router-dom";
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
    { "@type": "Question", name: "What is on a Quality of Earnings checklist?", acceptedAnswer: { "@type": "Answer", text: "A complete QoE checklist covers: data request (TB, GL, bank statements, AR/AP aging), revenue quality, EBITDA adjustments, working capital schedule, proof of cash, GL anomaly review, risk flags, and final deliverables (report, Excel workbook, audit trail)." } },
    { "@type": "Question", name: "What documents are needed for Quality of Earnings?", acceptedAnswer: { "@type": "Answer", text: "Minimum data set: 3 years of trial balances plus TTM, full general ledger, bank statements for the same periods, AR and AP aging reports, payroll registers, and customer/vendor lists." } },
    { "@type": "Question", name: "How many transactions should a QoE review?", acceptedAnswer: { "@type": "Answer", text: "Traditional CPA QoE samples 10–20% of GL transactions. AI-powered QoE software like Shepi reviews 100% of transactions to surface anomalies and add-back candidates." } },
  ],
};

export default function QualityOfEarningsChecklist() {
  return (
    <ContentPageLayout
      title="Quality of Earnings Checklist for M&A Due Diligence"
      seoTitle="Quality of Earnings Checklist — Free QoE Diligence Checklist | Shepi"
      seoDescription="Complete Quality of Earnings checklist covering data request, revenue quality, EBITDA adjustments, working capital, proof of cash, and lender-ready deliverables."
      canonical="https://shepi.ai/quality-of-earnings-checklist"
      breadcrumbs={[{ label: "Quality of Earnings Checklist" }]}
      toc={toc}
      jsonLd={faqSchema}
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

      <h2 id="data-request">1. Data Request Checklist</h2>
      <p>The minimum data set required to run a complete Quality of Earnings analysis:</p>
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
      <BenefitGrid benefits={[
        { title: "Recognition policy review", description: "Confirm revenue is recognized when earned, not when billed or collected" },
        { title: "Recurring vs non-recurring", description: "Classify each revenue stream — one-time projects distort run-rate" },
        { title: "Customer concentration", description: "Top 10 customer % of revenue and trend over 3 years" },
        { title: "Pricing & volume trends", description: "Decompose revenue growth into price vs volume drivers" },
        { title: "AR aging quality", description: "Aging bucket trends and collectability of >90 day balances" },
        { title: "Channel & geography mix", description: "Identify shifts that affect future run-rate" },
      ]} />

      <h2 id="ebitda">3. EBITDA Adjustments Checklist</h2>
      <p>Standard categories of <Link to="/guides/ebitda-adjustments">EBITDA adjustments</Link> to identify:</p>
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
      <BenefitGrid benefits={[
        { title: "Trailing 12-month NWC", description: "Build monthly NWC schedule covering at least the last 12 months" },
        { title: "Turnover ratios", description: "DSO, DPO, and DIO trends to identify deteriorating quality" },
        { title: "Seasonality adjustments", description: "Identify and normalize seasonal swings that distort the peg" },
        { title: "Peg calculation", description: "Compute the normalized NWC peg used in the purchase agreement" },
        { title: "Excluded items", description: "Cash, debt-like items, and deferred revenue treatment" },
      ]} />

      <h2 id="proof-cash">5. Proof of Cash Checklist</h2>
      <p>The section where commingled expenses and missing liabilities surface:</p>
      <ul>
        <li>☐ Reconcile total bank deposits to GL revenue + other receipts</li>
        <li>☐ Reconcile total disbursements to GL expenses + other payments</li>
        <li>☐ Identify unrecorded liabilities (checks not yet posted)</li>
        <li>☐ Identify commingled personal expenses</li>
        <li>☐ Verify intercompany / related-party transfer treatment</li>
        <li>☐ Confirm period-end cut-off accuracy</li>
      </ul>

      <h2 id="gl-review">6. General Ledger Review Checklist</h2>
      <BenefitGrid benefits={[
        { title: "Round-dollar transactions", description: "Large round-number entries that often signal estimates or accruals" },
        { title: "Period-end clustering", description: "Spike in entries on the last day of a period — earnings management signal" },
        { title: "Duplicate detection", description: "Same vendor + amount + date patterns" },
        { title: "Unusual journal entries", description: "Manual entries to revenue, COGS, or accruals" },
        { title: "Threshold flags", description: "Transactions over materiality reviewed individually" },
        { title: "Account drift", description: "Accounts with sudden activity changes year-over-year" },
      ]} />

      <h2 id="risks">7. Risk Flags Checklist</h2>
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
