import { jsx, jsxs } from "react/jsx-runtime";
import { useLocation, Outlet } from "react-router-dom";
import { u as useAdminCheck } from "./useAdminCheck-DEUH420T.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { u as useSidebar, S as Sidebar, a as SidebarContent, b as SidebarGroup, c as SidebarGroupLabel, d as SidebarGroupContent, e as SidebarMenu, f as SidebarMenuItem, g as SidebarMenuButton, N as NavLink, h as SidebarProvider, i as SidebarTrigger } from "./NavLink-CV_R1_wV.js";
import { LayoutDashboard, Users, FolderKanban, CreditCard, ShieldCheck, Mail, BookOpen, Activity, FileDown, DatabaseBackup, Briefcase, CloudUpload, ArrowLeft } from "lucide-react";
import "react";
import "../main.mjs";
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
const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Projects", url: "/admin/projects", icon: FolderKanban },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Whitelist", url: "/admin/whitelist", icon: ShieldCheck },
  { title: "Contact Forms", url: "/admin/contacts", icon: Mail },
  { title: "RAG Upload", url: "/admin/rag", icon: BookOpen },
  { title: "Diagnostics", url: "/admin/diagnostics", icon: Activity },
  { title: "Documents", url: "/admin/documents", icon: FileDown },
  { title: "Data Export", url: "/admin/data-export", icon: DatabaseBackup },
  { title: "DFY Engagements", url: "/admin/dfy-engagements", icon: Briefcase },
  { title: "Migration", url: "/admin/migration", icon: CloudUpload }
];
function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  useLocation();
  return /* @__PURE__ */ jsx(Sidebar, { collapsible: "icon", children: /* @__PURE__ */ jsxs(SidebarContent, { children: [
    /* @__PURE__ */ jsxs(SidebarGroup, { children: [
      /* @__PURE__ */ jsx(SidebarGroupLabel, { children: "Admin" }),
      /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(SidebarMenu, { children: menuItems.map((item) => /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(SidebarMenuButton, { asChild: true, children: /* @__PURE__ */ jsxs(
        NavLink,
        {
          to: item.url,
          end: item.url === "/admin",
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
function AdminLayout() {
  const { isAdmin, isLoading } = useAdminCheck();
  if (isLoading || !isAdmin) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  return /* @__PURE__ */ jsx(SidebarProvider, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex w-full", children: [
    /* @__PURE__ */ jsx(AdminSidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col", children: [
      /* @__PURE__ */ jsxs("header", { className: "h-14 border-b flex items-center px-4 bg-background", children: [
        /* @__PURE__ */ jsx(SidebarTrigger, { className: "mr-4" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Admin Portal" })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 p-6 overflow-auto", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] }) });
}
export {
  AdminLayout
};
