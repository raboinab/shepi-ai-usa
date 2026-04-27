import { jsxs, jsx } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from "react";
import { B as Button, m as cn, s as supabase, t as toast } from "../main.mjs";
import { I as Input } from "./input-CSM87NBF.js";
import { A as Alert, b as AlertDescription } from "./alert-FolYmCWY.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { Loader2, Sparkles, Plus, Info, Trash2, AlertTriangle } from "lucide-react";
import { r as resolveMappedAccount } from "./wipAccountUtils-ChihncpU.js";
import "vite-react-ssg";
import "react-router-dom";
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
function createEmptyJob() {
  return {
    id: crypto.randomUUID(),
    jobName: "",
    contractValue: 0,
    costsToDate: 0,
    billingsToDate: 0,
    status: "active"
  };
}
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
}
function formatPercent(value) {
  if (!isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}
const SEVERITY_STYLES = {
  high: "border-destructive/50 bg-destructive/10",
  medium: "border-amber-500/50 bg-amber-500/10",
  low: "border-muted bg-muted/30"
};
function WIPScheduleTab({ dealData, onDataChange }) {
  const jobs = dealData.wipSchedule?.jobs ?? [];
  const mapping = dealData.wipAccountMapping;
  const updateJobs = useCallback((updatedJobs) => {
    onDataChange?.({
      ...dealData,
      wipSchedule: { jobs: updatedJobs }
    });
  }, [dealData, onDataChange]);
  const addJob = () => updateJobs([...jobs, createEmptyJob()]);
  const removeJob = (id) => updateJobs(jobs.filter((j) => j.id !== id));
  const updateJob = (id, field, value) => {
    updateJobs(jobs.map((j) => j.id === id ? { ...j, [field]: value } : j));
  };
  const totals = jobs.reduce(
    (acc, j) => ({
      contractValue: acc.contractValue + j.contractValue,
      costsToDate: acc.costsToDate + j.costsToDate,
      billingsToDate: acc.billingsToDate + j.billingsToDate
    }),
    { contractValue: 0, costsToDate: 0, billingsToDate: 0 }
  );
  const totalPctComplete = totals.contractValue > 0 ? totals.costsToDate / totals.contractValue : 0;
  const totalOverUnder = totals.billingsToDate - totals.contractValue * totalPctComplete;
  const totalOverBilled = jobs.reduce((s, j) => {
    const pct = j.contractValue > 0 ? j.costsToDate / j.contractValue : 0;
    const ou = j.billingsToDate - j.contractValue * pct;
    return ou > 0 ? s + ou : s;
  }, 0);
  const totalUnderBilled = jobs.reduce((s, j) => {
    const pct = j.contractValue > 0 ? j.costsToDate / j.contractValue : 0;
    const ou = j.billingsToDate - j.contractValue * pct;
    return ou < 0 ? s + Math.abs(ou) : s;
  }, 0);
  const tbTieOut = useMemo(() => {
    if (!mapping || jobs.length === 0) return null;
    const periods = dealData.deal.periods;
    if (periods.length === 0) return null;
    const lastP = periods[periods.length - 1].id;
    const tb = dealData.trialBalance;
    const rc = dealData.reclassifications ?? [];
    const balanceFor = (key) => {
      const acc = resolveMappedAccount(
        // Build CoaAccount-like shape from accounts array (uses accountId as both number & name fallback)
        dealData.accounts.map((a) => ({
          id: 0,
          accountNumber: a.accountId || "",
          accountName: a.accountName,
          fsType: a.fsType,
          category: a.fsLineItem || ""
        })),
        key
      );
      if (!acc) return null;
      const matchEntries = tb.filter((e) => e.accountName === acc.accountName && e.fsType === "BS");
      let bal = 0;
      for (const e of matchEntries) {
        bal += e.balances?.[lastP] ?? 0;
      }
      for (const r of rc) {
        if (r.toAccount === acc.accountName) bal += r.amounts?.[lastP] ?? 0;
        if (r.fromAccount === acc.accountName) bal -= r.amounts?.[lastP] ?? 0;
      }
      return { accountName: acc.accountName, balance: bal };
    };
    return {
      contractAssets: balanceFor(mapping.contractAssets),
      contractLiabilities: balanceFor(mapping.contractLiabilities),
      jobCostsInProcess: balanceFor(mapping.jobCostsInProcess),
      lastPeriodId: lastP
    };
  }, [mapping, jobs.length, dealData]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(
    dealData.wipAnalysis ?? null
  );
  const runAnalysis = async () => {
    if (jobs.length === 0) return;
    setAnalyzing(true);
    try {
      const tbBalances = {};
      if (tbTieOut?.contractAssets) tbBalances.contractAssets = tbTieOut.contractAssets;
      if (tbTieOut?.contractLiabilities) tbBalances.contractLiabilities = tbTieOut.contractLiabilities;
      if (tbTieOut?.jobCostsInProcess) tbBalances.jobCostsInProcess = tbTieOut.jobCostsInProcess;
      const { data, error } = await supabase.functions.invoke("analyze-wip", {
        body: {
          jobs: jobs.map((j) => ({
            id: j.id,
            jobName: j.jobName,
            contractValue: j.contractValue,
            costsToDate: j.costsToDate,
            billingsToDate: j.billingsToDate,
            status: j.status
          })),
          tbBalances: Object.keys(tbBalances).length > 0 ? tbBalances : void 0
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data;
      setAnalysis(result);
      onDataChange?.({ ...dealData, wipAnalysis: result });
      toast({ title: "WIP analysis complete", description: `${result.findings.length} finding(s) surfaced.` });
    } catch (err) {
      toast({
        title: "Analysis failed",
        description: err.message || "Could not analyze WIP.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };
  const renderTieOutRow = (label, schedTotal, tb) => {
    if (!tb) {
      return /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-b-0", children: [
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-muted-foreground", children: label }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right font-mono text-xs", children: formatCurrency(schedTotal) }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right text-xs text-muted-foreground italic", children: "Not mapped" }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right text-xs text-muted-foreground", children: "—" })
      ] });
    }
    const variance = tb.balance - schedTotal;
    const variancePct = schedTotal !== 0 ? Math.abs(variance / schedTotal) : 0;
    const material = variancePct > 0.1;
    return /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-b-0", children: [
      /* @__PURE__ */ jsxs("td", { className: "px-3 py-2", children: [
        /* @__PURE__ */ jsx("div", { children: label }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: tb.accountName })
      ] }),
      /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right font-mono text-xs", children: formatCurrency(schedTotal) }),
      /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right font-mono text-xs", children: formatCurrency(tb.balance) }),
      /* @__PURE__ */ jsxs("td", { className: cn(
        "px-3 py-2 text-right font-mono text-xs",
        material ? "text-destructive font-medium" : "text-muted-foreground"
      ), children: [
        formatCurrency(variance),
        material && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "ml-2 text-[10px]", children: [
          (variancePct * 100).toFixed(0),
          "%"
        ] })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-foreground", children: "WIP Schedule" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Job-level contract tracking — over/under billing analysis" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "default",
            onClick: runAnalysis,
            disabled: analyzing || jobs.length === 0,
            className: "gap-1",
            children: [
              analyzing ? /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-3 h-3" }),
              "Run AI Analysis"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: addJob, className: "gap-1", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
          " Add Job"
        ] })
      ] })
    ] }),
    !mapping?.contractAssets && !mapping?.contractLiabilities && jobs.length > 0 && /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsx("strong", { children: "WIP accounts not mapped." }),
        " Map your Contract Assets / Liabilities accounts in Project Setup to enable Trial Balance tie-out and Balance Sheet integration."
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/50 border-b", children: [
        /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 font-medium text-muted-foreground min-w-[200px]", children: "Job Name" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium text-muted-foreground min-w-[130px]", children: "Contract Value" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium text-muted-foreground min-w-[130px]", children: "Costs to Date" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium text-muted-foreground min-w-[130px]", children: "Billings to Date" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium text-muted-foreground min-w-[90px]", children: "% Complete" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium text-muted-foreground min-w-[130px]", children: "Over/(Under)" }),
        /* @__PURE__ */ jsx("th", { className: "text-center px-3 py-2 font-medium text-muted-foreground w-[50px]" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        jobs.map((job) => {
          const pctComplete = job.contractValue > 0 ? job.costsToDate / job.contractValue : 0;
          const overUnder = job.billingsToDate - job.contractValue * pctComplete;
          return /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-b-0 hover:bg-muted/20", children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-1.5", children: /* @__PURE__ */ jsx(
              Input,
              {
                value: job.jobName,
                onChange: (e) => updateJob(job.id, "jobName", e.target.value),
                placeholder: "Job / Project name",
                className: "h-7 text-sm border-0 bg-transparent px-0 focus-visible:ring-0"
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-1.5", children: /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: job.contractValue || "",
                onChange: (e) => updateJob(job.id, "contractValue", parseFloat(e.target.value) || 0),
                className: "h-7 text-sm text-right border-0 bg-transparent px-0 focus-visible:ring-0"
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-1.5", children: /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: job.costsToDate || "",
                onChange: (e) => updateJob(job.id, "costsToDate", parseFloat(e.target.value) || 0),
                className: "h-7 text-sm text-right border-0 bg-transparent px-0 focus-visible:ring-0"
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-1.5", children: /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: job.billingsToDate || "",
                onChange: (e) => updateJob(job.id, "billingsToDate", parseFloat(e.target.value) || 0),
                className: "h-7 text-sm text-right border-0 bg-transparent px-0 focus-visible:ring-0"
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-1.5 text-right font-mono text-xs", children: formatPercent(pctComplete) }),
            /* @__PURE__ */ jsx("td", { className: cn(
              "px-3 py-1.5 text-right font-mono text-xs font-medium",
              overUnder > 0 ? "text-destructive" : overUnder < 0 ? "text-primary" : "text-muted-foreground"
            ), children: formatCurrency(overUnder) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-1.5 text-center", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => removeJob(job.id), children: /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3 text-muted-foreground" }) }) })
          ] }, job.id);
        }),
        jobs.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-3 py-8 text-center text-muted-foreground", children: 'No jobs added. Click "Add Job" to begin tracking WIP.' }) })
      ] }),
      jobs.length > 0 && /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { className: "border-t-2 bg-muted/30 font-semibold", children: [
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2", children: "Total" }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right font-mono text-xs", children: formatCurrency(totals.contractValue) }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right font-mono text-xs", children: formatCurrency(totals.costsToDate) }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right font-mono text-xs", children: formatCurrency(totals.billingsToDate) }),
        /* @__PURE__ */ jsx("td", { className: "px-3 py-2 text-right font-mono text-xs", children: formatPercent(totalPctComplete) }),
        /* @__PURE__ */ jsx("td", { className: cn(
          "px-3 py-2 text-right font-mono text-xs",
          totalOverUnder > 0 ? "text-destructive" : totalOverUnder < 0 ? "text-primary" : "text-muted-foreground"
        ), children: formatCurrency(totalOverUnder) }),
        /* @__PURE__ */ jsx("td", {})
      ] }) })
    ] }) }),
    tbTieOut && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Trial Balance Tie-Out" }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Compares WIP schedule totals against mapped Trial Balance accounts (latest period: ",
        tbTieOut.lastPeriodId,
        "). Variances >10% are flagged."
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-muted/50 border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left px-3 py-2 font-medium text-muted-foreground", children: "Slot" }),
          /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium text-muted-foreground", children: "Schedule Total" }),
          /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium text-muted-foreground", children: "TB Balance" }),
          /* @__PURE__ */ jsx("th", { className: "text-right px-3 py-2 font-medium text-muted-foreground", children: "Variance" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          renderTieOutRow("Contract Assets (Under-Billed)", totalUnderBilled, tbTieOut.contractAssets),
          renderTieOutRow("Contract Liabilities (Over-Billed)", totalOverBilled, tbTieOut.contractLiabilities),
          renderTieOutRow("Job Costs in Process", totals.costsToDate, tbTieOut.jobCostsInProcess)
        ] })
      ] }) })
    ] }),
    analysis && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
          " AI Findings"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "Analyzed ",
          new Date(analysis.analyzedAt).toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsx(Alert, { children: /* @__PURE__ */ jsx(AlertDescription, { className: "text-sm", children: analysis.summary }) }),
      analysis.findings.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground italic px-3", children: "No material findings — schedule is clean." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: analysis.findings.map((f, i) => /* @__PURE__ */ jsx("div", { className: cn("rounded-lg border p-3", SEVERITY_STYLES[f.severity]), children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium", children: f.title }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] uppercase", children: f.severity }),
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: f.category.replace(/_/g, " ") }),
            f.estimatedImpact !== 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-muted-foreground", children: [
              "Impact: ",
              formatCurrency(f.estimatedImpact)
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: f.narrative }),
          f.affectedJobIds.length > 0 && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground mt-1", children: [
            "Affected: ",
            f.affectedJobIds.map((id) => jobs.find((j) => j.id === id)?.jobName || id).join(", ")
          ] })
        ] })
      ] }) }, i)) })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx("strong", { children: "% Complete" }),
      " = Costs to Date ÷ Contract Value  | ",
      /* @__PURE__ */ jsx("strong", { children: "Over/(Under)" }),
      " = Billings to Date − (Contract Value × % Complete). Positive = over-billed, Negative = under-billed."
    ] })
  ] });
}
export {
  WIPScheduleTab
};
