import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { C as Card, f as CardContent, B as Button, u as useSEO, t as toast, s as supabase, S as ShepiLogo, b as CardHeader, d as CardTitle, e as CardDescription, P as PRICING, a as clearOAuthProcessedFlag, i as trackEvent } from "../main.mjs";
import { ArrowRight, X, User, LogOut, CreditCard, Plus, Lock, FolderOpen, Archive, CheckCircle, FileEdit, Clock, Users, Trash2 } from "lucide-react";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription } from "./dialog-sNpTUd89.js";
import { I as Input } from "./input-CSM87NBF.js";
import { L as Label } from "./label-B2r_8dgk.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { u as useSubscription } from "./useSubscription-fJr4XAL_.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CKdO6TGo.js";
import { u as useTosAcceptance, T as TermsAcceptanceModal } from "./TermsAcceptanceModal-DCI1QJ_5.js";
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
import "@radix-ui/react-dialog";
import "@radix-ui/react-label";
import "@radix-ui/react-select";
import "@radix-ui/react-alert-dialog";
import "./checkbox-3bpvUXl3.js";
import "@radix-ui/react-checkbox";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
function WelcomeBackBanner({ userId, projects }) {
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const key = `welcome_back_dismissed_${userId}`;
    if (sessionStorage.getItem(key)) return;
    const hasIncompleteOnly = projects.length === 0 || projects.every((p) => p.status === "draft" && p.current_phase <= 1);
    setShow(hasIncompleteOnly);
  }, [userId, projects]);
  if (!show || dismissed) return null;
  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(`welcome_back_dismissed_${userId}`, "true");
  };
  const incompleteProject = projects.find((p) => p.status === "draft");
  return /* @__PURE__ */ jsx(Card, { className: "border-primary/30 bg-primary/5", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-center justify-between py-4 px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm", children: "Welcome back! 👋" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: incompleteProject ? `Continue setting up "${incompleteProject.name}" — connect your data and generate your QoE report.` : "Create your first project to start your Quality of Earnings analysis." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 ml-4", children: [
      incompleteProject ? /* @__PURE__ */ jsx(Link, { to: `/project/${incompleteProject.id}`, children: /* @__PURE__ */ jsxs(Button, { size: "sm", className: "gap-1", children: [
        "Continue ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3" })
      ] }) }) : /* @__PURE__ */ jsxs(Button, { size: "sm", className: "gap-1", onClick: () => {
        document.querySelector("[data-create-project]")?.click();
      }, children: [
        "Create Project ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3" })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: handleDismiss, children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
    ] })
  ] }) });
}
const statusIcons = {
  draft: Clock,
  "in-progress": FileEdit,
  completed: CheckCircle,
  archived: Archive
};
const Dashboard = () => {
  const __seoTags = useSEO({ title: "Dashboard — shepi", noindex: true });
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [overageDialogOpen, setOverageDialogOpen] = useState(false);
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tosModalOpen, setTosModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [newProject, setNewProject] = useState({
    name: "",
    client_name: "",
    target_company: "",
    transaction_type: "buy-side"
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasActiveSubscription, paidProjects, projectCredits, activeProjectCount, monthlyProjectLimit, loading: subscriptionLoading, hasAccessToProject, canCreateProjects, isAtMonthlyLimit, checkSubscription } = useSubscription();
  const { hasAccepted } = useTosAcceptance();
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast({ title: "Payment successful!", description: "Thank you for your purchase." });
      checkSubscription();
    }
  }, [searchParams, checkSubscription]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchProjects(session.user);
      }
    });
  }, [navigate]);
  const fetchProjects = async (currentUser) => {
    setLoading(true);
    try {
      const [projectsRes, sharesRes] = await Promise.all([
        supabase.from("projects").select("id, name, client_name, target_company, transaction_type, status, current_phase, created_at, updated_at, funded_by_credit, user_id").order("updated_at", { ascending: false }),
        supabase.from("project_shares").select("project_id")
      ]);
      if (projectsRes.error) {
        toast({
          title: "Error loading projects",
          description: projectsRes.error.message,
          variant: "destructive"
        });
      } else {
        const currentUserId = currentUser?.id ?? user?.id;
        const sharedIds = new Set((sharesRes.data || []).map((s) => s.project_id));
        const myProjects = (projectsRes.data || []).filter(
          (p) => p.user_id === currentUserId || sharedIds.has(p.id)
        );
        setProjects(myProjects);
      }
    } catch (err) {
      toast({
        title: "Error loading projects",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
    setLoading(false);
  };
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project.",
        variant: "destructive"
      });
      return;
    }
    if (isAtMonthlyLimit()) {
      setCreateDialogOpen(false);
      setOverageDialogOpen(true);
      return;
    }
    if (!canCreateProjects()) {
      toast({
        title: "Subscription required",
        description: "You need an active subscription or a project credit to create new projects.",
        variant: "destructive"
      });
      setCreateDialogOpen(false);
      navigate("/pricing");
      return;
    }
    const useCredit = !hasActiveSubscription && projectCredits > 0;
    if (useCredit && !hasAccepted) {
      setPendingAction(() => () => doCreateProject(useCredit));
      setCreateDialogOpen(false);
      setTosModalOpen(true);
      return;
    }
    await doCreateProject(useCredit);
  };
  const doCreateProject = async (useCredit) => {
    let serviceTier = "diy";
    if (useCredit) {
      const { data: creditData } = await supabase.from("user_credits").select("credit_type").eq("user_id", user?.id).single();
      if (creditData?.credit_type === "done_for_you") {
        serviceTier = "done_for_you";
      }
    }
    const { data, error } = await supabase.from("projects").insert({
      user_id: user?.id,
      name: newProject.name,
      client_name: newProject.client_name || null,
      target_company: newProject.target_company || null,
      transaction_type: newProject.transaction_type,
      funded_by_credit: useCredit,
      service_tier: serviceTier
    }).select().single();
    if (error) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    if (useCredit) {
      const newCredits = projectCredits - 1;
      const creditExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1e3).toISOString();
      await Promise.all([
        supabase.from("user_credits").update({ credits_remaining: newCredits, credit_type: "per_project" }).eq("user_id", user?.id),
        supabase.from("projects").update({ credit_expires_at: creditExpiresAt }).eq("id", data.id)
      ]);
      console.log("[Dashboard] Credit consumed, remaining:", newCredits, "expires:", creditExpiresAt);
    }
    trackEvent("project_created", {
      project_id: data.id,
      service_tier: serviceTier,
      funded_by_credit: useCredit,
      transaction_type: newProject.transaction_type
    });
    toast({
      title: "Project created!"
    });
    setCreateDialogOpen(false);
    setNewProject({ name: "", client_name: "", target_company: "", transaction_type: "buy-side" });
    navigate(`/project/${data.id}`);
  };
  const handleProjectClick = (project) => {
    if (hasAccessToProject(project.id)) {
      navigate(`/project/${project.id}`);
    } else {
      setSelectedProjectForPayment(project);
      setPaymentDialogOpen(true);
    }
  };
  const handlePayForProject = async () => {
    if (!selectedProjectForPayment) return;
    if (!hasAccepted) {
      setPendingAction(() => () => doPayForProject());
      setPaymentDialogOpen(false);
      setTosModalOpen(true);
      return;
    }
    await doPayForProject();
  };
  const doPayForProject = async () => {
    if (!selectedProjectForPayment) return;
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planType: "per_project", projectId: selectedProjectForPayment.id }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive"
      });
    } finally {
      setCheckoutLoading(false);
      setPaymentDialogOpen(false);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    clearOAuthProcessedFlag();
    navigate("/");
  };
  const handleDeleteProject = (project, e) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const { error } = await supabase.from("projects").delete().eq("id", projectToDelete.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Project deleted", description: "Your project has been permanently deleted." });
      fetchProjects();
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    __seoTags,
    /* @__PURE__ */ jsx(
      TermsAcceptanceModal,
      {
        open: tosModalOpen,
        onOpenChange: setTosModalOpen,
        onAccepted: () => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "border-b border-border bg-card", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(ShepiLogo, { variant: "dark", size: "md" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Link, { to: "/account", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
          " Account"
        ] }) }),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: user?.email }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: handleLogout, children: /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }) })
      ] })
    ] }) }),
    !subscriptionLoading && !hasActiveSubscription && /* @__PURE__ */ jsx("div", { className: "bg-primary/10 border-b border-primary/20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm", children: "You don't have an active subscription. Subscribe to create unlimited projects." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/pricing", children: /* @__PURE__ */ jsx(Button, { size: "sm", children: "View Plans" }) })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-8", children: [
      user && /* @__PURE__ */ jsx(
        WelcomeBackBanner,
        {
          userId: user.id,
          projects: projects.map((p) => ({ id: p.id, name: p.name, current_phase: p.current_phase, status: p.status }))
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 mt-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-serif font-bold", children: "Your Projects" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Manage your Quality of Earnings analyses" })
        ] }),
        /* @__PURE__ */ jsxs(Dialog, { open: createDialogOpen, onOpenChange: setCreateDialogOpen, children: [
          /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { className: "gap-2", disabled: !canCreateProjects(), children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            " New Project",
            !canCreateProjects() && /* @__PURE__ */ jsx(Lock, { className: "w-3 h-3 ml-1" }),
            !hasActiveSubscription && projectCredits > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs bg-primary-foreground/20 px-1 rounded", children: [
              projectCredits,
              " credit",
              projectCredits !== 1 ? "s" : ""
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsx(DialogTitle, { children: "Create New QoE Project" }),
              /* @__PURE__ */ jsx(DialogDescription, { children: "Set up the basic information for your analysis" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "projectName", children: "Project Name *" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "projectName",
                    placeholder: "e.g., Q4 2024 Acquisition Analysis",
                    value: newProject.name,
                    onChange: (e) => setNewProject({ ...newProject, name: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "clientName", children: "Client Name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "clientName",
                    placeholder: "e.g., ABC Capital Partners",
                    value: newProject.client_name,
                    onChange: (e) => setNewProject({ ...newProject, client_name: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "targetCompany", children: "Target Company" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "targetCompany",
                    placeholder: "e.g., XYZ Manufacturing Inc.",
                    value: newProject.target_company,
                    onChange: (e) => setNewProject({ ...newProject, target_company: e.target.value })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "transactionType", children: "Transaction Type" }),
                /* @__PURE__ */ jsxs(
                  Select,
                  {
                    value: newProject.transaction_type,
                    onValueChange: (value) => setNewProject({ ...newProject, transaction_type: value }),
                    children: [
                      /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                      /* @__PURE__ */ jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsx(SelectItem, { value: "buy-side", children: "Buy-Side" }),
                        /* @__PURE__ */ jsx(SelectItem, { value: "sell-side", children: "Sell-Side" })
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(Button, { className: "w-full", onClick: handleCreateProject, children: "Create Project" })
            ] })
          ] })
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxs(Card, { className: "animate-pulse", children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx("div", { className: "h-6 bg-muted rounded w-3/4" }),
          /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted rounded w-1/2 mt-2" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted rounded w-full" }) })
      ] }, i)) }) : projects.length === 0 ? /* @__PURE__ */ jsx(Card, { className: "border-dashed", children: /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [
        /* @__PURE__ */ jsx(FolderOpen, { className: "w-12 h-12 text-muted-foreground mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: "No projects yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center mb-4", children: canCreateProjects() ? projectCredits > 0 && !hasActiveSubscription ? `You have ${projectCredits} project credit${projectCredits !== 1 ? "s" : ""} — create your first project` : "Create your first QoE project to get started" : "Subscribe to create your first QoE project" }),
        canCreateProjects() ? /* @__PURE__ */ jsxs(Button, { onClick: () => setCreateDialogOpen(true), className: "gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " Create Project"
        ] }) : /* @__PURE__ */ jsx(Link, { to: "/pricing", children: /* @__PURE__ */ jsxs(Button, { className: "gap-2", children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "w-4 h-4" }),
          " View Plans"
        ] }) })
      ] }) }) : /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: [...projects].sort((a, b) => {
        const aOwned = a.user_id === user?.id;
        const bOwned = b.user_id === user?.id;
        if (aOwned && !bOwned) return -1;
        if (!aOwned && bOwned) return 1;
        return 0;
      }).map((project) => {
        const StatusIcon = statusIcons[project.status] || Clock;
        const hasAccess = hasAccessToProject(project.id);
        const isShared = project.user_id !== user?.id;
        return /* @__PURE__ */ jsx("div", { onClick: () => handleProjectClick(project), className: "cursor-pointer", children: /* @__PURE__ */ jsxs(Card, { className: `hover:border-primary transition-colors h-full ${!hasAccess ? "opacity-75" : ""}`, children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: project.name }),
                isShared && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full", children: [
                  /* @__PURE__ */ jsx(Users, { className: "w-3 h-3" }),
                  " Shared"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                !hasAccess && /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-muted-foreground" }),
                /* @__PURE__ */ jsx(StatusIcon, { className: "w-5 h-5 text-muted-foreground" }),
                !isShared && /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "icon",
                    className: "h-8 w-8 text-muted-foreground hover:text-destructive",
                    onClick: (e) => handleDeleteProject(project, e),
                    children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { children: project.target_company || "No target company specified" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground capitalize", children: project.transaction_type?.replace("-", " ") }),
              /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                "Phase ",
                project.current_phase,
                "/7"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
              "div",
              {
                className: "h-full bg-primary transition-all",
                style: { width: `${project.current_phase / 7 * 100}%` }
              }
            ) }),
            !hasAccess && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-2 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(CreditCard, { className: "w-3 h-3" }),
              " Payment required to access"
            ] })
          ] })
        ] }) }, project.id);
      }) })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: overageDialogOpen, onOpenChange: setOverageDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Project Limit Reached" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          "Your Monthly plan includes ",
          monthlyProjectLimit,
          " concurrent projects. You currently have ",
          activeProjectCount,
          " active project",
          activeProjectCount !== 1 ? "s" : "",
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "pt-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "font-semibold", children: "Purchase Additional Slot" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "One-time payment for one extra project" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold", children: [
            "$",
            PRICING.monthly.overagePerProject.toLocaleString()
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx(
          Button,
          {
            className: "w-full",
            disabled: checkoutLoading,
            onClick: async () => {
              setCheckoutLoading(true);
              try {
                const { data, error } = await supabase.functions.invoke("create-checkout", {
                  body: { planType: "monthly_overage" }
                });
                if (error) throw error;
                if (data?.url) window.open(data.url, "_blank");
              } catch (err) {
                toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to start checkout", variant: "destructive" });
              } finally {
                setCheckoutLoading(false);
                setOverageDialogOpen(false);
              }
            },
            children: checkoutLoading ? "Redirecting..." : `Purchase Additional Slot ($${PRICING.monthly.overagePerProject.toLocaleString()})`
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: paymentDialogOpen, onOpenChange: setPaymentDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Unlock This Project" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          `Choose how you'd like to access "`,
          selectedProjectForPayment?.name,
          '"'
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-4", children: [
        /* @__PURE__ */ jsx(Card, { className: "cursor-pointer hover:border-primary", onClick: handlePayForProject, children: /* @__PURE__ */ jsx(CardContent, { className: "pt-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "font-semibold", children: "Pay Per Project" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "One-time payment for this project" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-xl font-bold", children: PRICING.perProject.display })
        ] }) }) }),
        /* @__PURE__ */ jsx(Card, { className: "cursor-pointer hover:border-primary", onClick: () => {
          setPaymentDialogOpen(false);
          navigate("/pricing");
        }, children: /* @__PURE__ */ jsx(CardContent, { className: "pt-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "font-semibold", children: "Monthly Subscription" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Up to 3 concurrent projects, cancel anytime" })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold", children: [
            PRICING.monthly.display,
            "/mo"
          ] })
        ] }) }) }),
        checkoutLoading && /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground", children: "Redirecting to checkout..." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: deleteDialogOpen, onOpenChange: setDeleteDialogOpen, children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: projectToDelete?.funded_by_credit ? "Delete Paid Project" : "Delete Project" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { asChild: true, children: projectToDelete?.funded_by_credit ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("p", { children: "This project was funded by a one-time purchase. Deleting it will permanently consume your credit and remove all data. You will need to purchase a new credit to create another project." }),
          /* @__PURE__ */ jsxs("div", { className: "bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground", children: [
            "💡 Consider using ",
            /* @__PURE__ */ jsx("strong", { children: "Reset Project Data" }),
            " inside the project to start over without losing your credit."
          ] })
        ] }) : /* @__PURE__ */ jsxs("p", { children: [
          'Are you sure you want to delete "',
          projectToDelete?.name,
          '"? This action cannot be undone.'
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
        projectToDelete?.funded_by_credit && /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: () => {
              setDeleteDialogOpen(false);
              navigate(`/project/${projectToDelete.id}`);
            },
            children: "Go to Project"
          }
        ),
        /* @__PURE__ */ jsx(AlertDialogAction, { onClick: confirmDeleteProject, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: "Delete Permanently" })
      ] })
    ] }) })
  ] });
};
export {
  Dashboard as default
};
