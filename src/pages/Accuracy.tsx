import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "argument", label: "The Argument" },
  { id: "error-surface", label: "The Human-Error Surface" },
  { id: "what-shepi-removes", label: "What shepi Removes" },
  { id: "table", label: "Failure Mode Comparison" },
  { id: "humans", label: "Where Humans Still Belong" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Accuracy: Why shepi Beats a Human in Excel",
  description:
    "A manual QoE in Excel introduces a long list of error modes — broken references, sign flips, copy/paste drift, formula breakage. shepi removes that surface area structurally: no retyping, deterministic math, one source of truth.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-06-13",
  dateModified: "2026-06-13",
  mainEntityOfPage: "https://shepi.ai/accuracy",
};

export default function Accuracy() {
  return (
    <ContentPageLayout
      title="Accuracy: Why shepi Beats a Human in Excel"
      seoTitle="QoE Accuracy: No Retyping, No Broken Formulas | Shepi"
      seoDescription="A manual Quality of Earnings in Excel will introduce errors. shepi removes the human-error surface: no retyping data, deterministic math, one source of truth feeding every output."
      canonical="https://shepi.ai/accuracy"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "Accuracy" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="June 2026"
      heroAccent
    >
      <HeroCallout>
        A spreadsheet trusts whoever typed last. shepi doesn't.
      </HeroCallout>

      <p className="text-lg">
        Every <Link to="/guides/quality-of-earnings">Quality of Earnings</Link> built by hand in
        Excel carries the same hidden tax: the human typing it. Numbers get retyped between
        source documents and the model. Formulas drift when rows get inserted. Sign conventions
        flip silently between tabs. None of these are exotic failures — they are the normal
        cost of doing financial analysis in a tool that has no idea what any cell is supposed
        to mean.
      </p>

      <p>
        shepi removes that cost not by promising the impossible ("error-free analysis"), but by
        removing the steps where humans introduce errors in the first place: data entry,
        formula maintenance, and reconciling the same number across multiple outputs.
      </p>

      <h2 id="argument">The Argument, In One Sentence</h2>
      <p>
        <strong>No retyping. No broken formulas. Same math, every time.</strong> The math in
        shepi is deterministic — given the same inputs, the engine produces the same outputs on
        every run. The data flowing into that engine isn't hand-keyed by an analyst at 1 a.m.
        It's parsed from source documents into a structured ledger. The outputs — workbook,
        PDF, dashboards — all read from that same ledger. There is no copy/paste step where a
        number can quietly become a different number.
      </p>

      <h2 id="error-surface">The Human-Error Surface in a Manual QoE</h2>
      <p>
        Decades of spreadsheet research (Panko and others) put the rate of material errors in
        complex, hand-built workbooks alarmingly high. The categories below are not a
        hypothetical list — they are what every analyst who has built a QoE in Excel has
        debugged at 11 p.m. on a Sunday.
      </p>
      <BenefitGrid
        benefits={[
          {
            title: "Re-keyed numbers",
            description:
              "Trial balance values typed (or pasted as values) into a model. A single transposition or trailing zero quietly changes EBITDA.",
          },
          {
            title: "Inserted-row formula drift",
            description:
              "Adding a row to a category breaks SUM ranges further down the sheet. The total still looks reasonable, but it's wrong.",
          },
          {
            title: "Sign convention flips",
            description:
              "Revenue positive in one tab, expenses positive in another, adjustments inconsistently signed. The bridge ties out only by accident.",
          },
          {
            title: "Tab-to-tab copy/paste",
            description:
              "Adjustments live on one sheet, the bridge on another, the report on a third. Updating one and forgetting another is the default state.",
          },
          {
            title: "Broken external references",
            description:
              "Links to a closed workbook return #REF!. Links to an open workbook silently return last-saved values.",
          },
          {
            title: "Period misalignment",
            description:
              "TTM ending June compared to a fiscal year ending December, columns shifted one over, prior-period balances pulled from the wrong tab.",
          },
          {
            title: "Hand-keyed bank tie-outs",
            description:
              "Proof of cash done by reading PDFs and typing into a reconciliation grid. Every number is a chance to be wrong.",
          },
          {
            title: "Versioning chaos",
            description:
              '"QoE_final_v4_REVISED_JB_edits_USE_THIS_ONE.xlsx" — and three different people are working from three different files.',
          },
        ]}
      />

      <h2 id="what-shepi-removes">What shepi Removes — Structurally</h2>
      <p>
        These aren't "best practices" we ask users to follow. They are removed by the way the
        platform is built. You cannot accidentally re-type a number into shepi because there is
        no cell to type it into.
      </p>
      <BenefitGrid
        benefits={[
          {
            title: "Source documents → parsed ledger",
            description:
              "Trial balances, GLs, and supporting docs are parsed into a structured ledger. There is no human-data-entry step between the source PDF and the model.",
          },
          {
            title: "One canonical chart-of-accounts mapping",
            description:
              "Every account is mapped once. Adjustments, bridges, ratios, and the report all read the same mapping. Change it in one place, every output updates.",
          },
          {
            title: "Deterministic adjustment engine",
            description:
              "Given the same inputs, the math produces the same answer on every run. No floating cell references, no formula drift, no \"works on my machine.\"",
          },
          {
            title: "Single source of truth",
            description:
              "The workbook, PDF report, and dashboards are not separate files in different states. They render from the same underlying data.",
          },
          {
            title: "Full audit trail on every number",
            description:
              "Every adjustment carries who entered it, when, what source it traces to, and the formula behind the computed value.",
          },
          {
            title: "Period alignment is automatic",
            description:
              "TTM, fiscal year, calendar year, and prior periods are computed from the same dated ledger. You don't shift columns by hand.",
          },
        ]}
      />

      <h2 id="table">Failure Mode Comparison</h2>
      <ComparisonTable
        headers={["Failure Mode", "Excel / Manual", "shepi"]}
        rows={[
          ["Re-keyed source numbers", "Constant risk on every project", "Removed — data parsed from source"],
          ["Broken SUM ranges after inserts", "Common, hard to catch", "Not possible — no hand-built ranges"],
          ["Sign convention drift across tabs", "Common", "Removed — one signed ledger"],
          ["Bridge doesn't tie to report", "Frequent late-stage discovery", "Removed — both read same data"],
          ["Stale numbers in PDF vs. workbook", "Default state until manually synced", "Removed — single source"],
          ["Audit trail for an individual number", "Manual — if anyone bothered", "Built in — every adjustment traced"],
          ["Math reproducibility on re-run", "Depends on cell state", "Deterministic"],
        ]}
      />

      <h2 id="humans">Where Humans Still Belong</h2>
      <p>
        Removing data-entry error is not the same as removing judgment. shepi does not, and
        should not, decide which one-time legal fee qualifies as an add-back, how aggressively
        to normalize owner compensation, or whether a customer concentration risk warrants a
        disclosed adjustment versus a footnote. Those are judgment calls, and they belong to a
        human.
      </p>
      <p>
        That is exactly where the <Link to="/pricing">DFY tier</Link> sits: a matched, licensed
        CPA reviews the adjustments and the judgments behind them — on top of a deterministic
        engine that handles the math. Human-in-the-loop is not a hedge here; it's the right
        division of labor. Computers do the mechanical work without errors. People do the
        judgment work with accountability.
      </p>

      <h2 id="faq">FAQ</h2>
      <AccordionFAQ
        items={[
          {
            question: "Does shepi guarantee the analysis is accurate?",
            answer:
              "No, and we'd be lying if we did. shepi is analytical software, not an attestation or audit. What we guarantee is that the math is deterministic and that the platform removes the data-entry and formula-maintenance steps where human-built models go wrong. The judgment calls — which adjustments qualify, what assumptions to use — still require a human reviewer, which is why our DFY tier puts a licensed CPA in that loop.",
          },
          {
            question: "What about the AI? Doesn't AI hallucinate?",
            answer:
              "The AI in shepi suggests — it does not auto-execute. Every adjustment is human-entered or human-approved. The math that produces EBITDA, the bridge, the ratios, and the report is not AI; it is deterministic code. AI helps you find what to look at. Deterministic math computes the result.",
          },
          {
            question: "Is this the same as a CPA-attested audit or QoE?",
            answer: (
              <>
                No. shepi is not an audit, and outputs from the platform are not formal CPA
                attestations. For a full description of what shepi does and does not do, see
                the <Link to="/scope" className="text-primary underline underline-offset-4">Statement of Work</Link>.
              </>
            ),
          },
          {
            question: "If the math is deterministic, why do I need a person at all?",
            answer:
              "Because financial analysis is not just math. Picking the right adjustments, deciding what's truly non-recurring, normalizing owner compensation appropriately for the industry — these are judgment decisions. shepi removes the error-prone mechanical steps so the human's time and attention land on the questions that actually require professional judgment.",
          },
        ]}
      />

      <h2>Related Resources</h2>
      <RelatedResourceCards
        links={[
          { to: "/compare/shepi-vs-excel", label: "shepi vs. Excel" },
          { to: "/compare/ai-qoe-vs-traditional", label: "AI QoE vs. Traditional CPA Firm" },
          { to: "/guides/quality-of-earnings", label: "What Is a QoE Report?" },
          { to: "/pricing", label: "DIY and DFY Pricing" },
        ]}
      />
    </ContentPageLayout>
  );
}
