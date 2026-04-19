import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { StepList } from "@/components/content/StepList";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "techniques", label: "Detection Techniques" },
  { id: "what-ai-finds", label: "What AI Finds" },
  { id: "how-it-works", label: "How It Works" },
  { id: "vs-manual", label: "AI vs Manual Detection" },
  { id: "limitations", label: "Limitations" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How AI Detects Accounting Anomalies",
  description: "How AI and machine learning detect accounting anomalies in due diligence — techniques, what AI finds vs manual review, and how AI-powered anomaly detection works in practice.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  mainEntityOfPage: "https://shepi.ai/guides/ai-accounting-anomaly-detection",
};

export default function AIAccountingAnomalyDetection() {
  return (
    <ContentPageLayout
      title="How AI Detects Accounting Anomalies"
      seoTitle="AI Anomaly Detection in Accounting — How It Works | Shepi"
      seoDescription="How AI and machine learning detect accounting anomalies during M&A due diligence. Detection techniques, practical examples, and how AI-powered GL review compares to manual analysis."
      canonical="https://shepi.ai/guides/ai-accounting-anomaly-detection"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "AI Anomaly Detection" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        An analyst reviewing 50,000 transactions manually will miss patterns that AI detects in seconds. AI doesn't replace judgment — it gives every analyst superhuman pattern recognition.
      </HeroCallout>

      <StatRow stats={[
        { value: "100%", label: "Transaction coverage" },
        { value: "Seconds", label: "Time to scan entire GL" },
        { value: "5–10×", label: "More anomalies surfaced vs sampling" },
      ]} />

      <h2 id="overview">Overview</h2>
      <p>
        Traditional <Link to="/guides/general-ledger-review">GL review</Link> relies on analyst intuition and sampling. An experienced accountant reviews a subset of transactions, looking for things that "don't look right." This approach works — but it's slow, inconsistent, and inherently limited by human attention span.
      </p>
      <p>
        AI-powered anomaly detection changes the equation. Instead of sampling, AI analyzes <strong>every transaction</strong> simultaneously, applying statistical tests, pattern recognition, and natural language processing to surface items that warrant human review.
      </p>

      <h2 id="techniques">Detection Techniques</h2>
      <BenefitGrid benefits={[
        { title: "Statistical outlier detection", description: "Transactions that deviate significantly from account averages — flagged by standard deviation and interquartile range analysis" },
        { title: "Benford's Law analysis", description: "First-digit distribution analysis that detects artificial or manipulated transaction data" },
        { title: "Round-dollar flagging", description: "Transactions in suspiciously round amounts ($5,000, $10,000) that may indicate estimates or manual overrides" },
        { title: "Duplicate detection", description: "Same amount, same vendor, same period — potential duplicate payments or entries" },
        { title: "Period-end clustering", description: "Unusual concentration of entries in the last days of reporting periods — a classic manipulation signal" },
        { title: "Sequence analysis", description: "Gaps in check numbers, invoice numbers, or transaction sequences that suggest missing records" },
        { title: "NLP keyword detection", description: "Natural language processing identifies personal expenses, related-party indicators, and unusual descriptions" },
        { title: "Cross-account correlation", description: "Identifies entries that affect unusual account combinations — potential reclassification or intercompany issues" },
      ]} />

      <h2 id="what-ai-finds">What AI Typically Finds</h2>
      <BenefitGrid benefits={[
        { title: "Personal expenses", description: "Owner expenses buried in operating accounts — vehicles, travel, entertainment, personal services" },
        { title: "Duplicate payments", description: "Vendors paid twice for the same invoice — sometimes intentional, often clerical errors" },
        { title: "Period manipulation", description: "Revenue pulled forward or expenses pushed back to improve period-end results" },
        { title: "Misclassifications", description: "Capital expenditures expensed, COGS items in operating expense, revenue coded as other income" },
        { title: "Related-party transactions", description: "Payments to entities connected to the owner that may not be at arm's length" },
        { title: "Unusual journal entries", description: "Manual entries with large round amounts, missing descriptions, or off-hours posting" },
      ]} />

      <h2 id="how-it-works">How AI Anomaly Detection Works in Practice</h2>
      <StepList steps={[
        { title: "Data ingestion", description: "Complete GL exported from accounting system with all fields: date, account, amount, description, vendor, entry type" },
        { title: "Profiling", description: "AI builds a statistical profile of each account — average transaction size, frequency, vendor distribution, seasonal patterns" },
        { title: "Multi-test scanning", description: "All detection techniques run simultaneously across the entire ledger" },
        { title: "Confidence scoring", description: "Each flagged item receives a confidence score based on how strongly it deviates from expected patterns" },
        { title: "Categorization", description: "Flagged items categorized by type: potential add-back, possible error, risk indicator, reclassification candidate" },
        { title: "Human review", description: "Analyst reviews flagged items, applies business context, and determines appropriate treatment" },
      ]} />

      <h2 id="vs-manual">AI vs Manual Detection</h2>
      <BenefitGrid benefits={[
        { title: "Coverage", description: "AI: 100% of transactions. Manual: 10–20% sample. More coverage = fewer missed issues" },
        { title: "Consistency", description: "AI applies the same tests every time. Manual varies by analyst experience and fatigue level" },
        { title: "Speed", description: "AI completes initial scan in minutes. Manual review takes 2–4 weeks for a typical SMB" },
        { title: "Cross-account patterns", description: "AI correlates activity across all accounts simultaneously. Humans review account by account" },
        { title: "False positives", description: "AI flags more items (including some that aren't issues). Human filtering is required — but it's easier to filter than to discover" },
      ]} />

      <h2 id="limitations">Honest Limitations</h2>
      <BenefitGrid benefits={[
        { title: "Context blindness", description: "AI doesn't know the business story. A $50K payment to a consultant might be recurring or one-time — that requires human knowledge" },
        { title: "Data quality dependency", description: "If transaction descriptions are poor or accounts are disorganized, detection accuracy decreases" },
        { title: "Novel fraud", description: "Sophisticated manipulation designed to look normal may evade statistical detection" },
        { title: "Qualitative factors", description: "Customer relationship health, management competence, and market conditions can't be assessed from transaction data alone" },
      ]} />

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "Can AI detect fraud?", answer: "AI can detect patterns commonly associated with fraud — unusual entries, duplicates, round-dollar transactions, period-end manipulation. But confirming fraud requires investigation. AI flags; humans investigate." },
        { question: "How many false positives does AI generate?", answer: "Typically 30-50% of flagged items require no action after review. This is intentional — it's better to review a false positive than miss a real issue. The net time savings is still dramatic." },
        { question: "Does AI anomaly detection require clean data?", answer: "It works better with clean, well-described transaction data. However, messy data (poor descriptions, inconsistent coding) is itself a finding — it may indicate weak internal controls." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/features/ai-assistant", label: "AI-Powered QoE Assistant" },
        { to: "/guides/general-ledger-review", label: "General Ledger Review" },
        { to: "/guides/can-ai-replace-qoe", label: "Can AI Replace a QoE Report?" },
        { to: "/guides/earnings-manipulation-signs", label: "Signs of Earnings Manipulation" },
      ]} />
    </ContentPageLayout>
  );
}
