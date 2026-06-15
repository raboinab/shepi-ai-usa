import { Link } from "react-router-dom";
import { ContentPageLayout } from "@/components/ContentPageLayout";
import { HeroCallout } from "@/components/content/HeroCallout";
import { BenefitGrid } from "@/components/content/BenefitGrid";
import { StepList } from "@/components/content/StepList";

const toc = [
  { id: "scope", label: "Scope" },
  { id: "report", label: "How to Report" },
  { id: "safe-harbor", label: "Safe Harbor" },
  { id: "response", label: "What to Expect" },
  { id: "recognition", label: "Recognition" },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Responsible Disclosure Policy",
  description: "How to responsibly report a security vulnerability in Shepi, what's in and out of scope, our safe-harbor commitment, and response SLAs.",
  url: "https://shepi.ai/security/responsible-disclosure",
};

export default function ResponsibleDisclosure() {
  return (
    <ContentPageLayout
      title="Responsible Disclosure"
      seoTitle="Responsible Disclosure Policy | Shepi Security"
      seoDescription="Report a security vulnerability in Shepi. Scope, safe-harbor commitment, response SLAs, and contact details for our security team."
      canonical="https://shepi.ai/security/responsible-disclosure"
      breadcrumbs={[
        { label: "Security", href: "/security" },
        { label: "Responsible Disclosure" },
      ]}
      toc={toc}
      jsonLd={webPageSchema}
      heroAccent
      ogType="website"
    >
      <HeroCallout>
        If you've found a security issue in Shepi, we want to hear about it. This page explains what's in scope, how to report, and the commitments we make to researchers who report responsibly.
      </HeroCallout>

      <h2 id="scope">Scope</h2>
      <BenefitGrid benefits={[
        { title: "In scope", description: "shepi.ai and all subdomains, the Shepi web application, edge functions exposed under our Supabase project, and the accounting integration flow." },
        { title: "Out of scope", description: "Findings against third-party services (Supabase, Stripe, Vercel), social engineering of Shepi staff or customers, physical attacks, denial-of-service testing, and automated scanner output without a working proof-of-concept." },
        { title: "Not a vulnerability", description: "Missing security headers without a demonstrated impact, rate-limit observations, version disclosure, missing CSP on marketing pages, and self-XSS in your own session." },
        { title: "Already known", description: "Issues already disclosed publicly or already fixed in a deployed release are out of scope for recognition." },
      ]} />

      <h2 id="report">How to Report</h2>
      <p>
        Email <a href="mailto:hello@shepi.ai">hello@shepi.ai</a> with:
      </p>
      <ul>
        <li>A description of the issue and its impact.</li>
        <li>Steps to reproduce, ideally with a short proof of concept.</li>
        <li>Any logs, screenshots, or video showing the issue.</li>
        <li>The account or test environment you used (please don't test against other customers' data).</li>
      </ul>
      <p>
        A PGP key is available on request. Please do not file vulnerability reports through our support form, GitHub issues, or public social channels.
      </p>

      <h2 id="safe-harbor">Safe Harbor</h2>
      <p>
        We won't pursue legal action against researchers who, in good faith, follow this policy. Specifically, we will not initiate or support claims under the CFAA, DMCA, or equivalent laws for research that:
      </p>
      <ul>
        <li>Sticks to accounts and data you own, or test accounts you've created.</li>
        <li>Avoids degrading service availability for other customers.</li>
        <li>Does not exfiltrate or retain customer data beyond the minimum needed to demonstrate the issue.</li>
        <li>Gives us a reasonable window to remediate before any public disclosure (we suggest 90 days; we'll talk if more time is needed).</li>
      </ul>
      <p>
        If a third party brings a claim against you for activity that complied with this policy, we'll make our position public.
      </p>

      <h2 id="response">What to Expect</h2>
      <StepList steps={[
        { title: "Acknowledgement within 3 business days", description: "We confirm receipt and assign an internal owner." },
        { title: "Status update within 10 business days", description: "Triage outcome: confirmed / not reproducible / out of scope, with reasoning." },
        { title: "Fix and disclosure timeline", description: "We share a target remediation window. Critical issues are usually patched within 7 days; lower-severity items roll into the next scheduled release." },
        { title: "Public disclosure", description: "Coordinated with you. We default to a brief writeup once the fix is deployed, crediting you if you'd like." },
      ]} />

      <h2 id="recognition">Recognition</h2>
      <p>
        We don't run a paid bug bounty today. We do publicly credit researchers (with your permission) on a hall-of-fame section we'll publish once we have entries to list. If your finding is material, we'll also send a small thank-you of our choice — said honestly, this is not a structured payout program.
      </p>
      <p>
        Questions about this policy: <a href="mailto:hello@shepi.ai">hello@shepi.ai</a>. For everything else security-related, start at the <Link to="/security">Trust Center</Link>.
      </p>
    </ContentPageLayout>
  );
}
