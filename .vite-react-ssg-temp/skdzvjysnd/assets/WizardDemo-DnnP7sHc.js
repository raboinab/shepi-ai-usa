import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef } from "react";
import { D as DemoAuthGate } from "./DemoAuthGate-DDTOHLYa.js";
import { useNavigate } from "react-router-dom";
import { B as Button, i as trackEvent, t as toast } from "../main.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription } from "./dialog-sNpTUd89.js";
import { X, Sparkles, ArrowLeft, ArrowRight, MessageSquare, LayoutGrid, Table, BarChart3, Share2, Copy, RefreshCw } from "lucide-react";
import { M as MobileWizardSidebar, W as WizardSidebar, a as WizardContent } from "./WizardContent-vvbBG9PZ.js";
import { I as InsightsView } from "./InsightsView-BkA7fJjp.js";
import { A as AIChatPanel } from "./AIChatPanel-HqKvawgJ.js";
import { c as createMockProjectData } from "./mockWizardData-Bexxp34E.js";
import "./TermsAcceptanceModal-DCI1QJ_5.js";
import "./checkbox-3bpvUXl3.js";
import "@radix-ui/react-checkbox";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "./spinner-DXdBpr08.js";
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
import "./use-mobile-hSLzflml.js";
import "./badge-BbLwm7hH.js";
import "vaul";
import "./sanitizeWizardData-nrsUY-BP.js";
import "react-resizable-panels";
import "./tabs-dhx4sETc.js";
import "@radix-ui/react-tabs";
import "recharts";
import "date-fns";
import "./table-CVoj8f5R.js";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./input-CSM87NBF.js";
import "react-markdown";
import "./progress-DNO9VJ6D.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "./periodUtils-DliZcATp.js";
const STEPS = [
  {
    title: "Welcome to the QoE Demo",
    message: "This is a fully populated Quality of Earnings analysis for Acme Industrial. Everything here was generated from accounting data.",
    phase: 1,
    section: 1,
    viewMode: "wizard"
  },
  {
    title: "Project Setup",
    message: "Deal parameters, analysis periods, and intent configuration — the foundation of every QoE engagement.",
    phase: 1,
    section: 1,
    viewMode: "wizard"
  },
  {
    title: "Chart of Accounts & Trial Balance",
    message: "The accounting spine — every account mapped to financial line items. This drives the entire analysis downstream.",
    phase: 2,
    section: 1,
    viewMode: "wizard"
  },
  {
    title: "Document Upload",
    message: "Upload bank statements, tax returns, and contracts — AI extracts and classifies each document automatically.",
    phase: 2,
    section: 3,
    viewMode: "wizard",
    ai: true
  },
  {
    title: "AI Reclassifications",
    message: "AI-suggested reclassifications to standardize the chart of accounts for QoE analysis. Review, approve, or reject each suggestion.",
    phase: 3,
    section: 1,
    viewMode: "wizard",
    ai: true
  },
  {
    title: "AI Adjustment Discovery",
    message: "6 AI-discovered adjustment candidates worth $220K+ — like owner comp normalization, personal expenses, and non-recurring charges. Expand any card to see the transaction-level evidence.",
    phase: 3,
    section: 2,
    viewMode: "wizard",
    ai: true
  },
  {
    title: "Schedules",
    message: "AR/AP Aging, Fixed Assets, Payroll — supporting detail schedules that feed into the QoE Bridge and working capital analysis.",
    phase: 3,
    section: 4,
    viewMode: "wizard"
  },
  {
    title: "Customer & Vendor Concentration",
    message: "Revenue and spend concentration risk analysis — identify dependency on key customers or vendors that could impact deal valuation.",
    phase: 4,
    section: 1,
    viewMode: "wizard"
  },
  {
    title: "Financial Reports",
    message: "Income Statement, Balance Sheet, and QoE Bridge are computed automatically from your Trial Balance and adjustments. No manual spreadsheet formulas.",
    phase: 5,
    section: 1,
    viewMode: "wizard"
  },
  {
    title: "Proof of Cash & AI Transfer Assistant",
    message: "AI classifies bank transactions as Interbank, Owner, or Operating — isolating transfers that affect your reconciliation. Review and approve classifications before they hit the grid.",
    phase: 5,
    section: 17,
    viewMode: "wizard",
    ai: true
  },
  {
    title: "Export Center",
    message: "Export a lender-ready PDF report or Excel workbook. Everything flows from the same data — no copy-paste errors.",
    phase: 6,
    section: 4,
    viewMode: "wizard"
  },
  {
    title: "Workbook View",
    message: "Spreadsheet-style view of all tabs — familiar format for accountants. Every tab is auto-computed from the same underlying data.",
    phase: 1,
    section: 1,
    viewMode: "wizard",
    externalRoute: true
  },
  {
    title: "Insights Dashboard",
    message: "AI-powered analytics — metrics, risk indicators, and the AI Analyst chat. Ask questions about the deal in natural language.",
    phase: 1,
    section: 1,
    viewMode: "insights",
    ai: true
  }
];
function DemoGuide({ onNavigate, onSetViewMode, onNavigateToWorkbook }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (dismissed) return;
    const step2 = STEPS[currentStep];
    if (step2.externalRoute) {
      onNavigateToWorkbook?.();
      return;
    }
    onSetViewMode(step2.viewMode);
    if (step2.viewMode === "wizard") {
      onNavigate(step2.phase, step2.section);
    }
  }, [currentStep, dismissed]);
  if (dismissed) return null;
  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;
  const dismiss = () => {
    setDismissed(true);
  };
  const next = () => {
    if (isLast) dismiss();
    else setCurrentStep((s) => s + 1);
  };
  const back = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 bg-black/30 pointer-events-auto",
        onClick: dismiss
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: dismiss,
          className: "absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors",
          "aria-label": "Dismiss guide",
          children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 mb-3", children: STEPS.map((_, i) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `h-1 rounded-full transition-all ${i === currentStep ? "w-4 bg-primary" : i < currentStep ? "w-2 bg-primary/40" : "w-2 bg-muted"}`
        },
        i
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "shrink-0 mt-0.5", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm", children: step.title }),
            step.ai && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide", children: "AI" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: step.message })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: dismiss,
            className: "text-xs text-muted-foreground",
            children: "Skip tour"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            currentStep + 1,
            "/",
            STEPS.length
          ] }),
          !isFirst && /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: back, className: "gap-1", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-3 h-3" }),
            "Back"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: next, className: "gap-1", children: [
            isLast ? "Done" : "Next",
            !isLast && /* @__PURE__ */ jsx(ArrowRight, { className: "w-3 h-3" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
const MOCK_SHARE_LINK = "https://app.shepi.ai/share/demo-acme-qoe";
function QBIcon() {
  return /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "w-4 h-4 fill-current shrink-0", "aria-hidden": true, children: /* @__PURE__ */ jsx("path", { d: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z" }) });
}
function MockQuickBooksButtons() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const handleConnect = () => {
    toast({
      title: "Demo mode",
      description: "Sign up to connect your real QuickBooks account."
    });
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_SHARE_LINK).catch(() => {
    });
    toast({ title: "Link copied", description: "Share this link with the business owner." });
  };
  const handleRefresh = () => {
    toast({ title: "Demo mode", description: "Sign up to generate a real shareable link." });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleConnect,
        className: "hidden lg:inline-flex items-center gap-2 text-sm font-medium px-3 h-9 rounded-md border-0 transition-colors text-white shrink-0",
        style: { backgroundColor: "#2CA01C" },
        onMouseEnter: (e) => e.currentTarget.style.backgroundColor = "#1E8E14",
        onMouseLeave: (e) => e.currentTarget.style.backgroundColor = "#2CA01C",
        children: [
          /* @__PURE__ */ jsx(QBIcon, {}),
          " Connect to QuickBooks"
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "outline",
        size: "sm",
        onClick: () => setShowShareDialog(true),
        className: "gap-2 hidden lg:inline-flex shrink-0",
        children: [
          /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" }),
          " Request QuickBooks Access"
        ]
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: showShareDialog, onOpenChange: setShowShareDialog, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Request QuickBooks Access" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Share this link with the business owner so they can connect their QuickBooks account directly." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 mt-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground truncate select-all", children: MOCK_SHARE_LINK }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", onClick: handleCopy, title: "Copy link", children: /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }) }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "icon", onClick: handleRefresh, title: "Refresh link", children: /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "The business owner will click this link, log in to QuickBooks Online, and authorize Shepi to read their financial data. Once connected, data syncs automatically." }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-700 bg-amber-50 rounded px-2 py-1.5 border border-amber-200", children: "Demo mode — this link is non-functional. Sign up to generate a real access link for your project." })
      ] })
    ] }) })
  ] });
}
function WizardDemo() {
  const navigate = useNavigate();
  const initialProject = useMemo(() => createMockProjectData(), []);
  const [project, setProject] = useState(initialProject);
  const [viewMode, setViewMode] = useState("wizard");
  const [showChat, setShowChat] = useState(false);
  const lastStepRef = useRef({
    phase: project.current_phase,
    section: project.current_section
  });
  const maxStepRef = useRef({
    phase: project.current_phase,
    section: project.current_section
  });
  useEffect(() => {
    const phase = project.current_phase;
    const section = project.current_section;
    lastStepRef.current = { phase, section };
    const cur = phase * 100 + section;
    const max = maxStepRef.current.phase * 100 + maxStepRef.current.section;
    if (cur > max) maxStepRef.current = { phase, section };
    trackEvent("demo_step_viewed", {
      demo: "wizard",
      phase,
      section,
      step_key: `${phase}.${section}`
    });
  }, [project.current_phase, project.current_section]);
  useEffect(() => {
    const fireAbandon = () => {
      trackEvent("demo_exited", {
        demo: "wizard",
        last_phase: lastStepRef.current.phase,
        last_section: lastStepRef.current.section,
        max_phase: maxStepRef.current.phase,
        max_section: maxStepRef.current.section
      });
    };
    window.addEventListener("beforeunload", fireAbandon);
    return () => {
      window.removeEventListener("beforeunload", fireAbandon);
      fireAbandon();
    };
  }, []);
  const updateProject = (updates) => {
    setProject((prev) => ({ ...prev, ...updates }));
  };
  const updateWizardData = (section, data) => {
    setProject((prev) => ({
      ...prev,
      wizard_data: { ...prev.wizard_data, [section]: data }
    }));
  };
  const navigateToSection = (phase, section) => {
    setProject((prev) => ({ ...prev, current_phase: phase, current_section: section }));
  };
  const onSave = async (_overrides) => {
  };
  const inventoryEnabled = project.wizard_data?.settings?.inventoryEnabled || false;
  const wipEnabled = project.wizard_data?.settings?.wipEnabled || false;
  return /* @__PURE__ */ jsx(DemoAuthGate, { page: "wizard", children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [
    /* @__PURE__ */ jsx("header", { className: "border-b border-border bg-card sticky top-0 z-10", children: /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 md:gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "shrink-0 h-8 w-8",
            onClick: () => navigate("/dashboard/demo"),
            title: "Back to dashboard",
            children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" })
          }
        ),
        viewMode === "wizard" && /* @__PURE__ */ jsx(
          MobileWizardSidebar,
          {
            currentPhase: project.current_phase,
            currentSection: project.current_section,
            onNavigate: navigateToSection,
            inventoryEnabled,
            wipEnabled
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold bg-destructive/15 text-destructive px-2 py-0.5 rounded uppercase tracking-wide shrink-0", children: "Demo" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("h1", { className: "font-semibold truncate", children: "Acme Industrial Supply Co." }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground hidden sm:block", children: "Mock data · Jan 2022 – Dec 2024 · All sections populated" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(MockQuickBooksButtons, {}),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: showChat ? "secondary" : "outline",
            size: "sm",
            onClick: () => setShowChat(!showChat),
            className: "gap-1 px-2 sm:px-3",
            title: "QoE Assistant",
            children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "AI Assistant" })
            ]
          }
        ),
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
              onClick: () => navigate("/workbook/demo"),
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
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-1 overflow-hidden", children: [
      viewMode === "wizard" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsx(
          WizardSidebar,
          {
            currentPhase: project.current_phase,
            currentSection: project.current_section,
            onNavigate: navigateToSection,
            inventoryEnabled,
            wipEnabled
          }
        ) }),
        /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-hidden flex flex-col", children: /* @__PURE__ */ jsx(
          WizardContent,
          {
            project,
            updateProject,
            updateWizardData,
            onNavigate: navigateToSection,
            onSave,
            inventoryEnabled,
            wipEnabled,
            onSwitchToInsights: () => setViewMode("insights"),
            onOpenAssistant: () => setShowChat(true)
          }
        ) }),
        showChat && /* @__PURE__ */ jsx(
          AIChatPanel,
          {
            project,
            currentPhase: project.current_phase,
            currentSection: project.current_section,
            onClose: () => setShowChat(false)
          }
        )
      ] }),
      viewMode === "insights" && /* @__PURE__ */ jsx(InsightsView, { project })
    ] }),
    /* @__PURE__ */ jsx(
      DemoGuide,
      {
        onNavigate: navigateToSection,
        onSetViewMode: setViewMode,
        onNavigateToWorkbook: () => navigate("/workbook/demo")
      }
    )
  ] }) });
}
export {
  WizardDemo as default
};
