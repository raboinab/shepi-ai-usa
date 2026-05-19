import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, t as toast, B as Button, j as Badge, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, f as CardContent } from "../main.mjs";
import { S as Spinner } from "./spinner-Cl42thGn.js";
import { T as Textarea } from "./textarea-AMc2tKlb.js";
import { I as Input } from "./input-RFtselAh.js";
import { L as Label } from "./label-DiNTC6Nb.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-BYBu6BQa.js";
import { ArrowLeft, Send, AlertCircle, CheckCircle2, Pencil, XCircle } from "lucide-react";
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
import "@radix-ui/react-label";
import "@radix-ui/react-dialog";
function CpaEngagement() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [editing, setEditing] = useState({});
  const { data, isLoading } = useQuery({
    queryKey: ["cpa-engagement", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: claim2, error: claimErr } = await supabase.from("cpa_claims").select("id, status, claimed_at, accepted_at, completed_at, completion_summary, cpa_user_id").eq("project_id", projectId).eq("cpa_user_id", user.id).order("claimed_at", { ascending: false }).limit(1).maybeSingle();
      if (claimErr) throw claimErr;
      if (!claim2) throw new Error("Claim not found");
      const { data: project2 } = await supabase.from("projects").select("id, name, target_company, client_name, industry, transaction_type").eq("id", projectId).maybeSingle();
      const { data: proposals2 } = await supabase.from("adjustment_proposals").select("id, title, description, proposed_amount, ai_rationale, evidence_strength, block, adjustment_class").eq("project_id", projectId).order("internal_score", { ascending: false });
      const { data: reviews2 } = await supabase.from("cpa_adjustment_reviews").select("*").eq("claim_id", claim2.id);
      return { claim: claim2, project: project2, proposals: proposals2 || [], reviews: reviews2 || [] };
    }
  });
  const upsertReview = useMutation({
    mutationFn: async (args) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !data?.claim) throw new Error("Not ready");
      const payload = {
        claim_id: data.claim.id,
        proposal_id: args.proposalId,
        project_id: projectId,
        cpa_user_id: user.id,
        decision: args.decision,
        cpa_note: args.note || null,
        modified_amount: args.amount ? Number(args.amount) : null,
        reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error } = await supabase.from("cpa_adjustment_reviews").upsert(payload, { onConflict: "claim_id,proposal_id" });
      if (error) throw error;
      if (data.claim.status === "accepted" || data.claim.status === "proposed") {
        await supabase.from("cpa_claims").update({ status: "in_review" }).eq("id", data.claim.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cpa-engagement", projectId] });
      toast({ title: "Review saved" });
    },
    onError: (e) => toast({ title: "Save failed", description: e.message, variant: "destructive" })
  });
  const completeEngagement = useMutation({
    mutationFn: async () => {
      if (!data?.claim) throw new Error("No claim");
      const { error } = await supabase.from("cpa_claims").update({
        status: "completed",
        completed_at: (/* @__PURE__ */ new Date()).toISOString(),
        completion_summary: summary
      }).eq("id", data.claim.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setCompleteOpen(false);
      qc.invalidateQueries({ queryKey: ["cpa-engagement", projectId] });
      toast({ title: "Engagement completed", description: "The client has been notified." });
    },
    onError: (e) => toast({ title: "Could not complete", description: e.message, variant: "destructive" })
  });
  const withdraw = useMutation({
    mutationFn: async () => {
      if (!data?.claim) throw new Error("No claim");
      const reason = prompt("Reason for withdrawing (visible to admin):") || "";
      const { error } = await supabase.from("cpa_claims").update({
        status: "withdrawn",
        withdrawn_at: (/* @__PURE__ */ new Date()).toISOString(),
        withdrawn_reason: reason
      }).eq("id", data.claim.id);
      if (error) throw error;
    },
    onSuccess: () => {
      navigate("/cpa/engagements");
      toast({ title: "Withdrew from engagement" });
    }
  });
  if (isLoading) return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  if (!data) return /* @__PURE__ */ jsx("div", { className: "p-6", children: "Engagement not found." });
  const { claim, project, proposals, reviews } = data;
  const reviewMap = new Map(reviews.map((r) => [r.proposal_id, r]));
  const reviewedCount = reviews.length;
  const total = proposals.length;
  const allReviewed = total > 0 && reviewedCount >= total;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate("/cpa/engagements"), className: "gap-2", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      " Back to engagements"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: project?.target_company || project?.name }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "Client: ",
          project?.client_name || "—",
          " • ",
          project?.industry || ""
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "capitalize", children: claim.status.replace(/_/g, " ") }),
        claim.status !== "completed" && claim.status !== "withdrawn" && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => withdraw.mutate(), children: "Withdraw" }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            disabled: !allReviewed || claim.status === "completed",
            onClick: () => setCompleteOpen(true),
            children: [
              /* @__PURE__ */ jsx(Send, { className: "h-4 w-4 mr-2" }),
              "Complete engagement"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Adjustment review" }),
        /* @__PURE__ */ jsxs(CardDescription, { children: [
          "Reviewed ",
          reviewedCount,
          " of ",
          total,
          ". Confirm, modify, or reject each AI-flagged adjustment."
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: total === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        "No adjustment proposals have been generated yet for this project."
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: proposals.map((p) => {
        const r = reviewMap.get(p.id);
        const edit = editing[p.id] || { note: r?.cpa_note || "", amount: r?.modified_amount?.toString() || "" };
        const setEdit = (next) => setEditing((s) => ({ ...s, [p.id]: next }));
        return /* @__PURE__ */ jsx(Card, { className: "border-border", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: p.title }),
                p.evidence_strength && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-xs capitalize", children: [
                  p.evidence_strength,
                  " evidence"
                ] })
              ] }),
              p.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: p.description }),
              p.proposed_amount != null && /* @__PURE__ */ jsxs("p", { className: "text-sm mt-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Proposed: " }),
                /* @__PURE__ */ jsxs("span", { className: "font-mono", children: [
                  "$",
                  Number(p.proposed_amount).toLocaleString()
                ] })
              ] }),
              p.ai_rationale && /* @__PURE__ */ jsxs("details", { className: "mt-2", children: [
                /* @__PURE__ */ jsx("summary", { className: "text-xs text-muted-foreground cursor-pointer", children: "AI rationale" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 whitespace-pre-wrap", children: p.ai_rationale })
              ] })
            ] }),
            r && /* @__PURE__ */ jsx(
              Badge,
              {
                variant: r.decision === "confirmed" ? "default" : r.decision === "rejected" ? "destructive" : "secondary",
                className: "capitalize shrink-0",
                children: r.decision
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-2 sm:grid-cols-[1fr_auto]", children: [
            /* @__PURE__ */ jsx(
              Textarea,
              {
                placeholder: "Note (required for modify/reject; optional for confirm)",
                value: edit.note,
                onChange: (e) => setEdit({ ...edit, note: e.target.value }),
                rows: 2
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs", children: "Modified amount" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  placeholder: "optional",
                  value: edit.amount,
                  onChange: (e) => setEdit({ ...edit, amount: e.target.value }),
                  className: "w-32"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "default",
                onClick: () => upsertReview.mutate({ proposalId: p.id, decision: "confirmed", note: edit.note }),
                children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 mr-1" }),
                  " Confirm"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "secondary",
                disabled: !edit.note.trim(),
                onClick: () => upsertReview.mutate({ proposalId: p.id, decision: "modified", note: edit.note, amount: edit.amount }),
                children: [
                  /* @__PURE__ */ jsx(Pencil, { className: "h-4 w-4 mr-1" }),
                  " Modify"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "destructive",
                disabled: !edit.note.trim(),
                onClick: () => upsertReview.mutate({ proposalId: p.id, decision: "rejected", note: edit.note }),
                children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 mr-1" }),
                  " Reject"
                ]
              }
            )
          ] })
        ] }) }, p.id);
      }) }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: completeOpen, onOpenChange: setCompleteOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Complete engagement" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Send a short summary to the client. They'll be notified the review is complete." })
      ] }),
      /* @__PURE__ */ jsx(
        Textarea,
        {
          placeholder: "Summary of review (key findings, anything the client should know)…",
          rows: 6,
          value: summary,
          onChange: (e) => setSummary(e.target.value)
        }
      ),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setCompleteOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => completeEngagement.mutate(), disabled: !summary.trim() || completeEngagement.isPending, children: completeEngagement.isPending ? "Submitting…" : "Submit & notify client" })
      ] })
    ] }) })
  ] });
}
export {
  CpaEngagement as default
};
