import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { s as supabase } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { u as useSidebar, S as Sidebar, a as SidebarContent, b as SidebarGroup, c as SidebarGroupLabel, d as SidebarGroupContent, e as SidebarMenu, f as SidebarMenuItem, g as SidebarMenuButton, N as NavLink, h as SidebarProvider, j as SidebarInset, i as SidebarTrigger } from "./NavLink-CV_R1_wV.js";
import { ClipboardList, Briefcase, ArrowLeft } from "lucide-react";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "./use-mobile-hSLzflml.js";
import "@radix-ui/react-dialog";
import "./input-CSM87NBF.js";
import "./separator-BGlMS6na.js";
import "@radix-ui/react-separator";
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
  { title: "My Engagements", url: "/cpa/engagements", icon: Briefcase }
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
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "CPA Portal" })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 p-6", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] }) });
}
export {
  CpaLayout
};
