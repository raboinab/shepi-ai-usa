import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, t as toast, C as Card, b as CardHeader, d as CardTitle, f as CardContent, B as Button } from "../main.mjs";
import { S as StatsCard } from "./StatsCard-F9h3rOrW.js";
import { I as Input } from "./input-CSM87NBF.js";
import { L as Label } from "./label-B2r_8dgk.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell, f as TableFooter } from "./table-CVoj8f5R.js";
import { Users, FolderKanban, CreditCard, Mail, Eye, Sparkles } from "lucide-react";
import { S as Spinner } from "./spinner-DXdBpr08.js";
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
import "@radix-ui/react-label";
const PAGE_LABELS = {
  demo_video: "Watch Demo",
  wizard: "Wizard Demo",
  workbook: "Workbook Demo",
  dashboard: "Dashboard Demo"
};
function AdminDashboard() {
  const queryClient = useQueryClient();
  const [newSpots, setNewSpots] = useState("");
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, projects, subscriptions, contacts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("contact_submissions").select("id", { count: "exact", head: true })
      ]);
      return {
        users: profiles.count ?? 0,
        projects: projects.count ?? 0,
        activeSubscriptions: subscriptions.count ?? 0,
        contacts: contacts.count ?? 0
      };
    }
  });
  const { data: promoData } = useQuery({
    queryKey: ["admin-promo-spots"],
    queryFn: async () => {
      const { data } = await supabase.from("promo_config").select("value").eq("key", "early_adopter_spots").single();
      return data?.value ?? 0;
    }
  });
  const { data: demoViews } = useQuery({
    queryKey: ["admin-demo-views"],
    queryFn: async () => {
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase.from("demo_views").select("page, user_id, viewed_at").gte("viewed_at", thirtyDaysAgo.toISOString());
      return data ?? [];
    }
  });
  const demoStats = useMemo(() => {
    if (!demoViews) return [];
    const grouped = {};
    for (const row of demoViews) {
      if (!grouped[row.page]) grouped[row.page] = { views: 0, users: /* @__PURE__ */ new Set() };
      grouped[row.page].views++;
      grouped[row.page].users.add(row.user_id);
    }
    return Object.entries(grouped).map(([page, s]) => ({ page, label: PAGE_LABELS[page] ?? page, views: s.views, unique: s.users.size })).sort((a, b) => b.views - a.views);
  }, [demoViews]);
  const demoTotals = useMemo(() => {
    const allUsers = new Set(demoViews?.map((r) => r.user_id));
    return { views: demoViews?.length ?? 0, unique: allUsers.size };
  }, [demoViews]);
  const updateSpots = useMutation({
    mutationFn: async (value) => {
      const { data, error } = await supabase.functions.invoke("update-promo-config", {
        body: { key: "early_adopter_spots", value }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-spots"] });
      toast({ title: "Updated", description: `Spots set to ${data.value}` });
      setNewSpots("");
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Dashboard" }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(StatsCard, { title: "Total Users", value: stats?.users ?? 0, icon: Users }),
      /* @__PURE__ */ jsx(StatsCard, { title: "Total Projects", value: stats?.projects ?? 0, icon: FolderKanban }),
      /* @__PURE__ */ jsx(StatsCard, { title: "Active Subscriptions", value: stats?.activeSubscriptions ?? 0, icon: CreditCard }),
      /* @__PURE__ */ jsx(StatsCard, { title: "Contact Submissions", value: stats?.contacts ?? 0, icon: Mail })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-lg font-semibold", children: "Demo Views (Last 30 Days)" }),
        /* @__PURE__ */ jsx(Eye, { className: "h-5 w-5 text-muted-foreground" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Page" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Views" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Unique Users" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: demoStats.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 3, className: "text-center text-muted-foreground", children: "No views yet" }) }) : demoStats.map((row) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: row.label }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: row.views }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: row.unique })
        ] }, row.page)) }),
        demoStats.length > 0 && /* @__PURE__ */ jsx(TableFooter, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-semibold", children: "Total" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right font-semibold", children: demoTotals.views }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right font-semibold", children: demoTotals.unique })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-lg font-semibold", children: "Early Adopter Promo Control" }),
        /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-amber-500" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Current spots:" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold", children: promoData ?? "—" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1.5", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "spots-input", children: "Set spots to" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "spots-input",
                type: "number",
                min: 0,
                max: 100,
                placeholder: "e.g. 35",
                value: newSpots,
                onChange: (e) => setNewSpots(e.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => updateSpots.mutate(Number(newSpots)),
              disabled: !newSpots || updateSpots.isPending,
              children: "Update"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "outline",
              onClick: () => updateSpots.mutate(50),
              disabled: updateSpots.isPending,
              children: "Reset to 50"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminDashboard as default
};
