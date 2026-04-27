import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { av as adjustmentCells } from "./sanitizeWizardData-nrsUY-BP.js";
import "@tanstack/react-virtual";
import "../main.mjs";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "lucide-react";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
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
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  DDAdjustmentsTab
};
