import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-CB5OWz-k.js";
import { ArrowLeft, Loader2, FileText, ExternalLink, ShieldCheck, AlertTriangle, Receipt, ChevronRight } from "lucide-react";
import { S as Sheet, b as SheetContent, c as SheetHeader, d as SheetTitle, e as SheetDescription } from "./sheet-DEVVWd_r.js";
import { v as useToast, s as supabase, B as Button, j as Badge } from "../main.mjs";
import { S as ScrollArea } from "./scroll-area-DLvncVK9.js";
import { useQuery } from "@tanstack/react-query";
import { av as adjustmentCells } from "./sanitizeWizardData-Dv9tWNGG.js";
import "@tanstack/react-virtual";
import "@radix-ui/react-dialog";
import "class-variance-authority";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-scroll-area";
const formatCurrency$1 = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
function BankReconcilePanel({ txnId, onBack }) {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ["canonical-txn-detail", txnId],
    queryFn: async () => {
      const { data: data2, error: error2 } = await supabase.from("canonical_transactions").select(
        "id, txn_date, payee, vendor, description, memo, amount, account_name, account_number, source_type, source_document_id, raw_payload, documents:source_document_id(name, file_path, period_start, period_end, parsed_summary)"
      ).eq("id", txnId).maybeSingle();
      if (error2) throw error2;
      return data2;
    }
  });
  const openStatement = async () => {
    const path = data?.documents?.file_path;
    if (!path) return;
    const { data: signed, error: e } = await supabase.storage.from("documents").createSignedUrl(path, 600);
    if (e || !signed?.signedUrl) {
      toast({ title: "Could not open document", description: e?.message, variant: "destructive" });
      return;
    }
    window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
  };
  const isQB = data?.source_type === "quickbooks_api" || !data?.source_document_id && !data?.documents;
  const pageNum = data?.raw_payload?.page ?? data?.raw_payload?.page_number ?? null;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "-ml-2 gap-1.5", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
      "Back to GL lines"
    ] }),
    isLoading && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
      "Loading source record…"
    ] }),
    error && /* @__PURE__ */ jsxs("div", { className: "text-sm text-destructive py-4", children: [
      "Failed to load: ",
      String(error)
    ] }),
    data && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold mb-2", children: "Source record" }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md border divide-y text-sm", children: [
          /* @__PURE__ */ jsx(Field, { label: "Date", value: data.txn_date ?? "—" }),
          /* @__PURE__ */ jsx(Field, { label: "Payee", value: data.payee || data.vendor || "—" }),
          /* @__PURE__ */ jsx(Field, { label: "Description", value: data.description || "—" }),
          data.memo && /* @__PURE__ */ jsx(Field, { label: "Memo", value: data.memo }),
          /* @__PURE__ */ jsx(
            Field,
            {
              label: "Amount",
              value: /* @__PURE__ */ jsx("span", { className: "font-mono", children: formatCurrency$1(data.amount) })
            }
          ),
          /* @__PURE__ */ jsx(
            Field,
            {
              label: "GL account",
              value: /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs", children: [
                data.account_number ? `${data.account_number} · ` : "",
                data.account_name || "—"
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold mb-2 flex items-center gap-2", children: [
          "Reconciles to",
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px] uppercase tracking-wide", children: isQB ? "QuickBooks GL" : "Bank statement" })
        ] }),
        isQB ? /* @__PURE__ */ jsx("div", { className: "rounded-md border p-3 text-sm text-muted-foreground", children: "This GL line was synced directly from QuickBooks Online — no separate bank statement is attached. The transaction is reconciled within QuickBooks." }) : data.documents ? /* @__PURE__ */ jsxs("div", { className: "rounded-md border divide-y text-sm", children: [
          /* @__PURE__ */ jsx(
            Field,
            {
              label: "Statement",
              value: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(FileText, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }),
                /* @__PURE__ */ jsx("span", { className: "truncate", children: data.documents.name })
              ] })
            }
          ),
          (data.documents.period_start || data.documents.period_end) && /* @__PURE__ */ jsx(
            Field,
            {
              label: "Period",
              value: `${data.documents.period_start ?? "?"} → ${data.documents.period_end ?? "?"}`
            }
          ),
          pageNum != null && /* @__PURE__ */ jsx(Field, { label: "Page", value: String(pageNum) }),
          /* @__PURE__ */ jsx("div", { className: "p-2.5", children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "default", onClick: openStatement, className: "gap-1.5 w-full", children: [
            /* @__PURE__ */ jsx(ExternalLink, { className: "h-3.5 w-3.5" }),
            "Open source document"
          ] }) })
        ] }) : /* @__PURE__ */ jsx("div", { className: "rounded-md border p-3 text-sm text-muted-foreground", children: "Source document not linked." })
      ] })
    ] })
  ] });
}
function Field({ label, value }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 px-2.5 py-1.5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground shrink-0 w-24", children: label }),
    /* @__PURE__ */ jsx("span", { className: "text-right min-w-0", children: value })
  ] });
}
const formatCurrency = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
function AdjustmentTraceSheet({
  open,
  onOpenChange,
  adjustment,
  proofSet
}) {
  const [selectedTxnId, setSelectedTxnId] = useState(null);
  const proof = proofSet?.verification;
  const matches = useMemo(() => proof?.matchingTransactions ?? [], [proof]);
  const totalAmount = useMemo(
    () => adjustment ? Object.values(adjustment.amounts).reduce((s, v) => s + (v || 0), 0) : 0,
    [adjustment]
  );
  const isNonQoE = adjustment?.effectType === "NonQoE" || adjustment?.effectType === "PresentationOnly";
  const handleOpenChange = (next) => {
    if (!next) setSelectedTxnId(null);
    onOpenChange(next);
  };
  if (!adjustment) return null;
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxs(SheetContent, { className: "w-full sm:max-w-[640px] overflow-hidden flex flex-col p-0", children: [
    /* @__PURE__ */ jsxs(SheetHeader, { className: "px-6 pt-6 pb-3 border-b", children: [
      /* @__PURE__ */ jsxs(SheetTitle, { className: "text-base flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "h-4 w-4 mt-0.5 shrink-0 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "leading-snug", children: adjustment.label || "Adjustment" })
      ] }),
      /* @__PURE__ */ jsxs(SheetDescription, { className: "text-xs flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: adjustment.type }),
        adjustment.tbAccountNumber && /* @__PURE__ */ jsx("span", { className: "font-mono", children: adjustment.tbAccountNumber }),
        /* @__PURE__ */ jsx("span", { children: "·" }),
        isNonQoE ? /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: "Presentation only — not in Adjusted EBITDA" }) : /* @__PURE__ */ jsx("span", { className: "font-mono font-medium text-foreground", children: formatCurrency(totalAmount) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "flex-1 px-6 py-4", children: selectedTxnId ? /* @__PURE__ */ jsx(BankReconcilePanel, { txnId: selectedTxnId, onBack: () => setSelectedTxnId(null) }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      proof && (proof.sellerAmount || proof.actualAmount || proof.varianceAmount) ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Seller", value: formatCurrency(proof.sellerAmount) }),
        /* @__PURE__ */ jsx(Stat, { label: "GL-matched", value: formatCurrency(proof.actualAmount) }),
        /* @__PURE__ */ jsx(
          Stat,
          {
            label: "Variance",
            value: formatCurrency(proof.varianceAmount),
            tone: Math.abs(proof.varianceAmount) > 0.01 ? "warn" : "ok"
          }
        )
      ] }) : null,
      !proof && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-dashed p-4 text-sm text-muted-foreground space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-foreground font-medium", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-amber-500" }),
          "Asserted — not yet GL-traced"
        ] }),
        /* @__PURE__ */ jsx("p", { children: "No verification has been run for this adjustment, so there are no GL lines or bank reconciliations to display. Run verification from the wizard to populate the audit trail." })
      ] }),
      proof && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: "GL lines supporting this adjustment" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            matches.length,
            " ",
            matches.length === 1 ? "line" : "lines"
          ] })
        ] }),
        matches.length === 0 ? /* @__PURE__ */ jsx("div", { className: "rounded-md border p-4 text-sm text-muted-foreground", children: "Verification ran but found no matching GL transactions. The adjustment is asserted-only — see the contradictions / data-gap section in the verify dialog for details." }) : /* @__PURE__ */ jsx("ul", { className: "rounded-md border divide-y", children: matches.map((t) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setSelectedTxnId(t.id),
            className: "w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2 group",
            children: [
              /* @__PURE__ */ jsx(Receipt, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 grid grid-cols-12 gap-2 text-xs items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "col-span-2 text-muted-foreground font-mono", children: t.date || "—" }),
                /* @__PURE__ */ jsxs("span", { className: "col-span-5 truncate", children: [
                  t.description || "—",
                  t.vendor && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                    " · ",
                    t.vendor
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "col-span-3 text-muted-foreground truncate font-mono", children: [
                  t.account_number ? `${t.account_number} ` : "",
                  t.account_name
                ] }),
                /* @__PURE__ */ jsx("span", { className: "col-span-2 text-right font-mono font-medium", children: formatCurrency(t.amount) })
              ] }),
              /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" })
            ]
          }
        ) }, t.id)) }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground italic pt-1", children: "Click any GL line to see the bank transaction (or QuickBooks record) it reconciles to." })
      ] })
    ] }) })
  ] }) });
}
function Stat({
  label,
  value,
  tone = "neutral"
}) {
  const toneClass = tone === "warn" ? "text-amber-600 border-amber-500/30 bg-amber-500/5" : tone === "ok" ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5" : "text-foreground border-border bg-muted/30";
  return /* @__PURE__ */ jsxs("div", { className: `rounded-md border px-2.5 py-2 ${toneClass}`, children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-medium", children: value })
  ] });
}
const STATUS_LABELS = {
  validated: "Validated",
  supported: "Supported",
  partial: "Partial",
  insufficient: "Insufficient",
  contradictory: "Contradictory",
  pending: "Pending"
};
function formatProofLabel(proof) {
  if (!proof || proof.validation_status === "pending") return "";
  const label = STATUS_LABELS[proof.validation_status] ?? proof.validation_status;
  if (proof.validation_score !== null) {
    return `${label} (${proof.validation_score})`;
  }
  return label;
}
function formatProofFindings(findings, maxChars = 120) {
  if (!findings || findings.length === 0) return "";
  const joined = findings.join("; ");
  if (joined.length <= maxChars) return joined;
  return joined.slice(0, maxChars - 1) + "…";
}
const TIER_SHORT = {
  0: "T0 Corroborated",
  1: "T1 Multi-Source",
  2: "T2 Single Source",
  3: "T3 Analytical",
  4: "T4 Asserted"
};
function DDAdjustmentsTab({ dealData, tabIndex = 1, proofMap, proposalMap }) {
  const [traceAdjId, setTraceAdjId] = useState(null);
  const handleRowClick = (rowId) => {
    if (!rowId.startsWith("adj-")) return;
    setTraceAdjId(rowId.slice("adj-".length));
  };
  const traceAdjustment = useMemo(
    () => traceAdjId ? dealData.adjustments.find((a) => a.id === traceAdjId) ?? null : null,
    [traceAdjId, dealData.adjustments]
  );
  const gridData = useMemo(() => {
    const adj = dealData.adjustments;
    const { periods, aggregatePeriods } = dealData.deal;
    const columns = [
      { key: "label", label: "Description", width: 240, frozen: true, format: "text" },
      { key: "adjNo", label: "Adj #", width: 60, frozen: true, format: "text" },
      { key: "adjType", label: "Type", width: 60, frozen: true, format: "text" },
      { key: "acctNo", label: "Account #", width: 80, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
      { key: "source", label: "Source", width: 100, frozen: true, format: "text" },
      { key: "tier", label: "Support Tier", width: 110, frozen: false, format: "text" },
      { key: "verified", label: "Verified", width: 180, frozen: false, format: "text" },
      { key: "findings", label: "Findings", width: 200, frozen: false, format: "text" },
      { key: "flags", label: "Red Flags", width: 140, frozen: false, format: "text" },
      ...aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
      ...periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
    ];
    const emptyCols = { adjNo: "", adjType: "", acctNo: "", fsLine: "", source: "", tier: "", verified: "", findings: "", flags: "" };
    const filterTypes = tabIndex === 1 ? ["MA"] : ["DD", "PF"];
    const filtered = adj.filter((a) => filterTypes.includes(a.type));
    const sectionLabel = tabIndex === 1 ? "Management Adjustments" : "Due Diligence & Pro Forma Adjustments";
    const rows = [
      { id: "hdr", type: "section-header", label: sectionLabel, cells: { label: sectionLabel, ...emptyCols } },
      ...filtered.map((a, i) => {
        const proofSet = proofMap?.get(a.id);
        const proposal = proposalMap?.get(a.id);
        const proof = proofSet?.verification;
        const allRedFlags = proof?.red_flags ?? [];
        const allFindings = proof?.key_findings ?? [];
        const varianceAmount = proof?.varianceAmount ?? 0;
        return {
          id: `adj-${a.id}`,
          type: "data",
          editable: true,
          indent: 1,
          cells: {
            label: a.label || a.notes || `Adjustment ${i + 1}`,
            adjNo: `${a.type}-${i + 1}`,
            adjType: a.type,
            acctNo: a.tbAccountNumber,
            fsLine: a.intent,
            source: proposal ? proposal.source === "ai_discovery" ? "AI Discovery" : "Manual" : a.type === "MA" ? "Manual" : "",
            tier: proposal?.supportTier != null ? TIER_SHORT[proposal.supportTier] || `T${proposal.supportTier}` : "",
            verified: formatProofLabel(proofSet?.verification),
            findings: (() => {
              const base = formatProofFindings(allFindings, 160);
              if (varianceAmount && varianceAmount !== 0) {
                const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(Math.abs(varianceAmount));
                return `⚠ Variance: ${fmt} · ${base}`;
              }
              return base;
            })(),
            flags: allRedFlags.length ? allRedFlags.length === 1 ? allRedFlags[0] : `${allRedFlags.length} flags` : "",
            ...adjustmentCells(dealData, a.amounts)
          }
        };
      })
    ];
    const totalCells = {};
    for (const p of periods) {
      totalCells[p.id] = filtered.reduce((s, a) => s + (a.amounts[p.id] || 0), 0);
    }
    for (const ap of aggregatePeriods) {
      totalCells[ap.id] = ap.monthPeriodIds.reduce((s, mpid) => s + filtered.reduce((ss, a) => ss + (a.amounts[mpid] || 0), 0), 0);
    }
    rows.push({ id: "total", type: "total", cells: { label: `Total ${sectionLabel}`, ...emptyCols, ...totalCells } });
    if (filtered.length === 0) {
      rows.push({ id: "empty", type: "data", cells: { label: "No adjustments entered", ...emptyCols } });
    }
    return { columns, rows, frozenColumns: 6 };
  }, [dealData, tabIndex, proofMap, proposalMap]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData, onRowClick: handleRowClick }),
    /* @__PURE__ */ jsx(
      AdjustmentTraceSheet,
      {
        open: !!traceAdjId,
        onOpenChange: (o) => !o && setTraceAdjId(null),
        adjustment: traceAdjustment,
        proofSet: traceAdjId ? proofMap?.get(traceAdjId) : void 0
      }
    )
  ] });
}
export {
  DDAdjustmentsTab
};
