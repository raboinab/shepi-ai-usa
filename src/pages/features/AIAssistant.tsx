import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "what-it-does", label: "What the AI Does" },
  { id: "what-it-doesnt", label: "What It Doesn't Do" },
  { id: "red-flags", label: "Red Flag Detection" },
  { id: "education", label: "Educational Guidance" },
  { id: "privacy", label: "Data Privacy" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "AI-Powered QoE Analysis Assistant",
  description: "How Shepi's AI assistant helps with Quality of Earnings analysis — red flag identification, adjustment guidance, educational support, and what the AI doesn't do.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-02-21",
  dateModified: "2026-02-21",
  mainEntityOfPage: "https://shepi.ai/features/ai-assistant",
};

export default function AIAssistant() {
  return (
    <ContentPageLayout
      title="AI-Powered QoE Analysis Assistant"
      seoTitle="AI-Powered Quality of Earnings Assistant | Shepi"
      seoDescription="How Shepi's AI assistant accelerates QoE analysis — red flag identification, EBITDA adjustment guidance, educational support, and clear boundaries on what AI does and doesn't do."
      canonical="https://shepi.ai/features/ai-assistant"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "AI Assistant" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="February 2026"
      heroAccent
    >
      <HeroCallout>
        AI assists, you decide — every adjustment, conclusion, and judgment call is yours.
      </HeroCallout>

      <p className="text-lg">
        Shepi's AI assistant is designed with a clear philosophy: <strong>AI assists, you decide</strong>. The AI helps you work faster and catch more issues, but every adjustment, conclusion, and judgment call is yours. Here's exactly what the AI does — and what it doesn't.
      </p>

      <h2 id="overview">Overview</h2>
      <p>
        The AI assistant is available throughout the <Link to="/guides/quality-of-earnings">QoE analysis</Link> workflow. It operates in three modes: identification (surfacing potential issues), education (explaining concepts and context), and assistance (answering questions about your specific analysis).
      </p>

      <h2 id="what-it-does">What the AI Does</h2>
      <BenefitGrid benefits={[
        { title: "Identifies potential adjustments", description: "Reviews financial data to flag items that commonly require EBITDA adjustments: unusual transactions, related-party items, owner discretionary expenses, and non-recurring events." },
        { title: "Surfaces red flags", description: "Anomalies, trends, and patterns that warrant attention — revenue concentration, margin compression, working capital swings, accounting inconsistencies." },
        { title: "Explains concepts", description: 'Not sure what "normalized working capital" means? The AI provides clear, contextual explanations drawn from QoE best practices and M&A industry knowledge.' },
        { title: "Answers questions", description: 'Ask in real-time: "Is this revenue trend concerning?" or "What\'s a typical owner comp adjustment for a services business?" The AI provides informed perspectives.' },
      ]} />

      <h2 id="what-it-doesnt">What the AI Doesn't Do</h2>
      <p>Transparency matters. Here's what our AI explicitly does <strong>not</strong> do:</p>
      <BenefitGrid benefits={[
        { title: "Does not auto-calculate adjustments", description: "Every number in your analysis is entered and approved by you" },
        { title: "Does not certify or attest", description: "Provides analysis assistance, not professional certification" },
        { title: "Does not audit source documents", description: "Works with the data you provide; doesn't verify management representations" },
        { title: "Does not replace professional judgment", description: "A tool that makes you faster — not a substitute for financial expertise" },
        { title: "Does not train on your data", description: "Your deal information is never used to train AI models" },
      ]} />

      <h2 id="red-flags">Red Flag Detection</h2>
      <BenefitGrid benefits={[
        { title: "Revenue quality", description: "Customer concentration, seasonal anomalies, aggressive recognition" },
        { title: "Expense patterns", description: "Missing costs, below-market related-party charges, deferred maintenance" },
        { title: "Working capital", description: "DSO/DPO trends that suggest timing manipulation or collection issues" },
        { title: "Balance sheet", description: "Unusual accruals, inventory build-up, unrecorded liabilities" },
        { title: "Trend analysis", description: "Margin shifts, revenue trajectory breaks, expense reclassifications" },
      ]} />

      <h2 id="education">Educational Guidance</h2>
      <p>
        One of the most valuable aspects of the AI assistant is its educational role. For <Link to="/use-cases/independent-searchers">independent searchers</Link> and first-time buyers, the AI serves as a knowledgeable mentor:
      </p>
      <BenefitGrid benefits={[
        { title: "Industry-specific guidance", description: "Explains QoE considerations relevant to your target's industry" },
        { title: "Benchmarking context", description: 'Provides context on what\'s "normal" for adjustment categories' },
        { title: "Step-by-step process", description: "Guides users through the analytical process in logical order" },
        { title: "Best practices", description: "References established QoE methodology and industry standards" },
      ]} />

      <h2 id="privacy">Data Privacy</h2>
      <BenefitGrid benefits={[
        { title: "No model training", description: "Your deal data is never used to train AI models" },
        { title: "Encrypted at rest & in transit", description: "All data protected with industry-standard encryption" },
        { title: "Project isolation", description: "No cross-user visibility — your data stays yours" },
        { title: "Full deletion control", description: "Delete a project and all associated data is permanently removed" },
      ]} />

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ items={[
        { question: "What AI model powers Shepi's assistant?", answer: "Shepi uses enterprise-grade AI models optimized for financial analysis. The specific models may be updated over time to leverage the latest capabilities." },
        { question: "Can I turn off AI suggestions?", answer: "Yes. The AI assistant is an optional feature — you can use Shepi's structured workflow without AI assistance if you prefer." },
        { question: "Is the AI reliable for financial analysis?", answer: "The AI is a powerful tool for identification and guidance, but it's not infallible. That's why every AI suggestion is presented for your review and approval — never auto-applied. Think of it as a very fast, very well-read junior analyst that still needs senior review." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/features/quickbooks-integration", label: "QuickBooks Integration" },
        { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
        { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs. Traditional CPA" },
        { to: "/use-cases/pe-firms", label: "QoE for PE Firms" },
      ]} />
    </ContentPageLayout>
  );
}
