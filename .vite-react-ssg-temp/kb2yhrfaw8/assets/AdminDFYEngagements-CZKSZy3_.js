import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, t as toast, j as Badge, B as Button } from "../main.mjs";
import { S as Spinner } from "./spinner-Cl42thGn.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-BHTmwZ8v.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-BYBu6BQa.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-WnCLmZWE.js";
import { L as Label } from "./label-DiNTC6Nb.js";
import { T as Textarea } from "./textarea-AMc2tKlb.js";
import { differenceInHours, format } from "date-fns";
import { Briefcase, AlertTriangle, Filter, UserCog, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
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
import "@radix-ui/react-select";
import "@radix-ui/react-label";
const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Unclaimed", value: "unclaimed" },
  { label: "Proposed", value: "proposed" },
  { label: "Accepted", value: "accepted" },
  { label: "In Review", value: "in_review" },
  { label: "Completed", value: "completed" },
  { label: "Withdrawn", value: "withdrawn" }
];
function AdminDFYEngagements() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [reassignTarget, setReassignTarget] = useState(null);
  const [newCpaId, setNewCpaId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const { data: projects, isLoading: projLoading } = useQuery({
    queryKey: ["admin-dfy-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name, target_company, industry, created_at, client_name, user_id").eq("service_tier", "done_for_you").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ["admin-dfy-claims"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cpa_claims").select("*").is("withdrawn_at", null);
      if (error) throw error;
      return data || [];
    }
  });
  const { data: payments } = useQuery({
    queryKey: ["admin-dfy-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_payments").select("project_id, paid_at, amount").eq("status", "paid");
      if (error) throw error;
      return data || [];
    }
  });
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-cpa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name");
      if (error) throw error;
      return data || [];
    }
  });
  const { data: cpas } = useQuery({
    queryKey: ["admin-active-cpas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cpa_profiles").select("user_id, full_name, state_of_licensure, max_concurrent_engagements, active").eq("active", true).order("full_name");
      if (error) throw error;
      return data || [];
    }
  });
  const removeClaim = useMutation({
    mutationFn: async (claimId) => {
      const { error } = await supabase.from("cpa_claims").delete().eq("id", claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dfy-claims"] });
      toast({ title: "Claim removed — project returned to queue" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
  const reassignClaim = useMutation({
    mutationFn: async ({
      claim,
      newCpa,
      reason,
      projectId
    }) => {
      const { error: e1 } = await supabase.from("cpa_claims").update({
        status: "withdrawn",
        withdrawn_at: (/* @__PURE__ */ new Date()).toISOString(),
        withdrawn_reason: reason
      }).eq("id", claim.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("cpa_claims").insert({
        project_id: projectId,
        cpa_user_id: newCpa,
        status: "proposed"
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dfy-claims"] });
      toast({ title: "CPA reassigned", description: "New reviewer notified." });
      setReassignTarget(null);
      setNewCpaId("");
      setReassignReason("");
    },
    onError: (err) => {
      toast({ title: "Reassign failed", description: err.message, variant: "destructive" });
    }
  });
  const claimMap = useMemo(
    () => new Map((claims || []).map((c) => [c.project_id, c])),
    [claims]
  );
  const paymentMap = useMemo(
    () => new Map((payments || []).map((p) => [p.project_id, p])),
    [payments]
  );
  const profileMap = useMemo(
    () => new Map((profiles || []).map((p) => [p.user_id, p.full_name])),
    [profiles]
  );
  const cpaOpenCounts = useMemo(() => {
    const counts2 = /* @__PURE__ */ new Map();
    for (const c of claims || []) {
      if (["proposed", "accepted", "in_review", "in_progress", "review"].includes(c.status)) {
        counts2.set(c.cpa_user_id, (counts2.get(c.cpa_user_id) || 0) + 1);
      }
    }
    return counts2;
  }, [claims]);
  const isLoading = projLoading || claimsLoading;
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  const rows = (projects || []).map((p) => {
    const claim = claimMap.get(p.id);
    const payment = paymentMap.get(p.id);
    const status = claim ? claim.status : "unclaimed";
    const cpaName = claim ? profileMap.get(claim.cpa_user_id) || "Unknown CPA" : null;
    const hoursSinceCreation = differenceInHours(/* @__PURE__ */ new Date(), new Date(p.created_at));
    const isStale = !claim && hoursSinceCreation > 24;
    return { ...p, claim, payment, status, cpaName, hoursSinceCreation, isStale };
  });
  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const counts = STATUS_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = opt.value === "all" ? rows.length : rows.filter((r) => r.status === opt.value).length;
    return acc;
  }, {});
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Briefcase, { className: "h-6 w-6 text-primary" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "DFY Engagements" }),
      /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
        rows.length,
        " total"
      ] }),
      counts.unclaimed > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "gap-1", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }),
        counts.unclaimed,
        " unclaimed"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4 text-muted-foreground" }),
      STATUS_OPTIONS.map((f) => /* @__PURE__ */ jsxs(
        Button,
        {
          variant: filter === f.value ? "default" : "outline",
          size: "sm",
          onClick: () => setFilter(f.value),
          children: [
            f.label,
            /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs", children: [
              "(",
              counts[f.value] ?? 0,
              ")"
            ] })
          ]
        },
        f.value
      ))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Project" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Client" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Paid" }),
        /* @__PURE__ */ jsx(TableHead, { children: "CPA Assigned" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Age" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsxs(TableBody, { children: [
        filtered.map((row) => /* @__PURE__ */ jsxs(TableRow, { className: row.isStale ? "bg-destructive/5" : "", children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: row.target_company || row.name }),
          /* @__PURE__ */ jsx(TableCell, { children: row.client_name || "-" }),
          /* @__PURE__ */ jsx(TableCell, { children: row.payment?.paid_at ? format(new Date(row.payment.paid_at), "MMM d, yyyy") : "-" }),
          /* @__PURE__ */ jsx(TableCell, { children: row.cpaName || /* @__PURE__ */ jsxs("span", { className: "text-destructive font-medium flex items-center gap-1", children: [
            row.isStale && /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }),
            "Unclaimed"
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
            Badge,
            {
              variant: row.status === "unclaimed" ? "destructive" : row.status === "completed" || row.status === "delivered" ? "outline" : row.status === "in_review" || row.status === "review" ? "secondary" : "default",
              children: String(row.status).replace(/_/g, " ")
            }
          ) }),
          /* @__PURE__ */ jsx(TableCell, { children: row.hoursSinceCreation < 24 ? `${row.hoursSinceCreation}h` : `${Math.floor(row.hoursSinceCreation / 24)}d` }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => window.open(`/project/${row.id}`, "_blank"),
                children: "View"
              }
            ),
            row.claim && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => {
                    setReassignTarget({
                      claimId: row.claim.id,
                      projectLabel: row.target_company || row.name,
                      currentCpaUserId: row.claim.cpa_user_id
                    });
                    setNewCpaId("");
                    setReassignReason("");
                  },
                  children: [
                    /* @__PURE__ */ jsx(UserCog, { className: "h-3.5 w-3.5 mr-1" }),
                    "Reassign"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "text-destructive",
                  onClick: () => removeClaim.mutate(row.claim.id),
                  disabled: removeClaim.isPending,
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                }
              )
            ] })
          ] }) })
        ] }, row.id)),
        filtered.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "text-center py-8 text-muted-foreground", children: "No DFY engagements found" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      Dialog,
      {
        open: !!reassignTarget,
        onOpenChange: (open) => !open && setReassignTarget(null),
        children: /* @__PURE__ */ jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "Reassign CPA reviewer" }),
            /* @__PURE__ */ jsxs(DialogDescription, { children: [
              reassignTarget?.projectLabel,
              ". The current CPA will be marked withdrawn and the new CPA will be sent a proposal."
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "new-cpa", children: "New CPA" }),
              /* @__PURE__ */ jsxs(Select, { value: newCpaId, onValueChange: setNewCpaId, children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "new-cpa", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a CPA…" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: (cpas || []).filter((c) => c.user_id !== reassignTarget?.currentCpaUserId).map((c) => {
                  const open = cpaOpenCounts.get(c.user_id) || 0;
                  const atCap = open >= (c.max_concurrent_engagements ?? 3);
                  return /* @__PURE__ */ jsxs(
                    SelectItem,
                    {
                      value: c.user_id,
                      disabled: atCap,
                      children: [
                        c.full_name,
                        " (",
                        c.state_of_licensure,
                        ") —",
                        " ",
                        open,
                        "/",
                        c.max_concurrent_engagements ?? 3,
                        atCap ? " • at capacity" : ""
                      ]
                    },
                    c.user_id
                  );
                }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "reason", children: "Reason" }),
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  id: "reason",
                  value: reassignReason,
                  onChange: (e) => setReassignReason(e.target.value),
                  placeholder: "Why is this CPA being replaced? (e.g. unresponsive, conflict, client requested change)",
                  rows: 3
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                onClick: () => setReassignTarget(null),
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => {
                  if (!reassignTarget || !newCpaId || !reassignReason.trim()) {
                    toast({
                      title: "Missing info",
                      description: "Pick a CPA and provide a reason.",
                      variant: "destructive"
                    });
                    return;
                  }
                  const claim = (claims || []).find((c) => c.id === reassignTarget.claimId);
                  if (!claim) return;
                  reassignClaim.mutate({
                    claim,
                    newCpa: newCpaId,
                    reason: reassignReason.trim(),
                    projectId: claim.project_id
                  });
                },
                disabled: reassignClaim.isPending,
                children: reassignClaim.isPending ? "Reassigning…" : "Reassign"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
export {
  AdminDFYEngagements as default
};
