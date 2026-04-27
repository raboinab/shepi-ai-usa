import { jsxs, jsx } from "react/jsx-runtime";
import { L as LegalPageLayout } from "./LegalPageLayout-B8Jk9rBM.js";
import { u as useSEO } from "../main.mjs";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
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
const subprocessors = [
  {
    name: "Lovable Cloud",
    purpose: "Database, authentication, file storage, backend functions",
    dataProcessed: "All user and project data",
    location: "United States"
  },
  {
    name: "Stripe",
    purpose: "Payment processing",
    dataProcessed: "Billing information, email address",
    location: "United States"
  },
  {
    name: "Google AI (Gemini)",
    purpose: "AI-assisted financial analysis",
    dataProcessed: "Financial data sent for analysis",
    location: "United States"
  },
  {
    name: "OpenAI (GPT)",
    purpose: "AI-assisted financial analysis",
    dataProcessed: "Financial data sent for analysis",
    location: "United States"
  },
  {
    name: "Termageddon",
    purpose: "Legal policy hosting",
    dataProcessed: "None (policies only)",
    location: "United States"
  },
  {
    name: "Usercentrics",
    purpose: "Cookie consent management",
    dataProcessed: "Cookie preferences, IP address",
    location: "Germany (EU)"
  }
];
function Subprocessors() {
  const __seoTags = useSEO({
    title: "Subprocessors — shepi",
    description: "List of third-party subprocessors that shepi uses to deliver its services, including their purposes and data processing locations.",
    canonical: "https://shepi.ai/subprocessors"
  });
  return /* @__PURE__ */ jsxs(LegalPageLayout, { title: "Subprocessors", children: [
    __seoTags,
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: "shepi (operated by SMB EDGE) uses the following third-party subprocessors to deliver and support our services. This page is maintained in accordance with our obligations under applicable data protection laws, including the UK GDPR and Canadian PIPEDA." }),
    /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Subprocessor" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Purpose" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Data Processed" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Location" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: subprocessors.map((sp) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: sp.name }),
        /* @__PURE__ */ jsx(TableCell, { children: sp.purpose }),
        /* @__PURE__ */ jsx(TableCell, { children: sp.dataProcessed }),
        /* @__PURE__ */ jsx(TableCell, { children: sp.location })
      ] }, sp.name)) })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-8", children: [
      /* @__PURE__ */ jsx("strong", { children: "Last updated:" }),
      " February 22, 2026"
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-4", children: [
      "If you have questions about our subprocessors, please contact us at",
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
  ] });
}
export {
  Subprocessors as default
};
