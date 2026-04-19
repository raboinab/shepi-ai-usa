import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useSEO } from "@/hooks/useSEO";

export default function DPA() {
  useSEO({
    title: "Data Processing Addendum — shepi",
    description:
      "shepi's Data Processing Addendum (DPA) for enterprise customers, covering UK GDPR and Canadian PIPEDA requirements.",
    canonical: "https://shepi.ai/dpa",
  });

  return (
    <LegalPageLayout title="Data Processing Addendum (DPA)">
      <div className="space-y-8">
        <p className="text-muted-foreground">
          This Data Processing Addendum (&quot;DPA&quot;) forms part of the
          agreement between SMB EDGE (&quot;Processor&quot;) and the entity
          agreeing to these terms (&quot;Controller&quot;) for the use of the
           Shepi platform. To request a signed copy, please email{" "}
          <a
            href="mailto:privacy@shepi.ai"
            className="text-primary hover:underline"
          >
            privacy@shepi.ai
          </a>
          .
        </p>

        {/* 1. Definitions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            1. Definitions
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <strong>&quot;Controller&quot;</strong> means the entity that
              determines the purposes and means of processing Personal Data.
            </li>
            <li>
              <strong>&quot;Processor&quot;</strong> means SMB EDGE, which
              processes Personal Data on behalf of the Controller.
            </li>
            <li>
              <strong>&quot;Data Subject&quot;</strong> means an identified or
              identifiable natural person whose Personal Data is processed.
            </li>
            <li>
              <strong>&quot;Personal Data&quot;</strong> means any information
              relating to a Data Subject.
            </li>
            <li>
              <strong>&quot;Sub-processor&quot;</strong> means a third party
              engaged by the Processor to process Personal Data. See our{" "}
              <a
                href="/subprocessors"
                className="text-primary hover:underline"
              >
                Subprocessors page
              </a>{" "}
              for a current list.
            </li>
          </ul>
        </section>

        {/* 2. Scope and Purpose */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. Scope and Purpose of Processing
          </h2>
          <p className="text-muted-foreground">
            The Processor shall process Personal Data only to the extent
            necessary to provide the shepi platform services as described in the
            Terms of Service, and in accordance with the Controller&apos;s
            documented instructions.
          </p>
        </section>

        {/* 3. Processor Obligations */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. Processor Obligations
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              Process Personal Data only on documented instructions from the
              Controller.
            </li>
            <li>
              Ensure that persons authorized to process Personal Data have
              committed to confidentiality.
            </li>
            <li>
              Implement appropriate technical and organizational security
              measures, including encryption at rest and in transit, access
              controls, and regular security assessments.
            </li>
            <li>
              Not engage another processor (sub-processor) without prior
              written authorization of the Controller. The current list of
              approved sub-processors is maintained at{" "}
              <a
                href="/subprocessors"
                className="text-primary hover:underline"
              >
                shepi.ai/subprocessors
              </a>
              .
            </li>
            <li>
              Assist the Controller in responding to requests from Data Subjects
              exercising their rights.
            </li>
            <li>
              Delete or return all Personal Data at the end of the service
              relationship, at the Controller&apos;s choice.
            </li>
            <li>
              Make available to the Controller all information necessary to
              demonstrate compliance with these obligations.
            </li>
          </ul>
        </section>

        {/* 4. Data Subject Rights */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. Data Subject Rights
          </h2>
          <p className="text-muted-foreground">
            The Processor shall assist the Controller, by appropriate technical
            and organizational measures, in fulfilling obligations to respond to
            Data Subject requests including access, rectification, erasure,
            restriction, portability, and objection.
          </p>
        </section>

        {/* 5. International Transfers */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. International Data Transfers
          </h2>
          <p className="text-muted-foreground">
            Where Personal Data is transferred outside the United Kingdom or the
            European Economic Area, the Processor shall ensure that appropriate
            safeguards are in place, including the use of Standard Contractual
            Clauses (SCCs) as approved by the relevant authorities, or other
            lawful transfer mechanisms.
          </p>
        </section>

        {/* 6. Data Retention and Deletion */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            6. Data Retention and Deletion
          </h2>
          <p className="text-muted-foreground">
            The Processor shall retain Personal Data only for as long as
            necessary to fulfill the purposes of processing. Upon termination
            of the agreement or upon the Controller&apos;s request, the
            Processor shall securely delete or return all Personal Data within
            30 days, unless retention is required by applicable law.
          </p>
        </section>

        {/* 7. Audit Rights */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            7. Audit Rights
          </h2>
          <p className="text-muted-foreground">
            The Processor shall allow for and contribute to audits, including
            inspections, conducted by the Controller or an auditor mandated by
            the Controller, with reasonable notice. Audit requests should be
            directed to{" "}
            <a
              href="mailto:privacy@shepi.ai"
              className="text-primary hover:underline"
            >
              privacy@shepi.ai
            </a>
            .
          </p>
        </section>

        {/* 8. UK GDPR Provisions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            8. UK GDPR Specific Provisions
          </h2>
          <p className="text-muted-foreground">
            For processing subject to the UK General Data Protection Regulation
            (UK GDPR), this DPA incorporates the International Data Transfer
            Addendum to the EU Standard Contractual Clauses as issued by the UK
            Information Commissioner&apos;s Office (ICO). The Processor commits
            to cooperating with the ICO and honoring the rights of UK Data
            Subjects.
          </p>
        </section>

        {/* 9. Canadian PIPEDA Provisions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            9. Canadian PIPEDA Specific Provisions
          </h2>
          <p className="text-muted-foreground">
            For processing subject to the Personal Information Protection and
            Electronic Documents Act (PIPEDA), the Processor shall ensure that
            Personal Data of Canadian residents is handled in accordance with
            PIPEDA&apos;s ten fair information principles, including
            accountability, consent, limiting collection, limiting use, and
            safeguards. The Processor shall notify the Controller of any breach
            of security safeguards involving Personal Data of Canadian residents
            as required under PIPEDA.
          </p>
        </section>

        {/* 10. Contact */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            10. Contact Information
          </h2>
          <p className="text-muted-foreground">
            To execute this DPA or for any questions regarding data processing,
            please contact us at{" "}
            <a
              href="mailto:privacy@shepi.ai"
              className="text-primary hover:underline"
            >
              privacy@shepi.ai
            </a>
            .
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8">
          <strong>Last updated:</strong> February 22, 2026
        </p>
      </div>
    </LegalPageLayout>
  );
}
