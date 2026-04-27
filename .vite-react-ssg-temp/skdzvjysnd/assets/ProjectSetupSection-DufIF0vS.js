import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { m as cn, s as supabase, C as Card, b as CardHeader, d as CardTitle, e as CardDescription, f as CardContent, B as Button, t as toast$1, T as TooltipProvider, n as Tooltip, o as TooltipTrigger, p as TooltipContent } from "../main.mjs";
import { L as Label } from "./label-B2r_8dgk.js";
import { P as Progress } from "./progress-DNO9VJ6D.js";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { C as Command, a as CommandInput, b as CommandList, c as CommandEmpty, d as CommandGroup, e as CommandItem } from "./command-CJVemXry.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C93YiWo6.js";
import { ChevronsUpDown, Check, ArrowRight, Sparkles, Loader2, Upload, FileText, ArrowLeft, CheckCircle2, AlertCircle, Info, X, Calendar, ChevronUp, ChevronDown, Package, Ban, User, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import { a as QUICKBOOKS_CLOUD_RUN_URL, Q as QuickBooksButton } from "./QuickBooksButton-eoKunvUz.js";
import { S as INDUSTRIES, U as getIndustryLabels } from "./sanitizeWizardData-nrsUY-BP.js";
import { a as getYearRange, b as getMaxEndMonth, M as MONTHS, g as generatePeriods, c as createStubPeriods, d as calculatePeriodCoverage, f as formatPeriodRange } from "./periodUtils-DliZcATp.js";
import { I as Input } from "./input-CSM87NBF.js";
import { T as Textarea } from "./textarea-H3ZPGfnJ.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { C as Checkbox } from "./checkbox-3bpvUXl3.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { A as Alert, b as AlertDescription } from "./alert-FolYmCWY.js";
import { C as CIMInsightsCard } from "./CIMInsightsCard-B_1Yk3jo.js";
import { Q as QuickBooksSyncBadge } from "./QuickBooksSyncBadge-Bn85N4Ee.js";
import { e as extractWIPAccountsFromCOA, a as autoPopulateWIPMapping, W as WIP_SLOT_DEFINITIONS, r as resolveMappedAccount } from "./wipAccountUtils-ChihncpU.js";
import { g as getFilteredChecklist, i as isChecklistItemComplete } from "./documentChecklist-BAkBsBzh.js";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-label";
import "@radix-ui/react-progress";
import "@radix-ui/react-select";
import "cmdk";
import "./dialog-sNpTUd89.js";
import "@radix-ui/react-dialog";
import "@radix-ui/react-popover";
import "date-fns";
import "./alert-dialog-CKdO6TGo.js";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-checkbox";
import "@radix-ui/react-collapsible";
const Switch = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;
const OnboardingFlow = ({
  project,
  updateProject,
  updateWizardData,
  onNavigate,
  onSave
}) => {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const years = getYearRange();
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(currentYear - 2);
  const [endMonth, setEndMonth] = useState(12);
  const [endYear, setEndYear] = useState(currentYear);
  const [includeStub, setIncludeStub] = useState(false);
  const [stubStartMonth, setStubStartMonth] = useState(1);
  const [stubStartYear, setStubStartYear] = useState(currentYear);
  const [stubEndMonth, setStubEndMonth] = useState((/* @__PURE__ */ new Date()).getMonth() + 1);
  const [stubEndYear, setStubEndYear] = useState(currentYear);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [uploadingCim, setUploadingCim] = useState(false);
  const [cimUploaded, setCimUploaded] = useState(false);
  const [qbConnected, setQbConnected] = useState(false);
  const cimFileInputRef = useRef(null);
  const maxEndMonth = getMaxEndMonth(endYear);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);
  const checkQbConnection = useCallback(async () => {
    if (!project.id) return;
    try {
      const response = await fetch(
        `${QUICKBOOKS_CLOUD_RUN_URL}/check-connection?projectId=${encodeURIComponent(project.id)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.connected && !qbConnected) {
          setQbConnected(true);
          toast.success(`Connected to ${data.companyName || "QuickBooks"}!`);
          completeOnboarding({ phase: 2, section: 1 });
        }
      }
    } catch {
    }
  }, [project.id, qbConnected]);
  useEffect(() => {
    if (endMonth > maxEndMonth) {
      setEndMonth(maxEndMonth);
    }
  }, [endYear, endMonth, maxEndMonth]);
  useEffect(() => {
    if (project.periods && Array.isArray(project.periods) && project.periods.length > 0) {
      const periods = project.periods;
      const regular = periods.filter((p) => !p.isStub);
      const stubs = periods.filter((p) => p.isStub);
      if (regular.length > 0) {
        const first = regular[0];
        const last = regular[regular.length - 1];
        if (first.year > 0) {
          setStartMonth(first.month);
          setStartYear(first.year);
        }
        if (last.year > 0) {
          setEndMonth(last.month);
          setEndYear(last.year);
        }
      }
      if (stubs.length > 0 && stubs[0].startDate && stubs[stubs.length - 1].endDate) {
        setIncludeStub(true);
        const [sy, sm] = stubs[0].startDate.split("-").map(Number);
        setStubStartMonth(sm);
        setStubStartYear(sy);
        const [ey, em] = stubs[stubs.length - 1].endDate.split("-").map(Number);
        setStubEndMonth(em);
        setStubEndYear(ey);
      }
    }
  }, []);
  const handleStep1Next = async () => {
    if (startYear > endYear || startYear === endYear && startMonth > endMonth) {
      toast.error("Start date must be before end date");
      return;
    }
    let periods = generatePeriods(startMonth, startYear, endMonth, endYear);
    if (includeStub) {
      const stubStart = new Date(stubStartYear, stubStartMonth - 1, 1);
      const stubEnd = new Date(stubEndYear, stubEndMonth, 0);
      if (stubStart < stubEnd) {
        const stubPeriods = createStubPeriods(stubStart, stubEnd);
        periods = [...periods, ...stubPeriods];
      }
    }
    updateProject({ periods });
    if (onSave) {
      await onSave({ periods });
    }
    setStep(2);
  };
  const handleCimUpload = async (file) => {
    setUploadingCim(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${project.id}/cim/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: doc, error: insertError } = await supabase.from("documents").insert({
        project_id: project.id,
        user_id: user.id,
        name: file.name,
        file_path: filePath,
        file_type: fileExt,
        file_size: file.size,
        account_type: "cim",
        processing_status: "processing"
      }).select().single();
      if (insertError) throw insertError;
      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-cim", {
        body: { documentId: doc.id, projectId: project.id }
      });
      if (parseError) throw parseError;
      if (parseResult?.insights) {
        const insights = parseResult.insights;
        const updates = {};
        if (insights.marketPosition?.industry) {
          updates.industry = insights.marketPosition.industry;
        }
        if (!project.target_company && insights.businessOverview?.description) {
          const match = insights.businessOverview.description.match(
            /^([A-Z][A-Za-z0-9\s&'.-]+(?:\([A-Z]+\))?)\s+(?:is|are|,)\s/
          );
          if (match && match[1].length > 2 && match[1].length < 100) {
            updates.target_company = match[1].trim();
          }
        }
        if (Object.keys(updates).length > 0) {
          updateProject(updates);
          if (onSave) await onSave(updates);
        }
        setCimUploaded(true);
        toast.success("CIM parsed! Project details updated.");
      }
    } catch (error) {
      console.error("CIM upload error:", error);
      toast.error("Failed to process CIM");
    } finally {
      setUploadingCim(false);
    }
  };
  const completeOnboarding = async (navigateToSection) => {
    const settings = project.wizard_data?.settings || {};
    const updatedSettings = { ...settings, onboardingComplete: true };
    updateWizardData("settings", updatedSettings);
    if (onSave) {
      await onSave({
        wizard_data: {
          ...project.wizard_data,
          settings: updatedSettings
        }
      });
    }
    if (navigateToSection && onNavigate) {
      onNavigate(navigateToSection.phase, navigateToSection.section);
    } else if (onNavigate) {
      onNavigate(2, 1);
    }
  };
  useEffect(() => {
    if (step !== 2) return;
    checkQbConnection();
    const interval = setInterval(checkQbConnection, 5e3);
    return () => clearInterval(interval);
  }, [step, checkQbConnection]);
  const industryLabels = INDUSTRIES.map((i) => i.label);
  return /* @__PURE__ */ jsx("div", { className: "flex items-start justify-center min-h-full py-8 px-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Step ",
          step,
          " of 2"
        ] }),
        /* @__PURE__ */ jsx("span", { children: step === 1 ? "Review Period" : "Get Your Data In" })
      ] }),
      /* @__PURE__ */ jsx(Progress, { value: step * 50, className: "h-2" })
    ] }),
    step === 1 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-xl", children: "Review Period & Industry" }),
        /* @__PURE__ */ jsxs(CardDescription, { children: [
          "Set the analysis period and industry for",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: project.target_company || project.name })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Industry" }),
          /* @__PURE__ */ jsxs(Popover, { open: industryOpen, onOpenChange: setIndustryOpen, children: [
            /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                role: "combobox",
                "aria-expanded": industryOpen,
                className: "w-full justify-between font-normal",
                children: [
                  project.industry || "Select industry...",
                  /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(PopoverContent, { className: "w-full p-0", align: "start", children: /* @__PURE__ */ jsxs(Command, { children: [
              /* @__PURE__ */ jsx(
                CommandInput,
                {
                  placeholder: "Search industries...",
                  value: industrySearch,
                  onValueChange: setIndustrySearch
                }
              ),
              /* @__PURE__ */ jsxs(CommandList, { children: [
                /* @__PURE__ */ jsx(CommandEmpty, { children: "No industry found." }),
                /* @__PURE__ */ jsx(CommandGroup, { className: "max-h-64 overflow-auto", children: industryLabels.map((label) => /* @__PURE__ */ jsxs(
                  CommandItem,
                  {
                    value: label,
                    onSelect: () => {
                      updateProject({ industry: label });
                      setIndustryOpen(false);
                      setIndustrySearch("");
                    },
                    children: [
                      /* @__PURE__ */ jsx(
                        Check,
                        {
                          className: cn(
                            "mr-2 h-4 w-4",
                            project.industry === label ? "opacity-100" : "opacity-0"
                          )
                        }
                      ),
                      label
                    ]
                  },
                  label
                )) })
              ] })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Start Month" }),
            /* @__PURE__ */ jsxs(Select, { value: String(startMonth), onValueChange: (v) => setStartMonth(Number(v)), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((m, i) => /* @__PURE__ */ jsx(SelectItem, { value: String(i + 1), children: m }, i)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Start Year" }),
            /* @__PURE__ */ jsxs(Select, { value: String(startYear), onValueChange: (v) => setStartYear(Number(v)), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: years.map((y) => /* @__PURE__ */ jsx(SelectItem, { value: String(y), children: y }, y)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "End Month" }),
            /* @__PURE__ */ jsxs(Select, { value: String(endMonth), onValueChange: (v) => setEndMonth(Number(v)), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((m, i) => /* @__PURE__ */ jsx(SelectItem, { value: String(i + 1), disabled: i + 1 > maxEndMonth, children: m }, i)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "End Year" }),
            /* @__PURE__ */ jsxs(Select, { value: String(endYear), onValueChange: (v) => setEndYear(Number(v)), children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsx(SelectContent, { children: years.map((y) => /* @__PURE__ */ jsx(SelectItem, { value: String(y), children: y }, y)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { children: "Fiscal Year End" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: project.fiscal_year_end || "12",
              onValueChange: (v) => updateProject({ fiscal_year_end: v }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "December" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((m, i) => /* @__PURE__ */ jsx(SelectItem, { value: String(i + 1), children: m }, i)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { children: "Include stub period" }),
            /* @__PURE__ */ jsx(Switch, { checked: includeStub, onCheckedChange: setIncludeStub })
          ] }),
          includeStub && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 pl-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Stub Start" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs(Select, { value: String(stubStartMonth), onValueChange: (v) => setStubStartMonth(Number(v)), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "flex-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((m, i) => /* @__PURE__ */ jsx(SelectItem, { value: String(i + 1), children: m }, i)) })
                ] }),
                /* @__PURE__ */ jsxs(Select, { value: String(stubStartYear), onValueChange: (v) => setStubStartYear(Number(v)), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[100px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: years.map((y) => /* @__PURE__ */ jsx(SelectItem, { value: String(y), children: y }, y)) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx(Label, { className: "text-xs text-muted-foreground", children: "Stub End" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs(Select, { value: String(stubEndMonth), onValueChange: (v) => setStubEndMonth(Number(v)), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "flex-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((m, i) => /* @__PURE__ */ jsx(SelectItem, { value: String(i + 1), children: m }, i)) })
                ] }),
                /* @__PURE__ */ jsxs(Select, { value: String(stubEndYear), onValueChange: (v) => setStubEndYear(Number(v)), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[100px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: years.map((y) => /* @__PURE__ */ jsx(SelectItem, { value: String(y), children: y }, y)) })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Button, { className: "w-full gap-2", onClick: handleStep1Next, children: [
          "Continue ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
        ] })
      ] })
    ] }),
    step === 2 && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs(Card, { className: "border-dashed border-primary/30 bg-primary/5", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-primary" }),
            "Upload a CIM",
            /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-muted-foreground", children: "(optional)" })
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Auto-fill industry, target company, and key details from your Confidential Information Memorandum" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: cimUploaded ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-primary", children: [
          /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
          "CIM uploaded and parsed"
        ] }) : uploadingCim ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
          "Parsing CIM..."
        ] }) : /* @__PURE__ */ jsxs(
          "div",
          {
            className: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer",
            onClick: () => cimFileInputRef.current?.click(),
            children: [
              /* @__PURE__ */ jsx(Upload, { className: "h-8 w-8 mx-auto text-muted-foreground mb-2" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Click to upload your CIM (PDF)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: cimFileInputRef,
                  type: "file",
                  accept: ".pdf,.docx,.doc",
                  className: "hidden",
                  onChange: (e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCimUpload(file);
                  }
                }
              )
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-3", children: "Choose how to get your data in" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs(Card, { className: "sm:col-span-2 hover:border-primary/50 transition-colors", children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Connect QuickBooks" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-xs", children: "Fastest path. We'll pull your Chart of Accounts and Trial Balance automatically. You'll still upload bank statements and other docs later." })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: /* @__PURE__ */ jsx(
              QuickBooksButton,
              {
                projectId: project.id,
                userId,
                periods: project.periods
              }
            ) }) })
          ] }),
          /* @__PURE__ */ jsxs(Card, { className: "hover:border-primary/50 transition-colors", children: [
            /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
              /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Upload Documents" }),
              /* @__PURE__ */ jsx(CardDescription, { className: "text-xs", children: "Upload your financial statements, bank statements, and supporting documents manually." })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                className: "w-full gap-2",
                onClick: () => completeOnboarding({ phase: 2, section: 3 }),
                children: [
                  /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
                  "Upload Documents"
                ]
              }
            ) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "gap-1", onClick: () => setStep(1), children: [
          /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
          " Back"
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "link",
            size: "sm",
            className: "text-muted-foreground",
            onClick: () => completeOnboarding(),
            children: "Skip for now"
          }
        )
      ] })
    ] })
  ] }) });
};
function extractFinancialLabelsFromCOA(accounts) {
  const isAccounts = accounts.filter((a) => a.fsType === "IS");
  const allISCategories = [...new Set(isAccounts.map((a) => a.category))];
  return {
    salesLabel: [...new Set(
      isAccounts.filter(
        (a) => a.category.toLowerCase().includes("revenue") || a.category.toLowerCase() === "income"
      ).map((a) => a.category)
    )],
    cogsLabel: [...new Set(
      isAccounts.filter(
        (a) => a.category.toLowerCase().includes("cogs") || a.category.toLowerCase().includes("cost of goods")
      ).map((a) => a.category)
    )],
    expenseLabels: [...new Set(
      isAccounts.filter(
        (a) => a.category.toLowerCase().includes("expense")
      ).map((a) => a.category)
    )],
    interestLabel: [...new Set(
      isAccounts.filter(
        (a) => a.category.toLowerCase().includes("interest")
      ).map((a) => a.category)
    )],
    depreciationLabel: [...new Set(
      isAccounts.filter(
        (a) => a.category.toLowerCase().includes("deprec") || a.category.toLowerCase().includes("amort")
      ).map((a) => a.category)
    )],
    taxesLabel: [...new Set(
      isAccounts.filter(
        (a) => a.category.toLowerCase().includes("tax")
      ).map((a) => a.category)
    )],
    allIncomeStatementCategories: allISCategories
  };
}
function hasCoaData(wizardData) {
  if (!wizardData) return false;
  const coa = wizardData?.chartOfAccounts;
  return Array.isArray(coa?.accounts) && coa.accounts.length > 0;
}
function getCoaAccounts(wizardData) {
  if (!wizardData) return [];
  const coa = wizardData?.chartOfAccounts;
  return coa?.accounts || [];
}
function getCoaSyncInfo(wizardData) {
  if (!wizardData) return {};
  const coa = wizardData?.chartOfAccounts;
  return {
    syncSource: coa?.syncSource,
    lastSyncDate: coa?.lastSyncDate
  };
}
function autoPopulateFinancialLabels(labelOptions, existingLabels = {}) {
  const labels = { ...existingLabels };
  const autoPopulatedKeys = [];
  const tryAutoPopulate = (key, options) => {
    if (!labels[key] && options.length > 0) {
      labels[key] = options[0];
      autoPopulatedKeys.push(key);
    }
  };
  tryAutoPopulate("salesLabel", labelOptions.salesLabel);
  tryAutoPopulate("cogsLabel", labelOptions.cogsLabel);
  tryAutoPopulate("operatingExpensesLabel", labelOptions.expenseLabels);
  tryAutoPopulate("interestLabel", labelOptions.interestLabel);
  tryAutoPopulate("depreciationLabel", labelOptions.depreciationLabel);
  tryAutoPopulate("taxesLabel", labelOptions.taxesLabel);
  return { labels, autoPopulatedKeys };
}
function FinancialCategoryLabelsCard({
  project,
  dueDiligenceData,
  updateDueDiligenceData,
  onNavigate
}) {
  const hasCoa = hasCoaData(project.wizard_data);
  const coaAccounts = getCoaAccounts(project.wizard_data);
  const { syncSource, lastSyncDate } = getCoaSyncInfo(project.wizard_data);
  const dynamicLabelOptions = useMemo(() => {
    if (!hasCoa) return null;
    return extractFinancialLabelsFromCOA(coaAccounts);
  }, [hasCoa, coaAccounts]);
  const allISCategories = dynamicLabelOptions?.allIncomeStatementCategories || [];
  const buildOptions = (primary) => ({
    options: (primary?.length ?? 0) > 0 ? primary : allISCategories,
    isFallback: (primary?.length ?? 0) === 0 && allISCategories.length > 0
  });
  const salesOptions = buildOptions(dynamicLabelOptions?.salesLabel);
  const cogsOptions = buildOptions(dynamicLabelOptions?.cogsLabel);
  const expenseOptions = buildOptions(dynamicLabelOptions?.expenseLabels);
  const interestOptions = buildOptions(dynamicLabelOptions?.interestLabel);
  const depreciationOptions = buildOptions(dynamicLabelOptions?.depreciationLabel);
  const taxesOptions = buildOptions(dynamicLabelOptions?.taxesLabel);
  const hasAutoPopulatedRef = useRef(false);
  const prevCoaAccountsLength = useRef(0);
  useEffect(() => {
    if (!hasCoa || !dynamicLabelOptions) return;
    const coaJustLoaded = coaAccounts.length > 0 && prevCoaAccountsLength.current === 0;
    prevCoaAccountsLength.current = coaAccounts.length;
    if (!coaJustLoaded && hasAutoPopulatedRef.current) return;
    const existingLabels = dueDiligenceData.financialLabels || {};
    const { labels, autoPopulatedKeys } = autoPopulateFinancialLabels(dynamicLabelOptions, existingLabels);
    if (autoPopulatedKeys.length > 0) {
      updateDueDiligenceData({
        ...dueDiligenceData,
        financialLabels: labels
      });
      hasAutoPopulatedRef.current = true;
      toast$1({
        title: "Financial labels configured",
        description: `Auto-selected ${autoPopulatedKeys.length} label${autoPopulatedKeys.length > 1 ? "s" : ""} from your Chart of Accounts.`
      });
    }
  }, [hasCoa, dynamicLabelOptions, coaAccounts.length]);
  const updateLabel = (key, value) => {
    updateDueDiligenceData({
      ...dueDiligenceData,
      financialLabels: {
        ...dueDiligenceData.financialLabels || {},
        [key]: value
      }
    });
  };
  const getLabel = (key) => {
    return dueDiligenceData.financialLabels?.[key] || "";
  };
  const LabelSelect = ({
    id,
    label,
    optionData,
    fallbackMessage
  }) => /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx(Label, { htmlFor: id, children: label }),
    /* @__PURE__ */ jsxs(
      Select,
      {
        value: getLabel(id),
        onValueChange: (value) => updateLabel(id, value),
        children: [
          /* @__PURE__ */ jsx(SelectTrigger, { id, children: /* @__PURE__ */ jsx(SelectValue, { placeholder: optionData.isFallback ? "Select from all categories..." : "Select category..." }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: optionData.options.map((opt) => /* @__PURE__ */ jsx(SelectItem, { value: opt, children: opt }, opt)) })
        ]
      }
    ),
    optionData.isFallback && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground flex items-start gap-1", children: [
      /* @__PURE__ */ jsx(Info, { className: "w-3 h-3 mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxs("span", { children: [
        fallbackMessage,
        " Showing all Income Statement categories."
      ] })
    ] })
  ] });
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          "Financial Category Labels",
          hasCoa && syncSource === "quickbooks" && /* @__PURE__ */ jsx(QuickBooksSyncBadge, { lastSyncDate, size: "sm" })
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: hasCoa ? "Select labels matching your target company's financial statements" : "Load Chart of Accounts to configure labels" })
      ] }),
      hasCoa && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-green-600 border-green-600 dark:text-green-400 dark:border-green-400", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 mr-1" }),
        "COA Loaded"
      ] })
    ] }) }),
    !hasCoa ? /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "flex flex-col gap-3", children: [
        /* @__PURE__ */ jsx("span", { children: "To configure financial labels, first load your Chart of Accounts by syncing with QuickBooks or uploading a COA file." }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsx(
          Button,
          {
            size: "sm",
            variant: "outline",
            onClick: () => onNavigate?.(2, 1),
            children: "Go to Chart of Accounts"
          }
        ) })
      ] })
    ] }) }) : /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(
        LabelSelect,
        {
          id: "salesLabel",
          label: "Sales / Revenue",
          optionData: salesOptions,
          fallbackMessage: "No Revenue accounts found."
        }
      ),
      /* @__PURE__ */ jsx(
        LabelSelect,
        {
          id: "cogsLabel",
          label: "Cost of Goods Sold",
          optionData: cogsOptions,
          fallbackMessage: "No COGS accounts found."
        }
      ),
      /* @__PURE__ */ jsx(
        LabelSelect,
        {
          id: "operatingExpensesLabel",
          label: "Operating Expenses",
          optionData: expenseOptions,
          fallbackMessage: "No Operating Expenses accounts found."
        }
      ),
      /* @__PURE__ */ jsx(
        LabelSelect,
        {
          id: "interestLabel",
          label: "Interest Expense",
          optionData: interestOptions,
          fallbackMessage: 'No "Interest" accounts found.'
        }
      ),
      /* @__PURE__ */ jsx(
        LabelSelect,
        {
          id: "depreciationLabel",
          label: "Depreciation / Amortization",
          optionData: depreciationOptions,
          fallbackMessage: 'No "Depreciation" or "Amortization" accounts found.'
        }
      ),
      /* @__PURE__ */ jsx(
        LabelSelect,
        {
          id: "taxesLabel",
          label: "Income Taxes",
          optionData: taxesOptions,
          fallbackMessage: 'No "Tax" accounts found.'
        }
      )
    ] }) })
  ] });
}
function WIPAccountMappingCard({
  project,
  dueDiligenceData,
  updateDueDiligenceData,
  onNavigate
}) {
  const hasCoa = hasCoaData(project.wizard_data);
  const coaAccounts = getCoaAccounts(project.wizard_data);
  const candidates = useMemo(
    () => hasCoa ? extractWIPAccountsFromCOA(coaAccounts) : null,
    [hasCoa, coaAccounts]
  );
  const mapping = dueDiligenceData.wipAccountMapping || {};
  const hasAutoPopulatedRef = useRef(false);
  const prevCoaLen = useRef(0);
  useEffect(() => {
    if (!hasCoa || !candidates) return;
    const justLoaded = coaAccounts.length > 0 && prevCoaLen.current === 0;
    prevCoaLen.current = coaAccounts.length;
    if (!justLoaded && hasAutoPopulatedRef.current) return;
    const { mapping: newMapping, autoPopulatedKeys } = autoPopulateWIPMapping(candidates, mapping);
    if (autoPopulatedKeys.length > 0) {
      updateDueDiligenceData({ ...dueDiligenceData, wipAccountMapping: newMapping });
      hasAutoPopulatedRef.current = true;
      toast$1({
        title: "WIP accounts mapped",
        description: `Auto-matched ${autoPopulatedKeys.length} WIP account${autoPopulatedKeys.length > 1 ? "s" : ""} from your Chart of Accounts.`
      });
    }
  }, [hasCoa, candidates, coaAccounts.length]);
  const updateMapping = (slot, value) => {
    updateDueDiligenceData({
      ...dueDiligenceData,
      wipAccountMapping: { ...mapping, [slot]: value || void 0 }
    });
  };
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const requestSuggestion = async (slot) => {
    if (!candidates) return;
    setLoadingSlot(slot);
    try {
      const def = WIP_SLOT_DEFINITIONS[slot];
      const { data, error } = await supabase.functions.invoke("suggest-wip-account", {
        body: {
          slotKey: slot,
          slotLabel: def.label,
          slotDescription: def.description,
          accounts: candidates.allBalanceSheetAccounts.map((a) => ({
            accountId: a.accountNumber || a.accountName,
            name: a.accountName,
            category: a.category,
            fsType: a.fsType
          }))
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestions((prev) => ({ ...prev, [slot]: data }));
    } catch (err) {
      toast$1({
        title: "AI suggestion failed",
        description: err.message || "Could not get suggestion.",
        variant: "destructive"
      });
    } finally {
      setLoadingSlot(null);
    }
  };
  const applySuggestion = (slot) => {
    const s = suggestions[slot];
    if (!s) return;
    updateMapping(slot, s.accountId);
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
    toast$1({ title: "Mapping applied", description: `${WIP_SLOT_DEFINITIONS[slot].label} → ${s.accountName}` });
  };
  const dismissSuggestion = (slot) => {
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };
  const renderSlot = (slot) => {
    const def = WIP_SLOT_DEFINITIONS[slot];
    const value = mapping[slot] || "";
    const candList = candidates?.[slot] ?? [];
    const allBs = candidates?.allBalanceSheetAccounts ?? [];
    const isFallback = candList.length === 0 && allBs.length > 0;
    const optionList = candList.length > 0 ? candList : allBs;
    const mappedAccount = resolveMappedAccount(coaAccounts, value);
    const suggestion = suggestions[slot];
    const isLoading = loadingSlot === slot;
    return /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3 rounded-lg border bg-muted/20", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: `wip-${slot}`, className: "text-sm font-medium", children: def.label }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: def.description })
        ] }),
        !value && /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            className: "gap-1 shrink-0",
            onClick: () => requestSuggestion(slot),
            disabled: isLoading || allBs.length === 0,
            children: [
              isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
              "Suggest with AI"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Select, { value, onValueChange: (v) => updateMapping(slot, v === "__none__" ? "" : v), children: [
        /* @__PURE__ */ jsx(SelectTrigger, { id: `wip-${slot}`, children: /* @__PURE__ */ jsx(SelectValue, { placeholder: isFallback ? "Select from all BS accounts..." : "Select account..." }) }),
        /* @__PURE__ */ jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsx(SelectItem, { value: "__none__", children: "— Not mapped —" }),
          optionList.map((a) => {
            const key = a.accountNumber || a.accountName;
            return /* @__PURE__ */ jsxs(SelectItem, { value: key, children: [
              a.accountNumber ? `${a.accountNumber} · ` : "",
              a.accountName
            ] }, key);
          })
        ] })
      ] }),
      isFallback && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No keyword match found. Showing all Balance Sheet accounts." }),
      mappedAccount && /* @__PURE__ */ jsxs("p", { className: "text-xs text-primary flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3" }),
        " Mapped to ",
        mappedAccount.accountName
      ] }),
      suggestion && /* @__PURE__ */ jsxs(Alert, { className: "mt-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxs(AlertDescription, { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: suggestion.accountName }),
            /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "ml-2 text-xs", children: [
              suggestion.confidence,
              " confidence"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: suggestion.reasoning }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => applySuggestion(slot), className: "gap-1", children: [
              /* @__PURE__ */ jsx(Check, { className: "w-3 h-3" }),
              " Apply"
            ] }),
            /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", onClick: () => dismissSuggestion(slot), className: "gap-1", children: [
              /* @__PURE__ */ jsx(X, { className: "w-3 h-3" }),
              " Dismiss"
            ] })
          ] })
        ] })
      ] })
    ] }, slot);
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "WIP Account Mapping" }),
        /* @__PURE__ */ jsx(CardDescription, { children: hasCoa ? "Map your Chart of Accounts to standard WIP slots. Used for Balance Sheet tie-out and over/under-billing analysis." : "Load Chart of Accounts to map WIP accounts." })
      ] }),
      hasCoa && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-primary border-primary", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 mr-1" }),
        " COA Loaded"
      ] })
    ] }) }),
    !hasCoa ? /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "flex flex-col gap-3", children: [
        /* @__PURE__ */ jsx("span", { children: "Load your Chart of Accounts before mapping WIP accounts." }),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => onNavigate?.(2, 1), children: "Go to Chart of Accounts" }) })
      ] })
    ] }) }) : /* @__PURE__ */ jsx(CardContent, { className: "space-y-3", children: Object.keys(WIP_SLOT_DEFINITIONS).map(renderSlot) })
  ] });
}
const CURRENCY_OPTIONS = [
  { value: "USD $", label: "USD $" },
  { value: "CAD $", label: "CAD $" },
  { value: "GBP £", label: "GBP £" },
  { value: "AUD $", label: "AUD $" },
  { value: "NZD $", label: "NZD $" },
  { value: "MXN $", label: "MXN $" },
  { value: "EUR €", label: "EUR €" }
];
const ProjectSetupSection = (props) => {
  const settings = props.project.wizard_data?.settings || {};
  const onboardingComplete = settings.onboardingComplete;
  if (!onboardingComplete) {
    return /* @__PURE__ */ jsx(
      OnboardingFlow,
      {
        project: props.project,
        updateProject: props.updateProject,
        updateWizardData: props.updateWizardData,
        onNavigate: props.onNavigate,
        onSave: props.onSave
      }
    );
  }
  return /* @__PURE__ */ jsx(ProjectSetupSectionInner, { ...props });
};
const ProjectSetupSectionInner = ({
  project,
  updateProject,
  updateWizardData,
  dueDiligenceData,
  updateDueDiligenceData,
  onNavigate,
  onSave
}) => {
  const settings = project.wizard_data?.settings || {};
  const inventoryEnabled = settings.inventoryEnabled || false;
  const wipEnabled = settings.wipEnabled || false;
  const DD_CHECKLIST = useMemo(() => getFilteredChecklist(inventoryEnabled, wipEnabled), [inventoryEnabled, wipEnabled]);
  const updateSettings = (updates) => {
    updateWizardData("settings", { ...settings, ...updates });
  };
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const currentMonth = (/* @__PURE__ */ new Date()).getMonth() + 1;
  const years = getYearRange();
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(currentYear - 2);
  const [endMonth, setEndMonth] = useState(12);
  const [endYear, setEndYear] = useState(currentYear);
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  const maxEndMonth = getMaxEndMonth(endYear);
  const [includeStub, setIncludeStub] = useState(false);
  const [stubStartMonth, setStubStartMonth] = useState(1);
  const [stubStartYear, setStubStartYear] = useState(currentYear);
  const [stubEndMonth, setStubEndMonth] = useState(currentMonth);
  const [stubEndYear, setStubEndYear] = useState(currentYear);
  const [isInitialized, setIsInitialized] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [cimInsights, setCimInsights] = useState(null);
  const [uploadingCim, setUploadingCim] = useState(false);
  const [cimSynced, setCimSynced] = useState(false);
  const cimFileInputRef = useRef(null);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const checklist = dueDiligenceData.checklist || {};
  const checklistOverrides = dueDiligenceData.checklistOverrides || {};
  const notApplicable = dueDiligenceData.notApplicable || {};
  useEffect(() => {
    if (project.periods && Array.isArray(project.periods) && project.periods.length > 0) {
      const regularPeriods2 = project.periods.filter((p) => !p.isStub);
      const stubPeriods = project.periods.filter((p) => p.isStub);
      if (regularPeriods2.length > 0) {
        const firstPeriod = regularPeriods2[0];
        const lastPeriod = regularPeriods2[regularPeriods2.length - 1];
        if (typeof firstPeriod === "object" && "year" in firstPeriod && firstPeriod.year > 0) {
          setStartMonth(firstPeriod.month);
          setStartYear(firstPeriod.year);
        }
        if (typeof lastPeriod === "object" && "year" in lastPeriod && lastPeriod.year > 0) {
          setEndMonth(lastPeriod.month);
          setEndYear(lastPeriod.year);
        }
      }
      if (stubPeriods.length > 0) {
        const firstStub = stubPeriods[0];
        const lastStub = stubPeriods[stubPeriods.length - 1];
        if (firstStub.startDate && lastStub.endDate) {
          setIncludeStub(true);
          const [sy, sm] = firstStub.startDate.split("-").map(Number);
          setStubStartMonth(sm);
          setStubStartYear(sy);
          const [ey, em] = lastStub.endDate.split("-").map(Number);
          setStubEndMonth(em);
          setStubEndYear(ey);
        }
      }
    }
    setIsInitialized(true);
  }, []);
  useEffect(() => {
    if (!isInitialized) return;
    if (endMonth > maxEndMonth) {
      setEndMonth(maxEndMonth);
    }
  }, [isInitialized, endYear, endMonth, maxEndMonth]);
  useEffect(() => {
    if (!isInitialized) return;
    if (startYear > endYear || startYear === endYear && startMonth > endMonth) {
      return;
    }
    let periods2 = generatePeriods(startMonth, startYear, endMonth, endYear);
    if (includeStub) {
      const stubStart = new Date(stubStartYear, stubStartMonth - 1, 1);
      const stubEnd = new Date(stubEndYear, stubEndMonth, 0);
      if (stubStart < stubEnd) {
        const stubPeriods = createStubPeriods(stubStart, stubEnd);
        periods2 = [...periods2, ...stubPeriods];
      }
    }
    updateProject({ periods: periods2 });
  }, [isInitialized, startMonth, startYear, endMonth, endYear, includeStub, stubStartMonth, stubStartYear, stubEndMonth, stubEndYear]);
  useEffect(() => {
    if (!project.id) return;
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const { data: docs, error } = await supabase.from("documents").select("id, account_type, period_start, period_end, processing_status").eq("project_id", project.id).limit(1e6);
        if (error) throw error;
        setDocuments(docs || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
    const channel = supabase.channel(`setup-docs-${project.id}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "documents",
        filter: `project_id=eq.${project.id}`
      },
      () => {
        fetchDocuments();
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);
  useEffect(() => {
    if (!project.id) return;
    const fetchCimInsights = async () => {
      try {
        const { data, error } = await supabase.from("processed_data").select("data").eq("project_id", project.id).eq("data_type", "cim_insights").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!error && data?.data) {
          const insights = data.data;
          setCimInsights(insights);
          const needsSync = !project.industry && !project.target_company;
          if (needsSync && !cimSynced) {
            const { fieldsUpdated, updates } = autoFillFromCim(insights);
            if (fieldsUpdated > 0) {
              setCimSynced(true);
              if (onSave && Object.keys(updates).length > 0) {
                await onSave(updates);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching CIM insights:", error);
      }
    };
    fetchCimInsights();
  }, [project.id]);
  const autoFillFromCim = (insights) => {
    let fieldsUpdated = 0;
    const updates = {};
    if (insights.marketPosition?.industry) {
      updates.industry = insights.marketPosition.industry;
      fieldsUpdated++;
    }
    if (!project.target_company) {
      let companyName = null;
      if (insights.businessOverview?.description) {
        const descMatch = insights.businessOverview.description.match(
          /^([A-Z][A-Za-z0-9\s&'.-]+(?:\([A-Z]+\))?)\s+(?:is|are|,)\s/
        );
        if (descMatch) {
          companyName = descMatch[1].trim();
        }
      }
      if (!companyName && insights.rawSummary) {
        const summaryMatch = insights.rawSummary.match(
          /^([A-Z][A-Za-z0-9\s&'.-]+(?:\([A-Z]+\))?)\s+(?:is|are|,)\s/
        );
        if (summaryMatch) {
          companyName = summaryMatch[1].trim();
        }
      }
      if (companyName && companyName.length > 2 && companyName.length < 100) {
        updates.target_company = companyName;
        fieldsUpdated++;
      }
    }
    if (Object.keys(updates).length > 0) {
      updateProject(updates);
    }
    const notesParts = [];
    if (insights.businessOverview?.description) {
      notesParts.push(`**Business Overview:**
${insights.businessOverview.description}`);
    }
    if (insights.businessOverview?.headquarters) {
      notesParts.push(`**Headquarters:** ${insights.businessOverview.headquarters}`);
    }
    if (insights.businessOverview?.foundedYear || insights.businessOverview?.employeeCount) {
      const details = [];
      if (insights.businessOverview.foundedYear) details.push(`Founded: ${insights.businessOverview.foundedYear}`);
      if (insights.businessOverview.employeeCount) details.push(`Employees: ${insights.businessOverview.employeeCount}`);
      notesParts.push(`**Company Details:** ${details.join(" | ")}`);
    }
    if (insights.dealContext?.reasonForSale) {
      notesParts.push(`**Reason for Sale:** ${insights.dealContext.reasonForSale}`);
    }
    if (insights.keyRisks && insights.keyRisks.length > 0) {
      notesParts.push(`**Key Risks:** ${insights.keyRisks.slice(0, 3).join("; ")}`);
    }
    if (insights.marketPosition?.competitiveAdvantages && insights.marketPosition.competitiveAdvantages.length > 0) {
      notesParts.push(`**Competitive Advantages:** ${insights.marketPosition.competitiveAdvantages.slice(0, 3).join("; ")}`);
    }
    if (notesParts.length > 0) {
      updateDueDiligenceData({
        ...dueDiligenceData,
        notes: `--- Auto-extracted from CIM ---

${notesParts.join("\n\n")}`
      });
      fieldsUpdated++;
    }
    return { fieldsUpdated, updates };
  };
  const handleCimUpload = async (file) => {
    setUploadingCim(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${project.id}/cim/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: doc, error: insertError } = await supabase.from("documents").insert({
        project_id: project.id,
        user_id: user.id,
        name: file.name,
        file_path: filePath,
        file_type: fileExt,
        file_size: file.size,
        account_type: "cim",
        processing_status: "processing"
      }).select().single();
      if (insertError) throw insertError;
      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-cim", {
        body: { documentId: doc.id, projectId: project.id }
      });
      if (parseError) throw parseError;
      if (parseResult?.insights) {
        setCimInsights(parseResult.insights);
        const { fieldsUpdated, updates } = autoFillFromCim(parseResult.insights);
        setCimSynced(true);
        if (onSave && fieldsUpdated > 0 && Object.keys(updates).length > 0) {
          await onSave(updates);
        }
        toast.success(
          `CIM parsed! ${fieldsUpdated} field${fieldsUpdated > 1 ? "s" : ""} auto-filled — please review for accuracy.`,
          { duration: 5e3 }
        );
      }
    } catch (error) {
      console.error("CIM upload error:", error);
      toast.error("Failed to process CIM");
    } finally {
      setUploadingCim(false);
    }
  };
  const handleSyncFromCim = async () => {
    if (!cimInsights) return;
    const { fieldsUpdated, updates } = autoFillFromCim(cimInsights);
    setCimSynced(true);
    if (fieldsUpdated > 0) {
      if (onSave && Object.keys(updates).length > 0) {
        await onSave(updates);
      }
      toast.success(`Synced ${fieldsUpdated} field${fieldsUpdated > 1 ? "s" : ""} from CIM — please review for accuracy.`);
    } else {
      toast.info("No fields to sync - all fields already have values");
    }
  };
  const periods = project.periods || [];
  const regularPeriods = periods.filter((p) => !p.isStub);
  const stubPeriod = periods.find((p) => p.isStub);
  const displayPeriods = showAllPeriods ? regularPeriods : regularPeriods.slice(0, 6);
  const autoCheckStates = useMemo(() => {
    const states = {};
    const wizardData = project.wizard_data;
    DD_CHECKLIST.forEach((item) => {
      const isComplete = isChecklistItemComplete(item, wizardData, documents);
      if (isComplete) {
        states[item.id] = "full";
        return;
      }
      if (item.docType && item.needsPeriodCoverage && periods.length > 0) {
        const docsOfType = documents.filter((d) => d.account_type === item.docType);
        if (docsOfType.length > 0) {
          const coverage = calculatePeriodCoverage(periods, docsOfType);
          states[item.id] = coverage.status;
          return;
        }
      }
      states[item.id] = "none";
    });
    return states;
  }, [documents, periods, project.wizard_data]);
  const getEffectiveChecked = (itemId) => {
    if (notApplicable[itemId]) return false;
    if (itemId in checklistOverrides) return checklistOverrides[itemId];
    if (autoCheckStates[itemId] === "full") return true;
    return checklist[itemId] || false;
  };
  const getCheckSource = (itemId) => {
    if (notApplicable[itemId]) return "na";
    if (itemId in checklistOverrides) return "manual";
    if (autoCheckStates[itemId] === "full") return "auto";
    if (autoCheckStates[itemId] === "partial") return "partial";
    return "none";
  };
  const toggleItem = (itemId) => {
    if (notApplicable[itemId]) return;
    const currentEffective = getEffectiveChecked(itemId);
    const autoState = autoCheckStates[itemId];
    if (autoState === "full") {
      if (currentEffective) {
        updateDueDiligenceData({
          ...dueDiligenceData,
          checklistOverrides: { ...checklistOverrides, [itemId]: false }
        });
      } else {
        const newOverrides = { ...checklistOverrides };
        delete newOverrides[itemId];
        updateDueDiligenceData({
          ...dueDiligenceData,
          checklistOverrides: newOverrides
        });
      }
    } else {
      updateDueDiligenceData({
        ...dueDiligenceData,
        checklist: {
          ...checklist,
          [itemId]: !currentEffective
        }
      });
    }
  };
  const toggleNA = (itemId) => {
    const isCurrentlyNA = notApplicable[itemId];
    if (isCurrentlyNA) {
      const newNA = { ...notApplicable };
      delete newNA[itemId];
      updateDueDiligenceData({ ...dueDiligenceData, notApplicable: newNA });
    } else {
      const newChecklist = { ...checklist };
      delete newChecklist[itemId];
      const newOverrides = { ...checklistOverrides };
      delete newOverrides[itemId];
      updateDueDiligenceData({
        ...dueDiligenceData,
        notApplicable: { ...notApplicable, [itemId]: true },
        checklist: newChecklist,
        checklistOverrides: newOverrides
      });
    }
  };
  const getStatusBadge = (itemId) => {
    const source = getCheckSource(itemId);
    const item = DD_CHECKLIST.find((i) => i.id === itemId);
    const hasDocType = item?.docType;
    const hasWizardCheck = item?.checkWizardSection;
    if (source === "na") {
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs gap-1 text-muted-foreground bg-muted/50", children: [
        /* @__PURE__ */ jsx(Ban, { className: "w-3 h-3" }),
        " N/A"
      ] });
    }
    if (source === "auto") {
      return /* @__PURE__ */ jsxs(Badge, { variant: "default", className: "bg-green-600 text-xs gap-1", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3" }),
        " Auto"
      ] });
    }
    if (source === "partial" && hasDocType) {
      return /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-xs gap-1", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
        " Partial"
      ] });
    }
    if (source === "manual" && hasDocType) {
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs gap-1", children: [
        /* @__PURE__ */ jsx(User, { className: "w-3 h-3" }),
        " Override"
      ] });
    }
    if ((hasDocType || hasWizardCheck) && autoCheckStates[itemId] === "none") {
      if (hasWizardCheck && item?.sectionNav && onNavigate) {
        return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
            Badge,
            {
              variant: "outline",
              className: "text-xs gap-1 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors",
              onClick: () => onNavigate(item.sectionNav.phase, item.sectionNav.section),
              children: [
                /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }),
                " Go to ",
                item.sectionNav.label
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsxs("p", { children: [
            "Complete the ",
            item.sectionNav.label,
            " section to auto-check this item"
          ] }) })
        ] }) });
      }
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs gap-1 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
        " Awaiting"
      ] });
    }
    return null;
  };
  const stats = useMemo(() => {
    const byTier = (tier) => {
      const items = DD_CHECKLIST.filter((i) => i.tier === tier);
      const received2 = items.filter((item) => !notApplicable[item.id] && getEffectiveChecked(item.id)).length;
      return { total: items.length, received: received2 };
    };
    const received = DD_CHECKLIST.filter(
      (item) => !notApplicable[item.id] && getEffectiveChecked(item.id)
    ).length;
    const naCount = DD_CHECKLIST.filter((item) => notApplicable[item.id]).length;
    const awaiting = DD_CHECKLIST.length - received - naCount;
    const required = byTier("required");
    const recommended = byTier("recommended");
    const optional = byTier("optional");
    return { received, naCount, awaiting, required, recommended, optional };
  }, [checklist, checklistOverrides, notApplicable, autoCheckStates]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Project Setup" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Enter engagement details, contacts, and define the analysis period" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "border-dashed border-primary/30 bg-primary/5", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-primary" }),
          "Quick Start with CIM"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Upload your CIM (Confidential Information Memorandum) to auto-fill project details" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: !cimInsights ? /* @__PURE__ */ jsx("div", { className: "space-y-4", children: !uploadingCim ? /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors", children: [
        /* @__PURE__ */ jsx(Upload, { className: "h-8 w-8 mx-auto text-muted-foreground mb-2" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Drag & drop your CIM or click to browse" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: cimFileInputRef,
            type: "file",
            accept: ".pdf,.docx,.doc",
            className: "hidden",
            onChange: (e) => {
              const file = e.target.files?.[0];
              if (file) handleCimUpload(file);
            }
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            type: "button",
            onClick: (e) => {
              e.preventDefault();
              cimFileInputRef.current?.click();
            },
            children: [
              /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 mr-2" }),
              "Select CIM File"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsxs(Alert, { children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        /* @__PURE__ */ jsx(AlertDescription, { children: "Extracting business insights from CIM..." })
      ] }) }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Alert, { className: "border-green-600/30 bg-green-600/5", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-green-600" }),
          /* @__PURE__ */ jsxs(AlertDescription, { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "CIM uploaded and parsed successfully!" }),
            !cimSynced && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: handleSyncFromCim, children: "Apply to Fields" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(CIMInsightsCard, { insights: cimInsights })
      ] }) })
    ] }),
    cimSynced && /* @__PURE__ */ jsxs(Alert, { className: "border-amber-500/30 bg-amber-500/5", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-amber-600" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("strong", { children: "Please review:" }),
        " Fields below were auto-filled from your CIM. Verify the information is accurate and make any necessary corrections."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: "Engagement Details" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Client and project information" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "clientName", children: "Client Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "clientName",
              placeholder: "e.g., ABC Capital Partners",
              value: project.client_name || "",
              onChange: (e) => updateProject({ client_name: e.target.value })
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
              value: project.target_company || "",
              onChange: (e) => updateProject({ target_company: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "transactionType", children: "Transaction Type" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: project.transaction_type || "buy-side",
              onValueChange: (value) => updateProject({ transaction_type: value }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "transactionType", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "buy-side", children: "Buy-Side" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "sell-side", children: "Sell-Side" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "industry", children: "Industry" }),
            cimSynced && cimInsights?.marketPosition?.industry && project.industry && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs bg-primary/10 text-primary border-primary/20", children: "From CIM" })
          ] }),
          /* @__PURE__ */ jsxs(Popover, { open: industryOpen, onOpenChange: setIndustryOpen, children: [
            /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                role: "combobox",
                "aria-expanded": industryOpen,
                className: "w-full justify-between font-normal",
                children: [
                  project.industry || "Select industry...",
                  /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(PopoverContent, { className: "w-full p-0 bg-background", align: "start", children: /* @__PURE__ */ jsxs(Command, { children: [
              /* @__PURE__ */ jsx(
                CommandInput,
                {
                  placeholder: "Search or type custom...",
                  value: industrySearch,
                  onValueChange: setIndustrySearch
                }
              ),
              /* @__PURE__ */ jsxs(CommandList, { children: [
                /* @__PURE__ */ jsx(CommandEmpty, { children: industrySearch.trim() && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    className: "w-full px-4 py-2 text-left text-sm hover:bg-accent cursor-pointer",
                    onClick: () => {
                      updateProject({ industry: industrySearch.trim() });
                      setIndustryOpen(false);
                      setIndustrySearch("");
                    },
                    children: [
                      'Add "',
                      industrySearch.trim(),
                      '"'
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx(CommandGroup, { children: getIndustryLabels().map((label) => /* @__PURE__ */ jsxs(
                  CommandItem,
                  {
                    value: label,
                    onSelect: () => {
                      updateProject({ industry: label });
                      setIndustryOpen(false);
                      setIndustrySearch("");
                    },
                    children: [
                      /* @__PURE__ */ jsx(
                        Check,
                        {
                          className: cn(
                            "mr-2 h-4 w-4",
                            project.industry === label ? "opacity-100" : "opacity-0"
                          )
                        }
                      ),
                      label
                    ]
                  },
                  label
                )) })
              ] })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "location", children: "Location" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "location",
              placeholder: "e.g., Dallas, TX",
              value: dueDiligenceData.location || "",
              onChange: (e) => updateDueDiligenceData({ ...dueDiligenceData, location: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "currency", children: "Currency" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: dueDiligenceData.currency || "USD $",
              onValueChange: (value) => updateDueDiligenceData({ ...dueDiligenceData, currency: value }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "currency", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsx(SelectContent, { children: CURRENCY_OPTIONS.map((opt) => /* @__PURE__ */ jsx(SelectItem, { value: opt.value, children: opt.label }, opt.value)) })
              ]
            }
          )
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Key Contacts" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "For accounting firms managing client engagements" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "showContacts", className: "text-sm text-muted-foreground", children: Boolean(settings.showKeyContacts) ? "Enabled" : "Disabled" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              id: "showContacts",
              checked: Boolean(settings.showKeyContacts),
              onCheckedChange: (checked) => updateSettings({ showKeyContacts: checked })
            }
          )
        ] })
      ] }) }),
      Boolean(settings.showKeyContacts) && /* @__PURE__ */ jsxs(CardContent, { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "clientContact", children: "Client Contact" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "clientContact",
              placeholder: "Name",
              value: dueDiligenceData.clientContact || "",
              onChange: (e) => updateDueDiligenceData({ ...dueDiligenceData, clientContact: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "clientEmail", children: "Client Email" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "clientEmail",
              type: "email",
              placeholder: "email@example.com",
              value: dueDiligenceData.clientEmail || "",
              onChange: (e) => updateDueDiligenceData({ ...dueDiligenceData, clientEmail: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "targetContact", children: "Target Company Contact" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "targetContact",
              placeholder: "Name",
              value: dueDiligenceData.targetContact || "",
              onChange: (e) => updateDueDiligenceData({ ...dueDiligenceData, targetContact: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "targetEmail", children: "Target Email" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "targetEmail",
              type: "email",
              placeholder: "email@example.com",
              value: dueDiligenceData.targetEmail || "",
              onChange: (e) => updateDueDiligenceData({ ...dueDiligenceData, targetEmail: e.target.value })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      FinancialCategoryLabelsCard,
      {
        project,
        dueDiligenceData,
        updateDueDiligenceData,
        onNavigate
      }
    ),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5" }),
          "Financial Periods"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Define the analysis period range" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "fiscalYearEnd", children: "Fiscal Year End" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: project.fiscal_year_end || "",
              onValueChange: (value) => updateProject({ fiscal_year_end: value }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { id: "fiscalYearEnd", className: "w-full md:w-[200px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select month" }) }),
                /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((month) => /* @__PURE__ */ jsx(SelectItem, { value: month, children: month }, month)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Start Period" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: String(startMonth),
                  onValueChange: (v) => setStartMonth(Number(v)),
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "flex-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((month, idx) => /* @__PURE__ */ jsx(SelectItem, { value: String(idx + 1), children: month }, month)) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: String(startYear),
                  onValueChange: (v) => setStartYear(Number(v)),
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[100px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: years.map((year) => /* @__PURE__ */ jsx(SelectItem, { value: String(year), children: year }, year)) })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "End Period" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: String(endMonth),
                  onValueChange: (v) => setEndMonth(Number(v)),
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "flex-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((month, idx) => {
                      const monthNum = idx + 1;
                      const isDisabled = monthNum > maxEndMonth;
                      return /* @__PURE__ */ jsxs(
                        SelectItem,
                        {
                          value: String(monthNum),
                          disabled: isDisabled,
                          className: isDisabled ? "text-muted-foreground" : "",
                          children: [
                            month,
                            isDisabled && " (future)"
                          ]
                        },
                        month
                      );
                    }) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Select,
                {
                  value: String(endYear),
                  onValueChange: (v) => setEndYear(Number(v)),
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[100px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: years.map((year) => /* @__PURE__ */ jsx(SelectItem, { value: String(year), children: year }, year)) })
                  ]
                }
              )
            ] }),
            endYear === currentYear && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(AlertCircle, { className: "h-3 w-3" }),
              "Future months disabled – QuickBooks cannot sync data that doesn't exist yet"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                id: "includeStub",
                checked: includeStub,
                onCheckedChange: (checked) => setIncludeStub(checked === true)
              }
            ),
            /* @__PURE__ */ jsx(Label, { htmlFor: "includeStub", className: "font-normal cursor-pointer", children: "Include stub period (YTD / partial period)" })
          ] }),
          includeStub && /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2 pl-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Stub Start Period" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs(Select, { value: String(stubStartMonth), onValueChange: (v) => setStubStartMonth(Number(v)), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "flex-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((m, i) => /* @__PURE__ */ jsx(SelectItem, { value: String(i + 1), children: m }, i)) })
                ] }),
                /* @__PURE__ */ jsxs(Select, { value: String(stubStartYear), onValueChange: (v) => setStubStartYear(Number(v)), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[100px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: years.map((y) => /* @__PURE__ */ jsx(SelectItem, { value: String(y), children: y }, y)) })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Stub End Period" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs(Select, { value: String(stubEndMonth), onValueChange: (v) => setStubEndMonth(Number(v)), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "flex-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: MONTHS.map((m, i) => /* @__PURE__ */ jsx(SelectItem, { value: String(i + 1), children: m }, i)) })
                ] }),
                /* @__PURE__ */ jsxs(Select, { value: String(stubEndYear), onValueChange: (v) => setStubEndYear(Number(v)), children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[100px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsx(SelectContent, { children: years.map((y) => /* @__PURE__ */ jsx(SelectItem, { value: String(y), children: y }, y)) })
                ] })
              ] })
            ] }),
            (stubStartYear > stubEndYear || stubStartYear === stubEndYear && stubStartMonth > stubEndMonth) && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive col-span-2", children: "End period must be after start period" })
          ] })
        ] }),
        startYear > endYear || startYear === endYear && startMonth > endMonth ? /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: "End period must be after start period" }) : /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2 border-t", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
              "Generated Periods: ",
              /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
                regularPeriods.length,
                " months"
              ] }),
              stubPeriod && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: " + 1 stub" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: formatPeriodRange(periods) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
            displayPeriods.map((period) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: period.label }, period.id)),
            regularPeriods.length > 6 && !showAllPeriods && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
              "+",
              regularPeriods.length - 6,
              " more"
            ] }),
            stubPeriod && /* @__PURE__ */ jsx(Badge, { variant: "default", className: "text-xs bg-primary/80", children: stubPeriod.label })
          ] }),
          regularPeriods.length > 6 && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => setShowAllPeriods(!showAllPeriods),
              className: "h-8 px-2 text-xs",
              children: showAllPeriods ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(ChevronUp, { className: "h-3 w-3 mr-1" }),
                "Show less"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3 mr-1" }),
                "Show all ",
                regularPeriods.length,
                " periods"
              ] })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { className: "h-5 w-5" }),
          "Optional Sections"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Enable or disable optional wizard sections based on business type" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg border bg-muted/30", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "inventoryEnabled", className: "font-medium cursor-pointer", children: "Track Inventory" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Enable if the company holds inventory (raw materials, work-in-progress, finished goods)" })
          ] }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              id: "inventoryEnabled",
              checked: inventoryEnabled,
              onCheckedChange: (checked) => updateSettings({ inventoryEnabled: checked })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg border bg-muted/30", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "wipEnabled", className: "font-medium cursor-pointer", children: "Track Work in Progress (WIP)" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Enable for project-based or construction businesses with job costing, over/under billings" })
          ] }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              id: "wipEnabled",
              checked: wipEnabled,
              onCheckedChange: (checked) => updateSettings({ wipEnabled: checked })
            }
          )
        ] })
      ] })
    ] }),
    wipEnabled && /* @__PURE__ */ jsx(
      WIPAccountMappingCard,
      {
        project,
        dueDiligenceData,
        updateDueDiligenceData,
        onNavigate
      }
    ),
    /* @__PURE__ */ jsx(Collapsible, { open: checklistOpen, onOpenChange: setChecklistOpen, children: /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between cursor-pointer", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Document Request Checklist" }),
          /* @__PURE__ */ jsxs(CardDescription, { children: [
            "Required: ",
            stats.required.received,
            "/",
            stats.required.total,
            " • Recommended: ",
            stats.recommended.received,
            "/",
            stats.recommended.total,
            " • Optional: ",
            stats.optional.received,
            "/",
            stats.optional.total,
            stats.naCount > 0 && ` • ${stats.naCount} N/A`
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", children: checklistOpen ? /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" }) })
      ] }) }) }),
      /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsx(CardContent, { className: "pt-0 space-y-4", children: ["required", "recommended", "optional"].map((tier) => {
        const tierItems = DD_CHECKLIST.filter((i) => i.tier === tier);
        if (tierItems.length === 0) return null;
        const tierLabels = {
          required: { label: "Required", color: "text-destructive", bg: "bg-destructive/10" },
          recommended: { label: "Recommended", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
          optional: { label: "Optional", color: "text-muted-foreground", bg: "bg-muted/30" }
        };
        const config = tierLabels[tier];
        return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-xs", config.color), children: config.label }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              tierItems.filter((i) => !notApplicable[i.id] && getEffectiveChecked(i.id)).length,
              "/",
              tierItems.length
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: cn("rounded-lg p-2 space-y-1", config.bg), children: tierItems.map((item) => {
            const isChecked = getEffectiveChecked(item.id);
            const isNA = notApplicable[item.id];
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "flex items-center justify-between p-2 rounded-md transition-colors",
                  isNA && "opacity-60",
                  isChecked && !isNA && "bg-green-50 dark:bg-green-950/20"
                ),
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsx(
                      Checkbox,
                      {
                        id: item.id,
                        checked: isChecked,
                        onCheckedChange: () => toggleItem(item.id),
                        disabled: isNA,
                        className: cn(isNA && "opacity-50")
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Label,
                      {
                        htmlFor: item.id,
                        className: cn(
                          "font-normal cursor-pointer truncate",
                          isNA && "line-through text-muted-foreground"
                        ),
                        children: item.label
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [
                    getStatusBadge(item.id),
                    item.canBeNA && /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
                      /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                        Button,
                        {
                          variant: "ghost",
                          size: "sm",
                          className: cn("h-6 px-2 text-xs", isNA && "bg-muted"),
                          onClick: () => toggleNA(item.id),
                          children: "N/A"
                        }
                      ) }),
                      /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsx("p", { children: isNA ? "Remove N/A status" : "Mark as Not Applicable" }) })
                    ] }) })
                  ] })
                ]
              },
              item.id
            );
          }) })
        ] }, tier);
      }) }) })
    ] }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Notes" }),
          cimSynced && cimInsights?.businessOverview?.description && dueDiligenceData.notes && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs bg-primary/10 text-primary border-primary/20", children: "From CIM" })
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Additional notes or comments" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
        Textarea,
        {
          placeholder: "Enter any additional notes...",
          value: dueDiligenceData.notes || "",
          onChange: (e) => updateDueDiligenceData({ ...dueDiligenceData, notes: e.target.value }),
          rows: 4
        }
      ) })
    ] })
  ] });
};
export {
  ProjectSetupSection
};
