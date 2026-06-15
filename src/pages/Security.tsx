import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { StatRow } from "@/components/content/StatRow";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { StepList } from "@/components/content/StepList";
import { AccordionFAQ } from "@/components/content/AccordionFAQ";
import { RelatedResourceCards } from "@/components/content/RelatedResourceCards";

const toc = [
  { id: "at-a-glance", label: "At a Glance" },
  { id: "data-handling", label: "Data Handling" },
  { id: "auth", label: "Authentication & Access" },
  { id: "ai", label: "AI & Customer Data" },
  { id: "infra", label: "Infrastructure" },
  { id: "gaps", label: "What We Don't Have Yet" },
  { id: "roadmap", label: "Roadmap" },
  { id: "contact", label: "Contact" },
  { id: "faq", label: "FAQ" },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Shepi Trust Center",
  description:
    "How Shepi handles customer financial data: encryption, isolation, QuickBooks OAuth scopes, retention, and what we don't have in place yet.",
  url: "https://shepi.ai/security",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Shepi SOC 2 certified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not yet. We are scoping SOC 2 Type I and will publish the report once it's complete. In the meantime, this Trust Center page is an honest description of the controls that are actually in place today.",
      },
    },
    {
      "@type": "Question",
      name: "Where is customer data stored?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Customer data is stored in a Postgres database hosted by Supabase on AWS infrastructure in the United States. Uploaded documents are stored in Supabase Storage in the same region.",
      },
    },
    {
      "@type": "Question",
      name: "Does Shepi use my data to train AI models?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. LLM calls route through the Vercel AI Gateway under a zero-data-retention agreement. Upstream model providers (Anthropic, OpenAI) process requests as sub-processors under the same no-retention terms. Your data is not used to train any model.",
      },
    },
    {
      "@type": "Question",
      name: "What QuickBooks permissions does Shepi request?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Read-only OAuth scopes for the accounting data we need to produce a Quality of Earnings analysis. Shepi never writes back to QuickBooks. You can disconnect the integration at any time from your account settings.",
      },
    },
    {
      "@type": "Question",
      name: "Can I delete my data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can delete a project and its uploaded documents from the dashboard at any time. For account-level deletion or a full data export, email security@shepi.ai and we will process the request within 30 days.",
      },
    },
  ],
};

