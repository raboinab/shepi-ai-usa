import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { C as Card, f as CardContent, b as CardHeader, d as CardTitle, e as CardDescription, B as Button } from "../main.mjs";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { S as SpreadsheetReportViewer } from "./SpreadsheetReportViewer-BBrix0D8.js";
import { useState } from "react";
import { C as Checkbox } from "./checkbox-3bpvUXl3.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { AlertCircle, RefreshCw, Plus, X, DollarSign, Briefcase, Users, TrendingUp } from "lucide-react";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "date-fns";
import "@radix-ui/react-checkbox";
const PAYROLL_KEYWORDS = [
  "salary",
  "salaries",
  "wage",
  "wages",
  "payroll",
  "compensation",
  "bonus",
  "bonuses",
  "commission",
  "officer",
  "staff",
  "personnel",
  "employee",
  "benefits",
  "401k",
  "401(k)",
  "retirement",
  "pension",
  "health insurance",
  "medical",
  "dental",
  "vision",
  "fica",
  "medicare",
  "futa",
  "suta",
  "unemployment",
  "workers comp",
  "workman",
  "pto",
  "sick pay",
  "vacation pay",
  "employer contribution"
];
function isPotentialPayrollAccount(account) {
  if (account.fsType !== "IS") return false;
  if (account.subAccount1 === "Payroll & Related") return false;
  if (account.payrollDismissed === true) return false;
  const nameLower = (account.accountName || "").toLowerCase();
  return PAYROLL_KEYWORDS.some((kw) => nameLower.includes(kw));
}
const PayrollClassificationHelper = ({
  trialBalanceAccounts,
  onTrialBalanceChange
}) => {
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  const unclassifiedPayrollAccounts = trialBalanceAccounts.filter(isPotentialPayrollAccount);
  const classifiedPayrollAccounts = trialBalanceAccounts.filter(
    (acc) => acc.subAccount1 === "Payroll & Related"
  );
  const handleAddToPayroll = (accountId) => {
    const updated = trialBalanceAccounts.map(
      (acc) => acc.id === accountId ? { ...acc, subAccount1: "Payroll & Related" } : acc
    );
    onTrialBalanceChange(updated);
  };
  const handleAddSelected = () => {
    if (selectedIds.size === 0) return;
    const updated = trialBalanceAccounts.map(
      (acc) => selectedIds.has(acc.id) ? { ...acc, subAccount1: "Payroll & Related" } : acc
    );
    onTrialBalanceChange(updated);
    setSelectedIds(/* @__PURE__ */ new Set());
  };
  const handleAddAll = () => {
    const updated = trialBalanceAccounts.map(
      (acc) => isPotentialPayrollAccount(acc) ? { ...acc, subAccount1: "Payroll & Related" } : acc
    );
    onTrialBalanceChange(updated);
  };
  const handleDismiss = (accountId) => {
    const updated = trialBalanceAccounts.map(
      (acc) => acc.id === accountId ? { ...acc, payrollDismissed: true } : acc
    );
    onTrialBalanceChange(updated);
  };
  const handleDismissSelected = () => {
    if (selectedIds.size === 0) return;
    const updated = trialBalanceAccounts.map(
      (acc) => selectedIds.has(acc.id) ? { ...acc, payrollDismissed: true } : acc
    );
    onTrialBalanceChange(updated);
    setSelectedIds(/* @__PURE__ */ new Set());
  };
  const toggleSelection = (accountId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedIds(newSelected);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === unclassifiedPayrollAccounts.length) {
      setSelectedIds(/* @__PURE__ */ new Set());
    } else {
      setSelectedIds(new Set(unclassifiedPayrollAccounts.map((a) => a.id)));
    }
  };
  if (unclassifiedPayrollAccounts.length === 0) {
    if (classifiedPayrollAccounts.length === 0) {
      return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-8 text-center", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-10 h-10 mx-auto mb-3 text-muted-foreground/50" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No payroll-related accounts found in the Trial Balance." }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Import QuickBooks data or check that expense accounts exist in the Trial Balance." })
      ] }) });
    }
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 text-primary" }),
        /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Account Classification" })
      ] }),
      /* @__PURE__ */ jsxs(CardDescription, { children: [
        "All detected payroll accounts are classified. (",
        classifiedPayrollAccounts.length,
        " accounts)"
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Account Classification" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          selectedIds.size > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: handleAddSelected, className: "gap-1", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
              "Add Selected (",
              selectedIds.size,
              ")"
            ] }),
            /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: handleDismissSelected, className: "gap-1", children: [
              /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }),
              "Dismiss Selected"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: handleAddAll, children: [
            "Add All (",
            unclassifiedPayrollAccounts.length,
            ")"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { children: "These accounts may be payroll-related but aren't classified. Add them to include in the Payroll report." })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { children: [
      /* @__PURE__ */ jsx("div", { className: "border rounded-md overflow-hidden", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "bg-muted/50", children: [
          /* @__PURE__ */ jsx(TableHead, { className: "w-10", children: /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: selectedIds.size === unclassifiedPayrollAccounts.length,
              onCheckedChange: toggleSelectAll,
              "aria-label": "Select all"
            }
          ) }),
          /* @__PURE__ */ jsx(TableHead, { children: "Account Name" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Account #" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Current Classification" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-24 text-right", children: "Action" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: unclassifiedPayrollAccounts.map((account) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
            Checkbox,
            {
              checked: selectedIds.has(account.id),
              onCheckedChange: () => toggleSelection(account.id),
              "aria-label": `Select ${account.accountName}`
            }
          ) }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: account.accountName }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground", children: account.accountNumber || "—" }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-normal", children: account.subAccount1 || "Unclassified" }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-1", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => handleAddToPayroll(account.id),
                className: "h-7 px-2 text-xs",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3 mr-1" }),
                  "Add"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "ghost",
                onClick: () => handleDismiss(account.id),
                className: "h-7 px-2 text-xs text-muted-foreground hover:text-destructive",
                children: [
                  /* @__PURE__ */ jsx(X, { className: "w-3 h-3 mr-1" }),
                  "Dismiss"
                ]
              }
            )
          ] }) })
        ] }, account.id)) })
      ] }) }),
      classifiedPayrollAccounts.length > 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-3", children: [
        classifiedPayrollAccounts.length,
        ' account(s) already classified as "Payroll & Related"'
      ] })
    ] })
  ] });
};
const parseSheetNumber = (value) => {
  if (!value || typeof value !== "string") return 0;
  const clean = value.replace(/[$,]/g, "").trim();
  const isNegative = clean.includes("(") || clean.startsWith("-");
  const num = parseFloat(clean.replace(/[()$-]/g, ""));
  return isNaN(num) ? 0 : isNegative ? -num : num;
};
const extractMetrics = (rawData) => {
  if (!rawData || rawData.length === 0) {
    return { totalPayroll: 0, payrollTaxRate: 0, benefitRate: 0, ownerComp: 0 };
  }
  let totalPayroll = 0;
  let salaryWages = 0;
  let payrollTaxes = 0;
  let benefits = 0;
  let ownerComp = 0;
  for (const row of rawData) {
    const label = (row[0] || "").toLowerCase();
    const lastValue = row.length > 1 ? parseSheetNumber(row[row.length - 1]) : 0;
    if (label.includes("total payroll") || label.includes("total salary") || label === "total") {
      totalPayroll = lastValue;
    }
    if (label.includes("salary") || label.includes("wages")) {
      salaryWages += lastValue;
    }
    if (label.includes("payroll tax") || label.includes("fica") || label.includes("medicare") || label.includes("futa") || label.includes("suta")) {
      payrollTaxes += lastValue;
    }
    if (label.includes("benefit") || label.includes("health") || label.includes("401k") || label.includes("retirement")) {
      benefits += lastValue;
    }
    if (label.includes("officer") || label.includes("owner")) {
      ownerComp += lastValue;
    }
  }
  const base = salaryWages || totalPayroll;
  const payrollTaxRate = base > 0 ? payrollTaxes / base * 100 : 0;
  const benefitRate = base > 0 ? benefits / base * 100 : 0;
  return {
    totalPayroll: totalPayroll || salaryWages + payrollTaxes + benefits,
    payrollTaxRate,
    benefitRate,
    ownerComp
  };
};
const PayrollSection = ({
  data,
  periods = [],
  fiscalYearEnd = 12,
  projectId,
  trialBalanceAccounts = [],
  onTrialBalanceChange
}) => {
  const hasRawData = data?.rawData && data.rawData.length > 0;
  const metrics = extractMetrics(data?.rawData);
  const classifiedCount = trialBalanceAccounts.filter(
    (acc) => acc.subAccount1 === "Payroll & Related"
  ).length;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Payroll & Related" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: 'Payroll expenses aggregated from Trial Balance accounts classified as "Payroll & Related"' })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Total Payroll (LTM)",
          value: metrics.totalPayroll,
          icon: DollarSign
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Payroll Tax Rate",
          value: `${metrics.payrollTaxRate.toFixed(1)}%`,
          icon: Briefcase,
          subtitle: "% of wages"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Benefit Rate",
          value: `${metrics.benefitRate.toFixed(1)}%`,
          icon: Users,
          subtitle: "% of wages"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Owner Compensation",
          value: metrics.ownerComp,
          icon: TrendingUp
        }
      )
    ] }),
    trialBalanceAccounts.length > 0 && onTrialBalanceChange && /* @__PURE__ */ jsx(
      PayrollClassificationHelper,
      {
        trialBalanceAccounts,
        onTrialBalanceChange
      }
    ),
    hasRawData ? /* @__PURE__ */ jsx(
      SpreadsheetReportViewer,
      {
        rawData: data.rawData,
        title: "Payroll & Related Report",
        syncedAt: data.syncedAt
      }
    ) : /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Payroll Report" }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "py-8 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: classifiedCount > 0 ? `${classifiedCount} account(s) classified as "Payroll & Related". Sync from the spreadsheet to view the aggregated report.` : "No payroll data available. Classify Trial Balance accounts above, then sync from the spreadsheet." }) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: 'The Payroll report is calculated by the spreadsheet from Trial Balance accounts where subAccount1 = "Payroll & Related". Use the classification helper above to ensure all payroll-related accounts are included.' })
  ] });
};
export {
  PayrollSection
};
