import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { v as useToast, s as supabase, j as Badge, B as Button } from "../main.mjs";
import { S as Spinner } from "./spinner-Cl42thGn.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-BHTmwZ8v.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle } from "./dialog-BYBu6BQa.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-WnCLmZWE.js";
import { T as Textarea } from "./textarea-AMc2tKlb.js";
import { L as Label } from "./label-DiNTC6Nb.js";
import { differenceInBusinessDays, formatDistanceToNow } from "date-fns";
import { Eye } from "lucide-react";
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
const STATUS_LABELS = {
  submitted: "Submitted",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn"
};
const STATUS_VARIANTS = {
  submitted: "default",
  in_review: "secondary",
  approved: "outline",
  rejected: "destructive",
  withdrawn: "outline"
};
function AdminCpaApplications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-cpa-applications", filter],
    queryFn: async () => {
      let q = supabase.from("cpa_applications").select("*").order("created_at", { ascending: false }).limit(1e3);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    }
  });
  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      decision_notes
    }) => {
      const { data: userResp } = await supabase.auth.getUser();
      const { error } = await supabase.from("cpa_applications").update({
        status,
        decision_notes: decision_notes ?? null,
        reviewer_user_id: userResp.user?.id ?? null,
        reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cpa-applications"] });
      toast({ title: "Application updated" });
      setSelected(null);
    },
    onError: (err) => toast({ title: "Update failed", description: err?.message, variant: "destructive" })
  });
  const promote = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.functions.invoke("promote-cpa-application", {
        body: { application_id: id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-cpa-applications"] });
      toast({
        title: "Promoted to CPA",
        description: data.invited ? "Invite email sent. They'll land on onboarding after setting their password." : "User already had an account. They can sign in and complete onboarding now."
      });
      setSelected(null);
    },
    onError: (err) => toast({ title: "Promote failed", description: err?.message, variant: "destructive" })
  });
  function openDetail(a) {
    setSelected(a);
    setNotes(a.decision_notes ?? "");
  }
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "CPA Network Applications" }),
      /* @__PURE__ */ jsxs(Select, { value: filter, onValueChange: (v) => setFilter(v), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All statuses" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "submitted", children: "Submitted" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "in_review", children: "In review" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "approved", children: "Approved" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "Rejected" }),
          /* @__PURE__ */ jsx(SelectItem, { value: "withdrawn", children: "Withdrawn" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "State · License" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Experience" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Age" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-[80px]" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: !applications?.length ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 6, className: "text-center text-muted-foreground py-8", children: "No applications yet" }) }) : applications.map((a) => {
        const ageDays = differenceInBusinessDays(/* @__PURE__ */ new Date(), new Date(a.created_at));
        const stale = a.status === "submitted" && ageDays >= 3;
        return /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxs(TableCell, { children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: a.full_name }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: a.email })
          ] }),
          /* @__PURE__ */ jsxs(TableCell, { children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: a.state_of_licensure }),
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
              " · ",
              a.license_number
            ] })
          ] }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: a.years_experience != null ? `${a.years_experience} yrs` : "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: STATUS_VARIANTS[a.status], children: STATUS_LABELS[a.status] }) }),
          /* @__PURE__ */ jsx(TableCell, { className: stale ? "text-destructive font-medium" : "text-muted-foreground text-sm", children: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => openDetail(a), children: /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }) }) })
        ] }, a.id);
      }) })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: !!selected, onOpenChange: (o) => !o && setSelected(null), children: /* @__PURE__ */ jsx(DialogContent, { className: "max-w-2xl", children: selected && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: selected.full_name }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 text-sm", children: [
        /* @__PURE__ */ jsx(Detail, { label: "Email", value: selected.email }),
        /* @__PURE__ */ jsx(Detail, { label: "Phone", value: selected.phone }),
        /* @__PURE__ */ jsx(
          Detail,
          {
            label: "State · License",
            value: `${selected.state_of_licensure} · ${selected.license_number}`
          }
        ),
        /* @__PURE__ */ jsx(
          Detail,
          {
            label: "Years experience",
            value: selected.years_experience?.toString() ?? "—"
          }
        ),
        /* @__PURE__ */ jsx(Detail, { label: "Firm affiliation", value: selected.firm_affiliation }),
        /* @__PURE__ */ jsx(
          Detail,
          {
            label: "Side work permitted",
            value: selected.side_work_permitted == null ? "—" : selected.side_work_permitted ? "Yes" : "No"
          }
        ),
        /* @__PURE__ */ jsx(Detail, { label: "LinkedIn", value: selected.linkedin_url, link: true }),
        /* @__PURE__ */ jsx(Detail, { label: "Referral source", value: selected.referral_source }),
        /* @__PURE__ */ jsx(Detail, { label: "QoE background", value: selected.qoe_background, multiline: true }),
        /* @__PURE__ */ jsx(
          Detail,
          {
            label: "Conflicts disclosure",
            value: selected.conflicts_disclosure,
            multiline: true
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Decision notes" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              rows: 3,
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              placeholder: "Why approved / rejected, follow-up needed, etc."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "secondary",
              onClick: () => updateStatus.mutate({
                id: selected.id,
                status: "in_review",
                decision_notes: notes
              }),
              disabled: updateStatus.isPending,
              children: "Mark in review"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => updateStatus.mutate({
                id: selected.id,
                status: "approved",
                decision_notes: notes
              }),
              disabled: updateStatus.isPending,
              children: "Approve"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "default",
              onClick: () => promote.mutate(selected.id),
              disabled: promote.isPending,
              children: promote.isPending ? "Promoting…" : "Approve & promote to CPA"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "destructive",
              onClick: () => updateStatus.mutate({
                id: selected.id,
                status: "rejected",
                decision_notes: notes
              }),
              disabled: updateStatus.isPending,
              children: "Reject"
            }
          )
        ] })
      ] })
    ] }) }) })
  ] });
}
function Detail({
  label,
  value,
  multiline,
  link
}) {
  if (!value) {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "—" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: label }),
    link ? /* @__PURE__ */ jsx("a", { href: value, target: "_blank", rel: "noopener noreferrer", className: "text-primary hover:underline break-all", children: value }) : multiline ? /* @__PURE__ */ jsx("div", { className: "whitespace-pre-wrap", children: value }) : /* @__PURE__ */ jsx("div", { children: value })
  ] });
}
export {
  AdminCpaApplications as default
};
