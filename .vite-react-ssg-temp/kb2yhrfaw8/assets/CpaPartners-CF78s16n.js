import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { L as LegalPageLayout } from "./LegalPageLayout-B8Jk9rBM.js";
import { v as useToast, B as Button, s as supabase, u as useSEO } from "../main.mjs";
import { CheckCircle2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { I as Input } from "./input-RFtselAh.js";
import { L as Label } from "./label-DiNTC6Nb.js";
import { T as Textarea } from "./textarea-AMc2tKlb.js";
import { C as Checkbox } from "./checkbox-CNynTpZY.js";
import "vite-react-ssg";
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
import "@radix-ui/react-label";
import "@radix-ui/react-checkbox";
const schema = z.object({
  full_name: z.string().trim().min(1, "Required").max(200),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(64).optional().or(z.literal("")),
  state_of_licensure: z.string().trim().min(2, "Required").max(64),
  license_number: z.string().trim().min(1, "Required").max(100),
  years_experience: z.string().trim().optional().refine((v) => !v || /^\d+$/.test(v) && Number(v) <= 80, "0-80"),
  firm_affiliation: z.string().trim().max(200).optional().or(z.literal("")),
  side_work_permitted: z.boolean().optional(),
  qoe_background: z.string().trim().max(4e3).optional().or(z.literal("")),
  conflicts_disclosure: z.string().trim().max(4e3).optional().or(z.literal("")),
  linkedin_url: z.string().trim().max(500).optional().or(z.literal("")),
  referral_source: z.string().trim().max(500).optional().or(z.literal(""))
});
const initial = {
  full_name: "",
  email: "",
  phone: "",
  state_of_licensure: "",
  license_number: "",
  years_experience: "",
  firm_affiliation: "",
  side_work_permitted: false,
  qoe_background: "",
  conflicts_disclosure: "",
  linkedin_url: "",
  referral_source: ""
};
function CpaApplicationForm() {
  const { toast } = useToast();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const e2 = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) e2[String(issue.path[0])] = issue.message;
      }
      setErrors(e2);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...parsed.data,
        years_experience: parsed.data.years_experience ? Number(parsed.data.years_experience) : null
      };
      const { data, error } = await supabase.functions.invoke(
        "submit-cpa-application",
        { body: payload }
      );
      if (error || data && data.error) {
        throw new Error(data?.error || error?.message || "Submission failed");
      }
      setDone(true);
      toast({
        title: "Application received",
        description: "We'll come back within 3 business days."
      });
    } catch (err) {
      toast({
        title: "Couldn't submit",
        description: err?.message ?? "Please try again or email partners@shepi.ai.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }
  if (done) {
    return /* @__PURE__ */ jsxs("div", { className: "not-prose rounded-lg border border-border bg-muted/30 p-6 flex gap-4", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-6 h-6 text-primary flex-shrink-0 mt-1" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-1", children: "Application received" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Thanks. We'll review and come back within 3 business days. If you have anything to add, just reply to the confirmation email." })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit, className: "not-prose space-y-5 rounded-lg border border-border bg-card p-6", noValidate: true, children: [
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsx(Field, { label: "Full name", required: true, error: errors.full_name, children: /* @__PURE__ */ jsx(Input, { value: form.full_name, onChange: (e) => set("full_name", e.target.value), maxLength: 200 }) }),
      /* @__PURE__ */ jsx(Field, { label: "Email", required: true, error: errors.email, children: /* @__PURE__ */ jsx(Input, { type: "email", value: form.email, onChange: (e) => set("email", e.target.value), maxLength: 255 }) }),
      /* @__PURE__ */ jsx(Field, { label: "State of licensure", required: true, error: errors.state_of_licensure, children: /* @__PURE__ */ jsx(Input, { placeholder: "e.g. TX", value: form.state_of_licensure, onChange: (e) => set("state_of_licensure", e.target.value), maxLength: 64 }) }),
      /* @__PURE__ */ jsx(Field, { label: "License number", required: true, error: errors.license_number, children: /* @__PURE__ */ jsx(Input, { value: form.license_number, onChange: (e) => set("license_number", e.target.value), maxLength: 100 }) }),
      /* @__PURE__ */ jsx(Field, { label: "Years of experience", error: errors.years_experience, children: /* @__PURE__ */ jsx(Input, { inputMode: "numeric", value: form.years_experience ?? "", onChange: (e) => set("years_experience", e.target.value), maxLength: 2 }) }),
      /* @__PURE__ */ jsx(Field, { label: "Phone (optional)", error: errors.phone, children: /* @__PURE__ */ jsx(Input, { value: form.phone ?? "", onChange: (e) => set("phone", e.target.value), maxLength: 64 }) }),
      /* @__PURE__ */ jsx(Field, { label: "Current firm (if any)", error: errors.firm_affiliation, children: /* @__PURE__ */ jsx(Input, { value: form.firm_affiliation ?? "", onChange: (e) => set("firm_affiliation", e.target.value), maxLength: 200 }) }),
      /* @__PURE__ */ jsx(Field, { label: "LinkedIn URL", error: errors.linkedin_url, children: /* @__PURE__ */ jsx(Input, { placeholder: "https://linkedin.com/in/…", value: form.linkedin_url ?? "", onChange: (e) => set("linkedin_url", e.target.value), maxLength: 500 }) })
    ] }),
    /* @__PURE__ */ jsx(Field, { label: "Short note on your QoE / transaction-services background", error: errors.qoe_background, children: /* @__PURE__ */ jsx(
      Textarea,
      {
        rows: 4,
        value: form.qoe_background ?? "",
        onChange: (e) => set("qoe_background", e.target.value),
        maxLength: 4e3,
        placeholder: "A few sentences on the kind of QoE work you've done — deal sizes, industries, sell-side vs buy-side."
      }
    ) }),
    /* @__PURE__ */ jsx(Field, { label: "Independence conflicts you'd want to flag", error: errors.conflicts_disclosure, children: /* @__PURE__ */ jsx(
      Textarea,
      {
        rows: 3,
        value: form.conflicts_disclosure ?? "",
        onChange: (e) => set("conflicts_disclosure", e.target.value),
        maxLength: 4e3,
        placeholder: "Industries, firms, or types of engagements you'd need to decline."
      }
    ) }),
    /* @__PURE__ */ jsx(Field, { label: "How did you hear about us? (optional)", error: errors.referral_source, children: /* @__PURE__ */ jsx(Input, { value: form.referral_source ?? "", onChange: (e) => set("referral_source", e.target.value), maxLength: 500 }) }),
    /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-3 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(
        Checkbox,
        {
          checked: !!form.side_work_permitted,
          onCheckedChange: (v) => set("side_work_permitted", v === true),
          className: "mt-0.5"
        }
      ),
      /* @__PURE__ */ jsx("span", { children: "I've confirmed that side work through shepi is permitted by my current employer, or I'm independent." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-2", children: [
      /* @__PURE__ */ jsx(Button, { type: "submit", size: "lg", disabled: submitting, children: submitting ? "Submitting…" : "Submit application" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "We respond within 3 business days." })
    ] })
  ] });
}
function Field({
  label,
  required,
  error,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxs(Label, { className: "text-sm", children: [
      label,
      required && /* @__PURE__ */ jsx("span", { className: "text-destructive ml-0.5", children: "*" })
    ] }),
    children,
    error && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: error })
  ] });
}
const howItWorks = [
  {
    n: "1",
    title: "Apply and get verified.",
    body: "License check, background, brief interview. We're selective — typical admission rate around 5–10%."
  },
  {
    n: "2",
    title: "Pick up engagements you want.",
    body: "Browse open DFY projects in our queue. Accept the ones that fit your schedule and clear your conflict screen. No quotas, no exclusivity."
  },
  {
    n: "3",
    title: "Do the work, sign it, get paid.",
    body: "Use shepi's software to do the mechanical lifting. Bring your professional judgment. Sign the deliverable in your professional capacity. We handle billing and pay you per engagement."
  }
];
const whatYouGet = [
  "Quality deals routed to you (we vet Clients before they reach you)",
  "Software that handles the keystroke work — focus on judgment, not data entry",
  "Predictable per-engagement payment, paid promptly after completion",
  "Your workpapers stay yours, downloadable anytime, forever",
  "Direct CPA-to-Client communication — no gatekeeping"
];
const whatWeAsk = [
  "Active, unrestricted CPA license in any US state",
  "You carry your own professional liability (E&O) coverage as required by your state board or employer",
  "If you have a day job at a CPA firm: you've checked that side work is permitted (or you're independent)",
  "You disclose independence conflicts before accepting any engagement",
  "You meet our response time and quality standards (we'll show you what those are at onboarding)"
];
function CpaPartners() {
  const __seoTags = useSEO({
    title: "Join the shepi Network — CPA Partners",
    description: "shepi connects licensed CPAs with M&A deal teams that need Quality of Earnings analyses. Stay independent, set your hours, put your license on real work — with software that handles the mechanical heavy lifting.",
    canonical: "https://shepi.ai/cpa-partners"
  });
  return /* @__PURE__ */ jsxs(LegalPageLayout, { title: "A modern way to pick up QoE work.", children: [
    __seoTags,
    /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-10", children: "shepi connects licensed CPAs with M&A deal teams that need Quality of Earnings analyses. You stay independent, set your hours, and put your license on real work — with software that handles the mechanical heavy lifting." }),
    /* @__PURE__ */ jsx("div", { className: "not-prose mb-12", children: /* @__PURE__ */ jsx(Button, { asChild: true, size: "lg", children: /* @__PURE__ */ jsx("a", { href: "#apply", children: "Apply to the shepi Network" }) }) }),
    /* @__PURE__ */ jsx("h2", { children: "How it works" }),
    /* @__PURE__ */ jsx("ol", { className: "not-prose space-y-6 my-8", children: howItWorks.map((step) => /* @__PURE__ */ jsxs("li", { className: "flex gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold", children: step.n }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground mb-1", children: step.title }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: step.body })
      ] })
    ] }, step.n)) }),
    /* @__PURE__ */ jsx("h2", { children: "What you get" }),
    /* @__PURE__ */ jsx("ul", { className: "not-prose space-y-3 my-6", children: whatYouGet.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-primary flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsx("span", { className: "text-foreground", children: item })
    ] }, item)) }),
    /* @__PURE__ */ jsx("h2", { children: "What we ask" }),
    /* @__PURE__ */ jsx("ul", { className: "not-prose space-y-3 my-6", children: whatWeAsk.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-primary flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsx("span", { className: "text-foreground", children: item })
    ] }, item)) }),
    /* @__PURE__ */ jsx("h2", { id: "apply", children: "Apply" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: "Tell us a bit about you. We'll review and come back within 3 business days." }),
    /* @__PURE__ */ jsx(CpaApplicationForm, {}),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-10", children: [
      "Questions before applying? Email",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:partners@shepi.ai", className: "text-primary hover:underline", children: "partners@shepi.ai" }),
      " ",
      "or read our ",
      /* @__PURE__ */ jsx(Link, { to: "/compare/ai-qoe-vs-traditional", className: "text-primary hover:underline", children: "DIY vs. DFY vs. Traditional comparison" }),
      " to see where Network CPAs fit."
    ] })
  ] });
}
export {
  CpaPartners as default
};
