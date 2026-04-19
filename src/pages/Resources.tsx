import { Link } from "react-router-dom";
import { BookOpen, Users, GitCompare, Zap, ArrowRight, FileSearch } from "lucide-react";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    icon: FileSearch,
    title: "Quality of Earnings",
    description: "Core resources on Quality of Earnings — pricing, software, templates, and diligence checklists.",
    links: [
      { to: "/quality-of-earnings-cost", label: "QoE Cost", description: "Pricing benchmarks and what drives Quality of Earnings engagement fees." },
      { to: "/quality-of-earnings-software", label: "QoE Software", description: "Platform comparison and buyer's guide for Quality of Earnings tools." },
      { to: "/quality-of-earnings-template", label: "QoE Template", description: "Downloadable Quality of Earnings report structure and worked examples." },
      { to: "/quality-of-earnings-checklist", label: "QoE Checklist", description: "Step-by-step financial due diligence checklist for QoE engagements." },
    ],
  },
  {
    icon: BookOpen,
    title: "Educational Guides",
    description: "Master the fundamentals of Quality of Earnings analysis, EBITDA adjustments, and financial due diligence.",
    links: [
      { to: "/guides/quality-of-earnings", label: "What Is a Quality of Earnings Report?", description: "Complete guide to QoE reports — what they are, why they matter, key components, and how AI is changing the process." },
      { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments: Types, Examples & Best Practices", description: "Categories, common examples, documentation standards, and red flags to watch for in EBITDA adjustments." },
      { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist for M&A", description: "Document requests, analysis steps, red flags, timeline planning, and common mistakes to avoid." },
      { to: "/guides/revenue-quality-analysis", label: "Revenue Quality Analysis for M&A", description: "Customer concentration, recurring vs non-recurring revenue, AR aging, revenue recognition, and trend analysis." },
      { to: "/guides/working-capital-analysis", label: "Working Capital Analysis & NWC Peg", description: "Net working capital calculation, peg negotiation, turnover ratios, seasonality, and cash conversion cycle." },
      { to: "/guides/qoe-report-template", label: "QoE Report Template & Structure", description: "Executive summary, EBITDA bridge, revenue and expense analysis, working capital schedule, and proof of cash." },
      { to: "/guides/general-ledger-review", label: "General Ledger Review for Due Diligence", description: "GL anomaly detection, unusual journal entries, personal expenses, related party transactions, and AI-powered review." },
      { to: "/guides/ebitda-bridge", label: "EBITDA Bridge — Net Income to Adjusted EBITDA", description: "Build an EBITDA reconciliation: adjustment categories, run-rate calculations, and documentation standards." },
      { to: "/guides/financial-red-flags", label: "Financial Red Flags Checklist", description: "Revenue, expense, balance sheet, cash flow, GL-level, and operational warning signs in M&A due diligence." },
      { to: "/guides/cash-proof-analysis", label: "Cash & Bank Tie-Out Guide", description: "Proof of cash methodology, GL-to-bank reconciliation, commingled expense detection, and unrecorded liability identification." },
      { to: "/guides/sell-side-vs-buy-side-qoe", label: "Sell-Side vs Buy-Side QoE", description: "Key differences between sell-side and buy-side Quality of Earnings reports — scope, purpose, and when you need each." },
      { to: "/guides/owner-compensation-normalization", label: "Owner Compensation Normalization", description: "How to normalize owner salary, benefits, and personal expenses for EBITDA add-backs in M&A." },
      { to: "/guides/personal-expense-detection", label: "Personal Expense Detection", description: "Methods for finding personal expenses in the GL — keyword searches, vendor analysis, and AI-powered detection." },
      { to: "/guides/customer-concentration-risk", label: "Customer Concentration Risk Analysis", description: "Thresholds, analysis framework, mitigating factors, and how concentration affects deal terms and valuation." },
      { to: "/guides/run-rate-ebitda", label: "Run-Rate EBITDA vs Historical EBITDA", description: "When to use each, how to calculate run-rate EBITDA, pro forma adjustments, and red flags." },
      { to: "/guides/can-ai-replace-qoe", label: "Can AI Replace a QoE Report?", description: "Honest assessment of AI capabilities and limitations in Quality of Earnings analysis." },
      { to: "/guides/ai-accounting-anomaly-detection", label: "How AI Detects Accounting Anomalies", description: "Detection techniques, practical examples, and how AI-powered GL review compares to manual analysis." },
      { to: "/guides/earnings-manipulation-signs", label: "Signs of Earnings Manipulation", description: "Revenue manipulation, expense timing, balance sheet signals, and GL-level indicators in M&A." },
    ],
  },
  {
    icon: Users,
    title: "Use Cases",
    description: "See how deal professionals, advisors, lenders, and accounting firms use AI-assisted QoE analysis to move faster and smarter.",
    links: [
      { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers & ETA", description: "Screen deals faster, reduce diligence costs, and build confidence in acquisition decisions." },
      { to: "/use-cases/pe-firms", label: "QoE for Private Equity & Deal Teams", description: "Screen more deals without adding headcount with consistent, standardized analysis." },
      { to: "/use-cases/deal-advisors", label: "Sell-Side QoE for M&A Advisors", description: "Prepare sellers, control the narrative, and differentiate your advisory practice." },
      { to: "/use-cases/accountants-cpa", label: "QoE for Accountants, CPAs & QoE Firms", description: "Scale your practice with 2-3x more engagements and 48-hour preliminary findings." },
      { to: "/use-cases/business-brokers", label: "QoE for Business Brokers", description: "Close more deals with pre-listing financial assessments and compressed diligence." },
      { to: "/use-cases/lenders", label: "QoE for Lenders & SBA Lending", description: "Strengthen underwriting, mitigate acquisition loan risk, and accelerate closings." },
    ],
  },
  {
    icon: GitCompare,
    title: "Comparisons",
    description: "Understand the tradeoffs between different approaches to Quality of Earnings analysis.",
    links: [
      { to: "/compare/shepi-vs-excel", label: "Shepi vs. Excel for QoE Analysis", description: "Compare time, accuracy, consistency, and output quality for QoE analysis." },
      { to: "/compare/ai-qoe-vs-traditional", label: "AI-Assisted QoE vs. Traditional CPA Firm", description: "Cost, speed, scope, and when each approach is the right choice for your deal." },
    ],
  },
  {
    icon: Zap,
    title: "Features",
    description: "Deep dives into the tools and integrations that power Shepi's QoE platform.",
    links: [
      { to: "/features/quickbooks-integration", label: "QuickBooks Integration for QoE", description: "Direct data pull, automatic account mapping, multi-period support, and secure OAuth." },
      { to: "/features/ai-assistant", label: "AI-Powered QoE Analysis Assistant", description: "Red flag identification, adjustment guidance, educational support — AI assists, you decide." },
      { to: "/features/ai-due-diligence", label: "AI for Financial Due Diligence", description: "Automate EBITDA add-backs, GL anomaly detection, revenue analysis, and working capital calculations." },
      { to: "/features/qoe-software", label: "AI-Powered QoE Software", description: "End-to-end Quality of Earnings platform — from data ingestion to lender-ready reports." },
      { to: "/features/ebitda-automation", label: "EBITDA Add-Back Automation", description: "AI scans your GL for adjustment candidates, categorizes findings, and generates EBITDA bridges." },
    ],
  },
];

export default function Resources() {
  return (
    <ContentPageLayout
      title="Resources & Guides"
      seoTitle="QoE Resources — Guides, Use Cases & Comparisons | Shepi"
      seoDescription="Expert guides on Quality of Earnings analysis, EBITDA adjustments, due diligence checklists, and AI-assisted QoE tools for M&A professionals."
      canonical="https://shepi.ai/resources"
      breadcrumbs={[{ label: "Resources" }]}
      heroAccent
    >
      <p className="text-lg mb-10">
        Everything you need to understand Quality of Earnings analysis — from foundational guides to practical comparisons and deep dives into our platform's capabilities.
      </p>

      <div className="space-y-10 not-prose">
        {sections.map((section, sectionIdx) => (
          <div key={section.title}>
            {sectionIdx > 0 && <Separator className="mb-10" />}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-serif font-bold text-foreground">{section.title}</h2>
                <Badge variant="secondary" className="text-xs">{section.links.length} {section.links.length === 1 ? "article" : "articles"}</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{section.description}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.links.map((link) => (
                <Link key={link.to} to={link.to}>
                  <Card className="h-full hover:border-primary/40 transition-colors group cursor-pointer">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                        {link.label}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </CardTitle>
                      <CardDescription className="text-xs leading-relaxed mt-1.5">
                        {link.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center not-prose flex flex-col items-center">
        <p className="text-sm text-muted-foreground mb-2">Prefer a live conversation?</p>
        <a
          href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2qE2ZwYpCRi1MB-Ms9GnB1K7K3PpPCYankr9qdPiyVQYN8TqT9ZnkFuBz4mGlT4Lj0OukzYIrG?gv=true"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground/70 hover:text-muted-foreground underline underline-offset-4 transition-colors"
        >
          View available times →
        </a>
      </div>
    </ContentPageLayout>
  );
}
