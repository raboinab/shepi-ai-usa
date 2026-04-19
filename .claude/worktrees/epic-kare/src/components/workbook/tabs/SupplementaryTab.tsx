import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow, GridColumn } from "@/lib/workbook-types";
import { differenceInMonths, parseISO } from "date-fns";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
};

const fmtRate = (r: number) => `${r.toFixed(2)}%`;

function monthsTo(dateStr?: string): number | null {
  if (!dateStr) return null;
  try {
    const mo = differenceInMonths(parseISO(dateStr), new Date());
    return mo > 0 ? mo : 0;
  } catch { return null; }
}

/**
 * Supplementary Tab — Debt Schedule + Lease Obligations grid.
 * Reads from dealData.supplementary (populated from wizard_data.supplementary via adapter or mock).
 */
export function SupplementaryTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const columns: GridColumn[] = [
      { key: "col0", label: "Description",     width: 280, frozen: true, format: "text"    as const },
      { key: "col1", label: "Type",             width: 130, format: "text"     as const },
      { key: "col2", label: "Balance / Payment",width: 150, format: "currency" as const },
      { key: "col3", label: "Rate",             width: 90,  format: "text"     as const },
      { key: "col4", label: "Maturity / Expiry",width: 140, format: "text"     as const },
      { key: "col5", label: "Months Remaining", width: 130, format: "number"   as const },
    ];

    const rows: GridRow[] = [];
    const supp = dealData.supplementary;

    // ── Debt Schedule ──────────────────────────────────────────
    rows.push({
      id: "hdr-debt",
      type: "section-header",
      label: "Debt Schedule",
      cells: { col0: "Debt Schedule", col1: "", col2: "", col3: "", col4: "", col5: "" },
    });

    const debtItems = supp?.debtSchedule ?? [];
    if (debtItems.length === 0) {
      rows.push({
        id: "debt-empty",
        type: "data",
        cells: { col0: "No debt schedule data entered", col1: "", col2: "", col3: "", col4: "", col5: "" },
      });
    } else {
      let totalDebt = 0;
      debtItems.forEach((d, i) => {
        const mo = monthsTo(d.maturityDate);
        totalDebt += d.balance;
        rows.push({
          id: `debt-${i}`,
          type: "data",
          cells: {
            col0: d.lender,
            col1: d.type ?? "Term Loan",
            col2: d.balance,
            col3: fmtRate(d.interestRate),
            col4: d.maturityDate ?? "—",
            col5: mo !== null ? mo : "—",
          },
        });
      });
      rows.push({
        id: "debt-total",
        type: "subtotal",
        label: "Total Debt",
        cells: { col0: "Total Debt", col1: "", col2: totalDebt, col3: "", col4: "", col5: "" },
      });
    }

    rows.push({ id: "sp1", type: "spacer", cells: {} });

    // ── Lease Obligations ──────────────────────────────────────
    rows.push({
      id: "hdr-lease",
      type: "section-header",
      label: "Lease Obligations",
      cells: { col0: "Lease Obligations", col1: "", col2: "", col3: "", col4: "", col5: "" },
    });

    const leaseItems = supp?.leaseObligations ?? [];
    if (leaseItems.length === 0) {
      rows.push({
        id: "lease-empty",
        type: "data",
        cells: { col0: "No lease data entered", col1: "", col2: "", col3: "", col4: "", col5: "" },
      });
    } else {
      let totalLease = 0;
      leaseItems.forEach((l, i) => {
        const mo = monthsTo(l.expirationDate);
        totalLease += l.annualPayment;
        rows.push({
          id: `lease-${i}`,
          type: "data",
          cells: {
            col0: l.description,
            col1: l.leaseType,
            col2: l.annualPayment,
            col3: "—",
            col4: l.expirationDate ?? "—",
            col5: mo !== null ? mo : (l.remainingTerm !== undefined ? `${l.remainingTerm} yrs` : "—"),
          },
        });
      });
      rows.push({
        id: "lease-total",
        type: "subtotal",
        label: "Total Annual Lease Payments",
        cells: { col0: "Total Annual Lease Payments", col1: "", col2: totalLease, col3: "", col4: "", col5: "" },
      });
    }

    rows.push({ id: "sp2", type: "spacer", cells: {} });

    // ── Project Metadata ───────────────────────────────────────
    rows.push({
      id: "hdr-meta",
      type: "section-header",
      label: "Project Information",
      cells: { col0: "Project Information", col1: "", col2: "", col3: "", col4: "", col5: "" },
    });
    rows.push({ id: "meta-company",  type: "data", cells: { col0: "Target Company",   col1: dealData.deal.targetCompany || dealData.deal.projectName, col2: "", col3: "", col4: "", col5: "" } });
    rows.push({ id: "meta-client",   type: "data", cells: { col0: "Client",            col1: dealData.deal.clientName,   col2: "", col3: "", col4: "", col5: "" } });
    rows.push({ id: "meta-industry", type: "data", cells: { col0: "Industry",          col1: dealData.deal.industry,     col2: "", col3: "", col4: "", col5: "" } });
    rows.push({ id: "meta-txn",      type: "data", cells: { col0: "Transaction Type",  col1: dealData.deal.transactionType, col2: "", col3: "", col4: "", col5: "" } });
    rows.push({ id: "meta-fye",      type: "data", cells: { col0: "Fiscal Year End",   col1: `Month ${dealData.deal.fiscalYearEnd}`, col2: "", col3: "", col4: "", col5: "" } });
    rows.push({ id: "meta-periods",  type: "data", cells: { col0: "Period Coverage",   col1: `${dealData.deal.periods.length} months`, col2: "", col3: "", col4: "", col5: "" } });

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
