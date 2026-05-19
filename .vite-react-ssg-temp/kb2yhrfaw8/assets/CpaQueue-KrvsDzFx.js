import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, B as Button, t as toast, j as Badge, C as Card, f as CardContent, b as CardHeader, d as CardTitle, e as CardDescription } from "../main.mjs";
import { S as Spinner } from "./spinner-Cl42thGn.js";
import { format } from "date-fns";
import { Loader2, ClipboardList, Building2, ArrowRight, Calendar } from "lucide-react";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogFooter } from "./dialog-BYBu6BQa.js";
import { C as Checkbox } from "./checkbox-CNynTpZY.js";
import { S as ScrollArea } from "./scroll-area-DLvncVK9.js";
import "vite-react-ssg";
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
const CURRENT_PROVIDER_AGREEMENT_VERSION = "2026-05-18";
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
    /* @__PURE__ */ jsxs("header", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold text-lg", children: "DFY Provider Agreement" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Shepi Network — CPA Partner clickwrap agreement" })
    ] }),
    /* @__PURE__ */ jsx("p", { children: 'This DFY Provider Agreement (this "Agreement") is entered into between SMB EDGE d/b/a shepi, a Virginia company ("shepi," "we," "us," or "our"), and you, the individual licensed CPA accepting this Agreement ("Provider" or "you"). It takes effect when you click "Accept & Continue" below and remains in effect until terminated as set out below.' }),
    /* @__PURE__ */ jsx("p", { children: "By accepting, you confirm that you have read, understood, and agreed to be bound by this Agreement. Your electronic acceptance has the same legal effect as a handwritten signature under the U.S. Electronic Signatures in Global and National Commerce Act and any applicable state equivalent (including UETA)." }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "1. Purpose" }),
      /* @__PURE__ */ jsx("p", { children: `shepi operates an AI-assisted Quality of Earnings ("QoE") and financial due-diligence software platform (the "Platform"). shepi also operates a curated network of independent licensed CPAs (the "Network") who elect to perform Done-For-You ("DFY") QoE projects for shepi's Clients using the Platform. You wish to join the Network and accept DFY projects on the terms set out below.` })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "2. Network engagement" }),
      /* @__PURE__ */ jsx("p", { children: 'Through the Platform, shepi may make DFY projects available to you to accept ("Match offers"). shepi is not obligated to offer you any minimum amount of work, and you are not obligated to accept any specific Match offer. You may decline any Match offer for any reason, including capacity, professional judgment, conflicts of interest, or commercial fit — and declining is not a breach of this Agreement.' })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "3. Independent contractor status" }),
      /* @__PURE__ */ jsx("p", { children: "You are an independent contractor, not an employee, partner, agent, joint venturer, or legal representative of shepi. You have no authority to bind shepi, enter into contracts on shepi's behalf, make warranties on shepi's behalf, or hold yourself out as having authority to do so. You are solely responsible for all taxes, withholdings, insurance, benefits, and other obligations arising from compensation you receive under this Agreement. You will provide shepi with a completed Form W-9 before first payment. shepi will issue you a Form 1099-NEC annually as required." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "4. Scope and standard of performance" }),
      /* @__PURE__ */ jsx("p", { children: "For each DFY project you accept, you will perform:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "the Quality of Earnings analysis described in the project SOW within the Platform;" }),
        /* @__PURE__ */ jsx("li", { children: "in a professional, timely, and workmanlike manner;" }),
        /* @__PURE__ */ jsx("li", { children: "in accordance with applicable AICPA professional standards (including SSCS Section 100 for consulting engagements), applicable state board rules, and any other professional obligations that apply to you as a licensed CPA; and" }),
        /* @__PURE__ */ jsx("li", { children: "in compliance with applicable law." })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "The Platform provides software tools, document handling, AI-assisted suggestions, templates, and workflow automation to support your work. The Platform's suggestions and templates are advisory only. You exercise sole professional judgment over the methodology you apply, the contents of the final Work Product, and whether to sign and deliver it. You may accept, modify, or reject any Platform suggestion in your professional discretion." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "5. Direct client relationship" }),
      /* @__PURE__ */ jsx("p", { children: "For each DFY project you accept, you perform the professional services in your professional capacity as a licensed CPA. The final Work Product carries your name, state of licensure, and CPA license number. You are professionally responsible for the Work Product as a licensed CPA." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "shepi provides the software, matching, billing, and operational infrastructure that supports the engagement. shepi is not a CPA firm and does not provide accountancy services, and does not maintain professional-liability insurance covering Provider's work." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: `You will not represent yourself as shepi staff and will not use shepi email addresses or business cards. You may describe yourself as a "shepi Network CPA Partner" or substantially similar language consistent with shepi's brand guidelines.` })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "6. Communications with Clients" }),
      /* @__PURE__ */ jsx("p", { children: "You may communicate directly with each Client about the professional aspects of your engagement, including via the EngagementChat feature of the Platform. shepi may operate Platform and product support channels separately. You will use professional judgment in all Client communications and will not solicit Clients for services outside the Platform except as Section 12 expressly permits." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "7. Confidentiality" }),
      /* @__PURE__ */ jsx("p", { children: `You will keep confidential and not disclose any non-public information received from or through shepi or any Client, including Client data, business information, product information, workflows, prompts, pricing, reports, models, financial records, Client identities, and any other confidential or proprietary information ("Confidential Information"). You will use Confidential Information solely as necessary to perform DFY projects under this Agreement, and not for any other purpose. You will not disclose Confidential Information to any third party except with shepi's prior written consent.` }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "These obligations do not apply to information that: was lawfully known without restriction before disclosure; becomes publicly available through no fault of yours; is lawfully received from a third party without breach of duty; or is independently developed without use of Confidential Information. If you are legally compelled to disclose Confidential Information, you will, to the extent legally permitted, promptly notify shepi and cooperate with reasonable efforts to limit disclosure. You may also disclose Confidential Information to your E&O insurer, professional advisors, peer reviewers, and state board of accountancy as professionally required." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "8. Data security" }),
      /* @__PURE__ */ jsx("p", { children: "You will:" }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-5 mt-2 space-y-1", children: [
        /* @__PURE__ */ jsx("li", { children: "access Client data only through the Platform and not download or copy Client data unless required for the project;" }),
        /* @__PURE__ */ jsx("li", { children: "use a unique, MFA-protected account for the Platform and not share credentials;" }),
        /* @__PURE__ */ jsx("li", { children: "encrypt any local copies of Client data at rest and use full-disk encryption on devices used for DFY work;" }),
        /* @__PURE__ */ jsx("li", { children: "keep all Client data within the United States;" }),
        /* @__PURE__ */ jsx("li", { children: "not transmit Client data to any third-party generative AI service or large language model other than the Platform itself;" }),
        /* @__PURE__ */ jsx("li", { children: "notify security@shepi.ai promptly (and in any event within 24 hours of confirmation for an incident involving personal information, or 72 hours for any other security incident involving Client data) of any actual or suspected security incident; and" }),
        /* @__PURE__ */ jsx("li", { children: "securely delete Client data within 30 days of project completion, except for documents you are required to retain under professional standards." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "9. Work Product and intellectual property" }),
      /* @__PURE__ */ jsx("p", { children: `Subject to shepi's payment of all amounts due to you for each project, you hereby irrevocably assign to shepi all right, title, and interest (including all intellectual property rights) in and to the final deliverables prepared in connection with each DFY project (the "Work Product"), other than your Background IP and your Workpapers. You will execute such further documents as shepi reasonably requests to perfect this assignment. You waive, to the extent permitted by law, any moral rights in the Work Product.` }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
        /* @__PURE__ */ jsx("strong", { children: "Provider Workpapers." }),
        ` Your workpapers, working files, and supporting calculations for any DFY project you perform ("Provider Workpapers") are your professional property. You have a perpetual, irrevocable right to access, download, and retain Provider Workpapers in usable, exportable formats from the Platform. This right survives termination of this Agreement, end of Network membership, sale of shepi, or any other event. shepi will not delete Provider Workpapers without at least 90 days' prior written notice and an opportunity to download. You may use Provider Workpapers for AICPA / state board retention compliance, peer review, malpractice defense, and reasonable use in your professional practice.`
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
        /* @__PURE__ */ jsx("strong", { children: "Background IP." }),
        ' You retain ownership of pre-existing tools, know-how, templates, and materials you developed independently of this Agreement ("Background IP"), but grant shepi a perpetual, worldwide, non-exclusive, royalty-free license to use any such materials to the extent embedded in Work Product.'
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
        /* @__PURE__ */ jsx("strong", { children: "Platform." }),
        " shepi retains all rights in the Platform. Nothing in this Agreement grants you any license except a non-exclusive, non-transferable right to use the Platform to perform DFY projects."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "10. Compensation" }),
      /* @__PURE__ */ jsx("p", { children: `You will be compensated for each DFY project at the rate specified in shepi's then-current published Provider rate schedule (the "Rate Schedule") or as otherwise agreed in writing for a specific project. shepi will pay you within 15 days of project completion. You are responsible for all of your own expenses unless pre-approved in writing. shepi may amend the Rate Schedule on 30 days' written notice; if shepi does, you may continue accepting Match offers under the amended schedule, propose alternative terms, or terminate this Agreement as provided in §17.` })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "11. Compliance with laws and professional standards" }),
      /* @__PURE__ */ jsx("p", { children: "You will comply with all applicable laws, regulations, and professional obligations applicable to your performance under this Agreement, including the AICPA Code of Professional Conduct, the rules of your state board of accountancy, and applicable Statements on Standards for Consulting Services. You will promptly notify shepi of any suspension, revocation, investigation, disciplinary action, or restriction relating to your CPA license, certifications, or legal ability to perform DFY projects. You are solely responsible for any state-specific sole-practitioner or firm registration that may be required for your DFY activities outside your day-job employment." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "12. Conflicts; non-circumvention; non-solicitation" }),
      /* @__PURE__ */ jsx("p", { children: "You will promptly disclose any actual or potential conflict of interest relating to assigned work and will decline or withdraw from any project where independence is impaired." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "During the term of this Agreement and for 12 months thereafter, you will not, without shepi's prior written consent: (a) directly or indirectly solicit or accept substantially similar work from any shepi customer first introduced through shepi; (b) circumvent shepi in order to contract directly with any shepi customer for services materially related to DFY projects performed under this Agreement; or (c) solicit for employment or engagement any employee or contractor of shepi with whom you worked directly through shepi. This Section does not prohibit general advertising or responding to opportunities not specifically targeted at shepi customers, or pre-existing relationships you can document." }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
        /* @__PURE__ */ jsx("strong", { children: "Jurisdictional limits." }),
        " To the extent the obligations in this Section 12 are unenforceable under the laws of any jurisdiction (including under California Business & Professions Code §16600, North Dakota Century Code §9-08-06, Oklahoma title 15 §219A, or Minnesota Statutes §181.988), those obligations will not apply to your activities in or directed to such jurisdiction. Your confidentiality obligations under Section 7 and applicable trade-secret law remain in full force in all jurisdictions."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "13. Representations and attestations" }),
      /* @__PURE__ */ jsx("p", { children: "As a condition of admission to the Network, by accepting this Agreement, and on each project you accept, you represent and warrant:" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "(a) You hold an active, unrestricted CPA license in good standing in at least one U.S. state, and you are not currently subject to any pending state board investigation, suspension, or revocation." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "(b) If you are employed by a CPA firm or other employer, your employment terms permit you to perform DFY projects on the Platform, and you have obtained any required employer pre-approval. shepi has no obligation to confirm your employer's permission." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "(c) For each project you accept, neither you nor any individual or firm with which you have a relevant relationship has any independence-impairing connection to the Client or the underlying transaction party that would violate the AICPA Code of Professional Conduct (§§1.220 and 1.295) or your state board's rules. You will clear each project through any conflict, independence, or risk-management process applicable to you, and will disclose any actual or apparent conflict before accepting." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "(d) You are solely responsible for any state-specific sole-practitioner or firm registration that may be required for your DFY activities outside your day-job employment, and you will obtain any required registration before performing work in a state where it applies." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "(e) You have the skills, experience, and qualifications necessary to perform DFY projects; your performance of this Agreement will not violate any other agreement or obligation; and you will not knowingly make false, misleading, or unsupported statements to shepi or any Client." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "(f) Work Product you provide will not knowingly infringe the intellectual property rights of any third party." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "You will provide updated attestations on each project acceptance and will notify shepi within 5 business days of any material change to the foregoing, including any change in your license status, employer permission, or independence with respect to active projects." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "14. Indemnification" }),
      /* @__PURE__ */ jsxs("p", { children: [
        /* @__PURE__ */ jsx("strong", { children: "By Provider." }),
        " You will defend, indemnify, and hold harmless shepi and its officers, managers, employees, affiliates, agents, representatives, customers, and service providers from and against any third-party claims, demands, actions, liabilities, damages, judgments, settlements, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: your breach of this Agreement; your professional negligence, willful misconduct, fraud, or unlawful acts (in each case except to the extent caused by a Platform Defect under §14.A below); your unauthorized statements or representations to Clients or third parties; your violation of law or professional obligations; your infringement or alleged infringement of third-party intellectual property rights through your Background IP or Work Product; or any claim that you should be classified as shepi's employee, joint employee, or co-employee for purposes of any wage, benefit, tax, or workers' compensation obligation."
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
        /* @__PURE__ */ jsx("strong", { children: "14.A — shepi indemnifies Provider for Platform Defects." }),
        " shepi will defend, indemnify, and hold harmless Provider from any third-party claim by a Client (or any party claiming through a Client) to the extent the claim arises from a Platform Defect — defined as a defect, error, or malfunction in the Platform (including calculation engine errors, AI-suggested adjustments that are materially incorrect and that Provider adopted in reasonable reliance on Platform documentation, downtime or data corruption causing missed deadlines or defective deliverables), a security incident or data breach caused by shepi's systems (and not by Provider's breach of §8), or infringement by the Platform of a U.S. patent, copyright, or trademark."
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2", children: [
        /* @__PURE__ */ jsx("strong", { children: "Procedure." }),
        " The indemnified party will promptly notify the indemnifying party, allow the indemnifying party to control the defense, and reasonably cooperate. No settlement that imposes obligations on the indemnified party (including, for Provider, any admission of professional negligence) may be entered without the indemnified party's consent."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "15. Limitation of liability" }),
      /* @__PURE__ */ jsx("p", { children: "Except for liability arising from breach of confidentiality, indemnification obligations, professional negligence not caused by a Platform Defect, gross negligence, willful misconduct, fraud, or unlawful acts, neither party will be liable to the other for any indirect, incidental, consequential, special, exemplary, or punitive damages arising out of this Agreement." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "To the maximum extent permitted by law, each party's aggregate liability to the other arising out of or relating to this Agreement (other than the carve-outs above) will not exceed the greater of (x) the amounts paid between the parties under this Agreement during the 12 months preceding the event giving rise to the claim or (y) $100,000. shepi's indemnity obligations under §14.A are not subject to this cap." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "16. Insurance" }),
      /* @__PURE__ */ jsx("p", { children: "Each party is responsible for maintaining the insurance coverage it deems appropriate for its own business and professional activities. Provider is responsible for maintaining any professional liability (Errors & Omissions) coverage required by Provider's state board, employer, or professional judgment." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "17. Term and termination" }),
      /* @__PURE__ */ jsx("p", { children: "This Agreement begins when you accept it and continues until terminated. Either party may terminate this Agreement at any time on written notice. shepi may terminate immediately for cause, including for material breach, misconduct, security risk, Client risk, reputational risk, suspected unlawful conduct, or your failure to maintain the eligibility requirements in §13." }),
      /* @__PURE__ */ jsx("p", { className: "mt-2", children: "Upon termination, you will immediately cease use of Confidential Information and promptly return or destroy all shepi and Client materials as instructed by shepi, subject to your perpetual rights under §9 (Provider Workpapers) and your professional-standard retention obligations. Sections that by their nature should survive termination — including §3 (independent contractor), §7 (confidentiality), §8 (data security), §9 (Work Product and Workpapers), §12 (conflicts and non-circumvention, for the 12-month tail), §14 (indemnification), §15 (limitation of liability), §16 (insurance), §17, §18, §19, and any payment obligations accrued before termination — will survive." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "18. Governing law and venue" }),
      /* @__PURE__ */ jsx("p", { children: "This Agreement is governed by the laws of the Commonwealth of Virginia, without regard to conflict-of-law principles. Any dispute arising out of or relating to this Agreement will be brought exclusively in the state or federal courts located in Virginia, and each party consents to the personal jurisdiction and venue of those courts." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "19. General" }),
      /* @__PURE__ */ jsx("p", { children: "This Agreement is the entire agreement between the parties regarding its subject matter and supersedes any prior discussions, understandings, or agreements (including any prior DFY Provider Agreement between the parties). Amendments must be in writing or, for amendments shepi makes to its standard form, must be re-accepted by Provider through the Platform. If any provision is held unenforceable, the remaining provisions will remain in effect. Provider may not assign this Agreement without shepi's prior written consent. shepi may assign this Agreement to an affiliate or in connection with a merger, acquisition, or sale of substantially all assets (and any assignee is bound by Provider's perpetual rights under §9). Failure to enforce any provision is not a waiver. The headings are for convenience only and do not affect interpretation. There are no third-party beneficiaries except shepi's Clients with respect to confidentiality obligations." })
    ] }),
    /* @__PURE__ */ jsxs("section", { children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-base mb-2", children: "20. Electronic acceptance" }),
      /* @__PURE__ */ jsx("p", { children: 'By clicking "Accept & Continue" below, you acknowledge that you have read, understood, and agree to be bound by all terms of this DFY Provider Agreement. This electronic acceptance constitutes your signature and has the same legal effect as a handwritten signature.' })
    ] }),
    /* @__PURE__ */ jsx("footer", { className: "pt-4 border-t text-xs text-muted-foreground", children: "SMB EDGE d/b/a shepi · Herndon, Virginia · hello@shepi.ai" })
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
  const navigate = useNavigate();
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
        cpa_user_id: user.id,
        status: "proposed"
      });
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["cpa-dfy-projects"] });
      queryClient.invalidateQueries({ queryKey: ["cpa-claims-all"] });
      toast({
        title: "Project claimed",
        description: "The client will be notified to confirm you as their reviewer."
      });
      navigate(`/cpa/engagements/${projectId}`);
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
