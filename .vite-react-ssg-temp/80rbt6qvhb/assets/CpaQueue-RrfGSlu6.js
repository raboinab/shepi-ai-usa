import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, B as Button, t as toast, C as Card, f as CardContent, b as CardHeader, d as CardTitle, e as CardDescription } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { format } from "date-fns";
import { Loader2, ClipboardList, Building2, ArrowRight, Calendar } from "lucide-react";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogFooter } from "./dialog-sNpTUd89.js";
import { C as Checkbox } from "./checkbox-3bpvUXl3.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-dialog";
import "@radix-ui/react-checkbox";
import "@radix-ui/react-scroll-area";
const CURRENT_PROVIDER_AGREEMENT_VERSION = "2026-04-13";
function useProviderAgreement() {
  const [state, setState] = useState({ hasAccepted: false, loading: true });
  const checkAcceptance = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setState({ hasAccepted: false, loading: false });
      return;
    }
    const { data, error } = await supabase.from("dfy_provider_agreements").select("id").eq("user_id", session.user.id).eq("agreement_version", CURRENT_PROVIDER_AGREEMENT_VERSION).limit(1);
    if (error) {
      console.error("[useProviderAgreement] Error checking acceptance:", error);
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
    const { error } = await supabase.from("dfy_provider_agreements").insert({
      user_id: session.user.id,
      agreement_version: CURRENT_PROVIDER_AGREEMENT_VERSION,
      accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
      ip_address: null
    });
    if (error) {
      console.error("[useProviderAgreement] Error recording acceptance:", error);
      return false;
    }
    setState({ hasAccepted: true, loading: false });
    return true;
  }, []);
  return { ...state, recordAcceptance };
}
function ProviderAgreementContent() {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 text-sm leading-relaxed", children: [
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "1. Purpose" }),
      /* @__PURE__ */ jsx("p", { children: "shepi provides software-enabled analytical and workflow support services, including analyst-assisted and done-for-you services, to its customers." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider desires to perform certain services for shepi in connection with such offerings, and shepi desires to engage Provider as an independent contractor on the terms set forth herein." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "2. Engagement" }),
      /* @__PURE__ */ jsx("p", { children: 'shepi may assign Provider certain projects, tasks, or workstreams from time to time, which may include document review, financial data organization, data normalization, analytical support, draft report preparation, quality control review, customer support communications, or related services (the "Provider Services").' }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "shepi is not obligated to assign any minimum amount of work, and Provider is not obligated to accept any specific assignment unless Provider agrees to do so." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "3. Independent Contractor Status" }),
      /* @__PURE__ */ jsx("p", { children: "Provider is an independent contractor and is not an employee, partner, agent, joint venturer, or legal representative of shepi." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider has no authority to bind shepi, enter into contracts on shepi's behalf, make warranties on shepi's behalf, or hold itself out as having authority to do so." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider is solely responsible for all taxes, withholdings, insurance, benefits, and other obligations arising from compensation paid under this Agreement." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "4. Scope and Standard of Performance" }),
      /* @__PURE__ */ jsx("p", { children: "Provider shall perform the Provider Services:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "in a professional, timely, and workmanlike manner;" }),
        /* @__PURE__ */ jsx("li", { children: "in accordance with shepi's instructions, project requirements, policies, and quality standards;" }),
        /* @__PURE__ */ jsx("li", { children: "in compliance with applicable law; and" }),
        /* @__PURE__ */ jsx("li", { children: "in a manner consistent with the customer-facing terms, limitations, and disclaimers communicated by shepi." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall not exceed the scope of any assigned work or offer services outside the assigned scope without shepi's prior written approval." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "5. No Direct Client Relationship" }),
      /* @__PURE__ */ jsx("p", { children: "Provider acknowledges and agrees that Provider is performing services solely on behalf of shepi." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall not, by virtue of performing Provider Services, enter into any direct contractual, fiduciary, advisory, accounting, audit, attestation, tax, legal, or other professional relationship with any shepi customer unless expressly authorized in advance by shepi in a separate written agreement." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall not state or imply that:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "Provider is independently engaged by the customer;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider is issuing a CPA opinion, audit opinion, attestation report, tax opinion, legal opinion, valuation opinion, or certified conclusion; or" }),
        /* @__PURE__ */ jsx("li", { children: "any work product constitutes audited, certified, or independently verified professional work product unless expressly approved in writing by shepi and separately documented." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "The participation of a licensed accountant, CPA, analyst, reviewer, or other professional in any Provider Services does not by itself create an accountant-client relationship, attestation engagement, audit engagement, tax engagement, or other licensed professional engagement with the customer." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "6. Communications with Customers" }),
      /* @__PURE__ */ jsx("p", { children: "Provider shall not communicate directly with any shepi customer except:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "as expressly authorized by shepi;" }),
        /* @__PURE__ */ jsx("li", { children: "within the scope authorized by shepi; and" }),
        /* @__PURE__ */ jsx("li", { children: "in a manner consistent with shepi's instructions." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "All customer communications, written or oral, must be accurate, professional, and consistent with shepi's positioning that its services are informational and analytical support services unless shepi instructs otherwise in writing." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "7. Confidentiality" }),
      /* @__PURE__ */ jsx("p", { children: 'Provider shall keep confidential and not disclose any non-public information received from or through shepi, including customer data, business information, product information, workflows, prompts, pricing, reports, models, financial records, customer identities, and any other confidential or proprietary information ("Confidential Information").' }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall use Confidential Information solely as necessary to perform Provider Services under this Agreement and for no other purpose." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall not disclose Confidential Information to any third party except with shepi's prior written consent." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall protect Confidential Information using reasonable administrative, technical, and organizational safeguards appropriate to the sensitivity of the information." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "The obligations in this Section do not apply to information that Provider can demonstrate:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "was lawfully known without restriction before disclosure;" }),
        /* @__PURE__ */ jsx("li", { children: "becomes publicly available through no fault of Provider;" }),
        /* @__PURE__ */ jsx("li", { children: "is lawfully received from a third party without breach of duty; or" }),
        /* @__PURE__ */ jsx("li", { children: "is independently developed without use of Confidential Information." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "If Provider is legally compelled to disclose Confidential Information, Provider shall, to the extent legally permitted, promptly notify shepi and cooperate with reasonable efforts to limit disclosure." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "8. Data Security" }),
      /* @__PURE__ */ jsx("p", { children: "Provider shall follow shepi's security instructions and use commercially reasonable safeguards to protect customer data and other Confidential Information from unauthorized access, disclosure, alteration, misuse, or loss." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall not download, copy, retain, transmit, or store customer data except as necessary to perform assigned work and in accordance with shepi's instructions." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall promptly notify shepi of any actual or suspected security incident, unauthorized access, misuse, or loss involving Confidential Information or customer data." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Upon request by shepi or upon termination of this Agreement, Provider shall promptly return or destroy Confidential Information and customer data in Provider's possession or control, except where retention is required by law." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "9. Work Product and Intellectual Property" }),
      /* @__PURE__ */ jsx("p", { children: 'All reports, drafts, summaries, analyses, notes, templates, deliverables, derivative materials, and other work product created, prepared, or developed by Provider in connection with the Provider Services ("Work Product") shall be deemed works made for hire to the maximum extent permitted by law.' }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "To the extent any Work Product does not qualify as a work made for hire, Provider hereby irrevocably assigns to shepi all right, title, and interest in and to such Work Product, including all intellectual property rights therein." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall execute such further documents and take such actions as may reasonably be requested by shepi to confirm or perfect shepi's ownership rights." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider retains ownership of pre-existing tools, know-how, templates, and materials developed independently of this Agreement, but grants shepi a perpetual, worldwide, non-exclusive, royalty-free license to use any such incorporated materials as part of the Work Product or Service." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "10. Compensation" }),
      /* @__PURE__ */ jsx("p", { children: "Provider shall be compensated as set forth in one or more written schedules, statements of work, emails, or other written communications approved by shepi." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Unless otherwise stated in writing:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "Provider is responsible for all of its own expenses;" }),
        /* @__PURE__ */ jsx("li", { children: "shepi has no obligation to reimburse expenses without prior written approval; and" }),
        /* @__PURE__ */ jsx("li", { children: "payment is conditioned on satisfactory performance of the Provider Services." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "11. Compliance with Laws and Professional Standards" }),
      /* @__PURE__ */ jsx("p", { children: "Provider shall comply with all applicable laws, regulations, and professional obligations applicable to Provider's performance under this Agreement." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "If Provider holds a professional license or credential, Provider is solely responsible for compliance with all rules applicable to that license or credential." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider shall promptly notify shepi of any suspension, revocation, investigation, disciplinary action, or restriction relating to Provider's professional license, certifications, or legal ability to perform the Provider Services." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "12. Conflicts; Non-Circumvention; Non-Solicitation" }),
      /* @__PURE__ */ jsx("p", { children: "Provider shall promptly disclose any actual or potential conflict of interest relating to assigned work." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "During the term of this Agreement and for twelve (12) months thereafter, Provider shall not, without shepi's prior written consent:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "directly or indirectly solicit or accept substantially similar work from any shepi customer first introduced through shepi;" }),
        /* @__PURE__ */ jsx("li", { children: "circumvent shepi in order to contract directly with any shepi customer for services materially related to Provider Services performed under this Agreement; or" }),
        /* @__PURE__ */ jsx("li", { children: "solicit for employment or engagement any employee or contractor of shepi with whom Provider worked directly through shepi." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "This Section does not prohibit general advertising or responding to opportunities not specifically targeted at shepi customers." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "13. Representations and Warranties" }),
      /* @__PURE__ */ jsx("p", { children: "Provider represents and warrants that:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "Provider has full authority to enter into this Agreement;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider's performance will not violate any other agreement or obligation;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider will perform the Provider Services in a professional and lawful manner;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider will not knowingly make false, misleading, or unsupported statements to shepi or any shepi customer;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider has the skills, experience, and qualifications necessary to perform assigned work; and" }),
        /* @__PURE__ */ jsx("li", { children: "Work Product provided by Provider will not knowingly infringe the intellectual property rights of any third party." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "14. Indemnification" }),
      /* @__PURE__ */ jsx("p", { children: "Provider shall defend, indemnify, and hold harmless shepi and its officers, managers, employees, affiliates, agents, representatives, customers, and Service Providers from and against any claims, demands, actions, liabilities, damages, judgments, settlements, losses, costs, and expenses, including reasonable attorneys' fees, arising out of or relating to:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "Provider's breach of this Agreement;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider's negligence, willful misconduct, fraud, or unlawful acts;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider's unauthorized statements or representations to customers or third parties;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider's violation of law or professional obligations;" }),
        /* @__PURE__ */ jsx("li", { children: "Provider's infringement or alleged infringement of third-party intellectual property rights; or" }),
        /* @__PURE__ */ jsx("li", { children: "any claim that Provider created a direct professional relationship with a customer contrary to this Agreement." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "15. Limitation of Liability" }),
      /* @__PURE__ */ jsx("p", { children: "Except for liability arising from Provider's confidentiality obligations, data security obligations, indemnification obligations, fraud, willful misconduct, or unlawful acts, neither party shall be liable to the other for any indirect, incidental, consequential, special, exemplary, or punitive damages arising out of this Agreement." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "To the maximum extent permitted by law, shepi's aggregate liability to Provider arising out of or relating to this Agreement shall not exceed the amounts paid by shepi to Provider under this Agreement during the six (6) months preceding the event giving rise to the claim." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "16. Insurance" }),
      /* @__PURE__ */ jsx("p", { children: "If requested by shepi, Provider shall maintain commercially reasonable insurance appropriate to the nature of the Provider Services, which may include general liability, cyber liability, professional liability, or errors and omissions coverage, and shall provide evidence of such coverage upon request." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "17. Term and Termination" }),
      /* @__PURE__ */ jsx("p", { children: "This Agreement begins on the Effective Date and continues until terminated." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Either party may terminate this Agreement at any time upon written notice." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "shepi may terminate this Agreement immediately for cause, including for breach, misconduct, security risk, customer risk, reputational risk, or suspected unlawful conduct." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Upon termination, Provider shall immediately cease use of Confidential Information and promptly return or destroy all shepi and customer materials as instructed by shepi." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Sections that by their nature should survive termination shall survive, including confidentiality, data security, ownership, indemnification, limitations of liability, dispute provisions, and any payment obligations accrued before termination." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "18. Governing Law and Venue" }),
      /* @__PURE__ */ jsx("p", { children: "This Agreement is governed by the laws of the Commonwealth of Virginia, without regard to conflict-of-law principles." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Any dispute arising out of or relating to this Agreement shall be brought exclusively in the state or federal courts located in Virginia, and each party consents to the personal jurisdiction and venue of those courts." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "19. General" }),
      /* @__PURE__ */ jsx("p", { children: "This Agreement constitutes the entire agreement between the parties regarding its subject matter and supersedes prior discussions or understandings on that subject." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Any amendment must be in writing." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "If any provision of this Agreement is held unenforceable, the remaining provisions shall remain in effect." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Provider may not assign this Agreement without shepi's prior written consent." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "20. Electronic Acceptance" }),
      /* @__PURE__ */ jsx("p", { children: `By clicking "Accept & Continue" below, Provider acknowledges that they have read, understood, and agree to be bound by all terms and conditions of this DFY Provider Agreement. This electronic acceptance constitutes Provider's signature and has the same legal effect as a handwritten signature.` })
    ] })
  ] });
}
function ProviderAgreementModal({ open, onOpenChange, onAccepted }) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { recordAcceptance } = useProviderAgreement();
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
      /* @__PURE__ */ jsx(DialogTitle, { className: "text-xl font-serif", children: "DFY Provider Agreement" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Version: ",
        CURRENT_PROVIDER_AGREEMENT_VERSION,
        "  ·  Please read carefully before accepting."
      ] })
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 pr-4 overflow-y-auto max-h-[55vh] border border-border rounded-md p-4", children: /* @__PURE__ */ jsx(ProviderAgreementContent, {}) }),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "flex-col gap-3 sm:flex-col mt-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            id: "provider-agree",
            checked,
            onCheckedChange: (v) => setChecked(v === true)
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "provider-agree", className: "text-sm cursor-pointer", children: "I have read and agree to the DFY Provider Agreement" })
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
function CpaQueue() {
  const queryClient = useQueryClient();
  const { hasAccepted, loading: agreementLoading } = useProviderAgreement();
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState(null);
  const { data: dfyProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["cpa-dfy-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name, target_company, industry, transaction_type, created_at, client_name").eq("service_tier", "done_for_you").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ["cpa-claims-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cpa_claims").select("project_id, cpa_user_id, status");
      if (error) throw error;
      return data || [];
    }
  });
  const claimMutation = useMutation({
    mutationFn: async (projectId) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("cpa_claims").insert({
        project_id: projectId,
        cpa_user_id: user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cpa-dfy-projects"] });
      queryClient.invalidateQueries({ queryKey: ["cpa-claims-all"] });
      toast({ title: "Project claimed", description: "You now have editor access to this project." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
  const handleClaimClick = (projectId) => {
    if (hasAccepted) {
      claimMutation.mutate(projectId);
    } else {
      setPendingProjectId(projectId);
      setAgreementOpen(true);
    }
  };
  const handleAgreementAccepted = () => {
    if (pendingProjectId) {
      claimMutation.mutate(pendingProjectId);
      setPendingProjectId(null);
    }
  };
  const isLoading = projectsLoading || claimsLoading || agreementLoading;
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  const claimedProjectIds = new Set((claims || []).map((c) => c.project_id));
  const unclaimed = (dfyProjects || []).filter((p) => !claimedProjectIds.has(p.id));
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(ClipboardList, { className: "h-6 w-6 text-primary" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Available Engagements" }),
      /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "ml-2", children: [
        unclaimed.length,
        " unclaimed"
      ] })
    ] }),
    unclaimed.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12 text-center text-muted-foreground", children: "No unclaimed Done-For-You projects at the moment. Check back soon." }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: unclaimed.map((project) => /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: project.target_company || project.name }),
        /* @__PURE__ */ jsx(CardDescription, { children: project.client_name || "Client" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col flex-1 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm text-muted-foreground", children: [
          project.industry && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Building2, { className: "h-3.5 w-3.5" }),
            /* @__PURE__ */ jsx("span", { children: project.industry })
          ] }),
          project.transaction_type && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" }),
            /* @__PURE__ */ jsx("span", { className: "capitalize", children: project.transaction_type.replace(/_/g, " ") })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Created ",
              format(new Date(project.created_at), "MMM d, yyyy")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-auto pt-3", children: /* @__PURE__ */ jsx(
          Button,
          {
            className: "w-full",
            onClick: () => handleClaimClick(project.id),
            disabled: claimMutation.isPending,
            children: "Claim Project"
          }
        ) })
      ] })
    ] }, project.id)) }),
    /* @__PURE__ */ jsx(
      ProviderAgreementModal,
      {
        open: agreementOpen,
        onOpenChange: (open) => {
          setAgreementOpen(open);
          if (!open) setPendingProjectId(null);
        },
        onAccepted: handleAgreementAccepted
      }
    )
  ] });
}
export {
  CpaQueue as default
};