export default function Security() {
  return (
    <ContentPageLayout
      title="Trust Center"
      seoTitle="Trust Center — Security & Data Handling | Shepi"
      seoDescription="How Shepi handles customer financial data: TLS, AES-256, per-deal RLS isolation, read-only QuickBooks OAuth, and an honest list of what we don't have yet."
      canonical="https://shepi.ai/security"
      breadcrumbs={[{ label: "Security" }]}
      toc={toc}
      jsonLd={[webPageSchema, faqSchema]}
      heroAccent
      ogType="website"
    >
      <HeroCallout>
        Built for diligence-grade data. Shepi handles seller financials, bank statements, and QuickBooks data with the controls a PE associate or SBA lender expects — and this page is an honest description of what's actually in place today, not marketing puffery.
      </HeroCallout>

      <h2 id="at-a-glance">At a Glance</h2>
      <StatRow stats={[
        { value: "TLS 1.2+", label: "In transit" },
        { value: "AES-256", label: "At rest" },
        { value: "Per-deal RLS", label: "Tenant isolation" },
        { value: "Read-only", label: "QuickBooks OAuth scopes" },
      ]} />

      <h2 id="data-handling">Data Handling</h2>
      <p>
        Customer data lives in a Postgres database hosted by Supabase on AWS infrastructure in the United States. Uploaded documents (bank statements, GLs, payroll, contracts) are stored in Supabase Storage in the same region. All traffic between your browser, our edge functions, and the database is encrypted in transit with TLS 1.2 or higher; storage at rest is AES-256.
      </p>
      <BenefitGrid benefits={[
        { title: "What we collect", description: "Account email, organization name, billing details, the financial documents you upload, and the GL/bank data fetched from QuickBooks once you connect it." },
        { title: "Where it lives", description: "Postgres on Supabase, US region. Documents in Supabase Storage, US region. No copies in third-party drives." },
        { title: "Retention defaults", description: "Project data is retained for the life of the account so you can re-open historical deals. You can delete a project and its documents from the dashboard at any time." },
        { title: "Customer-initiated deletion", description: "Project delete is one click. For full account deletion or a data export, email security@shepi.ai — handled within 30 days." },
      ]} />

      <h2 id="auth">Authentication & Access</h2>
      <p>
        Authentication is handled by Supabase Auth (email/password with optional Google OAuth). Inside the database, every customer-facing table uses Postgres Row Level Security so a request scoped to your session only sees rows owned by your account or projects you've been invited to.
      </p>
      <BenefitGrid benefits={[
        { title: "Per-deal isolation", description: "RLS policies key off the authenticated user ID for every read and write. There is no \"read all\" path from the client." },
        { title: "Role separation", description: "Deal owner, invited collaborator, CPA reviewer (on DFY engagements), and platform admin are distinct roles enforced in a dedicated user_roles table — never on the profile record." },
        { title: "Session handling", description: "JWTs issued by Supabase Auth, short-lived access tokens with refresh rotation. Sign-out invalidates the session client-side and the refresh token server-side." },
        { title: "Password reset", description: "Self-service via emailed signed link. We never see or store plaintext passwords." },
      ]} />

      <h2 id="ai">AI & Customer Data</h2>
      <p>
        Shepi uses large language models to parse documents, classify GL entries, and draft narrative sections. All LLM calls route through the Vercel AI Gateway under a zero-data-retention agreement. Upstream model providers — currently Anthropic Claude and OpenAI — process those requests as sub-processors under the same no-retention terms. Your data is not used to train any model.
      </p>
      <p>
        Extracted fields and AI-generated drafts are stored against your deal record so you can review, override, and audit them. CPA review (on DFY engagements) is human-in-the-loop on the adjustments before any export.
      </p>

      <h2 id="infra">Infrastructure</h2>
      <BenefitGrid benefits={[
        { title: "Hosting", description: "Front end on Lovable's edge network. Database, auth, storage, and edge functions on Supabase (AWS US)." },
        { title: "Backups", description: "Daily automated database backups managed by Supabase with point-in-time recovery on the production plan." },
        { title: "Logging & monitoring", description: "Edge function logs and database query logs retained in Supabase. Errors surfaced to the engineering team in real time." },
        { title: "Subprocessors", description: <>Full list at <Link to="/subprocessors">/subprocessors</Link> — who has access to what, and why.</> as unknown as string },
      ]} />

      <h2 id="gaps">What We Don't Have Yet</h2>
      <p>
        Overclaiming on security is a bigger risk than underclaiming, so here's the honest list of what we have <em>not</em> shipped:
      </p>
      <ul>
        <li><strong>No SOC 2 report.</strong> Type I is on the roadmap below; we will publish the report when it's signed, not before.</li>
        <li><strong>No third-party penetration test report.</strong> We do internal review on every release; an external annual pen test is on the roadmap.</li>
        <li><strong>No HIPAA, PCI, or FedRAMP coverage.</strong> Shepi is not designed for protected health information, cardholder data, or federal-government workloads.</li>
        <li><strong>No SAML SSO.</strong> Email/password and Google OAuth today. SAML for DFY accounts is on the roadmap.</li>
        <li><strong>No published bug bounty payouts.</strong> We credit researchers on the responsible-disclosure page; cash bounties are not in place yet.</li>
      </ul>

      <h2 id="roadmap">Roadmap</h2>
      <p>
        These are goals, not commitments — dates will move as the business does. We publish this list so prospects can see direction.
      </p>
      <StepList steps={[
        { title: "SOC 2 Type I scoping", description: "Auditor selection and control mapping underway. Targeting a Type I report within 12 months, then Type II 6–12 months after." },
        { title: "Annual third-party penetration test", description: "External pen test on a fixed annual cadence, with a summary letter available to enterprise prospects under NDA." },
        { title: "SAML SSO for DFY accounts", description: "Okta / Azure AD / Google Workspace SAML for accounts on the DFY tier." },
        { title: "In-app data export", description: "Self-serve export of all deal data (workbook + uploaded docs + AI extractions) without contacting support." },
      ]} />

      <h2 id="contact">Contact</h2>
      <p>
        Security questions, DPA requests, or vendor questionnaires: <a href="mailto:security@shepi.ai">security@shepi.ai</a>. To report a vulnerability, see the <Link to="/security/responsible-disclosure">responsible disclosure policy</Link>.
      </p>

      <h2 id="faq">Frequently Asked Questions</h2>
      <AccordionFAQ items={[
        { question: "Is Shepi SOC 2 certified?", answer: "Not yet. We're scoping SOC 2 Type I and will publish the report once it's complete. This page is an honest description of the controls in place today." },
        { question: "Where is customer data stored?", answer: "Postgres database hosted by Supabase on AWS infrastructure in the United States. Uploaded documents live in Supabase Storage in the same region." },
        { question: "Does Shepi use my data to train AI models?", answer: "No. LLM calls route through the Vercel AI Gateway under a zero-data-retention agreement. Upstream model providers process requests as sub-processors under the same no-retention terms." },
        { question: "What QuickBooks permissions does Shepi request?", answer: "Read-only OAuth scopes for the accounting data needed to produce a Quality of Earnings analysis. Shepi never writes back to QuickBooks. You can disconnect at any time." },
        { question: "Can I delete my data?", answer: "Yes. Delete a project and its uploaded documents from the dashboard at any time. For full account deletion or a data export, email security@shepi.ai — handled within 30 days." },
        { question: "Do you sign DPAs?", answer: "Yes. Our standard DPA is summarized at /dpa. For a counter-signed copy, email security@shepi.ai." },
      ]} />

      <h2>Related</h2>
      <RelatedResourceCards links={[
        { to: "/subprocessors", label: "Subprocessors" },
        { to: "/dpa", label: "Data Processing Addendum" },
        { to: "/security/responsible-disclosure", label: "Responsible Disclosure Policy" },
        { to: "/privacy", label: "Privacy Policy" },
      ]} />
    </ContentPageLayout>
  );
}
