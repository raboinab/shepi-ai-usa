import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { C as Card, f as CardContent, B as Button } from "../main.mjs";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { I as Input } from "./input-CSM87NBF.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { BookOpen, Search, ChevronDown, ChevronRight, RefreshCw, Play } from "lucide-react";
import { u as useAnalysisTrigger } from "./useAnalysisTrigger-DbHpK9Um.js";
import { Q as QuickBooksSyncBadge } from "./QuickBooksSyncBadge-Bn85N4Ee.js";
import { u as useAutoLoadJournalEntries } from "./useAutoLoadProcessedData-BXrIGnhs.js";
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
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-collapsible";
import "date-fns";
const JournalEntriesSection = ({ projectId, data, onUpdate, onGuideContextChange }) => {
  const [search, setSearch] = useState("");
  useAutoLoadJournalEntries({
    projectId,
    data,
    updateData: onUpdate || (() => {
    })
  });
  const [expandedRows, setExpandedRows] = useState(/* @__PURE__ */ new Set());
  const entries = data.entries || [];
  useEffect(() => {
    onGuideContextChange?.({
      sectionKey: "3-3",
      hasData: entries.length > 0,
      mode: "ledger"
    });
  }, [entries.length]);
  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) => e.id.includes(q) || e.memo.toLowerCase().includes(q) || e.lines.some((l) => l.accountName.toLowerCase().includes(q))
    );
  }, [entries, search]);
  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const totalDebits = entries.reduce((s, e) => s + e.lines.filter((l) => l.postingType === "DEBIT").reduce((a, l) => a + l.amount, 0), 0);
  const totalCredits = entries.reduce((s, e) => s + e.lines.filter((l) => l.postingType === "CREDIT").reduce((a, l) => a + l.amount, 0), 0);
  const dateRange = entries.length > 0 ? `${entries[entries.length - 1]?.txnDate} – ${entries[0]?.txnDate}` : "—";
  const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  if (entries.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Journal Entries" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "View journal entries synced from QuickBooks" })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-12 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "w-10 h-10 mx-auto mb-3 opacity-40" }),
        /* @__PURE__ */ jsx("p", { children: "No journal entries available yet." }),
        /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: "Journal entries will appear here after a QuickBooks sync." })
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Journal Entries" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "View journal entries synced from QuickBooks" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        data.syncSource && /* @__PURE__ */ jsx(QuickBooksSyncBadge, { lastSyncDate: data.lastSyncDate }),
        /* @__PURE__ */ jsx(RunJEAnalysisButton, { projectId })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4 pb-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Total JEs" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: entries.length })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4 pb-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Date Range" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: dateRange })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4 pb-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Total Debits" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: fmt(totalDebits) })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-4 pb-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Total Credits" }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: fmt(totalCredits) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative max-w-sm", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Search by JE #, memo, or account...",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          className: "pl-9"
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(ScrollArea, { className: "h-[500px]", children: [
      /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { className: "w-8" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Date" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "JE #" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Memo" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "Debit" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "Credit" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: filtered.slice(0, 100).map((entry) => {
          const isOpen = expandedRows.has(entry.id);
          const debit = entry.lines.filter((l) => l.postingType === "DEBIT").reduce((s, l) => s + l.amount, 0);
          const credit = entry.lines.filter((l) => l.postingType === "CREDIT").reduce((s, l) => s + l.amount, 0);
          return /* @__PURE__ */ jsx(Collapsible, { open: isOpen, onOpenChange: () => toggleRow(entry.id), asChild: true, children: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(TableRow, { className: "cursor-pointer hover:bg-muted/50", children: [
              /* @__PURE__ */ jsx(TableCell, { className: "w-8", children: isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" }) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm", children: entry.txnDate }),
              /* @__PURE__ */ jsxs(TableCell, { className: "text-sm font-mono", children: [
                entry.id,
                entry.isAdjustment && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-2 text-[10px]", children: "Adj" })
              ] }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground max-w-[200px] truncate", children: entry.memo || "—" }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: fmt(debit) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: fmt(credit) })
            ] }) }),
            /* @__PURE__ */ jsx(CollapsibleContent, { asChild: true, children: /* @__PURE__ */ jsx(Fragment, { children: entry.lines.map((line, li) => /* @__PURE__ */ jsxs(TableRow, { className: "bg-muted/30", children: [
              /* @__PURE__ */ jsx(TableCell, {}),
              /* @__PURE__ */ jsx(TableCell, {}),
              /* @__PURE__ */ jsxs(TableCell, { colSpan: 2, className: "text-sm pl-8", children: [
                line.accountName,
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground ml-1 text-xs", children: [
                  "(",
                  line.accountId,
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: line.postingType === "DEBIT" ? fmt(line.amount) : "" }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-right", children: line.postingType === "CREDIT" ? fmt(line.amount) : "" })
            ] }, `${entry.id}-${li}`)) }) })
          ] }) }, entry.id);
        }) })
      ] }),
      filtered.length > 100 && /* @__PURE__ */ jsxs("div", { className: "text-center py-3 text-sm text-muted-foreground", children: [
        "Showing 100 of ",
        filtered.length,
        " entries"
      ] })
    ] }) })
  ] });
};
function RunJEAnalysisButton({ projectId }) {
  const { data, running, runAnalysis } = useAnalysisTrigger({
    projectId,
    functionName: "analyze-journal-entries",
    resultDataType: "journal_entry_analysis",
    projectIdKey: "projectId"
  });
  return /* @__PURE__ */ jsxs(Button, { size: "sm", variant: data ? "outline" : "default", onClick: runAnalysis, disabled: running, children: [
    running ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 mr-1" }),
    running ? "Analyzing…" : data ? "Re-run Analysis" : "Run JE Analysis"
  ] });
}
export {
  JournalEntriesSection
};
