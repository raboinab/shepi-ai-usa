import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { PieChart, Percent, BarChart3 } from "lucide-react";
import { N as sumByLineItem, a1 as calcTotalCurrentAssets, ab as calcTotalAssets, a2 as calcTotalCurrentLiabilities, ad as calcTotalLiabilities, ae as calcTotalEquity, F as calcRevenue, aj as calcCOGS, G as calcGrossProfit, ak as calcOpEx, al as calcPayroll, am as calcOtherExpense, H as calcNetIncome, aq as calcOperatingIncome, ar as calcEBITDA, as as calcInterestExpense } from "./sanitizeWizardData-nrsUY-BP.js";
import { S as SpreadsheetReportViewer } from "./SpreadsheetReportViewer-BBrix0D8.js";
import "vite-react-ssg";
import "react";
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
import "@radix-ui/react-tabs";
import "./badge-BbLwm7hH.js";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "date-fns";
const AnalysisReportsSection = ({ dealData, nwcReportData }) => {
  const tb = dealData?.trialBalance || [];
  const lastPeriod = dealData?.deal.periods[dealData.deal.periods.length - 1];
  const pid = lastPeriod?.id || "";
  const latestFY = dealData?.deal.fiscalYears?.[dealData.deal.fiscalYears.length - 1];
  const fyPeriodIds = latestFY?.periods.map((p) => p.id) || (pid ? [pid] : []);
  const sumFY = (fn) => fyPeriodIds.reduce((sum, id) => sum + fn(id), 0);
  const totalRevenue = -sumFY((id) => calcRevenue(tb, id));
  const totalCOGS = sumFY((id) => calcCOGS(tb, id));
  const grossProfit = -sumFY((id) => calcGrossProfit(tb, id));
  const totalOpEx = sumFY((id) => calcOpEx(tb, id) + calcPayroll(tb, id));
  const totalOtherExp = sumFY((id) => calcOtherExpense(tb, id));
  const netIncome = -sumFY((id) => calcNetIncome(tb, id));
  const annualNetIncome = netIncome;
  const annualRevenue = totalRevenue;
  const annualCOGS = totalCOGS;
  const annualEBITDA = -sumFY((id) => calcEBITDA(tb, id));
  const annualInterestExpense = sumFY((id) => calcInterestExpense(tb, id));
  const annualOperatingIncome = -sumFY((id) => calcOperatingIncome(tb, id));
  const cashAndEquiv = sumByLineItem(tb, "Cash and cash equivalents", pid);
  const ar = sumByLineItem(tb, "Accounts receivable", pid);
  const currentAssets = calcTotalCurrentAssets(tb, pid);
  const totalAssets = calcTotalAssets(tb, pid);
  const totalCurrentLiabilities = Math.abs(calcTotalCurrentLiabilities(tb, pid));
  const totalLiabilities = Math.abs(calcTotalLiabilities(tb, pid));
  const totalEquity = Math.abs(calcTotalEquity(tb, pid));
  const formatCurrency = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;
  const ap = Math.abs(sumByLineItem(tb, "Current liabilities", pid));
  const dso = annualRevenue > 0 ? ar / (annualRevenue / 365) : 0;
  const dpo = annualCOGS > 0 ? ap / (annualCOGS / 365) : 0;
  const assetTurnover = totalAssets > 0 ? annualRevenue / totalAssets : 0;
  const currentRatio = totalCurrentLiabilities > 0 ? currentAssets / totalCurrentLiabilities : 0;
  const quickRatio = totalCurrentLiabilities > 0 ? (cashAndEquiv + ar) / totalCurrentLiabilities : 0;
  const debtToEquity = totalEquity !== 0 ? totalLiabilities / Math.abs(totalEquity) : 0;
  const grossMargin = annualRevenue > 0 ? grossProfit / annualRevenue : 0;
  const operatingMargin = annualRevenue > 0 ? annualOperatingIncome / annualRevenue : 0;
  const ebitdaMargin = annualRevenue > 0 ? annualEBITDA / annualRevenue : 0;
  const netMargin = annualRevenue > 0 ? netIncome / annualRevenue : 0;
  const roa = totalAssets > 0 ? annualNetIncome / totalAssets : 0;
  const roe = totalEquity !== 0 ? annualNetIncome / Math.abs(totalEquity) : 0;
  const interestCoverage = annualInterestExpense > 0 ? annualEBITDA / annualInterestExpense : 0;
  const hasData = tb.length > 0;
  const plItems = [
    { label: "Revenue", amount: totalRevenue, isSection: true },
    { label: "Cost of Goods Sold", amount: totalCOGS, isSection: false },
    { label: "Gross Profit", amount: grossProfit, isSection: false, isSubtotal: true },
    { label: "Operating Expenses", amount: totalOpEx, isSection: false },
    { label: "Other Income/Expense", amount: totalOtherExp, isSection: false },
    { label: "Net Income", amount: netIncome, isSection: false, isTotal: true }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Analysis Reports" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Detailed analytical reports and financial ratios" })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "nwc", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "nwc", className: "gap-2", children: [
          /* @__PURE__ */ jsx(PieChart, { className: "w-4 h-4" }),
          "NWC Detail"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "common", className: "gap-2", children: [
          /* @__PURE__ */ jsx(Percent, { className: "w-4 h-4" }),
          "P&L (% Sales)"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "ratios", className: "gap-2", children: [
          /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4" }),
          "Financial Ratios"
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "nwc", className: "mt-6", children: /* @__PURE__ */ jsx(
        SpreadsheetReportViewer,
        {
          rawData: nwcReportData?.rawData || [],
          title: "Net Working Capital Analysis",
          syncedAt: nwcReportData?.syncedAt,
          skipEmptyRows: true
        }
      ) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "common", className: "mt-6", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Common Size Income Statement (% of Sales)" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: hasData ? /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { className: "w-[50%]", children: "Line Item" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Amount" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "% of Sales" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: plItems.map((item, idx) => /* @__PURE__ */ jsxs(
            TableRow,
            {
              className: item.isTotal ? "font-bold bg-primary/10 border-t-2" : item.isSubtotal ? "font-semibold border-t" : item.isSection ? "bg-muted/50 font-medium" : "",
              children: [
                /* @__PURE__ */ jsx(TableCell, { children: item.label }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: formatCurrency(item.amount) }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: totalRevenue > 0 ? formatPercent(item.amount / totalRevenue) : "—" })
              ]
            },
            idx
          )) })
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground py-8", children: "Enter trial balance data to see common size analysis." }) })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "ratios", className: "mt-6", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Liquidity Ratios" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Ratio" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Value" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Interpretation" })
            ] }) }),
            /* @__PURE__ */ jsxs(TableBody, { children: [
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Current Ratio" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? `${currentRatio.toFixed(2)}x` : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? currentRatio >= 1.5 ? "Strong" : currentRatio >= 1 ? "Adequate" : "Weak" : "—" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Quick Ratio" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? `${quickRatio.toFixed(2)}x` : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? quickRatio >= 1 ? "Strong" : quickRatio >= 0.5 ? "Adequate" : "Weak" : "—" })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Profitability Ratios" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Ratio" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Value" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Interpretation" })
            ] }) }),
            /* @__PURE__ */ jsxs(TableBody, { children: [
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Gross Margin" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? formatPercent(grossMargin) : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: "Industry dependent" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Net Margin" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? formatPercent(netMargin) : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? netMargin >= 0.1 ? "Strong" : netMargin >= 0.05 ? "Average" : "Below average" : "—" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Return on Assets (Annual)" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? formatPercent(roa) : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? roa >= 0.05 ? "Strong" : roa >= 0.02 ? "Average" : "Below average" : "—" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Operating Margin (Annual)" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? formatPercent(operatingMargin) : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? operatingMargin >= 0.15 ? "Strong" : operatingMargin >= 0.05 ? "Average" : "Below average" : "—" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "EBITDA Margin (Annual)" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? formatPercent(ebitdaMargin) : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? ebitdaMargin >= 0.2 ? "Strong" : ebitdaMargin >= 0.1 ? "Average" : "Below average" : "—" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Return on Equity (Annual)" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? formatPercent(roe) : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? roe >= 0.15 ? "Strong" : roe >= 0.1 ? "Average" : "Below average" : "—" })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Efficiency Ratios" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Ratio" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Value" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Interpretation" })
            ] }) }),
            /* @__PURE__ */ jsxs(TableBody, { children: [
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Days Sales Outstanding" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData && dso > 0 ? `${dso.toFixed(0)} days` : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData && dso > 0 ? dso <= 30 ? "Excellent" : dso <= 45 ? "Good" : dso <= 60 ? "Average" : "Slow collections" : "—" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Days Payable Outstanding" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData && dpo > 0 ? `${dpo.toFixed(0)} days` : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData && dpo > 0 ? dpo <= 30 ? "Paying quickly" : dpo <= 45 ? "Normal" : "Extended terms" : "—" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Asset Turnover" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? `${assetTurnover.toFixed(2)}x` : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? assetTurnover >= 2 ? "Efficient" : assetTurnover >= 1 ? "Average" : "Asset-heavy" : "—" })
              ] })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Leverage Ratios" }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [
            /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsx(TableHead, { children: "Ratio" }),
              /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Value" }),
              /* @__PURE__ */ jsx(TableHead, { children: "Interpretation" })
            ] }) }),
            /* @__PURE__ */ jsxs(TableBody, { children: [
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Debt to Equity" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData ? `${debtToEquity.toFixed(2)}x` : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData ? debtToEquity <= 1 ? "Conservative" : debtToEquity <= 2 ? "Moderate" : "Aggressive" : "—" })
              ] }),
              /* @__PURE__ */ jsxs(TableRow, { children: [
                /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: "Interest Coverage" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-right font-mono", children: hasData && interestCoverage > 0 ? `${interestCoverage.toFixed(1)}x` : "—" }),
                /* @__PURE__ */ jsx(TableCell, { className: "text-muted-foreground text-sm", children: hasData && interestCoverage > 0 ? interestCoverage >= 3 ? "Strong" : interestCoverage >= 1.5 ? "Adequate" : "Risky" : "—" })
              ] })
            ] })
          ] }) })
        ] })
      ] }) })
    ] })
  ] });
};
export {
  AnalysisReportsSection
};
