import { jsx } from "react/jsx-runtime";
import { useState, useCallback, useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { F as calcRevenue, aj as calcCOGS, as as calcInterestExpense, ah as calcIncomeTaxExpense, N as sumByLineItem, ab as calcTotalAssets, ad as calcTotalLiabilities, ak as calcOpEx, al as calcPayroll, G as calcGrossProfit, H as calcNetIncome, a1 as calcTotalCurrentAssets } from "./sanitizeWizardData-nrsUY-BP.js";
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
function buildReconcColumns(aggregatePeriods) {
  const cols = [
    { key: "label", label: "", width: 260, frozen: true, format: "text" }
  ];
  for (const ap of aggregatePeriods) {
    cols.push(
      { key: `${ap.id}-ours`, label: `${ap.shortLabel} — Our Numbers`, width: 120, format: "currency" },
      { key: `${ap.id}-adj`, label: `${ap.shortLabel} — Adj for Audit`, width: 120, format: "currency" },
      { key: `${ap.id}-audited`, label: `${ap.shortLabel} — Audited`, width: 120, format: "currency" },
      { key: `${ap.id}-diff`, label: `${ap.shortLabel} — Difference`, width: 110, format: "currency" }
    );
  }
  return cols;
}
function isAggCells(aggregatePeriods, auditAdj, rowId, oursValueFn) {
  const cells = {};
  for (const ap of aggregatePeriods) {
    const ours = oursValueFn(ap.monthPeriodIds);
    const adj = auditAdj[ap.id]?.[rowId] ?? 0;
    const audited = ours + adj;
    const diff = audited - ours;
    cells[`${ap.id}-ours`] = ours;
    cells[`${ap.id}-adj`] = adj;
    cells[`${ap.id}-audited`] = audited;
    cells[`${ap.id}-diff`] = diff;
  }
  return cells;
}
function bsAggCells(aggregatePeriods, auditAdj, rowId, oursValueFn) {
  const cells = {};
  for (const ap of aggregatePeriods) {
    const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1] ?? "";
    const ours = lastPid ? oursValueFn(lastPid) : 0;
    const adj = auditAdj[ap.id]?.[rowId] ?? 0;
    const audited = ours + adj;
    const diff = audited - ours;
    cells[`${ap.id}-ours`] = ours;
    cells[`${ap.id}-adj`] = adj;
    cells[`${ap.id}-audited`] = audited;
    cells[`${ap.id}-diff`] = diff;
  }
  return cells;
}
function ISBSReconciliationTab({ dealData }) {
  const [auditAdj, setAuditAdj] = useState({});
  const handleCellChange = useCallback((rowId, colKey, rawValue) => {
    if (!colKey.endsWith("-adj")) return;
    const aggId = colKey.slice(0, -4);
    const num = parseFloat(rawValue.replace(/[^0-9.\-]/g, "")) || 0;
    setAuditAdj((prev) => ({
      ...prev,
      [aggId]: { ...prev[aggId] ?? {}, [rowId]: num }
    }));
  }, []);
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const ab = dealData.addbacks;
    const { aggregatePeriods } = dealData.deal;
    const columns = buildReconcColumns(aggregatePeriods);
    const isRow = (rowId, label, type, oursValueFn, indent) => ({
      id: rowId,
      type,
      label,
      indent,
      editable: true,
      cells: {
        label,
        ...isAggCells(aggregatePeriods, auditAdj, rowId, oursValueFn)
      }
    });
    const bsRow = (rowId, label, type, oursValueFn, indent) => ({
      id: rowId,
      type,
      label,
      indent,
      editable: true,
      cells: {
        label,
        ...bsAggCells(aggregatePeriods, auditAdj, rowId, oursValueFn)
      }
    });
    const spacer = (id) => ({ id, type: "spacer", cells: {} });
    const calcTotalOpEx = (p) => calcOpEx(tb, p) + calcPayroll(tb, p);
    const allDiffsZero = (rowId) => aggregatePeriods.every((ap) => Math.abs(auditAdj[ap.id]?.[rowId] ?? 0) < 0.01);
    const rows = [
      // ── INCOME STATEMENT ──────────────────────────────────────────────────────
      {
        id: "hdr-is",
        type: "section-header",
        cells: { label: "INCOME STATEMENT — Reconciliation to Audited Financials" }
      },
      {
        id: "hdr-note",
        type: "header",
        cells: { label: "Enter audit adjustments in the 'Adj for Audit' columns. Difference should equal zero when reconciled." }
      },
      spacer("s-is-0"),
      // Revenue/GP/NI: credit accounts in TB → negate for positive display
      isRow(
        "is-revenue",
        "Revenue",
        "data",
        (mids) => -mids.reduce((s, p) => s + calcRevenue(tb, p), 0),
        1
      ),
      isRow(
        "is-cogs",
        "Cost of goods sold",
        "data",
        (mids) => mids.reduce((s, p) => s + calcCOGS(tb, p), 0),
        1
      ),
      isRow(
        "is-gross-profit",
        "Gross profit",
        "subtotal",
        (mids) => -mids.reduce((s, p) => s + calcGrossProfit(tb, p), 0)
      ),
      spacer("s-is-1"),
      isRow(
        "is-opex",
        "Operating expenses",
        "data",
        (mids) => mids.reduce((s, p) => s + calcTotalOpEx(p), 0),
        1
      ),
      isRow(
        "is-op-income",
        "Operating income",
        "subtotal",
        (mids) => -mids.reduce((s, p) => s + calcGrossProfit(tb, p) + calcTotalOpEx(p), 0)
      ),
      spacer("s-is-2"),
      isRow(
        "is-interest",
        "Interest expense, net",
        "data",
        (mids) => mids.reduce((s, p) => s + calcInterestExpense(tb, p, ab.interest), 0),
        1
      ),
      isRow(
        "is-taxes",
        "Income taxes",
        "data",
        (mids) => mids.reduce((s, p) => s + calcIncomeTaxExpense(tb, p, ab.taxes), 0),
        1
      ),
      spacer("s-is-3"),
      isRow(
        "is-net-income",
        "Net income (loss)",
        "total",
        (mids) => -mids.reduce((s, p) => s + calcNetIncome(tb, p), 0)
      ),
      spacer("s-is-check"),
      {
        id: "check-is",
        type: "check",
        checkPassed: allDiffsZero("is-net-income"),
        cells: {
          label: "IS Check — Difference should be zero",
          ...(() => {
            const c = {};
            for (const ap of aggregatePeriods) {
              const adj = auditAdj[ap.id]?.["is-net-income"] ?? 0;
              c[`${ap.id}-ours`] = 0;
              c[`${ap.id}-adj`] = adj;
              c[`${ap.id}-audited`] = adj;
              c[`${ap.id}-diff`] = adj;
            }
            return c;
          })()
        }
      },
      spacer("s-sep"),
      // ── BALANCE SHEET ─────────────────────────────────────────────────────────
      {
        id: "hdr-bs",
        type: "section-header",
        cells: { label: "BALANCE SHEET — Reconciliation to Audited Financials" }
      },
      spacer("s-bs-0"),
      { id: "hdr-assets", type: "section-header", cells: { label: "ASSETS" } },
      bsRow(
        "bs-cash",
        "Cash & equivalents",
        "data",
        (p) => sumByLineItem(tb, "Cash and cash equivalents", p),
        1
      ),
      bsRow(
        "bs-ar",
        "Accounts receivable",
        "data",
        (p) => sumByLineItem(tb, "Accounts receivable", p),
        1
      ),
      bsRow(
        "bs-oca",
        "Other current assets",
        "data",
        (p) => sumByLineItem(tb, "Other current assets", p),
        1
      ),
      bsRow(
        "bs-total-ca",
        "Current assets",
        "subtotal",
        (p) => calcTotalCurrentAssets(tb, p)
      ),
      bsRow(
        "bs-fa",
        "Fixed assets",
        "data",
        (p) => sumByLineItem(tb, "Fixed assets", p),
        1
      ),
      bsRow(
        "bs-total-assets",
        "TOTAL ASSETS",
        "total",
        (p) => calcTotalAssets(tb, p)
      ),
      spacer("s-bs-1"),
      { id: "hdr-liab", type: "section-header", cells: { label: "LIABILITIES" } },
      // Liabilities & Equity: credit accounts in TB → negate for positive display
      bsRow(
        "bs-cl",
        "Current liabilities",
        "data",
        (p) => -sumByLineItem(tb, "Current liabilities", p),
        1
      ),
      bsRow(
        "bs-ocl",
        "Other current liabilities",
        "data",
        (p) => -sumByLineItem(tb, "Other current liabilities", p),
        1
      ),
      bsRow(
        "bs-ltl",
        "Long term liabilities",
        "data",
        (p) => -sumByLineItem(tb, "Long term liabilities", p),
        1
      ),
      bsRow(
        "bs-total-liab",
        "Total liabilities",
        "subtotal",
        (p) => -calcTotalLiabilities(tb, p)
      ),
      spacer("s-bs-2"),
      { id: "hdr-equity", type: "section-header", cells: { label: "EQUITY" } },
      bsRow(
        "bs-equity",
        "Equity",
        "data",
        // Snapshot equity = Assets - |Liabilities| (consistent with summary BS tab)
        (p) => calcTotalAssets(tb, p) + calcTotalLiabilities(tb, p),
        1
      ),
      bsRow(
        "bs-total-le",
        "TOTAL LIABILITIES & EQUITY",
        "total",
        // Total L&E = displayLiab(-liab) + displayEquity(assets+liab) = assets (always balances)
        (p) => calcTotalAssets(tb, p)
      ),
      spacer("s-bs-check"),
      {
        id: "check-bs",
        type: "check",
        checkPassed: true,
        cells: {
          label: "BS Check — Audited Assets = Audited L&E (should be zero)",
          ...(() => {
            const c = {};
            for (const ap of aggregatePeriods) {
              const adjAssets = auditAdj[ap.id]?.["bs-total-assets"] ?? 0;
              const adjLE = auditAdj[ap.id]?.["bs-total-le"] ?? 0;
              const diff = adjAssets - adjLE;
              c[`${ap.id}-ours`] = 0;
              c[`${ap.id}-adj`] = diff;
              c[`${ap.id}-audited`] = diff;
              c[`${ap.id}-diff`] = diff;
            }
            return c;
          })()
        }
      }
    ];
    return { columns, rows, frozenColumns: 1 };
  }, [dealData, auditAdj]);
  return /* @__PURE__ */ jsx(
    SpreadsheetGrid,
    {
      data: gridData,
      onCellChange: handleCellChange
    }
  );
}
export {
  ISBSReconciliationTab
};
