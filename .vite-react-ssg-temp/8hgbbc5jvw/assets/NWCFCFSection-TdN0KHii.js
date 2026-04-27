import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { C as Card, b as CardHeader, d as CardTitle, e as CardDescription, n as Tooltip, o as TooltipTrigger, p as TooltipContent, f as CardContent } from "../main.mjs";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { GenericReportSection } from "./GenericReportSection-BPd0zg8c.js";
import { L as Label } from "./label-B2r_8dgk.js";
import { I as Input } from "./input-CSM87NBF.js";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-YtCmMBhU.js";
import { A as Alert, b as AlertDescription } from "./alert-FolYmCWY.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { HelpCircle, Info, TrendingUp, TrendingDown, Minus, DollarSign, Calculator } from "lucide-react";
import { O as calcNWCExCash, J as calcAdjustedEBITDA, ah as calcIncomeTaxExpense } from "./sanitizeWizardData-nrsUY-BP.js";
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
import "./SpreadsheetReportViewer-BBrix0D8.js";
import "./table-CVoj8f5R.js";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "date-fns";
import "./reportDashboardMetrics-CCrfX0F0.js";
import "recharts";
import "./InsightsView-BkA7fJjp.js";
import "react-resizable-panels";
import "./tabs-dhx4sETc.js";
import "@radix-ui/react-tabs";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./spinner-DXdBpr08.js";
import "react-markdown";
import "./progress-DNO9VJ6D.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-label";
import "@radix-ui/react-radio-group";
const calculatePegAmount = (metrics, dealParams) => {
  switch (dealParams.pegMethod) {
    case "t3m":
      return metrics.t3mAvg;
    case "t6m":
      return metrics.t6mAvg;
    case "t12m":
      return metrics.t12mAvg;
    case "custom":
      return dealParams.customPegAmount || 0;
    default:
      return metrics.t12mAvg;
  }
};
const calculatePriceAdjustment = (estimatedNWCAtClose, pegAmount) => {
  if (estimatedNWCAtClose === null || estimatedNWCAtClose === 0) return null;
  return estimatedNWCAtClose - pegAmount;
};
const formatCurrencyDisplay = (value) => {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};
const DealParametersCard = ({
  metrics,
  dealParameters,
  onUpdateDealParameters
}) => {
  const [customAmount, setCustomAmount] = useState(
    dealParameters.customPegAmount?.toString() || ""
  );
  const [estimatedClose, setEstimatedClose] = useState(
    dealParameters.estimatedNWCAtClose?.toString() || ""
  );
  useEffect(() => {
    if (dealParameters.customPegAmount !== null) {
      setCustomAmount(dealParameters.customPegAmount.toString());
    }
    if (dealParameters.estimatedNWCAtClose !== null) {
      setEstimatedClose(dealParameters.estimatedNWCAtClose.toString());
    }
  }, [dealParameters.customPegAmount, dealParameters.estimatedNWCAtClose]);
  const pegAmount = calculatePegAmount(metrics, dealParameters);
  const adjustment = calculatePriceAdjustment(
    dealParameters.estimatedNWCAtClose,
    pegAmount
  );
  const handleMethodChange = (value) => {
    onUpdateDealParameters({
      ...dealParameters,
      pegMethod: value
    });
  };
  const handleCustomAmountChange = (value) => {
    setCustomAmount(value);
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
    onUpdateDealParameters({
      ...dealParameters,
      customPegAmount: isNaN(parsed) ? null : parsed
    });
  };
  const handleEstimatedCloseChange = (value) => {
    setEstimatedClose(value);
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
    onUpdateDealParameters({
      ...dealParameters,
      estimatedNWCAtClose: isNaN(parsed) ? null : parsed
    });
  };
  useEffect(() => {
    if (dealParameters.estimatedNWCAtClose === null && metrics.currentNWC !== 0) {
      onUpdateDealParameters({
        ...dealParameters,
        estimatedNWCAtClose: metrics.currentNWC
      });
    }
  }, [metrics.currentNWC]);
  const hasAnyAverages = metrics.t3mAvg !== 0 || metrics.t6mAvg !== 0 || metrics.t12mAvg !== 0;
  return /* @__PURE__ */ jsxs(Card, { className: "border-primary/20", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          "Deal Parameters",
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "font-normal", children: "Editable" })
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Set the working capital target for transaction modeling" })
      ] }),
      /* @__PURE__ */ jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(HelpCircle, { className: "h-4 w-4 text-muted-foreground cursor-help" }) }),
        /* @__PURE__ */ jsxs(TooltipContent, { className: "max-w-xs", side: "left", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium mb-1", children: "What is the NWC Peg?" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm", children: "The agreed working capital target for the transaction. At closing, actual NWC is compared to the Peg, resulting in a dollar-for-dollar purchase price adjustment." }),
          /* @__PURE__ */ jsx("p", { className: "text-sm mt-2 text-muted-foreground", children: "T12M average is most common as it smooths seasonal fluctuations." })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium", children: "Working Capital Peg (Target)" }),
        hasAnyAverages ? /* @__PURE__ */ jsxs(
          RadioGroup,
          {
            value: dealParameters.pegMethod,
            onValueChange: handleMethodChange,
            className: "space-y-2",
            children: [
              metrics.t3mAvg !== 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "t3m", id: "t3m" }),
                /* @__PURE__ */ jsxs(Label, { htmlFor: "t3m", className: "flex-1 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "T3M Average" }),
                  /* @__PURE__ */ jsx("span", { className: "ml-2 text-muted-foreground", children: formatCurrencyDisplay(metrics.t3mAvg) })
                ] })
              ] }),
              metrics.t6mAvg !== 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "t6m", id: "t6m" }),
                /* @__PURE__ */ jsxs(Label, { htmlFor: "t6m", className: "flex-1 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "T6M Average" }),
                  /* @__PURE__ */ jsx("span", { className: "ml-2 text-muted-foreground", children: formatCurrencyDisplay(metrics.t6mAvg) })
                ] })
              ] }),
              metrics.t12mAvg !== 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 rounded-lg border border-border bg-primary/5 hover:bg-primary/10 transition-colors", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "t12m", id: "t12m" }),
                /* @__PURE__ */ jsxs(Label, { htmlFor: "t12m", className: "flex-1 cursor-pointer", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "T12M Average" }),
                  /* @__PURE__ */ jsx("span", { className: "ml-2 text-muted-foreground", children: formatCurrencyDisplay(metrics.t12mAvg) }),
                  /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-2 text-xs", children: "Recommended" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors", children: [
                /* @__PURE__ */ jsx(RadioGroupItem, { value: "custom", id: "custom" }),
                /* @__PURE__ */ jsx(Label, { htmlFor: "custom", className: "flex-1 cursor-pointer", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Custom Amount" }) }),
                dealParameters.pegMethod === "custom" && /* @__PURE__ */ jsx(
                  Input,
                  {
                    type: "text",
                    value: customAmount,
                    onChange: (e) => handleCustomAmountChange(e.target.value),
                    placeholder: "Enter amount",
                    className: "w-40"
                  }
                )
              ] })
            ]
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs(Alert, { children: [
            /* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx(AlertDescription, { children: "Sync from the spreadsheet to see suggested peg values based on calculated averages." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "custom-only", children: "Custom Peg Amount" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "custom-only",
                type: "text",
                value: customAmount,
                onChange: (e) => handleCustomAmountChange(e.target.value),
                placeholder: "$0",
                className: "w-40"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-border" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "nwc-close", className: "text-sm font-medium", children: "Estimated NWC at Close" }),
          /* @__PURE__ */ jsxs(Tooltip, { children: [
            /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(HelpCircle, { className: "h-3.5 w-3.5 text-muted-foreground cursor-help" }) }),
            /* @__PURE__ */ jsx(TooltipContent, { className: "max-w-xs", children: /* @__PURE__ */ jsx("p", { className: "text-sm", children: 'Enter your estimated working capital at closing for "what-if" analysis. Pre-populated with current NWC.' }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "nwc-close",
            type: "text",
            value: estimatedClose,
            onChange: (e) => handleEstimatedCloseChange(e.target.value),
            placeholder: formatCurrencyDisplay(metrics.currentNWC),
            className: "w-full"
          }
        )
      ] }),
      adjustment !== null && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-lg bg-muted/50 border border-border", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Purchase Price Adjustment" }),
          adjustment > 0 ? /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-green-600" }) : adjustment < 0 ? /* @__PURE__ */ jsx(TrendingDown, { className: "h-4 w-4 text-red-600" }) : /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-baseline gap-2", children: /* @__PURE__ */ jsxs("span", { className: `text-2xl font-bold ${adjustment > 0 ? "text-green-600" : adjustment < 0 ? "text-red-600" : ""}`, children: [
          adjustment >= 0 ? "+" : "",
          formatCurrencyDisplay(adjustment)
        ] }) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: adjustment > 0 ? "Buyer pays additional amount at close" : adjustment < 0 ? "Seller credits buyer at close" : "No adjustment needed" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Est. NWC at Close:" }),
            /* @__PURE__ */ jsx("span", { children: formatCurrencyDisplay(dealParameters.estimatedNWCAtClose) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Less: Peg Amount:" }),
            /* @__PURE__ */ jsx("span", { children: formatCurrencyDisplay(pegAmount) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-medium pt-1 border-t border-border", children: [
            /* @__PURE__ */ jsx("span", { children: "Adjustment:" }),
            /* @__PURE__ */ jsxs("span", { children: [
              adjustment >= 0 ? "+" : "",
              formatCurrencyDisplay(adjustment)
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
const defaultDealParameters = {
  pegMethod: "t12m",
  customPegAmount: null,
  estimatedNWCAtClose: null
};
const NWCFCFSection = ({
  nwcAnalysisData,
  fcfData,
  periods = [],
  fiscalYearEnd = 12,
  dealData,
  dealParameters = defaultDealParameters,
  onUpdateDealParameters
}) => {
  const regularPeriods = periods.filter((p) => !p.isStub);
  const hasPeriods = regularPeriods.length > 0;
  const metrics = useMemo(() => {
    const defaults = {
      currentNWC: 0,
      t3mAvg: 0,
      t6mAvg: 0,
      t12mAvg: 0,
      ltmEBITDA: 0,
      ltmCapEx: 0,
      ltmFCF: 0
    };
    if (!dealData || regularPeriods.length === 0) return defaults;
    const tb = dealData.trialBalance;
    const adj = dealData.adjustments;
    const ab = dealData.addbacks;
    const activePeriods = dealData.deal.periods.filter((p) => !p.isStub);
    if (activePeriods.length === 0) return defaults;
    const nwcValues = activePeriods.map((p) => calcNWCExCash(tb, p.id));
    const avg = (arr) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
    const currentNWC = nwcValues[nwcValues.length - 1] ?? 0;
    const t3mAvg = avg(nwcValues.slice(-3));
    const t6mAvg = avg(nwcValues.slice(-6));
    const t12mAvg = avg(nwcValues.slice(-12));
    const ltmPeriods = activePeriods.slice(-12);
    const ltmEBITDA = -ltmPeriods.reduce(
      (sum, p) => sum + calcAdjustedEBITDA(tb, adj, p.id, ab),
      0
    );
    const ltmCapEx = 0;
    const ltmFCF = ltmPeriods.reduce((sum, p, i) => {
      const pIdx = activePeriods.indexOf(p);
      const nwcChange = pIdx > 0 ? calcNWCExCash(tb, p.id) - calcNWCExCash(tb, activePeriods[pIdx - 1].id) : 0;
      const adjEbitda = -calcAdjustedEBITDA(tb, adj, p.id, ab);
      const taxes = calcIncomeTaxExpense(tb, p.id, ab.taxes);
      return sum + adjEbitda - nwcChange - taxes;
    }, 0);
    return { currentNWC, t3mAvg, t6mAvg, t12mAvg, ltmEBITDA, ltmCapEx, ltmFCF };
  }, [dealData, regularPeriods]);
  const handleUpdateDealParameters = (params) => {
    if (onUpdateDealParameters) {
      onUpdateDealParameters(params);
    }
  };
  if (!hasPeriods) {
    return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "NWC & FCF Analysis" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Analyze net working capital trends and free cash flow" })
      ] }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-8 text-center text-muted-foreground", children: /* @__PURE__ */ jsx("p", { children: "Please configure periods in the Company Info section first." }) }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "NWC & FCF Analysis" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Net working capital trends and free cash flow analysis" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Current NWC",
          value: metrics.currentNWC,
          icon: DollarSign
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "LTM EBITDA",
          value: metrics.ltmEBITDA,
          icon: TrendingUp
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "LTM CapEx",
          value: metrics.ltmCapEx,
          icon: Calculator,
          subtitle: "Manual entry in workbook"
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "LTM Free Cash Flow",
          value: metrics.ltmFCF,
          icon: DollarSign
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      DealParametersCard,
      {
        metrics,
        dealParameters,
        onUpdateDealParameters: handleUpdateDealParameters
      }
    ),
    /* @__PURE__ */ jsx(
      GenericReportSection,
      {
        title: "Net Working Capital Analysis",
        description: "NWC trends and trailing averages across periods",
        data: nwcAnalysisData
      }
    ),
    /* @__PURE__ */ jsx(
      GenericReportSection,
      {
        title: "Free Cash Flow Analysis",
        description: "Adjusted EBITDA less changes in NWC, CapEx, and taxes",
        data: fcfData
      }
    )
  ] });
};
export {
  NWCFCFSection
};
