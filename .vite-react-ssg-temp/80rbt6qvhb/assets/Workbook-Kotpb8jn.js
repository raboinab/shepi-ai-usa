import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { u as useSEO, B as Button, s as supabase, t as toast } from "../main.mjs";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { W as WorkbookShell } from "./WorkbookShell-yE0LNnTn.js";
import { A as AIChatPanel } from "./AIChatPanel-HqKvawgJ.js";
import { l as loadDealDataWithPriorBalances } from "./sanitizeWizardData-nrsUY-BP.js";
import { e as exportWorkbookXlsx } from "./exportWorkbookXlsx-Cd_42-fY.js";
import { i as isTBCacheIncomplete, l as loadTrialBalanceFromProcessedData } from "./loadTrialBalanceFromProcessedData-BKEnTKAJ.js";
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
import "./spinner-DXdBpr08.js";
import "./useAdjustmentProofs-BvjUM7OL.js";
import "./input-CSM87NBF.js";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "react-markdown";
import "date-fns";
import "xlsx";
import "./trialBalanceUtils-BTe9uefW.js";
const TAB_TO_SECTION = {
  "setup": 1,
  "trial-balance": 1,
  "income-statement": 1,
  "is-detailed": 2,
  "balance-sheet": 3,
  "bs-detailed": 4,
  "is-bs-reconciliation": 5,
  "sales": 6,
  "cogs": 7,
  "opex": 8,
  "other-expense": 9,
  "qoe-analysis": 10,
  "dd-adjustments-1": 10,
  "dd-adjustments-2": 10,
  "working-capital": 12,
  "nwc-analysis": 13,
  "cash": 14,
  "ar-aging": 15,
  "other-current-assets": 15,
  "fixed-assets": 15,
  "ap-aging": 16,
  "other-current-liabilities": 16,
  "top-customers": 17,
  "top-vendors": 17,
  "proof-of-cash": 17,
  "free-cash-flow": 18,
  "payroll": 8,
  "supplementary": 17,
  "wip-schedule": 15
};
const Workbook = () => {
  const __seoTags = useSEO({ title: "Workbook — shepi", noindex: true });
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealData, setDealData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectRaw, setProjectRaw] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const [activeTab, setActiveTab] = useState("setup");
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      fetchProject();
    };
    checkAuth();
  }, [id]);
  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("id, name, client_name, target_company, industry, transaction_type, fiscal_year_end, periods, wizard_data").eq("id", id).maybeSingle();
    if (error || !data) {
      toast({ title: "Error loading project", description: error?.message || "Project not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }
    const project = {
      ...data,
      periods: Array.isArray(data.periods) ? data.periods : [],
      wizard_data: data.wizard_data || {}
    };
    const wd = project.wizard_data || {};
    const tbData = wd.trialBalance;
    const tbAccounts = tbData?.accounts || [];
    const projectPeriods = project.periods || [];
    if (tbAccounts.length === 0 || isTBCacheIncomplete(tbAccounts, projectPeriods)) {
      const coaRaw = wd.chartOfAccounts;
      const coaAccounts = coaRaw?.accounts || [];
      const accounts = await loadTrialBalanceFromProcessedData(id, projectPeriods, coaAccounts);
      if (accounts.length > 0) {
        project.wizard_data = {
          ...project.wizard_data,
          trialBalance: { accounts }
        };
      }
    }
    setProjectRaw(project);
    const enriched = await loadDealDataWithPriorBalances(project);
    setDealData(enriched);
    setLoading(false);
  };
  const handleDataChange = useCallback(async (updatedData) => {
    setDealData(updatedData);
  }, []);
  const handleExport = useCallback(async () => {
    if (!dealData) return;
    try {
      await exportWorkbookXlsx({ dealData });
    } catch (err) {
      console.error("Excel export failed:", err);
    }
  }, [dealData]);
  const projectDataForChat = projectRaw ? {
    id: projectRaw.id,
    name: projectRaw.name,
    client_name: projectRaw.client_name ?? null,
    target_company: projectRaw.target_company ?? null,
    transaction_type: projectRaw.transaction_type ?? null,
    industry: projectRaw.industry ?? null,
    status: "active",
    fiscal_year_end: projectRaw.fiscal_year_end ?? null,
    periods: projectRaw.periods,
    wizard_data: projectRaw.wizard_data || {},
    current_phase: 5,
    current_section: TAB_TO_SECTION[activeTab] || 1
  } : null;
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex items-center justify-center", children: [
      __seoTags,
      /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" })
    ] });
  }
  if (!dealData) return null;
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [
    /* @__PURE__ */ jsxs("header", { className: "border-b border-border bg-card px-4 py-2 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Link, { to: `/project/${id}`, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("h1", { className: "font-semibold text-sm truncate", children: dealData.deal.projectName }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: dealData.deal.targetCompany || "QoE Workbook" })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: showChat ? "default" : "outline",
          size: "sm",
          className: "gap-1.5 h-7 text-xs",
          onClick: () => setShowChat(!showChat),
          children: [
            /* @__PURE__ */ jsx(MessageSquare, { className: "w-3.5 h-3.5" }),
            "Assistant"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-hidden", children: /* @__PURE__ */ jsx(
      WorkbookShell,
      {
        dealData,
        onDataChange: handleDataChange,
        saving,
        onExport: handleExport,
        onActiveTabChange: setActiveTab,
        projectId: id
      }
    ) }),
    showChat && projectDataForChat && /* @__PURE__ */ jsx(
      AIChatPanel,
      {
        project: projectDataForChat,
        currentPhase: 5,
        currentSection: TAB_TO_SECTION[activeTab] || 1,
        onClose: () => setShowChat(false)
      }
    )
  ] });
};
export {
  Workbook as default
};
