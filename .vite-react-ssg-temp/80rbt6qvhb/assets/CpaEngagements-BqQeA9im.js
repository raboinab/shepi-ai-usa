import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, t as toast, C as Card, f as CardContent, b as CardHeader, d as CardTitle, e as CardDescription, B as Button } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Briefcase, MessageCircle, ExternalLink } from "lucide-react";
import { E as EngagementChat } from "./EngagementChat-D_SRSsxn.js";
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
import "@radix-ui/react-select";
import "./textarea-H3ZPGfnJ.js";
const statusColors = {
  in_progress: "default",
  review: "secondary",
  delivered: "outline"
};
function CpaEngagements() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chatOpenFor, setChatOpenFor] = useState(null);
  const { data: engagements, isLoading } = useQuery({
    queryKey: ["cpa-my-engagements"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: claims, error: claimsErr } = await supabase.from("cpa_claims").select("id, project_id, status, claimed_at, notes, updated_at").eq("cpa_user_id", user.id).order("claimed_at", { ascending: false });
      if (claimsErr) throw claimsErr;
      if (!claims || claims.length === 0) return [];
      const projectIds = claims.map((c) => c.project_id);
      const { data: projects, error: projErr } = await supabase.from("projects").select("id, name, target_company, industry, transaction_type, client_name").in("id", projectIds);
      if (projErr) throw projErr;
      const projectMap = new Map((projects || []).map((p) => [p.id, p]));
      return claims.map((c) => ({
        ...c,
        project: projectMap.get(c.project_id)
      }));
    }
  });
  const updateStatusMutation = useMutation({
    mutationFn: async ({ claimId, status }) => {
      const { error } = await supabase.from("cpa_claims").update({ status }).eq("id", claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cpa-my-engagements"] });
      toast({ title: "Status updated" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Briefcase, { className: "h-6 w-6 text-primary" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "My Engagements" }),
      /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: (engagements || []).length })
    ] }),
    !engagements || engagements.length === 0 ? /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "py-12 text-center text-muted-foreground", children: "You haven't claimed any projects yet. Check the queue for available engagements." }) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: engagements.map((eng) => /* @__PURE__ */ jsxs(Card, { className: "flex flex-col", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: eng.project?.target_company || eng.project?.name || "Project" }),
          /* @__PURE__ */ jsx(Badge, { variant: statusColors[eng.status] || "outline", children: eng.status.replace(/_/g, " ") })
        ] }),
        /* @__PURE__ */ jsxs(CardDescription, { children: [
          eng.project?.client_name || "Client",
          " • Claimed ",
          format(new Date(eng.claimed_at), "MMM d, yyyy")
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col flex-1 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
          eng.project?.industry && /* @__PURE__ */ jsx("span", { children: eng.project.industry }),
          eng.project?.transaction_type && /* @__PURE__ */ jsxs("span", { className: "ml-2 capitalize", children: [
            "• ",
            eng.project.transaction_type.replace(/_/g, " ")
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Status:" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: eng.status,
              onValueChange: (value) => updateStatusMutation.mutate({ claimId: eng.id, status: value }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "h-7 text-xs w-[130px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "in_progress", children: "In Progress" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "review", children: "Review" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "delivered", children: "Delivered" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-auto pt-3 space-y-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full gap-2",
              onClick: () => setChatOpenFor(chatOpenFor === eng.project_id ? null : eng.project_id),
              children: [
                /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }),
                "Message Client"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: "w-full gap-2",
              onClick: () => navigate(`/project/${eng.project_id}`),
              children: [
                /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4" }),
                "Open Project"
              ]
            }
          )
        ] }),
        chatOpenFor === eng.project_id && /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx(
          EngagementChat,
          {
            projectId: eng.project_id,
            onClose: () => setChatOpenFor(null),
            selfLabel: "Analyst",
            otherLabel: "Client"
          }
        ) })
      ] })
    ] }, eng.id)) })
  ] });
}
export {
  CpaEngagements as default
};
