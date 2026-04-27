import { jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, t as toast, B as Button } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { differenceInHours, format } from "date-fns";
import { Briefcase, AlertTriangle, Filter, Trash2 } from "lucide-react";
import { useState } from "react";
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
function AdminDFYEngagements() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
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
      const { data, error } = await supabase.from("cpa_claims").select("*");
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
  const isLoading = projLoading || claimsLoading;
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  const claimMap = new Map((claims || []).map((c) => [c.project_id, c]));
  const paymentMap = new Map((payments || []).map((p) => [p.project_id, p]));
  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
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
  const counts = {
    all: rows.length,
    unclaimed: rows.filter((r) => r.status === "unclaimed").length,
    in_progress: rows.filter((r) => r.status === "in_progress").length,
    review: rows.filter((r) => r.status === "review").length,
    delivered: rows.filter((r) => r.status === "delivered").length
  };
  const filters = [
    { label: "All", value: "all" },
    { label: "Unclaimed", value: "unclaimed" },
    { label: "In Progress", value: "in_progress" },
    { label: "Review", value: "review" },
    { label: "Delivered", value: "delivered" }
  ];
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
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4 text-muted-foreground" }),
      filters.map((f) => /* @__PURE__ */ jsxs(
        Button,
        {
          variant: filter === f.value ? "default" : "outline",
          size: "sm",
          onClick: () => setFilter(f.value),
          children: [
            f.label,
            /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs", children: [
              "(",
              counts[f.value],
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
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: row.status === "unclaimed" ? "destructive" : row.status === "delivered" ? "outline" : row.status === "review" ? "secondary" : "default", children: row.status.replace(/_/g, " ") }) }),
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
            row.claim && /* @__PURE__ */ jsx(
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
          ] }) })
        ] }, row.id)),
        filtered.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "text-center py-8 text-muted-foreground", children: "No DFY engagements found" }) })
      ] })
    ] }) })
  ] });
}
export {
  AdminDFYEngagements as default
};
