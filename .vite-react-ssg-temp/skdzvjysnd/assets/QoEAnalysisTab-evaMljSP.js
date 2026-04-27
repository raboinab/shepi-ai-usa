import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { av as adjustmentCells, aw as negatedPeriodCells, ax as periodCells, ay as marginCells, as as calcInterestExpense, ah as calcIncomeTaxExpense, an as calcDepreciationExpense, az as calcAdjustmentTotal, aA as reclassAwareRevenueRaw, K as sumReclassImpact, I as calcReportedEBITDA, H as calcNetIncome, aB as calcRevenueAdjustments, G as calcGrossProfit, aC as calcCOGSAdjustments } from "./sanitizeWizardData-nrsUY-BP.js";
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
function QoEAnalysisTab({ dealData }) {
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const adj = dealData.adjustments;
    const ab = dealData.addbacks;
    const rc = dealData.reclassifications ?? [];
    const tbIdx = dealData.tbIndex;
    const pc = (fn) => periodCells(dealData, fn);
    const npc = (fn) => negatedPeriodCells(dealData, fn);
    const mc = (numFn, denFn) => marginCells(dealData, numFn, denFn);
    const { periods, aggregatePeriods } = dealData.deal;
    const columns = [
      { key: "label", label: "USD $", width: 240, frozen: true, format: "text" },
      { key: "adjNo", label: "Adj. #", width: 55, frozen: true, format: "text" },
      { key: "adjType", label: "Adj. Type", width: 70, frozen: true, format: "text" },
      { key: "acctNo", label: "Account #", width: 80, frozen: true, format: "text" },
      { key: "acctDesc", label: "Account Description", width: 160, frozen: true, format: "text" },
      { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
      { key: "sub1", label: "Sub-account 1", width: 100, frozen: true, format: "text" },
      { key: "sub2", label: "Sub-account 2", width: 100, frozen: true, format: "text" },
      { key: "sub3", label: "Sub-account 3", width: 100, frozen: true, format: "text" },
      ...aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
      ...periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" })),
      { key: "comments", label: "Comments", width: 200, format: "text" }
    ];
    const ec = { adjNo: "", adjType: "", acctNo: "", acctDesc: "", fsLine: "", sub1: "", sub2: "", sub3: "", comments: "" };
    const maAdj = adj.filter((a) => a.type === "MA");
    const ddAdj = adj.filter((a) => a.type === "DD");
    const pfAdj = adj.filter((a) => a.type === "PF");
    const adjRow = (a, prefix, i) => ({
      id: `${prefix}-${a.id}`,
      type: "data",
      indent: 1,
      cells: {
        label: a.label || a.notes || `${prefix.toUpperCase()}-${i + 1}`,
        adjNo: `${a.type}-${i + 1}`,
        adjType: a.type,
        acctNo: a.tbAccountNumber,
        acctDesc: a.label,
        fsLine: a.intent,
        sub1: "",
        sub2: "",
        sub3: "",
        comments: a.notes,
        ...adjustmentCells(dealData, a.amounts)
      }
    });
    const rows = [
      // Revenue: credit in TB = negative → negate for display (with reclass overlay)
      { id: "revenue-reported", type: "data", cells: { label: "Revenue, as reported", ...ec, ...npc((p) => reclassAwareRevenueRaw(tb, rc, p)) } },
      { id: "revenue-adjusted", type: "data", cells: {
        label: "Revenue, as adjusted",
        ...ec,
        ...npc((p) => reclassAwareRevenueRaw(tb, rc, p) - calcRevenueAdjustments(adj, tbIdx, "all", p))
      } },
      // Gross Profit: credit-biased in TB when profitable → negate (with reclass overlay)
      { id: "gross-profit", type: "data", cells: {
        label: "Gross profit, as adjusted",
        ...ec,
        ...npc((p) => calcGrossProfit(tb, p) + sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) - calcRevenueAdjustments(adj, tbIdx, "all", p) - calcCOGSAdjustments(adj, tbIdx, "all", p))
      } },
      // Net Income: IS sum is negative when profitable → negate (with reclass overlay)
      { id: "net-income", type: "subtotal", cells: { label: "Net income (loss)", ...ec, ...npc((p) => {
        const raw = calcNetIncome(tb, p);
        const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
        return raw + isReclass;
      }) } },
      { id: "s1", type: "spacer", cells: {} },
      // Normal Adjustments (addbacks are debits = positive, display as-is)
      { id: "hdr-normal", type: "section-header", label: "Normal adjustments", cells: { label: "Normal adjustments", ...ec } },
      { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc((p) => calcInterestExpense(tb, p, ab.interest)) } },
      { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc((p) => calcIncomeTaxExpense(tb, p, ab.taxes)) } },
      { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc((p) => calcDepreciationExpense(tb, p, ab.depreciation)) } },
      { id: "s2", type: "spacer", cells: {} },
      // Reported EBITDA: negative in TB when profitable → negate (with reclass overlay)
      { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...ec, ...npc((p) => {
        const raw = calcReportedEBITDA(tb, p, ab);
        const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
        return raw + isReclass;
      }) } },
      { id: "s3", type: "spacer", cells: {} },
      // Management Adjustments
      { id: "hdr-ma", type: "section-header", label: "Management adjustments", cells: { label: "Management adjustments", ...ec } },
      ...maAdj.map((a, i) => adjRow(a, "ma", i)),
      { id: "ma-total", type: "subtotal", cells: { label: "Total management adjustments", ...ec, ...pc((p) => calcAdjustmentTotal(adj, "MA", p)) } },
      { id: "ma-ebitda", type: "total", cells: {
        label: "Management adjusted EBITDA",
        ...ec,
        ...npc((p) => {
          const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
          return calcReportedEBITDA(tb, p, ab) + isReclass - calcAdjustmentTotal(adj, "MA", p);
        })
      } },
      { id: "s4", type: "spacer", cells: {} },
      // Due Diligence Adjustments
      { id: "hdr-dd", type: "section-header", label: "Due diligence adjustments", cells: { label: "Due diligence adjustments", ...ec } },
      ...ddAdj.map((a, i) => adjRow(a, "dd", i)),
      { id: "dd-total", type: "subtotal", cells: { label: "Total due diligence adjustments", ...ec, ...pc((p) => calcAdjustmentTotal(adj, "DD", p)) } },
      { id: "dd-ebitda", type: "total", cells: {
        label: "Due diligence adjusted EBITDA",
        ...ec,
        ...npc((p) => {
          const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
          return calcReportedEBITDA(tb, p, ab) + isReclass - calcAdjustmentTotal(adj, "MA", p) - calcAdjustmentTotal(adj, "DD", p);
        })
      } },
      { id: "s5", type: "spacer", cells: {} },
      // Pro Forma Adjustments
      { id: "hdr-pf", type: "section-header", label: "Pro Forma Adjustments", cells: { label: "Pro Forma Adjustments", ...ec } },
      ...pfAdj.map((a, i) => adjRow(a, "pf", i)),
      { id: "pf-total", type: "subtotal", cells: { label: "Total pro forma adjustments", ...ec, ...pc((p) => calcAdjustmentTotal(adj, "PF", p)) } },
      { id: "pf-ebitda", type: "total", cells: {
        label: "Pro Forma Adjusted EBITDA",
        ...ec,
        ...npc((p) => {
          const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
          return calcReportedEBITDA(tb, p, ab) + isReclass - calcAdjustmentTotal(adj, "all", p);
        })
      } },
      { id: "s6", type: "spacer", cells: {} },
      // % of Revenue — numerators negated so positive EBITDA/GP divide by |revenue| = positive margin
      { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue", ...ec } },
      { id: "reported-margin", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...ec, ...mc((p) => {
        const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
        return -(calcReportedEBITDA(tb, p, ab) + isReclass);
      }, (p) => reclassAwareRevenueRaw(tb, rc, p)) } },
      { id: "adj-margin", type: "data", format: "percent", cells: {
        label: "Adjusted EBITDA margin",
        ...ec,
        ...mc((p) => {
          const isReclass = sumReclassImpact(rc, "Revenue", p) + sumReclassImpact(rc, "Cost of Goods Sold", p) + sumReclassImpact(rc, "Operating expenses", p) + sumReclassImpact(rc, "Payroll & Related", p) + sumReclassImpact(rc, "Other expense (income)", p);
          return -(calcReportedEBITDA(tb, p, ab) + isReclass - calcAdjustmentTotal(adj, "all", p));
        }, (p) => reclassAwareRevenueRaw(tb, rc, p))
      } },
      { id: "s-pct", type: "spacer", cells: {} },
      // Reclassification Adjustments
      ...dealData.reclassifications.length > 0 ? [
        { id: "hdr-reclass", type: "section-header", label: "Reclassification Adjustments", cells: { label: "Reclassification Adjustments", ...ec } },
        ...dealData.reclassifications.map((r, i) => ({
          id: `reclass-${r.id}`,
          type: "data",
          indent: 1,
          cells: {
            label: `R-${i + 1}: ${r.label} (${r.fromAccount} → ${r.toAccount})`,
            adjNo: `R-${i + 1}`,
            adjType: "RC",
            acctNo: r.fromAccount,
            acctDesc: r.label,
            fsLine: "",
            sub1: "",
            sub2: "",
            sub3: "",
            comments: "",
            ...adjustmentCells(dealData, r.amounts)
          }
        })),
        { id: "reclass-total", type: "subtotal", cells: {
          label: "Total reclassification",
          ...ec,
          ...pc((p) => dealData.reclassifications.reduce((s, r) => s + (r.amounts[p] || 0), 0))
        } },
        { id: "s7", type: "spacer", cells: {} }
      ] : [],
      // Check row
      { id: "hdr-checks", type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } },
      {
        id: "check-qoe",
        type: "check",
        cells: {
          label: "Check (should = 0)",
          ...ec,
          ...pc((p) => {
            const qoeReported = calcReportedEBITDA(tb, p, ab);
            const isNetIncome = calcNetIncome(tb, p);
            const isAddbacks = calcInterestExpense(tb, p, ab.interest) + calcIncomeTaxExpense(tb, p, ab.taxes) + calcDepreciationExpense(tb, p, ab.depreciation);
            const isReported = isNetIncome - isAddbacks;
            return Math.abs(qoeReported - isReported) < 0.01 ? 0 : qoeReported - isReported;
          })
        },
        checkPassed: true
      }
    ];
    return { columns, rows, frozenColumns: 9 };
  }, [dealData]);
  return /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData });
}
export {
  QoEAnalysisTab
};
