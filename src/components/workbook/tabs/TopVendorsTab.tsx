import { useMemo } from "react";
import { SpreadsheetGrid } from "../SpreadsheetGrid";
import type { DealData, GridData, GridRow } from "@/lib/workbook-types";

interface TabProps { dealData: DealData; onDataChange?: (data: DealData) => void; }

export function TopVendorsTab({ dealData }: TabProps) {
  const gridData = useMemo((): GridData => {
    const dataKeys = Object.keys(dealData.topVendors || {});
    const yearSet = new Set<string>();
    for (const k of dataKeys) {
      const annualMatch = k.match(/^annual-(\d{4})$/);
      if (annualMatch) { yearSet.add(annualMatch[1]); continue; }
      const monthMatch = k.match(/^(\d{4})-\d{2}$/);
      if (monthMatch) yearSet.add(monthMatch[1]);
    }
    const years = Array.from(yearSet).sort();

    if (years.length === 0) {
      return { columns: [], rows: [], frozenColumns: 0 };
    }

    const columns: GridData["columns"] = [
      { key: "rank", label: "#", width: 30, frozen: true, format: "text" },
    ];
    for (const yr of years) {
      columns.push(
        { key: `${yr}-name`, label: `${yr} Vendor`, width: 160, format: "text" },
        { key: `${yr}-spend`, label: "Expenses", width: 110, format: "currency" },
        { key: `${yr}-pct`, label: "% of Total", width: 80, format: "percent" },
      );
    }

    const rows: GridRow[] = [];
    rows.push({ id: "hdr", type: "section-header", label: "Top Vendors by Year", cells: { rank: "Top Vendors by Year" } });

    const yearMaps: Record<string, { sorted: [string, number][]; total: number }> = {};
    for (const yr of years) {
      const vendorMap = new Map<string, number>();
      for (const e of (dealData.topVendors[`annual-${yr}`] || [])) {
        vendorMap.set(e.name, (vendorMap.get(e.name) || 0) + e.spend);
      }
      for (let m = 1; m <= 12; m++) {
        const pid = `${yr}-${String(m).padStart(2, "0")}`;
        for (const e of (dealData.topVendors[pid] || [])) {
          vendorMap.set(e.name, (vendorMap.get(e.name) || 0) + e.spend);
        }
      }
      const sorted = Array.from(vendorMap.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
      const total = sorted.reduce((s, [, v]) => s + v, 0);
      yearMaps[yr] = { sorted, total };
    }

    const maxRows = 10;
    for (let i = 0; i < maxRows; i++) {
      const cells: Record<string, string | number | null> = { rank: `${i + 1}` };
      for (const yr of years) {
        const { sorted, total } = yearMaps[yr];
        if (i < sorted.length) {
          cells[`${yr}-name`] = sorted[i][0];
          cells[`${yr}-spend`] = sorted[i][1];
          cells[`${yr}-pct`] = total === 0 ? NaN : sorted[i][1] / Math.abs(total);
        } else {
          cells[`${yr}-name`] = "";
          cells[`${yr}-spend`] = null;
          cells[`${yr}-pct`] = null;
        }
      }
      rows.push({ id: `vend-${i}`, type: "data", editable: true, cells });
    }

    const otherCells: Record<string, string | number | null> = { rank: "" };
    for (const yr of years) {
      const { sorted, total } = yearMaps[yr];
      const topSpend = sorted.slice(0, maxRows).reduce((s, [, v]) => s + v, 0);
      otherCells[`${yr}-name`] = "All other vendors";
      otherCells[`${yr}-spend`] = total - topSpend;
      otherCells[`${yr}-pct`] = total === 0 ? NaN : (total - topSpend) / Math.abs(total);
    }
    rows.push({ id: "other", type: "data", cells: otherCells });

    const totalCells: Record<string, string | number | null> = { rank: "" };
    for (const yr of years) {
      totalCells[`${yr}-name`] = "Total vendor purchases";
      totalCells[`${yr}-spend`] = yearMaps[yr].total;
      totalCells[`${yr}-pct`] = 1;
    }
    rows.push({ id: "total", type: "total", cells: totalCells });

    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);

  return <SpreadsheetGrid data={gridData} />;
}
