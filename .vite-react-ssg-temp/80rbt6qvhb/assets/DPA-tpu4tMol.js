import { jsxs, jsx } from "react/jsx-runtime";
import { L as LegalPageLayout } from "./LegalPageLayout-B8Jk9rBM.js";
import { u as useSEO } from "../main.mjs";
import "react-router-dom";
import "lucide-react";
import "vite-react-ssg";
import "react";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
function DPA() {
  const __seoTags = useSEO({
    title: "Data Processing Addendum — shepi",
    description: "shepi's Data Processing Addendum (DPA) for enterprise customers, covering UK GDPR and Canadian PIPEDA requirements.",
    canonical: "https://shepi.ai/dpa"
  });
  return /* @__PURE__ */ jsxs(LegalPageLayout, { title: "Data Processing Addendum (DPA)", children: [
    __seoTags,
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
        'This Data Processing Addendum ("DPA") forms part of the agreement between SMB EDGE ("Processor") and the entity agreeing to these terms ("Controller") for the use of the Shepi platform. To request a signed copy, please email',
        " ",
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "mailto:privacy@shepi.ai",
            className: "text-primary hover:underline",
            children: "privacy@shepi.ai"
          }
        ),
        "."
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "1. Definitions" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 space-y-2 text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: '"Controller"' }),
            " means the entity that determines the purposes and means of processing Personal Data."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: '"Processor"' }),
            " means SMB EDGE, which processes Personal Data on behalf of the Controller."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: '"Data Subject"' }),
            " means an identified or identifiable natural person whose Personal Data is processed."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: '"Personal Data"' }),
            " means any information relating to a Data Subject."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: '"Sub-processor"' }),
            " means a third party engaged by the Processor to process Personal Data. See our",
            " ",
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/subprocessors",
                className: "text-primary hover:underline",
                children: "Subprocessors page"
              }
            ),
            " ",
            "for a current list."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "2. Scope and Purpose of Processing" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "The Processor shall process Personal Data only to the extent necessary to provide the shepi platform services as described in the Terms of Service, and in accordance with the Controller's documented instructions." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "3. Processor Obligations" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 space-y-2 text-muted-foreground", children: [
          /* @__PURE__ */ jsx("li", { children: "Process Personal Data only on documented instructions from the Controller." }),
          /* @__PURE__ */ jsx("li", { children: "Ensure that persons authorized to process Personal Data have committed to confidentiality." }),
          /* @__PURE__ */ jsx("li", { children: "Implement appropriate technical and organizational security measures, including encryption at rest and in transit, access controls, and regular security assessments." }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Not engage another processor (sub-processor) without prior written authorization of the Controller. The current list of approved sub-processors is maintained at",
            " ",
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/subprocessors",
                className: "text-primary hover:underline",
                children: "shepi.ai/subprocessors"
              }
            ),
            "."
          ] }),
          /* @__PURE__ */ jsx("li", { children: "Assist the Controller in responding to requests from Data Subjects exercising their rights." }),
          /* @__PURE__ */ jsx("li", { children: "Delete or return all Personal Data at the end of the service relationship, at the Controller's choice." }),
          /* @__PURE__ */ jsx("li", { children: "Make available to the Controller all information necessary to demonstrate compliance with these obligations." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "4. Data Subject Rights" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "The Processor shall assist the Controller, by appropriate technical and organizational measures, in fulfilling obligations to respond to Data Subject requests including access, rectification, erasure, restriction, portability, and objection." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "5. International Data Transfers" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Where Personal Data is transferred outside the United Kingdom or the European Economic Area, the Processor shall ensure that appropriate safeguards are in place, including the use of Standard Contractual Clauses (SCCs) as approved by the relevant authorities, or other lawful transfer mechanisms." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "6. Data Retention and Deletion" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "The Processor shall retain Personal Data only for as long as necessary to fulfill the purposes of processing. Upon termination of the agreement or upon the Controller's request, the Processor shall securely delete or return all Personal Data within 30 days, unless retention is required by applicable law." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "7. Audit Rights" }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "The Processor shall allow for and contribute to audits, including inspections, conducted by the Controller or an auditor mandated by the Controller, with reasonable notice. Audit requests should be directed to",
          " ",
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "mailto:privacy@shepi.ai",
              className: "text-primary hover:underline",
              children: "privacy@shepi.ai"
            }
          ),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "8. UK GDPR Specific Provisions" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "For processing subject to the UK General Data Protection Regulation (UK GDPR), this DPA incorporates the International Data Transfer Addendum to the EU Standard Contractual Clauses as issued by the UK Information Commissioner's Office (ICO). The Processor commits to cooperating with the ICO and honoring the rights of UK Data Subjects." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "9. Canadian PIPEDA Specific Provisions" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "For processing subject to the Personal Information Protection and Electronic Documents Act (PIPEDA), the Processor shall ensure that Personal Data of Canadian residents is handled in accordance with PIPEDA's ten fair information principles, including accountability, consent, limiting collection, limiting use, and safeguards. The Processor shall notify the Controller of any breach of security safeguards involving Personal Data of Canadian residents as required under PIPEDA." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground mb-3", children: "10. Contact Information" }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "To execute this DPA or for any questions regarding data processing, please contact us at",
          " ",
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "mailto:privacy@shepi.ai",
              className: "text-primary hover:underline",
              children: "privacy@shepi.ai"
            }
          ),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-8", children: [
        /* @__PURE__ */ jsx("strong", { children: "Last updated:" }),
        " February 22, 2026"
      ] })
    ] })
  ] });
}
export {
  DPA as default
};
