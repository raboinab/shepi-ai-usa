import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { ComparisonTable } from "@/components/content/ComparisonTable";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "the-misconception", label: "The Promise & The Misconception" },
  { id: "what-ai-can-do", label: "What AI Can Do Well" },
  { id: "what-ai-cannot-do", label: "What AI Cannot Do" },
  { id: "assisted-vs-generated", label: "AI-Assisted vs AI-Generated" },
  { id: "analyst-in-the-loop", label: "The Better Model" },
  { id: "who-this-matters-for", label: "Who This Matters Most For" },
  { id: "the-real-unlock", label: "The Real Unlock" },
  { id: "faq", label: "FAQ" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "AI Won't Do Your Quality of Earnings Analysis For You — But It Can Make You Much Better At It",
  description: "An honest take from an AI QoE company on what AI can and can't do in financial due diligence — and why 'AI-assisted' beats 'AI-generated' every time.",
  author: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  publisher: { "@type": "Organization", name: "Shepi", url: "https://shepi.ai" },
  datePublished: "2026-04-29",
  dateModified: "2026-04-29",
  mainEntityOfPage: "https://shepi.ai/guides/ai-wont-do-your-qoe",
};

export default function AIWontDoYourQoE() {
  return (
    <ContentPageLayout
      title="AI Won't Do Your Quality of Earnings Analysis For You — But It Can Make You Much Better At It"
      seoTitle="AI Won't Do Your QoE Analysis (And Why That's the Point) | Shepi"
      seoDescription="Honest take from an AI QoE company on what AI can and can't do in financial due diligence — and why 'AI-assisted' beats 'AI-generated' every time."
      canonical="https://shepi.ai/guides/ai-wont-do-your-qoe"
      breadcrumbs={[
        { label: "Resources", href: "/resources" },
        { label: "AI Won't Do Your QoE" },
      ]}
      toc={toc}
      jsonLd={jsonLd}
      publishedDate="April 2026"
      heroAccent
    >
      <HeroCallout>
        We built an AI Quality of Earnings tool. And we tell every buyer the same thing on day one: this software won't do your QoE for you. It will make you dramatically faster and more thorough — but the judgment is still yours, and that's the point.
      </HeroCallout>

      <h2 id="the-misconception">The Promise and the Misconception</h2>
      <p>
        AI is genuinely changing financial due diligence. It's also generating a lot of marketing copy that overpromises in ways sophisticated buyers, lenders, and CPAs see right through.
      </p>
      <p>
        Here's the misconception worth correcting: a <Link to="/guides/quality-of-earnings">Quality of Earnings analysis</Link> is not a spreadsheet exercise. It's a <strong>judgment exercise</strong>. The deliverable looks like a workbook, but the value is the opinion underneath it — whether reported earnings are real, repeatable, and useful for making a deal decision.
      </p>
      <p>
        Push-button QoE doesn't exist. What does exist — and what's actually transformative — is software that lets one analyst do the work of three, with better coverage and a tighter audit trail. That's what we build. That's what this piece is about.
      </p>

      <h2 id="what-ai-can-do">What AI Can Do Well</h2>
      <p>
        AI is genuinely good at the painful, time-consuming parts of QoE — the parts that traditionally consume 70–80% of an engagement and produce no opinions, just structure:
      </p>
      <BenefitGrid benefits={[
        { title: "Ingest messy financial exports", description: "Pull from QuickBooks, Xero, raw GL exports, bank statements, and trial balances — and reconcile them into a single canonical dataset" },
        { title: "Review the full population", description: "Scan 100% of GL transactions instead of sampling 5%. Catch the things sampling misses by definition" },
        { title: "Surface anomalies and exceptions", description: "Round-dollar entries, period-end clustering, related-party indicators, duplicate vendors, unusual journal entries — drafted as a queue for human review" },
        { title: "Draft adjustment support", description: "Identify candidate addbacks, pull the matching GL lines, link to source documents, and write the first draft of the narrative" },
        { title: "Build structured schedules", description: "EBITDA bridge, working capital, proof of cash, debt schedule, customer concentration — populated and tied out to source automatically" },
        { title: "Accelerate the workflow", description: "Cut the time from data receipt to first findings from weeks to hours, leaving more runway for the parts that actually require judgment" },
      ]} />

      <h2 id="what-ai-cannot-do">What AI Cannot Do For You</h2>
      <p>
        This is where most AI-QoE marketing falls apart. The list of things AI <em>cannot</em> do is short, but it includes the entire reason QoE exists in the first place:
      </p>
      <BenefitGrid benefits={[
        { title: "Decide whether an addback is appropriate", description: "AI can flag a $400K consultant payment as a candidate. Whether it's truly non-recurring, or really the founder's spouse, or a pattern that will continue under new ownership — that's a judgment call" },
        { title: "Assess whether management's explanation is credible", description: "AI can transcribe a management call. It cannot tell you whether the CFO is hedging on the customer concentration question because she's nervous, or because she knows something you don't" },
        { title: "Determine whether risk is real or contained", description: "Customer churn that looks like 12% in the data might be three contracts that all renewed last week, or three customers who just got acquired and are reviewing every vendor relationship. AI sees the number. The human knows the story" },
        { title: "Conduct the diligence conversation with management", description: "QoE depends on the back-and-forth — the follow-up question to the answer to the original question. That's a human-to-human exercise, and it's where most of the real findings come from" },
        { title: "Take responsibility for the conclusion", description: "When the buyer's lender calls in six months because cash flow doesn't match what was diligenced, somebody has to answer the phone. The AI cannot. There is nobody to sue when the AI is wrong" },
      ]} />

      <p className="not-prose mb-8 border-l-4 border-primary bg-primary/5 rounded-r-lg px-6 py-5">
        <span className="text-lg font-medium text-foreground leading-relaxed">
          QoE is not about generating a report. QoE is about supporting a deal decision — and the value of that support is directly tied to the credibility of the person who stands behind it.
        </span>
      </p>

      <h2 id="assisted-vs-generated">AI-Assisted vs AI-Generated: The Distinction That Matters</h2>
      <p>
        Two phrases that sound similar describe completely different products. The difference shows up in every part of the engagement:
      </p>
      <ComparisonTable
        headers={["Question", "AI-Generated QoE", "AI-Assisted QoE"]}
        rows={[
          ["Who owns the conclusion?", "The software (effectively, no one)", "The analyst, the CPA, or the buyer"],
          ["Who reviews each adjustment?", "Nobody — the model output is the answer", "A human accepts, modifies, or rejects every adjustment"],
          ["Who handles management Q&A?", "Skipped", "The analyst, with AI-prepared question lists"],
          ["Who signs the report?", "Unsigned, or 'AI-generated' disclaimer", "The professional whose name is on it"],
          ["Defensible to a lender or court?", "No", "Yes — same standard as a traditional engagement"],
          ["What you're paying for", "Output", "Coverage, structure, and speed in service of judgment"],
        ]}
      />
      <p>
        The shorthand: AI-generated treats the software as the analyst. AI-assisted treats the software as a force multiplier for the analyst. The first one is an overpromise. The second one is what actually works.
      </p>

      <h2 id="analyst-in-the-loop">The Better Model: Analyst-in-the-Loop</h2>
      <p>
        The most useful framing we've found — for ourselves, our customers, and the CPAs we work with — is <strong>analyst-in-the-loop</strong>. The analyst is still the one driving the engagement. The AI changes what they get to start from.
      </p>
      <p>
        Instead of starting from a stack of bank statements and a blank workbook, the analyst starts from:
      </p>
      <BenefitGrid benefits={[
        { title: "Full-population review, already done", description: "Every GL line classified, every bank deposit reconciled, every anomaly queued — before the analyst opens the workbook" },
        { title: "Adjustment candidates with traced support", description: "Each candidate addback already has its matching GL lines pulled and its source documents linked. The analyst's job is to judge, not to dig" },
        { title: "A tied-out EBITDA bridge", description: "Drafted from the data, with every line drillable to the underlying transactions. The analyst stress-tests it; they don't build it from scratch" },
        { title: "A starting list of diligence questions", description: "Anomalies become questions for management. The analyst refines them and runs the call. The AI doesn't make the call" },
      ]} />
      <p>
        The result isn't a faster bad QoE. It's a <strong>better QoE done faster</strong>, because human attention gets concentrated on the parts that actually require it. <Link to="/guides/general-ledger-review">Full-population GL review</Link> instead of sampling. <Link to="/guides/ebitda-bridge">Tied-out adjustment bridges</Link> instead of pasted-in numbers. Documented audit trails on every adjustment instead of "see workpaper 3.7, ask Dave."
      </p>

      <h2 id="who-this-matters-for">Who This Matters Most For</h2>
      <p>
        Big PE shops with in-house diligence teams have always had structured workflows — they pay for them in headcount. The buyers who benefit most from AI-assisted QoE are the ones who couldn't previously access that level of rigor at all:
      </p>
      <BenefitGrid benefits={[
        { title: "Independent searchers and ETA", description: "You're reviewing 50 deals to close one. You can't pay $30K for a full QoE on every LOI. AI-assisted analysis gets you institutional-quality screening at a per-deal cost that actually scales" },
        { title: "Independent sponsors", description: "You need defensible diligence that an LP base will accept, without the overhead of a full transaction-services bench. AI-assisted analysis closes the gap" },
        { title: "SBA buyers", description: "Lender requirements keep getting tighter. You need the structure of a real QoE on a sub-$5M deal where the math on a traditional engagement doesn't work" },
        { title: "Lower-middle-market deal teams", description: "The $1–10M deal segment has always been underserved by traditional QoE pricing. AI-assisted analysis is what makes proper diligence economically viable here" },
        { title: "Lenders underwriting acquisitions", description: "You need the same coverage on a $2M loan as on a $20M loan, but the borrower can't fund a $30K QoE on a $2M deal. AI-assisted analysis closes that gap" },
        { title: "CPA firms scaling QoE practice", description: "The bottleneck on a QoE practice is usually the manager's hours. AI-assisted workflow lets the same manager oversee 2–3x more engagements without dropping quality" },
      ]} />

      <h2 id="the-real-unlock">The Real Unlock (And Our Actual Positioning)</h2>
      <p>
        Here's the thing we've come around to internally, and it's a sharper way to say what Shepi actually does:
      </p>
      <p className="not-prose mb-8 border-l-4 border-primary bg-primary/5 rounded-r-lg px-6 py-5">
        <span className="text-lg font-medium text-foreground leading-relaxed">
          Shepi is not "AI does QoE." Shepi is "AI gives every buyer a structured diligence workflow that used to require a full transaction advisory team."
        </span>
      </p>
      <p>
        That's a more honest claim, and it's a more useful one. It explains who benefits and why. It doesn't try to convince you the software replaces professional judgment — it tells you the software is what makes professional-quality judgment <em>possible</em> on deals where the traditional cost structure made it impossible.
      </p>
      <p>
        For the search fund evaluating its 40th teaser. For the SBA buyer trying to underwrite a $3M acquisition without spending 10% of equity on diligence. For the CPA firm trying to take on three more QoE engagements without hiring three more managers. <strong>That</strong> is the real unlock — not replacing professional judgment, but making real diligence accessible to buyers who previously couldn't afford it.
      </p>

      <p>
        If you want the longer, more balanced survey of where AI fits in QoE, read <Link to="/guides/can-ai-replace-qoe">Can AI Replace a Quality of Earnings Report?</Link>. If you want to see what analyst-in-the-loop actually looks like in practice, read <Link to="/features/ai-due-diligence">AI for Financial Due Diligence</Link>.
      </p>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "Can I use Shepi without a CPA?", answer: "Yes — many of our users are searchers, independent sponsors, or in-house deal teams who run the analysis themselves. The software produces lender-ready workbooks and reports. For deals where the lender or LP base specifically requires CPA attestation, you'll still want a CPA to review and sign — but they can start from your Shepi workpapers, which usually cuts their engagement time and your cost significantly." },
        { question: "Will lenders accept an AI-assisted QoE?", answer: "Most lenders care about the quality of the analysis and the credibility of who stands behind it — not whether the underlying tooling was AI-assisted. SBA lenders generally accept AI-assisted analysis when the buyer or a CPA has reviewed and signed off on the conclusions. Larger institutional lenders typically still require CPA-attested QoE; in those cases, AI-assisted analysis accelerates the CPA's work but doesn't replace it." },
        { question: "What's the actual difference between AI-generated and AI-assisted?", answer: "AI-generated: software produces a report, nobody reviews it, no human takes responsibility for the conclusion. AI-assisted: software does the data-intensive work (mapping, reconciling, anomaly detection, drafting adjustments), and a human reviews, modifies, and signs every conclusion. The second one is defensible to a lender, a court, or a buyer's investment committee. The first one is not." },
        { question: "Does this replace my QoE provider?", answer: "If your provider is doing pure data-processing work — account mapping, GL tie-outs, building schedules — then AI-assisted tooling will compress that work dramatically and you may not need them for it. If your provider is doing real diligence — interviewing management, judging adjustment validity, signing a report a lender will rely on — they're doing work AI cannot do, and you should keep using them. The right framing is usually: use AI-assisted tooling to make your provider faster and cheaper, not to eliminate them." },
        { question: "What happens if the AI is wrong about an adjustment?", answer: "This is exactly why analyst-in-the-loop matters. The AI flags candidates and drafts support. A human accepts, modifies, or rejects each one — and that human's name is on the conclusion. If an adjustment turns out to be wrong, it's wrong because a human accepted it, which is the same accountability structure as a traditional engagement. The AI is a research assistant. The analyst is the analyst." },
        { question: "Is AI-assisted QoE less rigorous than a traditional engagement?", answer: "On the data-intensive parts — population coverage, calculation consistency, audit trail — AI-assisted analysis is typically more rigorous, because the AI reviews 100% of transactions and shows its work. On the judgment-intensive parts, it's exactly as rigorous as the human running it. The combination is usually more thorough than either alone, which is why most CPA firms we talk to are adopting AI-assisted tooling rather than competing with it." },
      ]} />

      <h2>Related Resources</h2>
      <RelatedResourceCards links={[
        { to: "/guides/can-ai-replace-qoe", label: "Can AI Replace a QoE Report? (longer balanced view)" },
        { to: "/guides/ebitda-adjustments", label: "EBITDA Adjustments: Types, Examples & Best Practices" },
        { to: "/guides/general-ledger-review", label: "General Ledger Review for Due Diligence" },
        { to: "/guides/due-diligence-checklist", label: "Financial Due Diligence Checklist" },
        { to: "/use-cases/independent-searchers", label: "QoE for Independent Searchers & ETA" },
        { to: "/use-cases/lenders", label: "QoE for Lenders & SBA Lending" },
      ]} />
    </ContentPageLayout>
  );
}
