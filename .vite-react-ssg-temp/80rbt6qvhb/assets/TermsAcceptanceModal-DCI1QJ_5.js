import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogFooter } from "./dialog-sNpTUd89.js";
import { s as supabase, B as Button, t as toast } from "../main.mjs";
import { C as Checkbox } from "./checkbox-3bpvUXl3.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { Loader2 } from "lucide-react";
const CURRENT_TOS_VERSION = "2026-04-13";
function useTosAcceptance() {
  const [state, setState] = useState({ hasAccepted: false, loading: true });
  const checkAcceptance = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setState({ hasAccepted: false, loading: false });
      return;
    }
    const { data, error } = await supabase.from("tos_acceptances").select("id").eq("user_id", session.user.id).limit(1);
    if (error) {
      console.error("[useTosAcceptance] Error checking acceptance:", error);
      setState({ hasAccepted: false, loading: false });
      return;
    }
    setState({ hasAccepted: (data?.length ?? 0) > 0, loading: false });
  }, []);
  useEffect(() => {
    checkAcceptance();
  }, [checkAcceptance]);
  const recordAcceptance = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const { error } = await supabase.from("tos_acceptances").insert({
      user_id: session.user.id,
      tos_version: CURRENT_TOS_VERSION,
      accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
      ip_address: null
      // Browser doesn't expose client IP
    });
    if (error) {
      console.error("[useTosAcceptance] Error recording acceptance:", error);
      return false;
    }
    setState({ hasAccepted: true, loading: false });
    return true;
  }, []);
  return { ...state, recordAcceptance };
}
function TermsContent() {
  return /* @__PURE__ */ jsxs("div", { className: "prose prose-sm max-w-none dark:prose-invert", children: [
    /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-xs mb-4", children: [
      /* @__PURE__ */ jsx("strong", { children: "Effective Date:" }),
      " April 13, 2026"
    ] }),
    /* @__PURE__ */ jsx("p", { children: "These Terms of Service (“Terms”) govern your access to and use of the shepi platform, website, software, outputs, and related services provided by SMB EDGE d/b/a shepi (“shepi,” “we,” “us,” or “our”)." }),
    /* @__PURE__ */ jsx("p", { children: "By accessing or using the Service, you agree to these Terms. If you do not agree, do not use the Service." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "1. The Service" }),
    /* @__PURE__ */ jsx("p", { children: "shepi provides software and related services designed to help users organize, review, analyze, and transform financial and business information." }),
    /* @__PURE__ */ jsx("p", { children: "The Service may include workflows, rules-based logic, artificial intelligence, machine learning, document extraction, normalization, classification, summarization, and related analytical features." }),
    /* @__PURE__ */ jsx("p", { children: "The Service may be offered as:" }),
    /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [
      /* @__PURE__ */ jsx("li", { children: "self-service software access;" }),
      /* @__PURE__ */ jsx("li", { children: "assisted onboarding or support;" }),
      /* @__PURE__ */ jsx("li", { children: "analyst-assisted or done-for-you services; and" }),
      /* @__PURE__ */ jsx("li", { children: "optional premium features or add-on services." })
    ] }),
    /* @__PURE__ */ jsx("p", { children: "Some offerings may also be subject to a checkout flow, order form, statement of work, proposal, or other written terms that supplement these Terms." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "2. Nature of the Service" }),
    /* @__PURE__ */ jsxs("p", { children: [
      "shepi provides ",
      /* @__PURE__ */ jsx("strong", { children: "decision-support and analytical workflow support" }),
      " designed to help users organize, review, and analyze financial and business information."
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "The Service is ",
      /* @__PURE__ */ jsx("strong", { children: "not" }),
      " an audit, attestation engagement, or professional opinion."
    ] }),
    /* @__PURE__ */ jsx("p", { children: "Use of the Service does not create a fiduciary, accounting, legal, tax, investment, valuation, underwriting, or other professional engagement unless expressly stated in a separate written agreement signed by shepi." }),
    /* @__PURE__ */ jsx("p", { children: "You remain responsible for your decisions, filings, negotiations, financing requests, transactions, and representations, and you should use qualified professional advisors where appropriate." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "3. AI-Assisted Workflows" }),
    /* @__PURE__ */ jsx("p", { children: "The Service may use AI or machine-learning systems to assist with extraction, classification, normalization, summarization, drafting, anomaly detection, or analysis." }),
    /* @__PURE__ */ jsx("p", { children: "You acknowledge that AI-assisted outputs may be incomplete, inaccurate, inconsistent, or non-deterministic and should be reviewed and validated before use." }),
    /* @__PURE__ */ jsx("p", { children: "shepi does not use Customer Data to train generalized AI models for use outside providing and operating the Service." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "4. Your Responsibilities" }),
    /* @__PURE__ */ jsx("p", { children: "You represent and warrant that:" }),
    /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [
      /* @__PURE__ */ jsx("li", { children: "you have the legal right to provide all data and materials you submit;" }),
      /* @__PURE__ */ jsx("li", { children: "your Customer Data is accurate and complete to the best of your knowledge;" }),
      /* @__PURE__ */ jsx("li", { children: "you will review, validate, and interpret outputs before using them; and" }),
      /* @__PURE__ */ jsx("li", { children: "you will not use the Service for unlawful, deceptive, fraudulent, or misleading purposes." })
    ] }),
    /* @__PURE__ */ jsx("p", { children: "Outputs depend on the quality, completeness, and consistency of the materials you provide." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "5. Accounts and Access" }),
    /* @__PURE__ */ jsx("p", { children: "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account." }),
    /* @__PURE__ */ jsx("p", { children: "shepi may suspend or terminate access if:" }),
    /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [
      /* @__PURE__ */ jsx("li", { children: "you violate these Terms;" }),
      /* @__PURE__ */ jsx("li", { children: "your use creates legal, security, or operational risk;" }),
      /* @__PURE__ */ jsx("li", { children: "payment is overdue; or" }),
      /* @__PURE__ */ jsx("li", { children: "suspension or termination is required by law." })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "6. Customer Data and Outputs" }),
    /* @__PURE__ */ jsx("p", { children: "You retain ownership of the data and documents you upload or submit (“Customer Data”)." }),
    /* @__PURE__ */ jsx("p", { children: "You grant shepi a limited, non-exclusive license to host, process, analyze, store, and use Customer Data solely as necessary to provide, operate, maintain, support, and improve the Service." }),
    /* @__PURE__ */ jsx("p", { children: "Subject to your compliance with these Terms and payment of applicable fees, you may access, use, download, copy, and share outputs generated through the Service for lawful internal business purposes and lawful transaction-related purposes." }),
    /* @__PURE__ */ jsx("p", { children: "You may share outputs with your employees, owners, advisors, accountants, attorneys, brokers, lenders, investors, buyers, sellers, and other transaction participants in connection with diligence, financing, negotiation, or related business activity." }),
    /* @__PURE__ */ jsx("p", { children: "Outputs are part of shepi’s decision-support and analytical workflow support offering. Sharing them does not convert them into an audit, attestation, or professional opinion, and does not create rights against shepi for any recipient unless expressly stated in a separate written agreement." }),
    /* @__PURE__ */ jsx("p", { children: "shepi retains all rights, title, and interest in the Service itself, including its software, workflows, prompts, models, methods, and related intellectual property." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "7. Service Providers" }),
    /* @__PURE__ */ jsx("p", { children: "shepi may use employees, contractors, affiliates, subprocessors, independent analysts, licensed professionals, and other service providers to help deliver the Service." }),
    /* @__PURE__ */ jsx("p", { children: "You authorize shepi to share Customer Data with those service providers as reasonably necessary to provide, maintain, support, and secure the Service, subject to confidentiality and data-protection obligations." }),
    /* @__PURE__ */ jsx("p", { children: "Their involvement does not create a separate professional engagement with you or any recipient of outputs unless expressly stated in a separate written agreement." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "8. Confidentiality and Data Protection" }),
    /* @__PURE__ */ jsx("p", { children: "shepi will treat Customer Data as confidential and will not disclose it to third parties except:" }),
    /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [
      /* @__PURE__ */ jsx("li", { children: "as needed to provide, maintain, support, secure, or improve the Service;" }),
      /* @__PURE__ */ jsx("li", { children: "to service providers bound by confidentiality obligations;" }),
      /* @__PURE__ */ jsx("li", { children: "as required by law; or" }),
      /* @__PURE__ */ jsx("li", { children: "with your consent." })
    ] }),
    /* @__PURE__ */ jsx("p", { children: "shepi will not sell Customer Data." }),
    /* @__PURE__ */ jsx("p", { children: "shepi implements reasonable administrative, technical, and organizational safeguards designed to protect Customer Data, but no system can be guaranteed to be completely secure." }),
    /* @__PURE__ */ jsx("p", { children: "If legally required to disclose Customer Data, shepi will use reasonable efforts to provide notice unless legally prohibited." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "9. Fees and Payment" }),
    /* @__PURE__ */ jsx("p", { children: "If you purchase a subscription or paid service:" }),
    /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [
      /* @__PURE__ */ jsx("li", { children: "fees are billed as described at checkout or in applicable written terms;" }),
      /* @__PURE__ */ jsx("li", { children: "fees are generally non-refundable unless required by law or expressly stated otherwise in writing; and" }),
      /* @__PURE__ */ jsx("li", { children: "shepi may change pricing with reasonable notice." })
    ] }),
    /* @__PURE__ */ jsx("p", { children: "Done-for-you or assisted services may be subject to separate pricing, scope, or engagement terms." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "10. Done-For-You and Assisted Services" }),
    /* @__PURE__ */ jsx("p", { children: "Done-for-you and assisted services are part of shepi’s decision-support and analytical workflow support offering." }),
    /* @__PURE__ */ jsx("p", { children: "These services may involve a combination of software, automation, AI tools, human review, and service providers acting on shepi’s behalf." }),
    /* @__PURE__ */ jsx("p", { children: "Unless expressly stated in a separate written agreement, done-for-you and assisted services do not include an audit, review, compilation, attestation engagement, legal advice, tax advice, valuation opinion, underwriting opinion, third-party reliance letter, or any certification of facts or conclusions." }),
    /* @__PURE__ */ jsx("p", { children: "The specific scope, deliverables, timing, and pricing for done-for-you and assisted services may be described in checkout terms, an order form, proposal, statement of work, or similar written communication." }),
    /* @__PURE__ */ jsx("p", { children: "You agree to timely provide the records, information, clarifications, access, and approvals reasonably needed for those services. shepi is not responsible for delays, deficiencies, or inaccuracies caused by incomplete, inconsistent, delayed, unusable, or inaccessible Customer Data." }),
    /* @__PURE__ */ jsx("p", { children: "Any timelines or turnaround estimates are good-faith estimates only and depend on timely receipt of complete and usable information." }),
    /* @__PURE__ */ jsx("p", { children: "Unless otherwise stated in writing, done-for-you services include the initial deliverable and a limited opportunity to correct factual errors based on information originally provided. Additional revisions, updated datasets, expanded procedures, or changed assumptions may require additional fees." }),
    /* @__PURE__ */ jsx("p", { children: "A done-for-you or assisted engagement is deemed commenced when shepi begins intake, file review, processing, analysis, project setup, or other substantive work. Unless otherwise expressly stated in writing, fees for done-for-you or assisted services are non-refundable once work has commenced." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "11. Acceptable Use" }),
    /* @__PURE__ */ jsx("p", { children: "You agree not to:" }),
    /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [
      /* @__PURE__ */ jsx("li", { children: "access non-public areas of the Service without authorization;" }),
      /* @__PURE__ */ jsx("li", { children: "interfere with the integrity or security of the Service;" }),
      /* @__PURE__ */ jsx("li", { children: "use the Service to build or benchmark a competing product;" }),
      /* @__PURE__ */ jsx("li", { children: "misrepresent outputs as audited, certified, independently verified, or subject to third-party reliance rights;" }),
      /* @__PURE__ */ jsx("li", { children: "use the Service for unlawful, deceptive, or misleading activities; or" }),
      /* @__PURE__ */ jsx("li", { children: "upload malicious code or harmful materials." })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "12. Service Availability" }),
    /* @__PURE__ */ jsx("p", { children: "The Service is provided on an “as is” and “as available” basis." }),
    /* @__PURE__ */ jsx("p", { children: "shepi does not guarantee uninterrupted or error-free operation and may modify, suspend, or discontinue features at any time." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "13. Disclaimers" }),
    /* @__PURE__ */ jsx("p", { children: "To the maximum extent permitted by law, the Service and all outputs are provided without warranties of any kind, whether express or implied, including warranties of accuracy, merchantability, fitness for a particular purpose, and non-infringement." }),
    /* @__PURE__ */ jsx("p", { children: "shepi does not guarantee that outputs will meet your expectations, satisfy transaction requirements, satisfy underwriting requirements, or support a particular business outcome." }),
    /* @__PURE__ */ jsx("p", { children: "The quality and usefulness of outputs depend heavily on the quality, completeness, and accuracy of the Customer Data you provide. Incomplete or inaccurate materials may materially limit the resulting analysis." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "14. Limitation of Liability" }),
    /* @__PURE__ */ jsx("p", { children: "To the maximum extent permitted by law, shepi and its officers, managers, employees, contractors, affiliates, agents, representatives, and service providers will not be liable for any indirect, incidental, consequential, special, or punitive damages, including lost profits, lost transactions, lost business opportunities, lost data, or reliance damages." }),
    /* @__PURE__ */ jsx("p", { children: "shepi is also not liable for decisions made by you or others based on outputs, or for inaccuracies caused by incomplete, inaccurate, or misleading Customer Data." }),
    /* @__PURE__ */ jsx("p", { children: "shepi’s total aggregate liability arising out of or relating to the Service or these Terms will not exceed the amount paid by you to shepi in the twelve (12) months preceding the claim." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "15. Indemnification" }),
    /* @__PURE__ */ jsx("p", { children: "You agree to indemnify and hold harmless shepi and its officers, managers, employees, contractors, affiliates, agents, representatives, and service providers from claims arising out of:" }),
    /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 space-y-1", children: [
      /* @__PURE__ */ jsx("li", { children: "your use of the Service;" }),
      /* @__PURE__ */ jsx("li", { children: "your Customer Data;" }),
      /* @__PURE__ */ jsx("li", { children: "your violation of these Terms;" }),
      /* @__PURE__ */ jsx("li", { children: "your violation of law or third-party rights; or" }),
      /* @__PURE__ */ jsx("li", { children: "your representations or communications to third parties about outputs." })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "16. Governing Law and Venue" }),
    /* @__PURE__ */ jsx("p", { children: "These Terms are governed by the laws of the Commonwealth of Virginia, without regard to conflict-of-law principles." }),
    /* @__PURE__ */ jsx("p", { children: "Any dispute arising out of or relating to these Terms or the Service shall be brought exclusively in the state or federal courts located in Virginia." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "17. Changes to These Terms" }),
    /* @__PURE__ */ jsx("p", { children: "shepi may update these Terms from time to time. Continued use of the Service after updated Terms become effective constitutes acceptance of the revised Terms." }),
    /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold mt-6 mb-2", children: "18. Contact" }),
    /* @__PURE__ */ jsxs("p", { children: [
      /* @__PURE__ */ jsx("strong", { children: "SMB EDGE d/b/a shepi" }),
      /* @__PURE__ */ jsx("br", {}),
      "Herndon, Virginia",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("a", { href: "mailto:hello@shepi.ai", className: "text-primary hover:underline", children: "hello@shepi.ai" })
    ] })
  ] });
}
function TermsAcceptanceModal({ open, onOpenChange, onAccepted }) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { recordAcceptance } = useTosAcceptance();
  const handleAccept = async () => {
    if (!checked) return;
    setSubmitting(true);
    const ok = await recordAcceptance();
    setSubmitting(false);
    if (!ok) {
      toast({
        title: "Error",
        description: "Failed to record your acceptance. Please try again.",
        variant: "destructive"
      });
      return;
    }
    onOpenChange(false);
    onAccepted();
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl flex flex-col max-h-[90vh]", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl font-serif", children: "shepi Unified Terms of Service" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Effective Date: ",
        CURRENT_TOS_VERSION,
        "  ·  Please read carefully before using the Service."
      ] })
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 pr-4 overflow-y-auto max-h-[55vh] border border-border rounded-md p-4", children: /* @__PURE__ */ jsx(TermsContent, {}) }),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "flex-col gap-3 sm:flex-col mt-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            id: "tos-agree",
            checked,
            onCheckedChange: (v) => setChecked(v === true)
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "tos-agree", className: "text-sm cursor-pointer", children: "I have read and agree to the Terms of Service" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), disabled: submitting, children: "Cancel" }),
        /* @__PURE__ */ jsxs(Button, { onClick: handleAccept, disabled: !checked || submitting, children: [
          submitting && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
          "Accept & Continue"
        ] })
      ] })
    ] })
  ] }) });
}
export {
  TermsAcceptanceModal as T,
  useTosAcceptance as u
};
