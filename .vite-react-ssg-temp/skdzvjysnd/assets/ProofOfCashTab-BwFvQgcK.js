import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { S as SpreadsheetGrid } from "./SpreadsheetGrid-Br3kGZEk.js";
import { aD as buildStandardColumns, aw as negatedPeriodCells, ax as periodCells, N as sumByLineItem, aj as calcCOGS, ak as calcOpEx, al as calcPayroll, a2 as calcTotalCurrentLiabilities, aH as bsEndingBalanceCells, aL as calcUndepositedFunds, an as calcDepreciationExpense, am as calcOtherExpense, F as calcRevenue, H as calcNetIncome } from "./sanitizeWizardData-nrsUY-BP.js";
import { u as useProofOfCashData, a as useTransferClassification, T as TransferReviewDialog } from "./TransferReviewDialog-B-GWAqVw.js";
import { B as Button } from "../main.mjs";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { CheckCircle } from "lucide-react";
import "@tanstack/react-virtual";
import "@tanstack/react-query";
import "./dialog-sNpTUd89.js";
import "@radix-ui/react-dialog";
import "./tabs-dhx4sETc.js";
import "@radix-ui/react-tabs";
import "./table-CVoj8f5R.js";
import "./select-CXC355eQ.js";
import "@radix-ui/react-select";
import "./checkbox-3bpvUXl3.js";
import "@radix-ui/react-checkbox";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "./popover-C93YiWo6.js";
import "@radix-ui/react-popover";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
function ProofOfCashTab({ dealData, mockBankStatements, mockTransferClassifications }) {
  const isMock = !!mockBankStatements;
  const { bankStatements: liveBankStatements, isLoading } = useProofOfCashData(isMock ? void 0 : dealData.deal.projectId);
  const { classifications: liveClassifications, approvedClassifications: liveApproved, rawData, isLoading: classLoading, classify, isClassifying, updateClassifications, cases: transferCases, pendingCaseCount, excludedOperatingCount } = useTransferClassification(isMock ? void 0 : dealData.deal.projectId);
  const bankStatements = isMock ? mockBankStatements ?? [] : liveBankStatements;
  const classifications = isMock ? mockTransferClassifications ?? null : liveApproved && liveApproved.size > 0 ? liveApproved : null;
  const [reviewOpen, setReviewOpen] = useState(false);
  const bankByPeriod = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const stmt of bankStatements) {
      if (!stmt.periodStart) continue;
      const key = stmt.periodStart.substring(0, 7);
      const existing = map.get(key);
      if (existing) {
        existing.openingBalance += stmt.summary.openingBalance ?? 0;
        existing.closingBalance += stmt.summary.closingBalance ?? 0;
        existing.totalCredits += stmt.summary.totalCredits ?? 0;
        existing.totalDebits += stmt.summary.totalDebits ?? 0;
      } else {
        map.set(key, {
          openingBalance: stmt.summary.openingBalance ?? 0,
          closingBalance: stmt.summary.closingBalance ?? 0,
          totalCredits: stmt.summary.totalCredits ?? 0,
          totalDebits: stmt.summary.totalDebits ?? 0
        });
      }
    }
    return map;
  }, [bankStatements]);
  const gridData = useMemo(() => {
    const tb = dealData.trialBalance;
    const bc = (fn) => bsEndingBalanceCells(dealData, fn);
    const pc = (fn) => periodCells(dealData, fn);
    const npc = (fn) => negatedPeriodCells(dealData, fn);
    const { periods, aggregatePeriods } = dealData.deal;
    const columns = buildStandardColumns(dealData, "Proof of Cash", { labelWidth: 280 });
    const bankCells = (field) => {
      const cells = {};
      for (const p of periods) {
        cells[p.id] = bankByPeriod.get(p.id)?.[field] ?? 0;
      }
      for (const ap of aggregatePeriods) {
        if (field === "openingBalance") {
          const firstId = ap.monthPeriodIds[0];
          cells[ap.id] = firstId ? bankByPeriod.get(firstId)?.[field] ?? 0 : 0;
        } else if (field === "closingBalance") {
          const lastId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
          cells[ap.id] = lastId ? bankByPeriod.get(lastId)?.[field] ?? 0 : 0;
        } else {
          let sum = 0;
          for (const mpid of ap.monthPeriodIds) {
            sum += bankByPeriod.get(mpid)?.[field] ?? 0;
          }
          cells[ap.id] = sum;
        }
      }
      return cells;
    };
    const classificationCells = (field) => {
      if (!classifications) return {};
      const cells = {};
      for (const p of periods) {
        cells[p.id] = classifications.get(p.id)?.[field] ?? 0;
      }
      for (const ap of aggregatePeriods) {
        let sum = 0;
        for (const mpid of ap.monthPeriodIds) {
          sum += classifications.get(mpid)?.[field] ?? 0;
        }
        cells[ap.id] = sum;
      }
      return cells;
    };
    const bsChangeCells = (calcFn) => {
      const cells = {};
      for (let i = 0; i < periods.length; i++) {
        const curr = calcFn(tb, periods[i].id);
        const prev = i > 0 ? calcFn(tb, periods[i - 1].id) : 0;
        cells[periods[i].id] = curr - prev;
      }
      for (const ap of aggregatePeriods) {
        const firstPid = ap.monthPeriodIds[0];
        const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
        const idx = periods.findIndex((pp) => pp.id === firstPid);
        const beginVal = idx > 0 ? calcFn(tb, periods[idx - 1].id) : 0;
        const endVal = lastPid ? calcFn(tb, lastPid) : 0;
        cells[ap.id] = endVal - beginVal;
      }
      return cells;
    };
    const totalCredits = bankCells("totalCredits");
    const totalDebits = bankCells("totalDebits");
    const interbankNet = classificationCells("interbank");
    const interbankIn = classificationCells("interbankIn");
    const interbankOut = classificationCells("interbankOut");
    const ownerOut = classificationCells("owner");
    const debtOut = classificationCells("debt_service");
    const capexOut = classificationCells("capex");
    const taxOut = classificationCells("tax_payments");
    const opReceiptsCells = {};
    for (const key of Object.keys(totalCredits)) {
      opReceiptsCells[key] = (totalCredits[key] ?? 0) - (interbankIn[key] ?? 0);
    }
    const opDisbursementsCells = {};
    for (const key of Object.keys(totalDebits)) {
      opDisbursementsCells[key] = (totalDebits[key] ?? 0) - (interbankOut[key] ?? 0) - (ownerOut[key] ?? 0) - (debtOut[key] ?? 0) - (taxOut[key] ?? 0) - (capexOut[key] ?? 0);
    }
    const revenueCells = npc((p) => calcRevenue(tb, p));
    const expensesCells = pc(
      (p) => calcCOGS(tb, p) + calcOpEx(tb, p) + calcPayroll(tb, p)
    );
    const receiptsVarianceCells = {};
    for (const key of Object.keys(revenueCells)) {
      if (key === "label") continue;
      receiptsVarianceCells[key] = revenueCells[key] - (opReceiptsCells[key] ?? 0);
    }
    let arChangeCells = bsChangeCells((tb2, p) => sumByLineItem(tb2, "Accounts receivable", p));
    const arAllZero = Object.values(arChangeCells).every((v) => v === 0);
    if (arAllZero && !isMock) {
      const c2aRaw = rawData?._cash_to_accrual;
      if (c2aRaw) {
        const c2aPeriods = Array.isArray(c2aRaw.periods) ? c2aRaw.periods : [];
        const backendAr = {};
        let hasBackendAr = false;
        for (const p of c2aPeriods) {
          const key = p.period_key ?? p.period;
          const arVal = p.receipts?.ar_change ?? p.ar_change;
          if (key && arVal != null) {
            backendAr[key] = arVal;
            hasBackendAr = true;
          }
        }
        if (hasBackendAr) {
          for (const p of periods) {
            if (backendAr[p.id] != null) arChangeCells[p.id] = backendAr[p.id];
          }
          for (const ap of aggregatePeriods) {
            let sum = 0;
            for (const mpid of ap.monthPeriodIds) sum += arChangeCells[mpid] ?? 0;
            arChangeCells[ap.id] = sum;
          }
        }
      }
    }
    const undepChangeCells = bsChangeCells((tb2, p) => calcUndepositedFunds(tb2, p));
    const ocaChangeCells = bsChangeCells((tb2, p) => sumByLineItem(tb2, "Other current assets", p));
    const receiptsResidualCells = {};
    let receiptsAllTied = true;
    for (const key of Object.keys(receiptsVarianceCells)) {
      const residual = (receiptsVarianceCells[key] ?? 0) - (arChangeCells[key] ?? 0) - (undepChangeCells[key] ?? 0) - (ocaChangeCells[key] ?? 0);
      receiptsResidualCells[key] = residual;
      if (Math.abs(residual) > 0.5) receiptsAllTied = false;
    }
    const disbVarianceCells = {};
    for (const key of Object.keys(expensesCells)) {
      if (key === "label") continue;
      disbVarianceCells[key] = expensesCells[key] - (opDisbursementsCells[key] ?? 0);
    }
    const apChangeCells = bsChangeCells((tb2, p) => calcTotalCurrentLiabilities(tb2, p));
    const negApChangeCells = {};
    for (const key of Object.keys(apChangeCells)) {
      negApChangeCells[key] = -(apChangeCells[key] ?? 0);
    }
    const daCells = pc((p) => calcDepreciationExpense(tb, p, dealData.addbacks?.depreciation));
    const otherExpCells = pc((p) => calcOtherExpense(tb, p));
    const disbResidualCells = {};
    let disbAllTied = true;
    for (const key of Object.keys(disbVarianceCells)) {
      const residual = (disbVarianceCells[key] ?? 0) - (negApChangeCells[key] ?? 0) - (daCells[key] ?? 0) - (otherExpCells[key] ?? 0);
      disbResidualCells[key] = residual;
      if (Math.abs(residual) > 0.5) disbAllTied = false;
    }
    const glEndingCells = bc((p) => sumByLineItem(tb, "Cash and cash equivalents", p));
    const bankEndingCells = bankCells("closingBalance");
    const undepEndingCells = bc((p) => calcUndepositedFunds(tb, p));
    const adjustedGlCells = {};
    for (const key of Object.keys(glEndingCells)) {
      if (key === "label") continue;
      adjustedGlCells[key] = glEndingCells[key] - undepEndingCells[key];
    }
    const legacyVarianceCells = {};
    for (const key of Object.keys(glEndingCells)) {
      if (key === "label") continue;
      const v = glEndingCells[key] - bankEndingCells[key];
      legacyVarianceCells[key] = v;
    }
    const adjustedVarianceCells = {};
    let adjustedAllZero = true;
    for (const key of Object.keys(adjustedGlCells)) {
      const v = (adjustedGlCells[key] ?? 0) - (bankEndingCells[key] ?? 0);
      adjustedVarianceCells[key] = v;
      if (Math.abs(v) > 0.01) adjustedAllZero = false;
    }
    const nonOpTotalCells = {};
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(interbankNet), ...Object.keys(ownerOut), ...Object.keys(debtOut), ...Object.keys(capexOut), ...Object.keys(taxOut)]);
    for (const key of allKeys) {
      nonOpTotalCells[key] = (interbankNet[key] ?? 0) + (ownerOut[key] ?? 0) + (debtOut[key] ?? 0) + (capexOut[key] ?? 0) + (taxOut[key] ?? 0);
    }
    const rows = [
      // ══════ Section 1: Bank Activity — Receipts ══════
      { id: "hdr-receipts-bank", type: "section-header", label: "Bank Activity — Receipts", cells: { label: "Bank Activity — Receipts" } },
      { id: "dep-total", type: "data", cells: { label: "Total Deposits (Credits)", ...totalCredits } },
      { id: "less-interbank-in", type: "data", indent: 1, cells: { label: "Less: Interbank transfers in", ...interbankIn } },
      { id: "op-receipts", type: "subtotal", cells: { label: "Operating Cash Receipts", ...opReceiptsCells } },
      { id: "s1", type: "spacer", cells: {} },
      // ══════ Section 2: Receipts Reconciliation ══════
      { id: "hdr-receipts-recon", type: "section-header", label: "Receipts Reconciliation (Cash vs Accrual)", cells: { label: "Receipts Reconciliation (Cash vs Accrual)" } },
      { id: "recon-op-receipts", type: "data", cells: { label: "Operating Cash Receipts (Bank)", ...opReceiptsCells } },
      { id: "recon-revenue", type: "data", cells: { label: "Revenue per Income Statement", ...revenueCells } },
      { id: "recon-receipts-var", type: "subtotal", cells: { label: "Receipts Variance (Revenue − Receipts)", ...receiptsVarianceCells } },
      { id: "hdr-explained-r", type: "data", indent: 1, cells: { label: "Explained by:" } },
      { id: "recon-ar-change", type: "data", indent: 2, cells: { label: "Change in Accounts Receivable", ...arChangeCells } },
      { id: "recon-undep-change", type: "data", indent: 2, cells: { label: "Change in Undeposited Funds", ...undepChangeCells } },
      { id: "recon-oca-change", type: "data", indent: 2, cells: { label: "Change in Other Current Assets", ...ocaChangeCells } },
      { id: "recon-receipts-residual", type: "check", checkPassed: receiptsAllTied, cells: { label: "Receipts Residual", ...receiptsResidualCells } },
      { id: "s2", type: "spacer", cells: {} },
      // ══════ Section 3: Bank Activity — Disbursements ══════
      { id: "hdr-disb-bank", type: "section-header", label: "Bank Activity — Disbursements", cells: { label: "Bank Activity — Disbursements" } },
      { id: "disb-total", type: "data", cells: { label: "Total Withdrawals (Debits)", ...totalDebits } },
      { id: "less-interbank-out", type: "data", indent: 1, cells: { label: "Less: Interbank transfers out", ...interbankOut } },
      { id: "less-owner", type: "data", indent: 1, cells: { label: "Less: Owner draws", ...ownerOut } },
      { id: "less-debt", type: "data", indent: 1, cells: { label: "Less: Debt service", ...debtOut } },
      { id: "less-tax", type: "data", indent: 1, cells: { label: "Less: Tax payments", ...taxOut } },
      { id: "less-capex", type: "data", indent: 1, cells: { label: "Less: Capital expenditures", ...capexOut } },
      { id: "op-disbursements", type: "subtotal", cells: { label: "Operating Cash Disbursements", ...opDisbursementsCells } },
      { id: "s3", type: "spacer", cells: {} },
      // ══════ Section 4: Disbursements Reconciliation ══════
      { id: "hdr-disb-recon", type: "section-header", label: "Disbursements Reconciliation (Cash vs Accrual)", cells: { label: "Disbursements Reconciliation (Cash vs Accrual)" } },
      { id: "recon-op-disb", type: "data", cells: { label: "Operating Cash Disbursements (Bank)", ...opDisbursementsCells } },
      { id: "recon-expenses", type: "data", cells: { label: "Expenses per Income Statement", ...expensesCells } },
      { id: "recon-disb-var", type: "subtotal", cells: { label: "Disbursements Variance (Expenses − Disbursements)", ...disbVarianceCells } },
      { id: "hdr-explained-d", type: "data", indent: 1, cells: { label: "Explained by:" } },
      { id: "recon-ap-change", type: "data", indent: 2, cells: { label: "Change in Current Liabilities (AP)", ...negApChangeCells } },
      { id: "recon-da", type: "data", indent: 2, cells: { label: "Depreciation & Amortization (non-cash)", ...daCells } },
      { id: "recon-other-exp", type: "data", indent: 2, cells: { label: "Other Income / Non-operating Items", ...otherExpCells } },
      { id: "recon-disb-residual", type: "check", checkPassed: disbAllTied, cells: { label: "Disbursements Residual", ...disbResidualCells } },
      { id: "s4", type: "spacer", cells: {} },
      // ══════ Section 5: Non-Operating Flows (Reference) ══════
      { id: "hdr-nonop", type: "section-header", label: "Non-Operating Flows (Reference)", cells: { label: "Non-Operating Flows (Reference)" } },
      { id: "nonop-interbank", type: "data", indent: 1, cells: { label: "Interbank transfers (net)", ...interbankNet } },
      { id: "nonop-owner", type: "data", indent: 1, cells: { label: "Owner draws", ...ownerOut } },
      { id: "nonop-debt", type: "data", indent: 1, cells: { label: "Debt service", ...debtOut } },
      { id: "nonop-tax", type: "data", indent: 1, cells: { label: "Tax payments", ...taxOut } },
      { id: "nonop-capex", type: "data", indent: 1, cells: { label: "Capital expenditures", ...capexOut } },
      { id: "nonop-total", type: "subtotal", cells: { label: "Total non-operating flows", ...nonOpTotalCells } },
      { id: "s5", type: "spacer", cells: {} },
      // ══════ Section 6: GL vs Bank Variance ══════
      { id: "hdr-legacy", type: "section-header", label: "GL vs Bank Variance", cells: { label: "GL vs Bank Variance" } },
      { id: "gl-ending", type: "data", cells: { label: "GL Ending Cash", ...glEndingCells } },
      { id: "less-undep-bal", type: "data", indent: 1, cells: { label: "Less: Undeposited Funds Balance", ...undepEndingCells } },
      { id: "adjusted-gl", type: "subtotal", cells: { label: "Adjusted GL Cash", ...adjustedGlCells } },
      { id: "bank-ending-var", type: "data", cells: { label: "Bank Ending Balance", ...bankEndingCells } },
      { id: "legacy-variance", type: "data", cells: { label: "Unadjusted Variance (GL − Bank)", ...legacyVarianceCells } },
      { id: "adjusted-variance", type: "check", checkPassed: adjustedAllZero, cells: { label: "Adjusted Variance", ...adjustedVarianceCells } },
      { id: "net-income", type: "data", cells: { label: "Net Income per IS", ...npc((p) => calcNetIncome(tb, p)) } }
    ];
    return { columns, rows, frozenColumns: 1 };
  }, [dealData, bankByPeriod, classifications, rawData, isMock]);
  if (!isMock && (isLoading || classLoading)) {
    return /* @__PURE__ */ jsx("div", { className: "p-4 text-muted-foreground", children: "Loading bank statement data…" });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
    !isMock && !classifications && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "AI can classify interbank and owner transfers from your bank transactions." }),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "sm",
          variant: "outline",
          onClick: () => {
            import("../main.mjs").then((n) => n.w).then(({ toast }) => toast({ title: "Classification started" }));
            classify().catch((e) => {
              import("../main.mjs").then((n) => n.w).then(({ toast }) => toast({ title: "Classification failed", description: e?.message || "Unknown error", variant: "destructive" }));
            });
          },
          disabled: isClassifying,
          children: isClassifying ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Spinner, { className: "mr-2 h-3 w-3" }),
            "Classifying…"
          ] }) : "Classify Transfers"
        }
      )
    ] }),
    !isMock && (classifications || liveClassifications) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 py-2 border-b border-border bg-accent/30", children: [
      /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "gap-1 shrink-0", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3" }),
        "Classified"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground flex-1", children: [
        "AI transfer classification complete.",
        pendingCaseCount > 0 && /* @__PURE__ */ jsxs("span", { className: "text-destructive font-medium ml-1", children: [
          pendingCaseCount,
          " case",
          pendingCaseCount !== 1 ? "s" : "",
          " pending review — excluded from totals."
        ] }),
        pendingCaseCount === 0 && excludedOperatingCount > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
          excludedOperatingCount,
          " operating cluster",
          excludedOperatingCount !== 1 ? "s" : "",
          " auto-excluded."
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "sm",
          variant: "ghost",
          onClick: () => {
            import("../main.mjs").then((n) => n.w).then(({ toast }) => toast({ title: "Re-run started" }));
            classify().catch((e) => {
              import("../main.mjs").then((n) => n.w).then(({ toast }) => toast({ title: "Re-run failed", description: e?.message || "Unknown error", variant: "destructive" }));
            });
          },
          disabled: isClassifying,
          className: "gap-1.5",
          children: isClassifying ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Spinner, { className: "h-3 w-3" }),
            "Classifying…"
          ] }) : "Re-run"
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          variant: "outline",
          onClick: () => setReviewOpen(true),
          className: "gap-1.5",
          children: [
            "Review & Approve",
            pendingCaseCount > 0 && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "ml-1 h-4 min-w-[18px] text-[10px] px-1", children: pendingCaseCount })
          ]
        }
      )
    ] }),
    isMock && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30", children: /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Demo mode — mock bank statement data. Owner transfers: $3,500/mo." }) }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0", children: /* @__PURE__ */ jsx(SpreadsheetGrid, { data: gridData }) }),
    !isMock && /* @__PURE__ */ jsx(
      TransferReviewDialog,
      {
        open: reviewOpen,
        onOpenChange: setReviewOpen,
        rawData: rawData ?? null,
        cases: transferCases,
        onSave: updateClassifications
      }
    )
  ] });
}
export {
  ProofOfCashTab
};
