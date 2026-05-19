import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { s as supabase, B as Button, j as Badge } from "../main.mjs";
import { S as Spinner } from "./spinner-Cl42thGn.js";
import { u as useSidebar, S as Sidebar, a as SidebarContent, b as SidebarGroup, c as SidebarGroupLabel, d as SidebarGroupContent, e as SidebarMenu, f as SidebarMenuItem, g as SidebarMenuButton, N as NavLink, h as SidebarProvider, j as SidebarInset, i as SidebarTrigger } from "./NavLink-BDE3BHIW.js";
import { ClipboardList, Briefcase, UserCog, ArrowLeft, Bell, Check } from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-D0j9I2hv.js";
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
import "./use-mobile-BsFue-bT.js";
import "./input-RFtselAh.js";
import "./separator-BEt9dQh5.js";
import "@radix-ui/react-separator";
import "./sheet-DEVVWd_r.js";
import "@radix-ui/react-dialog";
import "@radix-ui/react-popover";
import "@radix-ui/react-scroll-area";
function useCpaCheck() {
  const [isCpa, setIsCpa] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const checkCpa = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "cpa"
      });
      if (error || !data) {
        navigate("/dashboard");
        return;
      }
      setIsCpa(true);
      setIsLoading(false);
    };
    checkCpa();
  }, [navigate]);
  return { isCpa, isLoading };
}
const menuItems = [
  { title: "Queue", url: "/cpa", icon: ClipboardList },
  { title: "My Engagements", url: "/cpa/engagements", icon: Briefcase },
  { title: "Onboarding & Profile", url: "/cpa/onboarding", icon: UserCog }
];
function CpaSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return /* @__PURE__ */ jsx(Sidebar, { collapsible: "icon", children: /* @__PURE__ */ jsxs(SidebarContent, { children: [
    /* @__PURE__ */ jsxs(SidebarGroup, { children: [
      /* @__PURE__ */ jsx(SidebarGroupLabel, { children: "CPA Portal" }),
      /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(SidebarMenu, { children: menuItems.map((item) => /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(SidebarMenuButton, { asChild: true, children: /* @__PURE__ */ jsxs(
        NavLink,
        {
          to: item.url,
          end: item.url === "/cpa",
          className: "hover:bg-muted/50",
          activeClassName: "bg-muted text-primary font-medium",
          children: [
            /* @__PURE__ */ jsx(item.icon, { className: "h-4 w-4" }),
            !collapsed && /* @__PURE__ */ jsx("span", { className: "ml-2", children: item.title })
          ]
        }
      ) }) }, item.title)) }) })
    ] }),
    /* @__PURE__ */ jsx(SidebarGroup, { className: "mt-auto", children: /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(SidebarMenu, { children: /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(SidebarMenuButton, { asChild: true, children: /* @__PURE__ */ jsxs(NavLink, { to: "/dashboard", className: "hover:bg-muted/50", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
      !collapsed && /* @__PURE__ */ jsx("span", { className: "ml-2", children: "Back to App" })
    ] }) }) }) }) }) })
  ] }) });
}
function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useQuery({
    queryKey: ["cpa-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cpa_notifications").select("*").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 6e4
  });
  useEffect(() => {
    const channel = supabase.channel("cpa-notifications-rt").on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "cpa_notifications" },
      () => qc.invalidateQueries({ queryKey: ["cpa-notifications"] })
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
  const unread = notifications.filter((n) => !n.read_at);
  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = unread.map((n) => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("cpa_notifications").update({ read_at: (/* @__PURE__ */ new Date()).toISOString() }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cpa-notifications"] })
  });
  const markOne = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("cpa_notifications").update({ read_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cpa-notifications"] })
  });
  const handleClick = (n) => {
    if (!n.read_at) markOne.mutate(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "icon", className: "relative", "aria-label": "Notifications", children: [
      /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" }),
      unread.length > 0 && /* @__PURE__ */ jsx(
        Badge,
        {
          variant: "destructive",
          className: "absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-[10px]",
          children: unread.length > 9 ? "9+" : unread.length
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs(PopoverContent, { align: "end", className: "w-96 p-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b px-3 py-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Notifications" }),
        unread.length > 0 && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "h-7 text-xs",
            onClick: () => markAllRead.mutate(),
            children: [
              /* @__PURE__ */ jsx(Check, { className: "mr-1 h-3 w-3" }),
              " Mark all read"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-96", children: notifications.length === 0 ? /* @__PURE__ */ jsx("div", { className: "px-3 py-8 text-center text-sm text-muted-foreground", children: "You're all caught up." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y", children: notifications.map((n) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleClick(n),
          className: `w-full text-left px-3 py-2.5 hover:bg-muted/50 transition ${!n.read_at ? "bg-muted/30" : ""}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
            !n.read_at && /* @__PURE__ */ jsx("span", { className: "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium truncate", children: n.title }),
              n.body && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 mt-0.5", children: n.body }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-1", children: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) })
            ] })
          ] })
        }
      ) }, n.id)) }) })
    ] })
  ] });
}
function CpaLayout() {
  const { isCpa, isLoading } = useCpaCheck();
  if (isLoading || !isCpa) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-screen bg-background", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  return /* @__PURE__ */ jsx(SidebarProvider, { children: /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen w-full", children: [
    /* @__PURE__ */ jsx(CpaSidebar, {}),
    /* @__PURE__ */ jsxs(SidebarInset, { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex h-12 items-center gap-2 border-b px-4", children: [
        /* @__PURE__ */ jsx(SidebarTrigger, {}),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "CPA Portal" }),
        /* @__PURE__ */ jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsx(NotificationBell, {}) })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 p-6", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] }) });
}
export {
  CpaLayout
};
