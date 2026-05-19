import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { P as PRICING, B as Button, j as Badge, C as Card, f as CardContent, s as supabase, t as toast, u as useSEO } from "../main.mjs";
import { u as useSubscription } from "./useSubscription-fJr4XAL_.js";
import { Briefcase, CheckCircle, Eye, Clock, ShieldCheck, UserCheck, MessageCircle, ArrowLeft, Lock, LayoutGrid, Table, BarChart3, MessageSquare, RotateCcw, MoreVertical, Save } from "lucide-react";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-BYBu6BQa.js";
import { I as Input } from "./input-RFtselAh.js";
import { L as Label } from "./label-DiNTC6Nb.js";
import { M as MobileWizardSidebar, W as WizardSidebar, a as WizardContent } from "./WizardContent-Bmenghk2.js";
import { A as AIChatPanel } from "./AIChatPanel-7lA4-45U.js";
import { I as InsightsView } from "./InsightsView-C9eH5gNO.js";
import { Q as QuickBooksButton } from "./QuickBooksButton-Dh-7rTz0.js";
import { A as Alert, a as AlertTitle, b as AlertDescription } from "./alert-CU8jdTdW.js";
import { E as EngagementChat } from "./EngagementChat-BpdvS0gO.js";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem, d as DropdownMenuSeparator } from "./dropdown-menu-CstrB05R.js";
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
import "./sheet-DEVVWd_r.js";
import "vaul";
import "./scroll-area-DLvncVK9.js";
import "@radix-ui/react-scroll-area";
import "./use-mobile-BsFue-bT.js";
import "./sanitizeWizardData-Dv9tWNGG.js";
import "./spinner-Cl42thGn.js";
import "react-markdown";
import "date-fns";
import "react-resizable-panels";
import "./tabs-CJYPrMmK.js";
import "@radix-ui/react-tabs";
import "recharts";
import "./table-BHTmwZ8v.js";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./progress-Y5q1JT93.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "./alert-dialog-r94B0RtJ.js";
import "@radix-ui/react-alert-dialog";
import "./textarea-AMc2tKlb.js";
import "@radix-ui/react-dropdown-menu";
const statusConfig = {
  unclaimed: {
    label: "Awaiting CPA",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Your project is in our queue. A licensed CPA reviewer will claim it shortly."
  },
  proposed: {
    label: "CPA Assigned — Pending Your Approval",
    icon: UserCheck,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "A CPA has been matched to your project. Review their profile and accept to begin."
  },
  accepted: {
    label: "CPA Confirmed",
    icon: ShieldCheck,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Your CPA reviewer is confirmed and will begin reviewing adjustments shortly."
  },
  in_review: {
    label: "Under CPA Review",
    icon: Eye,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Your CPA reviewer is working through each AI-flagged adjustment."
  },
  completed: {
    label: "Review Complete",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Your CPA reviewer has completed the engagement."
  },
  withdrawn: {
    label: "Reassigning CPA",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "The previous CPA stepped back. We're matching you with another reviewer."
  },
  // legacy aliases — render gracefully if old data still exists
  in_progress: {
    label: "In Progress",
    icon: Briefcase,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Your CPA reviewer is actively working on your Quality of Earnings analysis."
  },
  review: {
    label: "Under Review",
    icon: Eye,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Your analysis is being reviewed for quality assurance."
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Your analysis has been completed and delivered."
  }
};
const DfyStatusBanner = ({ projectId, serviceTier }) => {
  const [status, setStatus] = useState("unclaimed");
  const [claimId, setClaimId] = useState(null);
  const [autoAccepted, setAutoAccepted] = useState(false);
  const [reviewer, setReviewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [isUpgradeEligible, setIsUpgradeEligible] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      if (serviceTier === "done_for_you") {
        const { data: claim } = await supabase.from("cpa_claims").select("id, status, cpa_user_id, accepted_by_user_id, accepted_at").eq("project_id", projectId).order("claimed_at", { ascending: false }).limit(1).maybeSingle();
        if (claim) {
          setClaimId(claim.id);
          setStatus(claim.status || "unclaimed");
          setAutoAccepted(
            !!claim.accepted_at && claim.accepted_by_user_id == null
          );
          const { data: profile } = await supabase.from("cpa_profiles").select("full_name, state_of_licensure, years_experience, bio").eq("user_id", claim.cpa_user_id).maybeSingle();
          if (profile) setReviewer(profile);
        } else {
          setStatus("unclaimed");
        }
      } else {
        const [{ data: payment }, { data: project }] = await Promise.all([
          supabase.from("project_payments").select("status").eq("project_id", projectId).eq("status", "paid").maybeSingle(),
          supabase.from("projects").select("funded_by_credit").eq("id", projectId).maybeSingle()
        ]);
        setIsUpgradeEligible(!!payment || !!project?.funded_by_credit);
      }
      setLoading(false);
    };
    fetchData();
  }, [projectId, serviceTier]);
  const handleAccept = async () => {
    if (!claimId) return;
    setAccepting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("cpa_claims").update({
        status: "accepted",
        accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
        accepted_by_user_id: user?.id
      }).eq("id", claimId);
      if (error) throw error;
      setStatus("accepted");
      toast({ title: "Reviewer confirmed", description: "Your CPA will begin reviewing shortly." });
    } catch (err) {
      toast({ title: "Could not accept", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };
  const handleRequestDifferent = async () => {
    if (!claimId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("cpa_notifications").insert({
        user_id: user.id,
        // self-notify; admin will see via RLS policy "Admins view all"
        event_type: "client_requested_reassignment",
        title: "Client requested a different reviewer",
        body: `Project ${projectId} client asked for a different CPA.`,
        link: `/admin/dfy-engagements`,
        payload: { project_id: projectId, claim_id: claimId }
      });
      toast({
        title: "Request sent",
        description: "Our team will match you with another reviewer."
      });
    } catch (err) {
      toast({ title: "Could not send request", description: err.message, variant: "destructive" });
    }
  };
  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please sign in", description: "You need to be signed in to upgrade.", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planType: "done_for_you", projectId }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      toast({ title: "Upgrade failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
  };
  if (loading) return null;
  if (serviceTier !== "done_for_you") {
    const upgradePrice = isUpgradeEligible ? PRICING.dfyUpgradeFromPerProject.display : PRICING.doneForYou.display;
    return /* @__PURE__ */ jsxs(Alert, { className: "bg-accent/50 border-accent mb-4 mx-4 mt-4", children: [
      /* @__PURE__ */ jsx(Briefcase, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertTitle, { children: "Want a CPA reviewer on your analysis?" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Upgrade to Done-For-You and have a licensed CPA review every adjustment before delivery.",
          isUpgradeEligible && /* @__PURE__ */ jsxs("span", { className: "block text-xs text-muted-foreground mt-1", children: [
            PRICING.perProject.display,
            " credit applied from your existing project payment."
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "default", size: "sm", className: "shrink-0", onClick: handleUpgrade, disabled: upgrading, children: upgrading ? "Redirecting…" : `Upgrade — ${upgradePrice}` })
      ] })
    ] });
  }
  const config = statusConfig[status] || statusConfig.unclaimed;
  const Icon = config.icon;
  const isActive = ["accepted", "in_review", "completed", "in_progress", "review", "delivered"].includes(status);
  return /* @__PURE__ */ jsxs("div", { className: "mb-4 space-y-3", children: [
    /* @__PURE__ */ jsxs(Alert, { className: `${config.color} border`, children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertTitle, { className: "flex items-center gap-2", children: [
        "Done-For-You Analysis",
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: config.color, children: config.label })
      ] }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsx("span", { children: config.description }),
        isActive && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "ml-4 shrink-0 gap-1",
            onClick: () => setChatOpen(!chatOpen),
            children: [
              /* @__PURE__ */ jsx(MessageCircle, { className: "h-3.5 w-3.5" }),
              "Message Reviewer"
            ]
          }
        )
      ] })
    ] }),
    reviewer && status !== "unclaimed" && status !== "withdrawn" && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-wider text-muted-foreground mb-1", children: "Your CPA Reviewer" }),
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-foreground", children: [
          reviewer.full_name,
          ", CPA"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          "Licensed in ",
          reviewer.state_of_licensure,
          reviewer.years_experience ? ` • ${reviewer.years_experience}+ yrs experience` : ""
        ] }),
        autoAccepted && ["accepted", "in_review", "completed"].includes(status) && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1 italic", children: "Auto-confirmed after 48h" }),
        reviewer.bio && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2 max-w-2xl", children: reviewer.bio })
      ] }),
      status === "proposed" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(Button, { size: "sm", onClick: handleAccept, disabled: accepting, children: accepting ? "Confirming…" : "Confirm reviewer" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: handleRequestDifferent, children: "Request different reviewer" })
      ] })
    ] }) }),
    chatOpen && isActive && /* @__PURE__ */ jsx(
      EngagementChat,
      {
        projectId,
        onClose: () => setChatOpen(false),
        selfLabel: "You",
        otherLabel: "Reviewer"
      }
    )
  ] });
};
const Project = () => {
  const __seoTags = useSEO({ title: "Project — shepi", noindex: true });
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChat, setShowChat] = useState(() => {
    const dismissed = sessionStorage.getItem(`chat-dismissed-${id}`);
    return !dismissed;
  });
  const [viewMode, setViewMode] = useState("wizard");
  const [pendingPrompt, setPendingPrompt] = useState();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const saveGenRef = useRef(0);
  const dirtyWizardKeysRef = useRef(/* @__PURE__ */ new Set());
  const navigate = useNavigate();
  const { hasAccessToProject, loading: subscriptionLoading } = useSubscription();
  useEffect(() => {
    if (searchParams.get("qb_connected") === "true") {
      toast({ title: "Connected to QuickBooks!", description: "Your QuickBooks account is now linked." });
      searchParams.delete("qb_connected");
      searchParams.delete("realm_id");
      searchParams.delete("company_name");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast({ title: "Upgrade complete!", description: "A CPA analyst will be assigned shortly." });
      searchParams.delete("upgraded");
      setSearchParams(searchParams, { replace: true });
      fetchProject();
      setTimeout(() => fetchProject(), 3e3);
    }
  }, [searchParams, setSearchParams]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
      else fetchProject();
    });
  }, [navigate, id]);
  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
    if (error) {
      toast({ title: "Error loading project", description: error.message, variant: "destructive" });
      navigate("/dashboard");
    } else if (!data) {
      toast({ title: "Project not found", variant: "destructive" });
      navigate("/dashboard");
    } else {
      const periods = Array.isArray(data.periods) ? data.periods : [];
      const wizard_data = data.wizard_data || {};
      setProject({ ...data, periods, wizard_data });
    }
    setLoading(false);
  };
  const saveProject = async (overrides = {}) => {
    if (!project) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const gen = ++saveGenRef.current;
    setSaving(true);
    const hasOverrides = Object.keys(overrides).length > 0;
    const dataToSave = hasOverrides ? { ...project, ...overrides } : project;
    const { error } = await supabase.from("projects").update({
      wizard_data: dataToSave.wizard_data,
      current_phase: dataToSave.current_phase,
      current_section: dataToSave.current_section,
      client_name: dataToSave.client_name,
      target_company: dataToSave.target_company,
      transaction_type: dataToSave.transaction_type,
      industry: dataToSave.industry,
      fiscal_year_end: dataToSave.fiscal_year_end,
      periods: dataToSave.periods,
      status: dataToSave.current_phase > 1 ? "in-progress" : "draft"
    }).eq("id", project.id);
    if (gen !== saveGenRef.current) return;
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    if (hasOverrides) {
      setProject(dataToSave);
    }
    toast({ title: "Saved!" });
    setIsDirty(false);
    setSaving(false);
    const changedKeys = Array.from(dirtyWizardKeysRef.current);
    dirtyWizardKeysRef.current.clear();
    if (changedKeys.length > 0) {
      const wizardKeyToDataType = {
        adjustments: "adjustments",
        reclassifications: "reclassifications",
        arAging: "ar_aging",
        apAging: "ap_aging",
        topCustomers: "customer_concentration",
        topVendors: "vendor_concentration",
        fixedAssets: "fixed_assets",
        debtSchedule: "debt_schedule",
        materialContracts: "material_contract",
        payroll: "payroll",
        proofOfCash: "proof_of_cash",
        inventory: "inventory",
        cimInsights: "cim_insights",
        financialCategoryLabels: "financial_category_labels",
        dealParameters: "deal_parameters"
      };
      const dataTypes = changedKeys.map((k) => wizardKeyToDataType[k]).filter(Boolean);
      if (dataTypes.length > 0) {
        supabase.functions.invoke("embed-project-data", {
          body: { project_id: project.id, data_types: dataTypes, source: "wizard" }
        }).catch(() => {
        });
      }
    }
  };
  const updateProject = (updates) => {
    setProject((prev) => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
  };
  const updateWizardData = (section, data) => {
    setProject((prev) => prev ? { ...prev, wizard_data: { ...prev.wizard_data, [section]: data } } : null);
    dirtyWizardKeysRef.current.add(section);
    setIsDirty(true);
  };
  const navigateToSection = (phase, section) => {
    setProject((prev) => prev ? { ...prev, current_phase: phase, current_section: section } : null);
  };
  const handleResetProject = async () => {
    if (!project || resetConfirmText !== "RESET") return;
    setResetting(true);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsDirty(false);
    try {
      const { data: docs } = await supabase.from("documents").select("id, file_path").eq("project_id", project.id).limit(1e6);
      if (docs?.length) {
        const paths = docs.map((d) => d.file_path).filter(Boolean);
        if (paths.length) {
          await supabase.storage.from("documents").remove(paths);
        }
      }
      const { error: rpcError } = await supabase.rpc("reset_project_data", {
        p_project_id: project.id
      });
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      await fetchProject();
      setResetDialogOpen(false);
      setResetConfirmText("");
      toast({ title: "Project reset", description: "All data cleared. Your access window continues." });
    } catch (err) {
      toast({ title: "Reset failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };
  const lastSyncTime = project?.wizard_data?._lastSyncedAt;
  const saveProjectRef = useRef(saveProject);
  saveProjectRef.current = saveProject;
  useEffect(() => {
    if (!isDirty || saving || !project?.id) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveProjectRef.current({});
      } catch (err) {
        console.error("Auto-save failed:", err);
        toast({ title: "Auto-save failed", description: "Your changes may not have been saved. Try saving manually.", variant: "destructive" });
      }
    }, 3e3);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, saving, project?.id]);
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
  if (loading || subscriptionLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex items-center justify-center", children: [
      __seoTags,
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" })
    ] });
  }
  if (!project) return null;
  const hasAccess = hasAccessToProject(project.id);
  if (!hasAccess) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [
      /* @__PURE__ */ jsx("header", { className: "border-b border-border bg-card sticky top-0 z-10", children: /* @__PURE__ */ jsx("div", { className: "px-4 py-3 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(Link, { to: "/dashboard", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }) }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "font-semibold", children: project.name }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: project.target_company || "QoE Analysis" })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center max-w-md mx-auto px-4", children: [
        /* @__PURE__ */ jsx(Lock, { className: "w-16 h-16 text-muted-foreground mx-auto mb-4" }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-2", children: "Payment Required" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: "You need an active subscription or to purchase access to this project to continue." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 justify-center", children: [
          /* @__PURE__ */ jsx(Link, { to: "/pricing", children: /* @__PURE__ */ jsx(Button, { children: "View Pricing Plans" }) }),
          /* @__PURE__ */ jsx(Link, { to: "/dashboard", children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Back to Dashboard" }) })
        ] })
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [
    /* @__PURE__ */ jsx("header", { className: "border-b border-border bg-card sticky top-0 z-10", children: /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 md:gap-4 min-w-0", children: [
        viewMode === "wizard" && /* @__PURE__ */ jsx(
          MobileWizardSidebar,
          {
            currentPhase: project.current_phase,
            currentSection: project.current_section,
            onNavigate: navigateToSection,
            inventoryEnabled: project.wizard_data?.settings?.inventoryEnabled || false,
            wipEnabled: project.wizard_data?.settings?.wipEnabled || false
          }
        ),
        /* @__PURE__ */ jsx(Link, { to: "/dashboard", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "shrink-0", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("h1", { className: "font-semibold truncate", children: project.name }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground truncate hidden sm:block", children: project.target_company || "QoE Analysis" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center border rounded-md", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: viewMode === "wizard" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setViewMode("wizard"),
              className: "gap-1 rounded-none rounded-l-md px-2 sm:px-3",
              title: "Wizard",
              children: [
                /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Wizard" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => navigate(`/project/${id}/workbook`),
              className: "gap-1 rounded-none border-l px-2 sm:px-3",
              title: "Workbook",
              children: [
                /* @__PURE__ */ jsx(Table, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Workbook" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: viewMode === "insights" ? "secondary" : "ghost",
              size: "sm",
              onClick: () => setViewMode("insights"),
              className: "gap-1 rounded-none rounded-r-md border-l px-2 sm:px-3",
              title: "Insights",
              children: [
                /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Insights" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            QuickBooksButton,
            {
              projectId: project.id,
              userId: user?.id || "",
              periods: project.periods,
              onSyncComplete: fetchProject,
              lastSyncDate: lastSyncTime
            }
          ),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowChat(!showChat), className: "gap-2", children: [
            /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4" }),
            " AI Assistant"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hidden lg:flex items-center", children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => setResetDialogOpen(true),
            className: "gap-1 text-muted-foreground hover:text-destructive px-2",
            title: "Reset Project Data",
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden xl:inline", children: "Reset" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "icon", className: "lg:hidden shrink-0", children: [
            /* @__PURE__ */ jsx(MoreVertical, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { className: "sr-only", children: "More actions" })
          ] }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "w-56", children: [
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setShowChat(!showChat), children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4 mr-2" }),
              showChat ? "Hide AI Assistant" : "AI Assistant"
            ] }),
            /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
            /* @__PURE__ */ jsxs(
              DropdownMenuItem,
              {
                onClick: () => setResetDialogOpen(true),
                className: "text-destructive focus:text-destructive",
                children: [
                  /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4 mr-2" }),
                  "Reset Project Data"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            onClick: () => saveProject({}),
            disabled: saving,
            variant: isDirty ? "default" : "outline",
            className: `gap-1 sm:gap-2 px-2 sm:px-3 ${isDirty ? "animate-pulse" : ""}`,
            children: [
              /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: saving ? "Saving..." : isDirty ? "Save Changes" : "Saved" })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(DfyStatusBanner, { projectId: project.id, serviceTier: project.service_tier || "diy" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      viewMode === "wizard" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsx(
          WizardSidebar,
          {
            currentPhase: project.current_phase,
            currentSection: project.current_section,
            onNavigate: navigateToSection,
            inventoryEnabled: project.wizard_data?.settings?.inventoryEnabled || false,
            wipEnabled: project.wizard_data?.settings?.wipEnabled || false
          }
        ) }),
        /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-hidden flex flex-col", children: /* @__PURE__ */ jsx(
          WizardContent,
          {
            project,
            updateProject,
            updateWizardData,
            onNavigate: navigateToSection,
            onSave: saveProject,
            inventoryEnabled: project.wizard_data?.settings?.inventoryEnabled || false,
            wipEnabled: project.wizard_data?.settings?.wipEnabled || false,
            onSwitchToInsights: () => setViewMode("insights"),
            onOpenAssistant: (prompt) => {
              setShowChat(true);
              if (prompt) {
                setPendingPrompt(prompt);
              }
            }
          }
        ) })
      ] }),
      viewMode === "insights" && /* @__PURE__ */ jsx(InsightsView, { project }),
      showChat && viewMode !== "insights" && /* @__PURE__ */ jsx(
        AIChatPanel,
        {
          project,
          currentPhase: project.current_phase,
          currentSection: project.current_section,
          pendingPrompt,
          onPromptConsumed: () => setPendingPrompt(void 0),
          onClose: () => {
            setShowChat(false);
            sessionStorage.setItem(`chat-dismissed-${id}`, "true");
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: resetDialogOpen, onOpenChange: (open) => {
      setResetDialogOpen(open);
      if (!open) setResetConfirmText("");
    }, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(RotateCcw, { className: "w-5 h-5 text-destructive" }),
          "Reset Project Data"
        ] }),
        /* @__PURE__ */ jsx(DialogDescription, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-1", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            "This will permanently delete all uploaded documents, analysis data, and AI results for ",
            /* @__PURE__ */ jsx("strong", { children: project?.name }),
            "."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-primary/10 border border-primary/20 rounded-md px-3 py-2 text-sm text-foreground", children: [
            "✓ Your project access and 90-day window are ",
            /* @__PURE__ */ jsx("strong", { children: "NOT affected" }),
            " — you can start fresh immediately."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm", children: "The project name, client, and target company are preserved. Only the analysis data is cleared." })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 py-2", children: [
        /* @__PURE__ */ jsxs(Label, { htmlFor: "reset-confirm", className: "text-sm font-medium", children: [
          "Type ",
          /* @__PURE__ */ jsx("span", { className: "font-mono font-bold", children: "RESET" }),
          " to confirm"
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "reset-confirm",
            value: resetConfirmText,
            onChange: (e) => setResetConfirmText(e.target.value),
            placeholder: "RESET",
            className: "font-mono"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => {
          setResetDialogOpen(false);
          setResetConfirmText("");
        }, children: "Cancel" }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "destructive",
            onClick: handleResetProject,
            disabled: resetConfirmText !== "RESET" || resetting,
            children: resetting ? "Resetting..." : "Reset All Data"
          }
        )
      ] })
    ] }) })
  ] });
};
export {
  Project as default
};
