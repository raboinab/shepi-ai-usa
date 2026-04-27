import { useMemo, useState } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import { AdjustmentTraceSheet } from "../AdjustmentTraceSheet";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";
import { adjustmentCells } from "../shared/tabHelpers";
import { formatProofLabel, formatProofFindings } from "@/lib/proofFormatUtils";
import type { AdjustmentProofSet } from "@/hooks/useAdjustmentProofs";

export interface ProposalSummary {
  source: "ai_discovery" | "manual";
  detectorType?: string;
  supportTier?: number | null;
  supportTierLabel?: string | null;
}

interface TabProps {
  dealData: DealData;
  onDataChange?: (data: DealData) => void;
  tabIndex?: 1 | 2;
  proofMap?: Map<string, AdjustmentProofSet>;
  proposalMap?: Map<string, ProposalSummary>;
}

const TIER_SHORT: Record<number, string> = {
  0: "T0 Corroborated",
  1: "T1 Multi-Source",
  2: "T2 Single Source",
  3: "T3 Analytical",
  4: "T4 Asserted",
};

/**
 * DD Adjustments tab - shows all adjustments in a ledger-style grid.
 * Tab 4 shows Management adjustments; Tab 5 shows DD + Pro Forma adjustments.
 */
export function DDAdjustmentsTab({ dealData, tabIndex = 1, proofMap, proposalMap }: TabProps) {
  const [traceAdjId, setTraceAdjId] = useState<string | null>(null);

  const handleRowClick = (rowId: string) => {
    if (!rowId.startsWith("adj-")) return;
    setTraceAdjId(rowId.slice("adj-".length));
  };

  const traceAdjustment = useMemo(
    () => (traceAdjId ? dealData.adjustments.find(a => a.id === traceAdjId) ?? null : null),
    [traceAdjId, dealData.adjustments]
  );

  const gridData = useMemo((): GridData => {
    const adj = dealData.adjustments;
    const { periods, aggregatePeriods } = dealData.deal;

    const columns: GridData["columns"] = [
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
      ...aggregatePeriods.map(ap => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" as const })),
      ...periods.map(p => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" as const })),
    ];

    const emptyCols = { adjNo: "", adjType: "", acctNo: "", fsLine: "", source: "", tier: "", verified: "", findings: "", flags: "" };

    // Tab 4 = Management adjustments, Tab 5 = DD + PF adjustments
    const filterTypes = tabIndex === 1 ? ["MA"] : ["DD", "PF"];
    const filtered = adj.filter(a => filterTypes.includes(a.type));
    const sectionLabel = tabIndex === 1 ? "Management Adjustments" : "Due Diligence & Pro Forma Adjustments";

    const rows: GridRow[] = [
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
          type: "data" as const,
          editable: true,
          indent: 1,
          cells: {
            label: a.label || a.notes || `Adjustment ${i + 1}`,
            adjNo: `${a.type}-${i + 1}`,
            adjType: a.type,
            acctNo: a.tbAccountNumber,
            fsLine: a.intent,
            source: proposal ? (proposal.source === "ai_discovery" ? "AI Discovery" : "Manual") : (a.type === "MA" ? "Manual" : ""),
            tier: proposal?.supportTier != null ? (TIER_SHORT[proposal.supportTier] || `T${proposal.supportTier}`) : "",
            verified: formatProofLabel(proofSet?.verification),
            findings: (() => {
              const base = formatProofFindings(allFindings, 160);
              if (varianceAmount && varianceAmount !== 0) {
                const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(Math.abs(varianceAmount));
                return `⚠ Variance: ${fmt} · ${base}`;
              }
              return base;
            })(),
            flags: allRedFlags.length
              ? (allRedFlags.length === 1 ? allRedFlags[0] : `${allRedFlags.length} flags`)
              : "",
            ...adjustmentCells(dealData, a.amounts),
          },
        };
      }),
    ];

    // Total row
    const totalCells: Record<string, number> = {};
    for (const p of periods) {
      totalCells[p.id] = filtered.reduce((s, a) => s + (a.amounts[p.id] || 0), 0);
    }
    for (const ap of aggregatePeriods) {
      totalCells[ap.id] = ap.monthPeriodIds.reduce((s, mpid) =>
        s + filtered.reduce((ss, a) => ss + (a.amounts[mpid] || 0), 0), 0);
    }
    rows.push({ id: "total", type: "total", cells: { label: `Total ${sectionLabel}`, ...emptyCols, ...totalCells } });

    if (filtered.length === 0) {
      rows.push({ id: "empty", type: "data", cells: { label: "No adjustments entered", ...emptyCols } });
    }

    return { columns, rows, frozenColumns: 6 };
  }, [dealData, tabIndex, proofMap, proposalMap]);

  return (
    <>
      <SpreadsheetGrid data={gridData} onRowClick={handleRowClick} />
      <AdjustmentTraceSheet
        open={!!traceAdjId}
        onOpenChange={(o) => !o && setTraceAdjId(null)}
        adjustment={traceAdjustment}
        proofSet={traceAdjId ? proofMap?.get(traceAdjId) : undefined}
      />
    </>
  );
}
