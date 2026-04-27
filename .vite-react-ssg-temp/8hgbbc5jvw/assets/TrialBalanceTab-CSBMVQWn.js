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
function TrialBalanceTab({ dealData }) {
  const gridData = useMemo(() => {
    const periods = dealData.deal.periods;
    const columns = [
      { key: "fsType", label: "FS", width: 45, frozen: true, format: "text" },
      { key: "accountId", label: "Acct #", width: 70, frozen: true, format: "text" },
      { key: "accountName", label: "Account Name", width: 280, frozen: true, format: "text" },
      { key: "fsLineItem", label: "FS Line Item", width: 170, frozen: true, format: "text" },
      ...periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 90, format: "currency" }))
    ];
    const dataRows = dealData.trialBalance.map((entry) => {
      const fullName = entry.accountName || "";
      const colonParts = fullName.split(":");
      const indentLevel = colonParts.length - 1;
      const leafName = colonParts[colonParts.length - 1]?.trim() || fullName;
      return {
        id: entry.accountId,
        type: "data",
        editable: true,
        indent: indentLevel,
        cells: {
          fsType: entry.fsType,
          accountId: entry.accountId,
          accountName: leafName,
          fsLineItem: entry.fsLineItem,
          ...Object.fromEntries(periods.map((p) => [p.id, entry.balances[p.id] || 0]))
        }
      };
    });
    const bsTotals = {};
    const isTotals = {};
    for (const entry of dealData.trialBalance) {
      for (const p of periods) {
        const val = entry.balances[p.id] || 0;
        if (entry.fsType === "BS") {
          bsTotals[p.id] = (bsTotals[p.id] || 0) + val;
        } else {
          isTotals[p.id] = (isTotals[p.id] || 0) + val;
        }
      }
    }
    const fyEndMonth = dealData.deal.fiscalYearEnd;
    const fyStartMonth = fyEndMonth % 12 + 1;
    const isYtdTotals = {};
    let isRunning = 0;
    for (const p of periods) {
      if (p.month === fyStartMonth) isRunning = 0;
      isRunning += isTotals[p.id] || 0;
      isYtdTotals[p.id] = isRunning;
    }
    const bsRow = {
      id: "__bs_total",
      type: "subtotal",
      cells: {
        fsType: "",
        accountId: "",
        accountName: "BS Total",
        fsLineItem: "",
        ...Object.fromEntries(periods.map((p) => [p.id, bsTotals[p.id] || 0]))
      }
    };
    const isRow = {
      id: "__is_total",
      type: "subtotal",
      cells: {
        fsType: "",
        accountId: "",
        accountName: "IS Total (YTD)",
        fsLineItem: "",
        ...Object.fromEntries(periods.map((p) => [p.id, isYtdTotals[p.id] || 0]))
      }
    };
    const checkCells = {
      fsType: "",
      accountId: "",
      accountName: "Check (should be 0)",
      fsLineItem: ""
    };
    let allBalanced = true;
    for (const p of periods) {
      const checkVal = (bsTotals[p.id] || 0) + (isYtdTotals[p.id] || 0);
      checkCells[p.id] = checkVal;
      if (Math.abs(checkVal) >= 0.01) allBalanced = false;
    }
    const checkRow = {
      id: "__check",
      type: "check",
      checkPassed: allBalanced,
      cells: checkCells
    };
    const rows = [...dataRows, bsRow, isRow, checkRow];
    return { columns, rows, frozenColumns: 4 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  TrialBalanceTab
};
