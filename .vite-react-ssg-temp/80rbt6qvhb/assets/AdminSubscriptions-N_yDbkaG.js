import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { s as supabase } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { format } from "date-fns";
import "vite-react-ssg";
import "react";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
function AdminSubscriptions() {
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      return data;
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
        return "default";
      case "canceled":
        return "destructive";
      case "past_due":
        return "destructive";
      default:
        return "secondary";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Subscriptions" }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Plan" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Period Start" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Period End" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Stripe Customer" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: subscriptions?.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "text-center text-muted-foreground", children: "No subscriptions found" }) }) : subscriptions?.map((sub) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: sub.plan_type }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: getStatusVariant(sub.status), children: sub.status }) }),
        /* @__PURE__ */ jsx(TableCell, { children: sub.current_period_start ? format(new Date(sub.current_period_start), "MMM d, yyyy") : "-" }),
        /* @__PURE__ */ jsx(TableCell, { children: sub.current_period_end ? format(new Date(sub.current_period_end), "MMM d, yyyy") : "-" }),
        /* @__PURE__ */ jsx(TableCell, { className: "font-mono text-xs", children: sub.stripe_customer_id || "-" })
      ] }, sub.id)) })
    ] }) })
  ] });
}
export {
  AdminSubscriptions as default
};
