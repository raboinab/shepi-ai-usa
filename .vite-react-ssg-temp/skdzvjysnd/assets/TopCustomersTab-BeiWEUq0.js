import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import "@tanstack/react-virtual";
import "./sanitizeWizardData-nrsUY-BP.js";
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
function TopCustomersTab({ dealData }) {
  const gridData = useMemo(() => {
    const dataKeys = Object.keys(dealData.topCustomers || {});
    const yearSet = /* @__PURE__ */ new Set();
    for (const k of dataKeys) {
      const annualMatch = k.match(/^annual-(\d{4})$/);
      if (annualMatch) {
        yearSet.add(annualMatch[1]);
        continue;
      }
      const monthMatch = k.match(/^(\d{4})-\d{2}$/);
      if (monthMatch) yearSet.add(monthMatch[1]);
    }
    const years = Array.from(yearSet).sort();
    if (years.length === 0) {
      return { columns: [], rows: [], frozenColumns: 0 };
    }
    const columns = [
      { key: "rank", label: "#", width: 30, frozen: true, format: "text" }
    ];
    for (const yr of years) {
      columns.push(
        { key: `${yr}-name`, label: `${yr} Customer`, width: 160, format: "text" },
        { key: `${yr}-revenue`, label: "Revenue", width: 110, format: "currency" },
        { key: `${yr}-pct`, label: "% of Total", width: 80, format: "percent" }
      );
    }
    const rows = [];
    rows.push({ id: "hdr", type: "section-header", label: "Top Customers by Year", cells: { rank: "Top Customers by Year" } });
    const yearMaps = {};
    for (const yr of years) {
      const customerMap = /* @__PURE__ */ new Map();
      for (const e of dealData.topCustomers[`annual-${yr}`] || []) {
        customerMap.set(e.name, (customerMap.get(e.name) || 0) + e.revenue);
      }
      for (let m = 1; m <= 12; m++) {
        const pid = `${yr}-${String(m).padStart(2, "0")}`;
        for (const e of dealData.topCustomers[pid] || []) {
          customerMap.set(e.name, (customerMap.get(e.name) || 0) + e.revenue);
        }
      }
      const sorted = Array.from(customerMap.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
      const total = sorted.reduce((s, [, v]) => s + v, 0);
      yearMaps[yr] = { sorted, total };
    }
    const maxRows = 10;
    for (let i = 0; i < maxRows; i++) {
      const cells = { rank: `${i + 1}` };
      for (const yr of years) {
        const { sorted, total } = yearMaps[yr];
        if (i < sorted.length) {
          cells[`${yr}-name`] = sorted[i][0];
          cells[`${yr}-revenue`] = sorted[i][1];
          cells[`${yr}-pct`] = total === 0 ? NaN : sorted[i][1] / Math.abs(total);
        } else {
          cells[`${yr}-name`] = "";
          cells[`${yr}-revenue`] = null;
          cells[`${yr}-pct`] = null;
        }
      }
      rows.push({ id: `cust-${i}`, type: "data", editable: true, cells });
    }
    const otherCells = { rank: "" };
    for (const yr of years) {
      const { sorted, total } = yearMaps[yr];
      const topRev = sorted.slice(0, maxRows).reduce((s, [, v]) => s + v, 0);
      otherCells[`${yr}-name`] = "All other customers";
      otherCells[`${yr}-revenue`] = total - topRev;
      otherCells[`${yr}-pct`] = total === 0 ? NaN : (total - topRev) / Math.abs(total);
    }
    rows.push({ id: "other", type: "data", cells: otherCells });
    const totalCells = { rank: "" };
    for (const yr of years) {
      totalCells[`${yr}-name`] = "Total Revenue";
      totalCells[`${yr}-revenue`] = yearMaps[yr].total;
      totalCells[`${yr}-pct`] = 1;
    }
    rows.push({ id: "total", type: "total", cells: totalCells });
    return { columns, rows, frozenColumns: 1 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  TopCustomersTab
};
