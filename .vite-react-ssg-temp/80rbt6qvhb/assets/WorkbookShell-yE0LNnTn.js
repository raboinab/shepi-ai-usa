import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useCallback, Suspense, lazy } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { B as Button, m as cn } from "../main.mjs";
import { W as WORKBOOK_TABS } from "./exportWorkbookXlsx-Cd_42-fY.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { u as useAdjustmentProofs } from "./useAdjustmentProofs-BvjUM7OL.js";
const SetupTab = lazy(() => import("./SetupTab-ySl3tDXl.js").then((m) => ({ default: m.SetupTab })));
const TrialBalanceTab = lazy(() => import("./TrialBalanceTab-CSBMVQWn.js").then((m) => ({ default: m.TrialBalanceTab })));
const QoEAnalysisTab = lazy(() => import("./QoEAnalysisTab-evaMljSP.js").then((m) => ({ default: m.QoEAnalysisTab })));
const DDAdjustmentsTab = lazy(() => import("./DDAdjustmentsTab-CZ24zXJf.js").then((m) => ({ default: m.DDAdjustmentsTab })));
const IncomeStatementTab = lazy(() => import("./IncomeStatementTab-BDSuiN9e.js").then((m) => ({ default: m.IncomeStatementTab })));
const ISDetailedTab = lazy(() => import("./ISDetailedTab-CFSofdrW.js").then((m) => ({ default: m.ISDetailedTab })));
const BalanceSheetTab = lazy(() => import("./BalanceSheetTab-Dg-KAHM8.js").then((m) => ({ default: m.BalanceSheetTab })));
const BSDetailedTab = lazy(() => import("./BSDetailedTab-BiaEMHVM.js").then((m) => ({ default: m.BSDetailedTab })));
const SalesTab = lazy(() => import("./SalesTab-BEM350nV.js").then((m) => ({ default: m.SalesTab })));
const COGSTab = lazy(() => import("./COGSTab-P71kwcQC.js").then((m) => ({ default: m.COGSTab })));
const OpExTab = lazy(() => import("./OpExTab-C1e4Lt5D.js").then((m) => ({ default: m.OpExTab })));
const OtherExpenseTab = lazy(() => import("./OtherExpenseTab-DUEq0EX8.js").then((m) => ({ default: m.OtherExpenseTab })));
const PayrollTab = lazy(() => import("./PayrollTab-uoDg9Pkk.js").then((m) => ({ default: m.PayrollTab })));
const WorkingCapitalTab = lazy(() => import("./WorkingCapitalTab-BWJ1d7Vi.js").then((m) => ({ default: m.WorkingCapitalTab })));
const NWCAnalysisTab = lazy(() => import("./NWCAnalysisTab-DxgK6ABD.js").then((m) => ({ default: m.NWCAnalysisTab })));
const CashTab = lazy(() => import("./CashTab-BkosT5gW.js").then((m) => ({ default: m.CashTab })));
const ARAgingTab = lazy(() => import("./ARAgingTab-DjWcLvN-.js").then((m) => ({ default: m.ARAgingTab })));
const OtherCurrentAssetsTab = lazy(() => import("./OtherCurrentAssetsTab-3_bZRWIA.js").then((m) => ({ default: m.OtherCurrentAssetsTab })));
const FixedAssetsTab = lazy(() => import("./FixedAssetsTab-BUfzUM0z.js").then((m) => ({ default: m.FixedAssetsTab })));
const APAgingTab = lazy(() => import("./APAgingTab-Di-DgGHD.js").then((m) => ({ default: m.APAgingTab })));
const OtherCurrentLiabilitiesTab = lazy(() => import("./OtherCurrentLiabilitiesTab-DgE0pwjv.js").then((m) => ({ default: m.OtherCurrentLiabilitiesTab })));
const SupplementaryTab = lazy(() => import("./SupplementaryTab-DmAbxaXp.js").then((m) => ({ default: m.SupplementaryTab })));
const TopCustomersTab = lazy(() => import("./TopCustomersTab-BeiWEUq0.js").then((m) => ({ default: m.TopCustomersTab })));
const TopVendorsTab = lazy(() => import("./TopVendorsTab-BuMMCT5e.js").then((m) => ({ default: m.TopVendorsTab })));
const ProofOfCashTab = lazy(() => import("./ProofOfCashTab-BwFvQgcK.js").then((m) => ({ default: m.ProofOfCashTab })));
const FreeCashFlowTab = lazy(() => import("./FreeCashFlowTab-DWfiBFip.js").then((m) => ({ default: m.FreeCashFlowTab })));
const ISBSReconciliationTab = lazy(() => import("./ISBSReconciliationTab-BBKIMXND.js").then((m) => ({ default: m.ISBSReconciliationTab })));
const WIPScheduleTab = lazy(() => import("./WIPScheduleTab-C3LNGMJx.js").then((m) => ({ default: m.WIPScheduleTab })));
function DDAdjustments1Tab(props) {
  return /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(TabFallback, {}), children: /* @__PURE__ */ jsx(DDAdjustmentsTab, { ...props, tabIndex: 1, proofMap: props.proofMap }) });
}
function DDAdjustments2Tab(props) {
  return /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(TabFallback, {}), children: /* @__PURE__ */ jsx(DDAdjustmentsTab, { ...props, tabIndex: 2, proofMap: props.proofMap }) });
}
function TabFallback() {
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsx(Spinner, { className: "h-6 w-6 text-muted-foreground" }) });
}
const TAB_COMPONENTS = {
  "setup": SetupTab,
  "trial-balance": TrialBalanceTab,
  "qoe-analysis": QoEAnalysisTab,
  "is-bs-reconciliation": ISBSReconciliationTab,
  "dd-adjustments-1": DDAdjustments1Tab,
  "dd-adjustments-2": DDAdjustments2Tab,
  "income-statement": IncomeStatementTab,
  "is-detailed": ISDetailedTab,
  "balance-sheet": BalanceSheetTab,
  "bs-detailed": BSDetailedTab,
  "sales": SalesTab,
  "cogs": COGSTab,
  "opex": OpExTab,
  "other-expense": OtherExpenseTab,
  "payroll": PayrollTab,
  "working-capital": WorkingCapitalTab,
  "nwc-analysis": NWCAnalysisTab,
  "cash": CashTab,
  "ar-aging": ARAgingTab,
  "other-current-assets": OtherCurrentAssetsTab,
  "fixed-assets": FixedAssetsTab,
  "ap-aging": APAgingTab,
  "other-current-liabilities": OtherCurrentLiabilitiesTab,
  "supplementary": SupplementaryTab,
  "top-customers": TopCustomersTab,
  "top-vendors": TopVendorsTab,
  "proof-of-cash": ProofOfCashTab,
  "free-cash-flow": FreeCashFlowTab,
  "wip-schedule": WIPScheduleTab
};
function WorkbookShell({ dealData, onDataChange, saving, onExport, mockBankStatements, mockTransferClassifications, onActiveTabChange, projectId }) {
  const [activeTab, setActiveTab] = useState(WORKBOOK_TABS[0].id);
  const tabStripRef = useRef(null);
  const { proofMap } = useAdjustmentProofs(projectId);
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    onActiveTabChange?.(tabId);
  }, [onActiveTabChange]);
  const scrollTabs = useCallback((direction) => {
    if (!tabStripRef.current) return;
    const scrollAmount = 200;
    tabStripRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  }, []);
  const ActiveComponent = TAB_COMPONENTS[activeTab];
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-card", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-1.5 border-b border-border bg-card", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: dealData.deal.targetCompany || dealData.deal.projectName }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "QoE Workbook" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        saving !== void 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground mr-2", children: saving ? "Saving..." : "Saved" }),
        onExport && /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: onExport, className: "gap-1 h-7 text-xs", children: [
          /* @__PURE__ */ jsx(Download, { className: "w-3 h-3" }),
          "Export XLSX"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto p-3", children: /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(TabFallback, {}), children: ActiveComponent ? activeTab === "proof-of-cash" ? /* @__PURE__ */ jsx(
      ProofOfCashTab,
      {
        dealData,
        onDataChange,
        mockBankStatements,
        mockTransferClassifications
      }
    ) : activeTab === "dd-adjustments-1" || activeTab === "dd-adjustments-2" ? /* @__PURE__ */ jsx(ActiveComponent, { dealData, onDataChange, proofMap }) : /* @__PURE__ */ jsx(ActiveComponent, { dealData, onDataChange }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full text-muted-foreground", children: "Select a tab to view data" }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center border-t border-border bg-[hsl(var(--excel-header-bg,220_14%_96%))]", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "h-7 w-7 shrink-0",
          onClick: () => scrollTabs("left"),
          children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-3 h-3" })
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          ref: tabStripRef,
          className: "flex-1 flex overflow-x-auto scrollbar-none",
          style: { scrollbarWidth: "none" },
          children: WORKBOOK_TABS.map((tab) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleTabChange(tab.id),
              className: cn(
                "excel-tab px-3 py-1.5 text-xs whitespace-nowrap border-r border-[hsl(var(--excel-grid,220_13%_91%))] transition-colors",
                activeTab === tab.id ? "excel-tab-active bg-card font-semibold text-foreground border-t-2 border-t-primary" : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
              ),
              children: tab.label
            },
            tab.id
          ))
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "h-7 w-7 shrink-0",
          onClick: () => scrollTabs("right"),
          children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" })
        }
      )
    ] })
  ] });
}
export {
  WorkbookShell as W
};
