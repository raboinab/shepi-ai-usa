import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

function formatAgingPeriodLabel(key: string): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const match = key.match(/(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const month = months[parseInt(match[2], 10) - 1] || match[2];
    const prefix = key.startsWith("as_of_") ? "As of " : "";
    return `${prefix}${month} ${year}`;
  }
  return key;
}

export function APAgingTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const columns = [
      { key: "label", label: "Vendor", width: 200, frozen: true, format: "text" as const },
      { key: "current", label: "Current", width: 90, format: "currency" as const },
      { key: "d30", label: "1-30", width: 90, format: "currency" as const },
      { key: "d60", label: "31-60", width: 90, format: "currency" as const },
      { key: "d90", label: "61-90", width: 90, format: "currency" as const },
      { key: "d90p", label: "90+", width: 90, format: "currency" as const },
      { key: "total", label: "Total", width: 100, format: "currency" as const },
    ];
    const rows: GridRow[] = [];
    const agingPeriods = Object.keys(dealData.apAging).sort();
    if (agingPeriods.length === 0) {
      rows.push({ id: "empty", type: "data", cells: { label: "No data", current: null, d30: null, d60: null, d90: null, d90p: null, total: null } });
    } else {
      for (const periodKey of agingPeriods) {
        const entries = dealData.apAging[periodKey];
        const label = formatAgingPeriodLabel(periodKey);
        rows.push({ id: `hdr-${periodKey}`, type: "section-header", label, cells: { label } });
        for (const [i, e] of entries.entries()) {
          rows.push({ id: `ap-${periodKey}-${i}`, type: "data", editable: true, cells: { label: e.name, current: e.current, d30: e.days1to30, d60: e.days31to60, d90: e.days61to90, d90p: e.days90plus, total: e.total } });
        }
        if (entries.length === 0) {
          rows.push({ id: `empty-${periodKey}`, type: "data", cells: { label: "No data", current: null, d30: null, d60: null, d90: null, d90p: null, total: null } });
        } else {
          const totals = entries.reduce(
            (acc, e) => ({
              current: acc.current + e.current,
              d30:     acc.d30     + e.days1to30,
              d60:     acc.d60     + e.days31to60,
              d90:     acc.d90     + e.days61to90,
              d90p:    acc.d90p    + e.days90plus,
              total:   acc.total   + e.total,
            }),
            { current: 0, d30: 0, d60: 0, d90: 0, d90p: 0, total: 0 }
          );
          rows.push({ id: `total-${periodKey}`, type: "total", cells: { label: "Total AP", ...totals } });
        }
        rows.push({ id: `sp-${periodKey}`, type: "spacer", cells: {} });
      }
    }
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return <SpreadsheetGrid data={gridData} />;
}
