import { useEffect } from "react";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useSEO } from "@/hooks/useSEO";

export default function Terms() {
  const __seoTags = useSEO({
    title: "Terms of Service — shepi",
    description: "Read shepi's Terms of Service to understand your rights and responsibilities when using our platform.",
    canonical: "https://shepi.ai/terms",
    
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://policies.termageddon.com/api/embed/WlVSSFVtMUdLMWxXVTNkd1RXYzlQUT09.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://policies.termageddon.com/api/embed/WlVSSFVtMUdLMWxXVTNkd1RXYzlQUT09.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <LegalPageLayout title="Terms of Service">
      {__seoTags}

      <section id="professional-use" className="mb-12 rounded-lg border border-border bg-secondary/40 p-6 not-prose">
        <h2 className="text-2xl font-serif text-foreground mb-3">Professional Use by Licensed Practitioners</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Shepi-authored addendum. The general Terms of Service follow below.
        </p>
        <div className="space-y-4 text-sm text-foreground leading-relaxed">
          <p>
            If you are a CPA, accountant, financial advisor, broker, or other professional using shepi
            to produce work product for a client ("Practitioner Use"), the following terms apply in
            addition to the general Terms of Service.
          </p>
          <ol className="list-decimal list-inside space-y-3 ml-2">
            <li>
              <strong>You are the service provider to your client.</strong> shepi is a software tool
              you use in the course of your own engagement. shepi has no contractual relationship,
              privity, or engagement with your end client, and does not assume any duty to them.
            </li>
            <li>
              <strong>shepi output is not an attestation.</strong> Nothing produced through the
              platform — including the PDF report, XLSX workbook, narrative explanations, or any
              firm-branded version of the foregoing — constitutes an audit opinion, review report
              under SSARS, compilation report, or any other form of attest service. shepi is
              analytical Quality of Earnings software, not a CPA firm, and does not issue attest
              deliverables through the platform.
            </li>
            <li>
              <strong>Firm branding is presentation only.</strong> The optional firm-branding
              features (firm name, logo, "Prepared by" line on deliverables) are formatting controls
              you apply to your own work product. They do not transfer authorship, liability, or
              attestation status to or from shepi. Every deliverable retains a "Powered by shepi"
              footer.
            </li>
            <li>
              <strong>Professional responsibility stays with you.</strong> You are solely
              responsible for the accuracy, appropriateness, and professional standards applicable
              to the work product you deliver to your client, including compliance with your state
              board, the AICPA Code of Professional Conduct, applicable independence rules, and any
              firm-level quality control standards. You are responsible for your own review of
              shepi's outputs before relying on them or delivering them to a client.
            </li>
            <li>
              <strong>Indemnification.</strong> You will indemnify and hold harmless shepi and SMB
              EDGE from any claim, demand, or proceeding brought by your end client (or a third
              party claiming through your end client) arising out of or relating to your
              Practitioner Use of the platform, including claims of professional malpractice,
              breach of engagement, or unauthorized practice. This is in addition to any
              indemnification obligations in the general Terms.
            </li>
            <li>
              <strong>Acknowledgement.</strong> Enabling firm-branded output in a project requires
              a one-time in-product acknowledgement of this section. That acknowledgement is logged
              against your account and project.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground pt-2">
            This addendum is a Shepi-authored supplement to the general Terms of Service below.
            Where the two address the same subject, this addendum controls for Practitioner Use.
          </p>
        </div>
      </section>

      <div 
        id="WlVSSFVtMUdLMWxXVTNkd1RXYzlQUT09"
        className="policy_embed_div"
      >
        Please wait while the policy is loaded. If it does not load, please{" "}
        <a 
          rel="nofollow" 
          href="https://policies.termageddon.com/api/policy/WlVSSFVtMUdLMWxXVTNkd1RXYzlQUT09" 
          target="_blank"
          className="text-primary hover:underline"
        >
          click here
        </a>{" "}
        to view the policy.
      </div>

    </LegalPageLayout>
  );
}
