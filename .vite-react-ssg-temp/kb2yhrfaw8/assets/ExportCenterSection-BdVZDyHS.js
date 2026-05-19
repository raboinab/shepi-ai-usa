import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase, C as Card, b as CardHeader, d as CardTitle, f as CardContent, j as Badge, B as Button, i as trackEvent } from "../main.mjs";
import { Sparkles, Loader2, Save, CheckCircle, PartyPopper, AlertCircle, ArrowRight, Download, FileSpreadsheet, Share2 } from "lucide-react";
import { toast } from "sonner";
import { g as getExportReadiness, c as computeQoEMetrics } from "./InsightsView-C9eH5gNO.js";
import { e as exportWorkbookXlsx } from "./exportWorkbookXlsx-B0pfVts0.js";
import { I as calcReportedEBITDA, F as calcRevenue, m as buildFreeCashFlowGrid, r as buildNWCAnalysisGrid, t as buildWorkingCapitalGrid, x as buildOpExGrid, y as buildCOGSGrid, z as buildSalesGrid, v as buildQoEAnalysisGrid, at as buildDDAdjustmentsGrid, D as buildIncomeStatementGrid, C as buildISDetailedGrid, w as buildOtherExpenseGrid, j as buildPayrollGrid, B as buildBalanceSheetGrid, A as buildBSDetailedGrid, i as buildARAgingGrid, h as buildAPAgingGrid, f as buildFixedAssetsGrid, R as buildProofOfCashGrid, e as buildTopCustomersGrid, d as buildTopVendorsGrid, a4 as reclassAwareRevenue, a8 as reclassAwareGrossProfit, a6 as reclassAwareOperatingIncome, af as reclassAwareNetIncome, $ as reclassAwareAdjustedEBITDA, ab as calcTotalAssets, ae as calcTotalEquity, a1 as calcTotalCurrentAssets, a2 as calcTotalCurrentLiabilities, ad as calcTotalLiabilities, N as sumByLineItem, aj as calcCOGS } from "./sanitizeWizardData-Dv9tWNGG.js";
import { T as Textarea } from "./textarea-AMc2tKlb.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription } from "./dialog-BYBu6BQa.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { S as Spinner } from "./spinner-Cl42thGn.js";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "vite-react-ssg";
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
import "react-resizable-panels";
import "recharts";
import "./scroll-area-DLvncVK9.js";
import "@radix-ui/react-scroll-area";
import "date-fns";
import "./table-BHTmwZ8v.js";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./input-RFtselAh.js";
import "react-markdown";
import "./progress-Y5q1JT93.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "./workbook-tabs-EPVJV9jR.js";
import "@radix-ui/react-dialog";
import "@radix-ui/react-tabs";
function buildClientPDF(reportData, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./pdfWorker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "progress" && onProgress) {
        onProgress({ page: msg.page, total: msg.total });
      } else if (msg.type === "done") {
        const blob = new Blob([msg.pdf], { type: "application/pdf" });
        worker.terminate();
        resolve(blob);
      } else if (msg.type === "error") {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(err.message || "Worker error"));
    };
    worker.postMessage({ type: "build", payload: reportData });
  });
}
const SEV_RANK = { high: 0, medium: 1, low: 2, info: 3 };
const FILLER_RATIONALE = /* @__PURE__ */ new Set([
  "this finding may affect reported ebitda and warrants further analysis.",
  "adjustment identified for review.",
  "review supporting detail and confirm adjustment basis."
]);
const FILLER_FOLLOWUP = /* @__PURE__ */ new Set([
  "validate with supporting documentation and confirm with management.",
  "review supporting detail and confirm adjustment basis."
]);
function squash(s) {
  return s.replace(/\s+/g, " ").trim();
}
function trimToSentence(s, max) {
  const t = squash(s);
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const lastPeriod = slice.lastIndexOf(".");
  if (lastPeriod > max * 0.6) return slice.slice(0, lastPeriod + 1);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).replace(/[,;:\-]+$/, "") + "…";
}
function normalizeSeverity(input, fallback = "medium") {
  const v = (input || "").toLowerCase();
  if (v === "high" || v === "critical") return "high";
  if (v === "low") return "low";
  if (v === "info" || v === "informational") return "info";
  if (v === "medium" || v === "moderate") return "medium";
  return fallback;
}
function pickRationale(raw) {
  const candidates = [raw.rationale, raw.description].map((s) => squash(s || ""));
  for (const c of candidates) {
    if (!c) continue;
    if (FILLER_RATIONALE.has(c.toLowerCase())) continue;
    return trimToSentence(c, 160);
  }
  return "";
}
function pickFollowUp(raw) {
  const f = squash(raw.followUp || "");
  if (!f) return "";
  if (FILLER_FOLLOWUP.has(f.toLowerCase())) return "";
  return trimToSentence(f, 110);
}
function normalizeAttentionItems(raw, limit = 6) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const r of raw) {
    const titleRaw = squash(r.title || "");
    if (!titleRaw) continue;
    const dedupeKey = titleRaw.toLowerCase().slice(0, 80);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const severity = normalizeSeverity(r.severity);
    const rationale = pickRationale(r) || "Identified during analysis; review supporting detail to confirm impact.";
    const followUp = pickFollowUp(r) || "Verify against source records and corroborate with management.";
    out.push({
      title: trimToSentence(titleRaw, 110),
      severity,
      ebitdaImpact: r.ebitdaImpact ?? void 0,
      rationale,
      followUp,
      description: r.description ?? void 0
    });
  }
  out.sort((a, b) => {
    const s = SEV_RANK[a.severity] - SEV_RANK[b.severity];
    if (s !== 0) return s;
    return Math.abs(b.ebitdaImpact || 0) - Math.abs(a.ebitdaImpact || 0);
  });
  return out.slice(0, limit);
}
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function buildMonthlyRevenue(dealData) {
  if (!dealData?.deal?.periods?.length) return void 0;
  const tb = dealData.trialBalance;
  const out = [];
  for (const p of dealData.deal.periods) {
    const rev = Math.abs(calcRevenue(tb, p.id) || 0);
    if (!isFinite(rev)) continue;
    const mLabel = `${MONTH_SHORT[(p.month || 1) - 1]} ${String(p.year).slice(2)}`;
    out.push({ month: mLabel, revenue: rev });
  }
  return out.length >= 6 ? out : void 0;
}
function buildPLReconciliation(dealData) {
  if (!dealData) return void 0;
  const agg = dealData.deal.aggregatePeriods?.[dealData.deal.aggregatePeriods.length - 1];
  const fallback = dealData.deal.periods?.[dealData.deal.periods.length - 1];
  const periodId = agg?.id || fallback?.id;
  if (!periodId) return void 0;
  const tb = dealData.trialBalance;
  const ab = dealData.addbacks;
  const adj = dealData.adjustments;
  const reported = -calcReportedEBITDA(tb, periodId, ab);
  const revenue = calcRevenue(tb, periodId);
  const ebitdaAdj = adj.filter((a) => a.effectType !== "NonQoE");
  const adjustments = ebitdaAdj.map((a) => ({
    label: a.label || a.notes || `${a.type} adjustment`,
    amount: a.amounts?.[periodId] || 0,
    category: a.type
  })).filter((x) => Math.abs(x.amount) > 0.5);
  const totalAdj = adjustments.reduce((s, x) => s + x.amount, 0);
  const adjusted = reported + totalAdj;
  if (!isFinite(reported) || adjustments.length === 0) return void 0;
  return { reportedEBITDA: reported, adjustments, adjustedEBITDA: adjusted, revenue: Math.abs(revenue) };
}
function buildBusinessOverview(wizardData, projectName, cimFallback) {
  const wd = wizardData || {};
  const intake = wd.intake || wd.businessProfile || wd.companyProfile || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = intake[k] ?? wd[k];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    return void 0;
  };
  const pickList = (...keys) => {
    for (const k of keys) {
      const v = intake[k] ?? wd[k];
      if (Array.isArray(v) && v.length > 0) return v.map(String).filter(Boolean);
      if (typeof v === "string" && v.includes("\n")) {
        const parts = v.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts;
      }
    }
    return void 0;
  };
  const description = pick("businessDescription", "description", "whatBusinessDoes", "companyDescription") || cimFallback?.businessOverview;
  const productsServices = pickList("productsServices", "products", "services") || cimFallback?.productsServices;
  const customerProfile = pick("customerProfile", "customers", "customerSegments");
  const growthDrivers = pickList("growthDrivers", "drivers") || cimFallback?.growthDrivers;
  const keyRisks = pickList("keyRisks", "risks") || cimFallback?.keyRisks;
  const founded = pick("foundedYear", "yearFounded", "founded");
  const headquarters = pick("hqLocation", "headquarters", "location");
  const employeeCount = pick("employeeCount", "employees", "headcount");
  const ownershipType = pick("ownershipType", "ownership");
  const hasAnything = description || productsServices?.length || customerProfile || growthDrivers?.length || keyRisks?.length || founded || headquarters || employeeCount || ownershipType;
  if (!hasAnything) return void 0;
  return { description, productsServices, customerProfile, growthDrivers, keyRisks, founded, headquarters, employeeCount, ownershipType };
}
const NARRATIVE_SLIDES = [
  { key: "qoe", title: "Quality of Earnings", style: "bullets", gridKeys: ["qoeAnalysis"] },
  { key: "revenue_detail", title: "Revenue Detail", style: "bullets", gridKeys: ["salesDetail"] },
  { key: "cogs_detail", title: "COGS Detail", style: "bullets", gridKeys: ["cogsDetail"] },
  { key: "opex_detail", title: "Operating Expenses", style: "bullets", gridKeys: ["opexDetail"] },
  { key: "working_capital", title: "Working Capital", style: "bullets", gridKeys: ["workingCapital", "nwcAnalysis"] },
  { key: "free_cash_flow", title: "Free Cash Flow", style: "bullets", gridKeys: ["freeCashFlow"] },
  { key: "attention_areas", title: "Attention Areas", style: "paragraphs" }
];
function serializeGrid(title, grid) {
  if (!grid || grid.rows.length === 0) return "";
  const cols = grid.columns;
  const header = cols.map((c) => c.label || c.key).join(" | ");
  const lines = [`### ${title}`, header];
  for (const row of grid.rows) {
    const cells = cols.map((c) => {
      const v = row.cells?.[c.key];
      if (v === null || v === void 0 || v === "") return "";
      if (typeof v === "number") {
        const colKey = (c.key || "").toLowerCase();
        const colLabel = (c.label || "").toLowerCase();
        const isPct = colKey.includes("pct") || colKey.includes("percent") || colKey.includes("margin") || colLabel.includes("%");
        if (isPct) {
          const p = Math.abs(v) < 1 ? v * 100 : v;
          return `${p.toFixed(1)}%`;
        }
        return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
      }
      return String(v);
    });
    lines.push(cells.join(" | "));
  }
  return lines.join("\n");
}
function serializeAttentionItems(items) {
  return items.map((it, i) => {
    const sev = it.severity ? ` [${it.severity.toUpperCase()}]` : "";
    const impact = it.ebitdaImpact != null ? ` (EBITDA impact: $${it.ebitdaImpact.toLocaleString("en-US", { maximumFractionDigits: 0 })})` : "";
    const detail = it.rationale || it.description || "";
    return `${i + 1}. ${it.title}${sev}${impact}
${detail}`;
  }).join("\n\n");
}
async function generateNarrative(args) {
  const { data, error } = await supabase.functions.invoke("generate-narrative", {
    body: args
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
async function getProjectNarratives(projectId) {
  const { data, error } = await supabase.from("project_narratives").select("*").eq("project_id", projectId);
  if (error) throw error;
  return data || [];
}
async function saveNarrativeEdit(args) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("project_narratives").upsert([{
    project_id: args.projectId,
    slide_key: args.slideKey,
    content: args.content,
    edited_by: user?.id,
    edited_at: (/* @__PURE__ */ new Date()).toISOString()
  }], { onConflict: "project_id,slide_key" });
  if (error) throw error;
}
const narratives = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  NARRATIVE_SLIDES,
  generateNarrative,
  getProjectNarratives,
  saveNarrativeEdit,
  serializeAttentionItems,
  serializeGrid
}, Symbol.toStringTag, { value: "Module" }));
function NarrativePanel({ projectId, grids, attentionItems }) {
  const [narratives2, setNarratives] = useState({});
  const [loading, setLoading] = useState({});
  const [records, setRecords] = useState([]);
  useEffect(() => {
    if (!projectId) return;
    getProjectNarratives(projectId).then((rs) => {
      setRecords(rs);
      const map = {};
      for (const r of rs) map[r.slide_key] = r.content;
      setNarratives(map);
    }).catch(console.error);
  }, [projectId]);
  const buildRawData = (slideKey, gridKeys) => {
    if (slideKey === "attention_areas") return serializeAttentionItems(attentionItems || []);
    return (gridKeys || []).map((k) => serializeGrid(k, grids[k])).filter(Boolean).join("\n\n");
  };
  const handleGenerate = async (slide) => {
    const rawData = buildRawData(slide.key, slide.gridKeys);
    if (!rawData) {
      toast.error(`No data available for ${slide.title}`);
      return;
    }
    setLoading((s) => ({ ...s, [slide.key]: true }));
    try {
      const res = await generateNarrative({
        projectId,
        slideKey: slide.key,
        slideTitle: slide.title,
        rawData,
        style: slide.style
      });
      setNarratives((n) => ({ ...n, [slide.key]: res.content }));
      toast.success(`Generated narrative for ${slide.title}`);
    } catch (e) {
      toast.error(`Generation failed: ${e.message}`);
    } finally {
      setLoading((s) => ({ ...s, [slide.key]: false }));
    }
  };
  const handleSave = async (slideKey) => {
    try {
      await saveNarrativeEdit({ projectId, slideKey, content: narratives2[slideKey] });
      toast.success("Saved");
    } catch (e) {
      toast.error(`Save failed: ${e.message}`);
    }
  };
  const updateField = (slideKey, updater) => {
    setNarratives((n) => ({ ...n, [slideKey]: updater(n[slideKey] || {}) }));
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-primary" }),
        "AI Analyst Commentary"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Generate Kyle/AKB-style narrative for each slide. Numbers are auto-verified against your data; unverified figures are stripped. Edit freely before exporting." })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: NARRATIVE_SLIDES.map((slide) => {
      const content = narratives2[slide.key] || {};
      const rec = records.find((r) => r.slide_key === slide.key);
      const isLoading = loading[slide.key];
      return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-3 space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: slide.title }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: slide.style }),
            rec?.edited_at && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: "edited" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", disabled: isLoading, onClick: () => handleGenerate(slide), children: [
              isLoading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
              rec ? "Regenerate" : "Generate"
            ] }),
            rec && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "default", onClick: () => handleSave(slide.key), children: [
              /* @__PURE__ */ jsx(Save, { className: "h-4 w-4 mr-1" }),
              " Save"
            ] })
          ] })
        ] }),
        slide.style === "bullets" && content.bullets && /* @__PURE__ */ jsx(
          Textarea,
          {
            className: "min-h-[100px] text-sm",
            value: (content.bullets || []).join("\n"),
            onChange: (e) => updateField(slide.key, (c) => ({
              ...c,
              bullets: e.target.value.split("\n").filter(Boolean)
            })),
            placeholder: "One bullet per line"
          }
        ),
        slide.style === "bullets" && content.callouts && content.callouts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: "Callouts (LABEL: text)" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              className: "min-h-[80px] text-sm font-mono",
              value: (content.callouts || []).map((c) => `${c.label}: ${c.text}`).join("\n"),
              onChange: (e) => updateField(slide.key, (c) => ({
                ...c,
                callouts: e.target.value.split("\n").filter(Boolean).map((line) => {
                  const idx = line.indexOf(":");
                  return idx > 0 ? { label: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() } : { label: "", text: line.trim() };
                })
              }))
            }
          )
        ] }),
        slide.style === "paragraphs" && content.paragraphs && content.paragraphs.map((p, idx) => /* @__PURE__ */ jsxs("div", { className: "space-y-1 border-l-2 border-primary pl-3", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "w-full text-sm font-medium bg-transparent border-b focus:outline-none",
              value: p.topic,
              onChange: (e) => updateField(slide.key, (c) => {
                const next = [...c.paragraphs || []];
                next[idx] = { ...next[idx], topic: e.target.value };
                return { ...c, paragraphs: next };
              })
            }
          ),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              className: "text-sm",
              placeholder: "Observation",
              value: p.observation,
              onChange: (e) => updateField(slide.key, (c) => {
                const next = [...c.paragraphs || []];
                next[idx] = { ...next[idx], observation: e.target.value };
                return { ...c, paragraphs: next };
              })
            }
          ),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              className: "text-sm",
              placeholder: "Recommendation (optional)",
              value: p.recommendation || "",
              onChange: (e) => updateField(slide.key, (c) => {
                const next = [...c.paragraphs || []];
                next[idx] = { ...next[idx], recommendation: e.target.value };
                return { ...c, paragraphs: next };
              })
            }
          )
        ] }, idx)),
        !rec && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No narrative yet. Click Generate." })
      ] }, slide.key);
    }) })
  ] });
}
const PDF_URL = "/demo/acme-sample-qoe.pdf";
const XLSX_URL = "/demo/acme-sample-workbook.xlsx";
function DeliverablePreviewDialog({ mode, onClose }) {
  const open = mode !== null;
  const navigate = useNavigate();
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (v) => !v && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-[95vw] w-[95vw] h-[92vh] p-0 flex flex-col gap-0 overflow-hidden", children: [
    /* @__PURE__ */ jsx(DialogHeader, { className: "px-5 py-3 border-b border-border shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "text-base", children: mode === "pdf" ? "Sample QoE Report (PDF preview)" : "Sample QoE Workbook (Excel preview)" }),
        /* @__PURE__ */ jsx(DialogDescription, { className: "text-xs mt-0.5", children: "Acme Industrial Supply Co. · synthetic demo data · view only — sign up to generate your own" })
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "sm",
          onClick: () => {
            onClose();
            navigate("/auth?mode=signup");
          },
          children: "Sign up to export"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 relative bg-muted/30", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          "aria-hidden": true,
          className: "absolute inset-0 pointer-events-none z-10 select-none",
          style: {
            backgroundImage: "repeating-linear-gradient(-30deg, transparent 0 140px, hsl(var(--muted-foreground) / 0.08) 140px 142px)"
          }
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          "aria-hidden": true,
          className: "absolute inset-0 pointer-events-none z-10 select-none flex items-center justify-center overflow-hidden",
          children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "text-foreground/[0.04] font-bold whitespace-nowrap",
              style: { fontSize: "min(10vw, 140px)", transform: "rotate(-30deg)" },
              children: "DEMO PREVIEW"
            }
          )
        }
      ),
      mode === "pdf" && /* @__PURE__ */ jsx(PdfPreview, {}),
      mode === "xlsx" && /* @__PURE__ */ jsx(XlsxPreview, {})
    ] })
  ] }) });
}
function PdfPreview() {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    let createdUrl = null;
    fetch(PDF_URL).then((r) => {
      if (!r.ok) throw new Error(`Failed to load PDF (${r.status})`);
      return r.blob();
    }).then((blob) => {
      if (cancelled) return;
      createdUrl = URL.createObjectURL(blob);
      setBlobUrl(createdUrl);
    }).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load PDF");
    });
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, []);
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full text-sm text-destructive", children: error });
  }
  if (!blobUrl) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsx(Spinner, { className: "size-6" }) });
  }
  return /* @__PURE__ */ jsx(
    "iframe",
    {
      title: "Sample QoE Report",
      src: `${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`,
      className: "w-full h-full border-0 relative z-0"
    }
  );
}
function XlsxPreview() {
  const [sheets, setSheets] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch(XLSX_URL).then((r) => {
      if (!r.ok) throw new Error(`Failed to load workbook (${r.status})`);
      return r.arrayBuffer();
    }).then((buf) => {
      if (cancelled) return;
      const wb = XLSX.read(buf, { type: "array" });
      const parsed = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
          raw: false
        });
        return { name, rows };
      });
      setSheets(parsed);
      if (parsed.length > 0) setActiveTab(parsed[0].name);
    }).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load workbook");
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full text-sm text-destructive", children: error });
  }
  if (!sheets) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full", children: /* @__PURE__ */ jsx(Spinner, { className: "size-6" }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 flex flex-col", children: /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "flex-1 flex flex-col min-h-0", children: [
    /* @__PURE__ */ jsx(TabsList, { className: "mx-4 mt-3 self-start shrink-0", children: sheets.map((s) => /* @__PURE__ */ jsx(TabsTrigger, { value: s.name, className: "text-xs", children: s.name }, s.name)) }),
    sheets.map((s) => /* @__PURE__ */ jsx(TabsContent, { value: s.name, className: "flex-1 min-h-0 mt-2 mx-4 mb-4", children: /* @__PURE__ */ jsx("div", { className: "h-full overflow-auto bg-card border border-border rounded-md", children: /* @__PURE__ */ jsx("table", { className: "text-xs w-max border-collapse", children: /* @__PURE__ */ jsx("tbody", { children: s.rows.map((row, ri) => /* @__PURE__ */ jsx("tr", { className: ri === 0 ? "bg-[hsl(220_14%_96%)] font-semibold" : "", children: row.length === 0 ? /* @__PURE__ */ jsx("td", { className: "px-3 py-1.5 border border-[hsl(220_13%_91%)] h-6", children: " " }) : row.map((cell, ci) => /* @__PURE__ */ jsx(
      "td",
      {
        className: `px-3 py-1.5 border border-[hsl(220_13%_91%)] whitespace-nowrap ${ci === 0 ? "text-left" : "text-right font-mono"}`,
        children: cell === "" ? " " : String(cell)
      },
      ci
    )) }, ri)) }) }) }) }, s.name))
  ] }) });
}
function stripMd(s) {
  return s.replace(/\*\*/g, "").replace(/[#>~`_]/g, "").replace(/\s{2,}/g, " ").replace(/[—–−]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();
}
function cleanProposalDescription(desc) {
  if (!desc) return "";
  let cleaned = desc.replace(/\*\*[A-Za-z\s/&]+:\*\*\s*[^\n]*/g, "");
  cleaned = cleaned.replace(/Verification:.*$/gm, "");
  cleaned = cleaned.replace(/^(Category|Direction|Reported GL Amount|Proposed Adjustment|Evidence Strength|Review Priority|Adjustment Class|Block|Status|Score|Intent|Template):.*$/gim, "");
  cleaned = stripMd(cleaned);
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
}
function humanizeFlagType(flagType) {
  const map = {
    reclass_interest_in_opex: "Interest Reclassification",
    reclass_cogs_opex_boundary: "COGS / OpEx Classification",
    reclass_current_vs_noncurrent: "Current vs. Non-Current Classification",
    reclass_debt_classification: "Debt Classification",
    reclass_gain_loss_in_revenue: "Gain/Loss in Revenue",
    reclass_other: "Other Reclassification",
    adjustment_candidate: "Adjustment Candidate",
    unusual_transaction: "Unusual Transaction",
    related_party: "Related-Party Transaction",
    timing_issue: "Timing Issue"
  };
  if (map[flagType]) return map[flagType];
  return flagType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function humanizeFlagCategory(cat) {
  const map = {
    adjustment_candidate: "Adjustment Candidate",
    reclassification: "Reclassification",
    risk_flag: "Risk Flag"
  };
  if (map[cat]) return map[cat];
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function extractFindings(data) {
  if (!data || typeof data !== "object") return [];
  const d = data;
  const findings = d.findings || d.anomalies || d.issues || d.results;
  if (!Array.isArray(findings)) return [];
  return findings.slice(0, 10).map((f) => ({
    title: String(f.title || f.name || f.finding || "Finding"),
    description: String(f.description || f.detail || f.explanation || ""),
    severity: String(f.severity || f.priority || "medium"),
    category: String(f.category || f.type || "")
  }));
}
function fmtCurrency(n) {
  if (n === null || n === void 0) return "-";
  const abs = Math.abs(n);
  const formatted = abs >= 1e3 ? "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "$" + abs.toFixed(0);
  return n < 0 ? `(${formatted})` : formatted;
}
function safeGrid(fn) {
  try {
    const g = fn();
    if (!g || !g.rows || g.rows.length === 0) return null;
    return g;
  } catch {
    return null;
  }
}
function computeExecSummary(dealData) {
  const m = computeQoEMetrics(dealData);
  return {
    revenue: m.revenue,
    grossProfit: m.grossProfit,
    netIncome: m.netIncome,
    reportedEBITDA: m.reportedEBITDA,
    totalAdjustments: m.totalAdjustments,
    adjustedEBITDA: m.adjustedEBITDA,
    adjustmentCount: m.adjustmentCount
  };
}
function buildDDAdjustments(dealData, proofMap, proposalMap, evidenceByProposal) {
  const adjustments = dealData.adjustments || {};
  const items = [];
  const entries = Array.isArray(adjustments) ? adjustments : Object.values(adjustments);
  for (const adj of entries) {
    if (!adj) continue;
    const a = adj;
    const adjId = a.id;
    const pv = a.periodValues || a.proposed_period_values || a.amounts || {};
    const total = Object.values(pv).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
    if (total === 0) continue;
    const title = a.title || a.description || a.label || "";
    const isUUID = /^[0-9a-f]{8}-/i.test(title) || !title.trim();
    const rawDesc = a.description || a.notes || "";
    const cleanedDesc = cleanProposalDescription(rawDesc);
    const proof = adjId ? proofMap?.get(adjId) : void 0;
    const proposal = title ? proposalMap?.get(title) : void 0;
    const evidence = title ? evidenceByProposal?.get(title) : void 0;
    items.push({
      title: isUUID ? "Untitled Adjustment" : stripMd(title),
      description: cleanedDesc || `${isUUID ? "Adjustment" : stripMd(title)} - ${fmtCurrency(total)}`,
      block: a.block || a.type || "DD",
      adjustmentClass: a.adjustmentClass || a.adjustment_class || "",
      amount: total,
      status: a.status || "accepted",
      // Traceability fields
      source: proposal ? proposal.source : a.type === "MA" ? "manual" : void 0,
      detectorType: proposal?.detectorType,
      supportTier: proposal?.supportTier,
      supportTierLabel: proposal?.supportTierLabel,
      aiRationale: proposal?.aiRationale,
      keySignals: proposal?.keySignals,
      evidenceTransactions: evidence?.slice(0, 5),
      verificationStatus: proof?.validation_status,
      verificationScore: proof?.validation_score,
      keyFindings: proof?.key_findings,
      redFlags: proof?.red_flags
    });
  }
  return items;
}
function computeRatios(dealData) {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const activePeriods = dealData.deal.periods.filter((p) => !p.isStub);
  if (activePeriods.length === 0 || tb.length === 0) return [];
  const ltmPids = activePeriods.slice(-12).map((p) => p.id);
  const lastPid = activePeriods[activePeriods.length - 1].id;
  const rc = dealData.reclassifications ?? [];
  const revenue = reclassAwareRevenue(tb, rc, ltmPids);
  const grossProfit = reclassAwareGrossProfit(tb, rc, ltmPids);
  const opIncome = reclassAwareOperatingIncome(tb, rc, ltmPids);
  const netIncome = reclassAwareNetIncome(tb, rc, ltmPids);
  const adjustedEBITDA = reclassAwareAdjustedEBITDA(tb, rc, adj, ltmPids, ab);
  const totalAssets = calcTotalAssets(tb, lastPid);
  const totalEquity = calcTotalEquity(tb, lastPid);
  const currentAssets = calcTotalCurrentAssets(tb, lastPid);
  const currentLiab = calcTotalCurrentLiabilities(tb, lastPid);
  const totalLiab = calcTotalLiabilities(tb, lastPid);
  const ar = sumByLineItem(tb, "Accounts receivable", lastPid);
  const ap = sumByLineItem(tb, "Accounts payable", lastPid);
  const fmtPct = (n) => isNaN(n) || !isFinite(n) ? "N/A" : `${(n * 100).toFixed(1)}%`;
  const fmtX = (n) => isNaN(n) || !isFinite(n) ? "N/A" : `${n.toFixed(2)}x`;
  const fmtDays = (n) => isNaN(n) || !isFinite(n) ? "N/A" : `${Math.round(n)} days`;
  const ratios = [];
  ratios.push({ name: "Gross Margin", value: fmtPct(revenue > 0 ? grossProfit / revenue : NaN), category: "Profitability" });
  ratios.push({ name: "Operating Margin", value: fmtPct(revenue > 0 ? opIncome / revenue : NaN), category: "Profitability" });
  ratios.push({ name: "EBITDA Margin", value: fmtPct(revenue > 0 ? adjustedEBITDA / revenue : NaN), category: "Profitability" });
  ratios.push({ name: "Net Profit Margin", value: fmtPct(revenue > 0 ? netIncome / revenue : NaN), category: "Profitability" });
  ratios.push({ name: "ROA", value: fmtPct(totalAssets > 0 ? netIncome / totalAssets : NaN), category: "Profitability" });
  ratios.push({ name: "ROE", value: fmtPct(Math.abs(totalEquity) > 0 ? netIncome / Math.abs(totalEquity) : NaN), category: "Profitability" });
  const currentRatio = Math.abs(currentLiab) > 0 ? currentAssets / Math.abs(currentLiab) : NaN;
  ratios.push({ name: "Current Ratio", value: fmtX(currentRatio), category: "Liquidity" });
  const dso = revenue > 0 ? Math.abs(ar) / revenue * 365 : NaN;
  const cogs = ltmPids.reduce((s, p) => s + calcCOGS(tb, p), 0);
  const dpo = cogs > 1e3 ? Math.abs(ap) / cogs * 365 : NaN;
  ratios.push({ name: "DSO", value: fmtDays(dso), category: "Efficiency" });
  ratios.push({ name: "DPO", value: fmtDays(dpo), category: "Efficiency" });
  ratios.push({ name: "Asset Turnover", value: fmtX(totalAssets > 0 ? revenue / totalAssets : NaN), category: "Efficiency" });
  ratios.push({ name: "Debt/Equity", value: fmtX(Math.abs(totalEquity) > 0 ? Math.abs(totalLiab) / Math.abs(totalEquity) : NaN), category: "Leverage" });
  return ratios;
}
const ExportCenterSection = ({ data, updateData, wizardData, projectId, projectName, computedReports, dealData, onNavigateToInsights, isDemo }) => {
  const exportData = { completedSections: [], notes: "", ...data };
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ page: 0, total: 0 });
  const [previewMode, setPreviewMode] = useState(null);
  const { coreStatus, readyCount, totalCore, isReady } = getExportReadiness(wizardData, computedReports);
  const coreDataStatus = coreStatus;
  const handleExportPDF = async () => {
    if (isDemo) {
      trackEvent("demo_preview_opened", { format: "pdf" });
      setPreviewMode("pdf");
      return;
    }
    if (isGenerating || !dealData) return;
    trackEvent("workbook_exported", { format: "pdf" });
    setIsGenerating(true);
    setPdfProgress({ page: 0, total: 0 });
    try {
      const now = /* @__PURE__ */ new Date();
      const reportDate = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}.${now.getFullYear()}`;
      const resolvedProjectId = projectId || dealData?.deal?.projectId;
      const metadata = {
        companyName: projectName || "Company",
        projectName: projectName || "Project",
        clientName: wizardData?.projectSetup?.clientName || "",
        industry: wizardData?.projectSetup?.industry || "",
        transactionType: wizardData?.projectSetup?.transactionType || "",
        reportDate,
        fiscalYearEnd: wizardData?.projectSetup?.fiscalYearEnd || "December"
      };
      toast.info("Generating PDF report...", { description: "Building in the background — you can keep working." });
      const rawAttention = [];
      let flaggedItems = [];
      let glFindings = [];
      let jeFindings = [];
      let proofMap = /* @__PURE__ */ new Map();
      let proposalMap = /* @__PURE__ */ new Map();
      let evidenceByProposal = /* @__PURE__ */ new Map();
      if (resolvedProjectId) {
        const [
          { data: hypotheses },
          { data: proposals },
          { data: flagged },
          { data: glData },
          { data: jeData },
          { data: payrollData }
        ] = await Promise.all([
          supabase.from("hypotheses").select("hypothesis_claim, category, severity, status, estimated_ebitda_impact").eq("project_id", resolvedProjectId).in("status", ["proposed", "confirmed"]).order("estimated_ebitda_impact", { ascending: true }).limit(6),
          supabase.from("adjustment_proposals").select("title, description, review_priority, block, status").eq("project_id", resolvedProjectId).in("status", ["new", "accepted"]).order("internal_score", { ascending: false }).limit(10),
          supabase.from("flagged_transactions").select("description, account_name, amount, flag_type, flag_category, confidence_score, transaction_date").eq("project_id", resolvedProjectId).order("confidence_score", { ascending: false }).limit(20),
          supabase.from("processed_data").select("data").eq("project_id", resolvedProjectId).eq("data_type", "gl_analysis").maybeSingle(),
          supabase.from("processed_data").select("data").eq("project_id", resolvedProjectId).eq("data_type", "je_analysis").maybeSingle(),
          supabase.from("processed_data").select("data").eq("project_id", resolvedProjectId).eq("data_type", "payroll").maybeSingle()
        ]);
        const [
          { data: proofRows },
          { data: acceptedProposals }
        ] = await Promise.all([
          supabase.from("adjustment_proofs").select("adjustment_id, validation_status, validation_score, key_findings, red_flags, traceability_data, ai_analysis").eq("project_id", resolvedProjectId),
          supabase.from("adjustment_proposals").select("id, title, description, detector_type, support_tier, support_tier_label, ai_rationale, ai_key_signals, block, adjustment_class, proposed_amount, status").eq("project_id", resolvedProjectId).in("status", ["accepted", "accepted_with_edits"])
        ]);
        for (const r of proofRows ?? []) {
          const ai = r.ai_analysis ?? {};
          const td = r.traceability_data ?? {};
          const matchingTxns = td.matching_transactions ?? [];
          proofMap.set(r.adjustment_id, {
            validation_status: r.validation_status,
            validation_score: r.validation_score,
            key_findings: r.key_findings ?? [],
            red_flags: r.red_flags ?? [],
            matchCount: ai.match_count ?? matchingTxns.length
          });
        }
        const proposalIds = [];
        const proposalByTitle = /* @__PURE__ */ new Map();
        for (const p of acceptedProposals ?? []) {
          const signals = Array.isArray(p.ai_key_signals) ? p.ai_key_signals : [];
          proposalMap.set(p.title, {
            source: "ai_discovery",
            detectorType: p.detector_type,
            supportTier: p.support_tier,
            supportTierLabel: p.support_tier_label,
            aiRationale: p.ai_rationale,
            keySignals: signals
          });
          proposalByTitle.set(p.title, p);
          proposalIds.push(p.id);
        }
        if (proposalIds.length > 0) {
          const { data: evidenceRows } = await supabase.from("proposal_evidence").select("proposal_id, txn_date, description, amount, match_quality").in("proposal_id", proposalIds).order("amount", { ascending: false }).limit(500);
          for (const ev of evidenceRows ?? []) {
            const list = evidenceByProposal.get(ev.proposal_id) ?? [];
            list.push({ date: ev.txn_date ?? "", description: ev.description ?? "", amount: ev.amount ?? 0, matchQuality: ev.match_quality ?? "" });
            evidenceByProposal.set(ev.proposal_id, list);
          }
        }
        const evidenceByTitle = /* @__PURE__ */ new Map();
        for (const [proposalId, evList] of evidenceByProposal) {
          const proposal = (acceptedProposals ?? []).find((p) => p.id === proposalId);
          if (proposal) evidenceByTitle.set(proposal.title, evList);
        }
        evidenceByProposal = evidenceByTitle;
        if (payrollData?.data && dealData) {
          const extracted = payrollData.data?.extractedData;
          if (extracted) {
            dealData = {
              ...dealData,
              payrollFallback: {
                salaryWages: extracted.salaryWages || [],
                ownerCompensation: extracted.ownerCompensation || [],
                payrollTaxes: extracted.payrollTaxes || [],
                benefits: extracted.benefits || []
              }
            };
          }
        }
        const categoryRationale = {
          revenue: "Revenue adjustments directly affect top-line earnings and normalized EBITDA.",
          expense: "Expense normalization impacts reported margins and go-forward cost structure.",
          compensation: "Compensation adjustments reflect the difference between current and market-rate staffing costs.",
          "related-party": "Non-arm's-length terms may not persist post-transaction, affecting normalized earnings.",
          "working-capital": "Abnormal working capital levels create peg adjustments that affect enterprise value."
        };
        const blockFollowUp = {
          dd: "Requires independent verification with supporting documentation.",
          ma: "Confirm assumptions and rationale with management.",
          qoe: "Validate against source financial records and general ledger."
        };
        for (const h of hypotheses || []) {
          const cat = (h.category || "").toLowerCase();
          rawAttention.push({
            title: stripMd(h.hypothesis_claim || h.category || "Finding"),
            severity: h.severity,
            ebitdaImpact: h.estimated_ebitda_impact ?? void 0,
            rationale: categoryRationale[cat] || "",
            followUp: "Validate with supporting documentation and confirm with management."
          });
        }
        const wipFindings = dealData?.wipAnalysis?.findings ?? [];
        for (const w of wipFindings) {
          rawAttention.push({
            title: stripMd(w.title),
            severity: w.severity,
            ebitdaImpact: w.estimatedImpact || void 0,
            rationale: stripMd(w.narrative),
            followUp: "Confirm with project controller and reconcile to mapped TB balances."
          });
        }
        for (const p of proposals || []) {
          const block = (p.block || "").toLowerCase();
          const cleanedDesc = cleanProposalDescription(p.description || "");
          rawAttention.push({
            title: stripMd(p.title),
            description: cleanedDesc,
            rationale: cleanedDesc,
            followUp: blockFollowUp[block] || "",
            severity: p.review_priority
          });
        }
        flaggedItems = (flagged || []).map((f) => ({
          ...f,
          flag_type: humanizeFlagType(String(f.flag_type || "")),
          flag_category: humanizeFlagCategory(String(f.flag_category || ""))
        }));
        glFindings = extractFindings(glData?.data);
        jeFindings = extractFindings(jeData?.data);
      }
      const grids = {};
      const gridMap = [
        { key: "qoeAnalysis", fn: () => buildQoEAnalysisGrid(dealData) },
        { key: "ddAdjustments1", fn: () => buildDDAdjustmentsGrid(dealData, 1, proofMap, proposalMap) },
        { key: "ddAdjustments2", fn: () => buildDDAdjustmentsGrid(dealData, 2, proofMap, proposalMap) },
        { key: "incomeStatement", fn: () => buildIncomeStatementGrid(dealData) },
        { key: "isDetailed", fn: () => buildISDetailedGrid(dealData) },
        { key: "salesDetail", fn: () => buildSalesGrid(dealData) },
        { key: "cogsDetail", fn: () => buildCOGSGrid(dealData) },
        { key: "opexDetail", fn: () => buildOpExGrid(dealData) },
        { key: "otherExpense", fn: () => buildOtherExpenseGrid(dealData) },
        { key: "payroll", fn: () => buildPayrollGrid(dealData) },
        { key: "balanceSheet", fn: () => buildBalanceSheetGrid(dealData) },
        { key: "bsDetailed", fn: () => buildBSDetailedGrid(dealData) },
        { key: "arAging", fn: () => buildARAgingGrid(dealData) },
        { key: "apAging", fn: () => buildAPAgingGrid(dealData) },
        { key: "fixedAssets", fn: () => buildFixedAssetsGrid(dealData) },
        { key: "workingCapital", fn: () => buildWorkingCapitalGrid(dealData) },
        { key: "nwcAnalysis", fn: () => buildNWCAnalysisGrid(dealData) },
        { key: "freeCashFlow", fn: () => buildFreeCashFlowGrid(dealData) },
        { key: "proofOfCash", fn: () => buildProofOfCashGrid(dealData) },
        { key: "topCustomers", fn: () => buildTopCustomersGrid(dealData) },
        { key: "topVendors", fn: () => buildTopVendorsGrid(dealData) }
      ];
      for (const { key, fn } of gridMap) {
        const g = safeGrid(fn);
        if (g) grids[key] = g;
      }
      let cimInsights;
      if (computedReports) {
        for (const report of Object.values(computedReports)) {
          const ci = report?.cimInsights;
          if (ci && (ci.businessOverview || ci.productsServices && ci.productsServices.length > 0)) {
            cimInsights = ci;
            break;
          }
        }
      }
      const enrichedAdjustments = buildDDAdjustments(dealData, proofMap, proposalMap, evidenceByProposal);
      const attentionItems = normalizeAttentionItems(rawAttention, 6);
      let narratives$1 = {};
      if (projectId) {
        try {
          const { getProjectNarratives: getProjectNarratives2 } = await Promise.resolve().then(() => narratives);
          const records = await getProjectNarratives2(projectId);
          for (const r of records) narratives$1[r.slide_key] = r.content;
        } catch (e) {
          console.warn("Failed to load narratives:", e);
        }
      }
      const reportData = {
        metadata,
        attentionItems: attentionItems.length > 0 ? attentionItems : void 0,
        execSummary: computeExecSummary(dealData),
        ddAdjustments: enrichedAdjustments,
        financialRatios: computeRatios(dealData),
        flaggedItems: flaggedItems.length > 0 ? flaggedItems : void 0,
        glFindings: glFindings.length > 0 ? glFindings : void 0,
        jeFindings: jeFindings.length > 0 ? jeFindings : void 0,
        cimInsights,
        grids,
        traceabilityAdjustments: enrichedAdjustments,
        narratives: narratives$1,
        monthlyRevenue: buildMonthlyRevenue(dealData),
        plReconciliation: buildPLReconciliation(dealData),
        businessOverview: buildBusinessOverview(wizardData, projectName, cimInsights)
      };
      const blob = await buildClientPDF(reportData, (p) => {
        setPdfProgress({ page: p.page, total: p.total });
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(projectName || "Company").replace(/[^a-zA-Z0-9]/g, "_")}_QoE_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF report generated successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setIsGenerating(false);
      setPdfProgress({ page: 0, total: 0 });
    }
  };
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [excelProgress, setExcelProgress] = useState({ current: 0, total: 0, label: "" });
  const handleExportExcel = async () => {
    if (isDemo) {
      trackEvent("demo_preview_opened", { format: "xlsx" });
      setPreviewMode("xlsx");
      return;
    }
    if (!dealData) {
      toast.info("Excel export requires workbook data", { description: "No deal data available for export." });
      return;
    }
    if (isExportingExcel) return;
    trackEvent("workbook_exported", { format: "xlsx" });
    setIsExportingExcel(true);
    setExcelProgress({ current: 0, total: 0, label: "Preparing..." });
    try {
      await exportWorkbookXlsx({
        dealData,
        onProgress: (current, total, label) => {
          setExcelProgress({ current, total, label });
        }
      });
      toast.success("Excel workbook exported successfully!");
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Failed to export Excel workbook", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setIsExportingExcel(false);
      setExcelProgress({ current: 0, total: 0, label: "" });
    }
  };
  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };
  const pdfButtonLabel = isGenerating ? pdfProgress.total > 0 ? `Page ${pdfProgress.page}/${pdfProgress.total}` : "Preparing..." : "PDF Report";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(DeliverablePreviewDialog, { mode: previewMode, onClose: () => setPreviewMode(null) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Export Center" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Export your QoE deliverables" })
      ] }),
      isReady && /* @__PURE__ */ jsx(Card, { className: "border-primary/50 bg-primary/5", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-12 h-12 text-primary" }),
          /* @__PURE__ */ jsx(PartyPopper, { className: "w-6 h-6 text-amber-500 absolute -top-1 -right-1" })
        ] }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-primary mb-2", children: "QoE Analysis Complete!" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "All core sections have data. Your Quality of Earnings analysis is ready for export." })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: isReady ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-primary", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Ready to Export" })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-600", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5" }),
            /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
              totalCore - readyCount,
              " core sections missing data"
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "text-muted-foreground gap-1", onClick: onNavigateToInsights, children: [
            "View full status in Insights",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mt-3 pt-3 border-t", children: [
          /* @__PURE__ */ jsxs(Badge, { variant: coreDataStatus.incomeStatement ? "default" : "secondary", className: "gap-1", children: [
            coreDataStatus.incomeStatement ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
            "Income Statement"
          ] }),
          /* @__PURE__ */ jsxs(Badge, { variant: coreDataStatus.balanceSheet ? "default" : "secondary", className: "gap-1", children: [
            coreDataStatus.balanceSheet ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
            "Balance Sheet"
          ] }),
          /* @__PURE__ */ jsxs(Badge, { variant: coreDataStatus.qoeAnalysis ? "default" : "secondary", className: "gap-1", children: [
            coreDataStatus.qoeAnalysis ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
            "QoE Analysis"
          ] }),
          /* @__PURE__ */ jsxs(Badge, { variant: coreDataStatus.ddAdjustments ? "default" : "secondary", className: "gap-1", children: [
            coreDataStatus.ddAdjustments ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
            "DD Adjustments"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Engagement Notes" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
          "textarea",
          {
            value: exportData.notes,
            onChange: (e) => updateData({ ...exportData, notes: e.target.value }),
            placeholder: "Add any final notes, observations, or recommendations for this QoE engagement...",
            className: "w-full h-32 p-3 border border-border rounded-lg resize-none bg-background"
          }
        ) })
      ] }),
      projectId && dealData && /* @__PURE__ */ jsx(
        NarrativePanel,
        {
          projectId,
          grids: {
            qoeAnalysis: buildQoEAnalysisGrid(dealData),
            salesDetail: buildSalesGrid(dealData),
            cogsDetail: buildCOGSGrid(dealData),
            opexDetail: buildOpExGrid(dealData),
            workingCapital: buildWorkingCapitalGrid(dealData),
            nwcAnalysis: buildNWCAnalysisGrid(dealData),
            freeCashFlow: buildFreeCashFlowGrid(dealData)
          }
        }
      ),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Export Options" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleExportPDF,
              disabled: isGenerating || !dealData,
              className: "h-20 flex flex-col gap-2",
              children: [
                isGenerating ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsx(Download, { className: "w-5 h-5" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: pdfButtonLabel })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleExportExcel,
              disabled: isExportingExcel || !dealData,
              className: "h-20 flex flex-col gap-2",
              children: [
                isExportingExcel ? /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-5 h-5" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: isExportingExcel ? `Tab ${excelProgress.current}/${excelProgress.total}` : "Excel Workbook" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: handleCopyShareLink,
              className: "h-20 flex flex-col gap-2",
              children: [
                /* @__PURE__ */ jsx(Share2, { className: "w-5 h-5" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Copy Share Link" })
              ]
            }
          )
        ] }) })
      ] })
    ] })
  ] });
};
export {
  ExportCenterSection
};
