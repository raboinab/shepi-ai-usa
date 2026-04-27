import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { s as supabase, t as toast, B as Button } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { T as Textarea } from "./textarea-H3ZPGfnJ.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { format, differenceInDays } from "date-fns";
import { Send, Users, FolderOpen, UserPlus, FileText, Link2, Filter, Copy, StickyNote, ChevronDown, Shield } from "lucide-react";
import { S as StatsCard } from "./StatsCard-F9h3rOrW.js";
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
import "@radix-ui/react-collapsible";
function getStage(user) {
  const daysSinceSignup = differenceInDays(/* @__PURE__ */ new Date(), new Date(user.signed_up_at));
  const daysSinceLastLogin = user.last_sign_in_at ? differenceInDays(/* @__PURE__ */ new Date(), new Date(user.last_sign_in_at)) : daysSinceSignup;
  if (user.has_completed_onboarding && user.document_count > 0) return "Active";
  if (daysSinceLastLogin >= 14 && !user.has_completed_onboarding) return "Churned";
  if (daysSinceSignup < 3) return "New";
  return "Stalled";
}
const stageBadgeVariant = {
  New: "outline",
  Stalled: "secondary",
  Active: "default",
  Churned: "destructive"
};
function AdminUsers() {
  const queryClient = useQueryClient();
  const [stageFilter, setStageFilter] = useState("All");
  const [expandedUser, setExpandedUser] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [sendingNudges, setSendingNudges] = useState(false);
  const { data: cpaRoles } = useQuery({
    queryKey: ["admin-cpa-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role").eq("role", "cpa");
      if (error) throw error;
      return new Set((data || []).map((r) => r.user_id));
    }
  });
  const toggleCpaRole = useMutation({
    mutationFn: async ({ userId, isCpa }) => {
      if (isCpa) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "cpa");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: "cpa"
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cpa-roles"] });
      toast({ title: "CPA role updated" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-engagement-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_engagement_stats");
      if (error) throw error;
      return data || [];
    }
  });
  const { data: notes } = useQuery({
    queryKey: ["admin-notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_notes").select("*").order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      return data || [];
    }
  });
  const { data: nudgeLogs } = useQuery({
    queryKey: ["admin-nudge-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nudge_log").select("*").order("sent_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      return data || [];
    }
  });
  const addNoteMutation = useMutation({
    mutationFn: async ({ userId, note }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("admin_notes").insert({
        user_id: userId,
        admin_id: user.id,
        note
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      setNewNote("");
      toast({ title: "Note added" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    toast({ title: "Email copied" });
  };
  const handleSendNudges = async () => {
    setSendingNudges(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-engagement-email");
      if (error) throw error;
      const sent = data?.sent_count || 0;
      toast({
        title: sent > 0 ? `${sent} nudge email${sent > 1 ? "s" : ""} sent` : "No nudges needed",
        description: sent > 0 ? "Check nudge logs for details" : "All users have been nudged already or are active"
      });
      queryClient.invalidateQueries({ queryKey: ["admin-nudge-logs"] });
    } catch (err) {
      toast({ title: "Error sending nudges", description: err instanceof Error ? err.message : "Unknown", variant: "destructive" });
    } finally {
      setSendingNudges(false);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  const usersWithStage = (users || []).map((u) => ({ ...u, stage: getStage(u) }));
  const filtered = stageFilter === "All" ? usersWithStage : usersWithStage.filter((u) => u.stage === stageFilter);
  const total = usersWithStage.length;
  const withProject = usersWithStage.filter((u) => u.project_count > 0).length;
  const withOnboarding = usersWithStage.filter((u) => u.has_completed_onboarding).length;
  const withDocs = usersWithStage.filter((u) => u.document_count > 0).length;
  const withQB = usersWithStage.filter((u) => u.has_qb_connection).length;
  const notesByUser = (notes || []).reduce((acc, n) => {
    (acc[n.user_id] ||= []).push(n);
    return acc;
  }, {});
  const nudgesByUser = (nudgeLogs || []).reduce((acc, n) => {
    (acc[n.user_id] ||= []).push(n);
    return acc;
  }, {});
  const stages = ["All", "New", "Stalled", "Active", "Churned"];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "User Engagement" }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleSendNudges, disabled: sendingNudges, className: "gap-2", children: [
        /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }),
        sendingNudges ? "Sending..." : "Send Nudges"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4", children: [
      /* @__PURE__ */ jsx(StatsCard, { title: "Signed Up", value: total, icon: Users }),
      /* @__PURE__ */ jsx(StatsCard, { title: "Created Project", value: withProject, icon: FolderOpen, description: `${total > 0 ? Math.round(withProject / total * 100) : 0}%` }),
      /* @__PURE__ */ jsx(StatsCard, { title: "Onboarded", value: withOnboarding, icon: UserPlus, description: `${total > 0 ? Math.round(withOnboarding / total * 100) : 0}%` }),
      /* @__PURE__ */ jsx(StatsCard, { title: "Uploaded Docs", value: withDocs, icon: FileText, description: `${total > 0 ? Math.round(withDocs / total * 100) : 0}%` }),
      /* @__PURE__ */ jsx(StatsCard, { title: "Connected QB", value: withQB, icon: Link2, description: `${total > 0 ? Math.round(withQB / total * 100) : 0}%` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4 text-muted-foreground" }),
      stages.map((s) => /* @__PURE__ */ jsxs(
        Button,
        {
          variant: stageFilter === s ? "default" : "outline",
          size: "sm",
          onClick: () => setStageFilter(s),
          children: [
            s,
            s !== "All" && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs", children: [
              "(",
              usersWithStage.filter((u) => u.stage === s).length,
              ")"
            ] })
          ]
        },
        s
      ))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Email" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Company" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Stage" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Projects" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Docs" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Last Active" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Signed Up" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Notes" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: filtered.map((user) => {
        const userNotes = notesByUser[user.user_id] || [];
        const userNudges = nudgesByUser[user.user_id] || [];
        const isExpanded = expandedUser === user.user_id;
        return /* @__PURE__ */ jsx(Collapsible, { open: isExpanded, onOpenChange: () => setExpandedUser(isExpanded ? null : user.user_id), asChild: true, children: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(TableRow, { className: "cursor-pointer", children: [
            /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: user.full_name || "No name" }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  handleCopyEmail(user.email);
                },
                className: "text-sm hover:underline text-primary flex items-center gap-1",
                title: "Click to copy",
                children: [
                  user.email,
                  " ",
                  /* @__PURE__ */ jsx(Copy, { className: "h-3 w-3" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(TableCell, { children: user.company || "-" }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: stageBadgeVariant[user.stage], children: user.stage }) }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: user.project_count }),
            /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: user.document_count }),
            /* @__PURE__ */ jsx(TableCell, { children: user.last_sign_in_at ? format(new Date(user.last_sign_in_at), "MMM d, yyyy") : "Never" }),
            /* @__PURE__ */ jsx(TableCell, { children: format(new Date(user.signed_up_at), "MMM d, yyyy") }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "gap-1", children: [
              /* @__PURE__ */ jsx(StickyNote, { className: "h-3 w-3" }),
              userNotes.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs", children: userNotes.length }),
              /* @__PURE__ */ jsx(ChevronDown, { className: `h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}` })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsx(CollapsibleContent, { asChild: true, children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 9, className: "p-4 bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(
              Button,
              {
                variant: cpaRoles?.has(user.user_id) ? "default" : "outline",
                size: "sm",
                className: "gap-1",
                onClick: () => toggleCpaRole.mutate({ userId: user.user_id, isCpa: !!cpaRoles?.has(user.user_id) }),
                disabled: toggleCpaRole.isPending,
                children: [
                  /* @__PURE__ */ jsx(Shield, { className: "h-3 w-3" }),
                  cpaRoles?.has(user.user_id) ? "CPA Role Active" : "Grant CPA Role"
                ]
              }
            ) }),
            userNudges.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground mb-1", children: "Nudges sent:" }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-2 flex-wrap", children: userNudges.map((n, i) => /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
                n.nudge_type,
                " — ",
                format(new Date(n.sent_at), "MMM d")
              ] }, i)) })
            ] }),
            userNotes.length > 0 && /* @__PURE__ */ jsx("div", { className: "space-y-1", children: userNotes.map((n) => /* @__PURE__ */ jsxs("div", { className: "text-sm border-l-2 border-primary/30 pl-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: format(new Date(n.created_at), "MMM d, h:mm a") }),
              /* @__PURE__ */ jsx("p", { children: n.note })
            ] }, n.id)) }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  placeholder: "Add a note (e.g., 'Emailed re: onboarding help')",
                  value: expandedUser === user.user_id ? newNote : "",
                  onChange: (e) => setNewNote(e.target.value),
                  className: "min-h-[60px]"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "sm",
                  disabled: !newNote.trim() || addNoteMutation.isPending,
                  onClick: () => addNoteMutation.mutate({ userId: user.user_id, note: newNote }),
                  children: "Add"
                }
              )
            ] })
          ] }) }) }) })
        ] }) }, user.user_id);
      }) })
    ] }) })
  ] });
}
export {
  AdminUsers as default
};
