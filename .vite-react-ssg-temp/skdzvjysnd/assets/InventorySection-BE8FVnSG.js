import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { F as FinancialTable } from "./FinancialTable-C338IkVp.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { DollarSign, Package, TrendingUp, BarChart3 } from "lucide-react";
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
import "./table-CVoj8f5R.js";
import "./input-CSM87NBF.js";
const defaultData = {
  items: [
    { id: 1, category: "Raw Materials", description: "", quantity: 0, unitCost: 0, totalValue: 0 },
    { id: 2, category: "Work in Progress", description: "", quantity: 0, unitCost: 0, totalValue: 0 },
    { id: 3, category: "Finished Goods", description: "", quantity: 0, unitCost: 0, totalValue: 0 }
  ],
  turnoverAnalysis: [
    { id: 1, period: "Y-2", avgInventory: 0, cogs: 0, turnover: 0, daysOnHand: 0 },
    { id: 2, period: "Y-1", avgInventory: 0, cogs: 0, turnover: 0, daysOnHand: 0 },
    { id: 3, period: "Current", avgInventory: 0, cogs: 0, turnover: 0, daysOnHand: 0 }
  ]
};
const InventorySection = ({ data, updateData }) => {
  const invData = { ...defaultData, ...data };
  const itemColumns = [
    { key: "category", label: "Category", type: "text" },
    { key: "description", label: "Description", type: "text" },
    { key: "quantity", label: "Quantity", type: "number" },
    { key: "unitCost", label: "Unit Cost", type: "currency" },
    { key: "totalValue", label: "Total Value", type: "currency", editable: false }
  ];
  const turnoverColumns = [
    { key: "period", label: "Period", type: "text", editable: false },
    { key: "avgInventory", label: "Avg Inventory", type: "currency" },
    { key: "cogs", label: "COGS", type: "currency" },
    { key: "turnover", label: "Turnover Ratio", type: "number", editable: false },
    { key: "daysOnHand", label: "Days on Hand", type: "number", editable: false }
  ];
  const itemsWithTotal = invData.items.map((item) => ({
    ...item,
    totalValue: (item.quantity || 0) * (item.unitCost || 0)
  }));
  const turnoverWithCalcs = invData.turnoverAnalysis.map((period) => {
    const avgInv = period.avgInventory || 0;
    const cogs = period.cogs || 0;
    const turnover = avgInv > 0 ? cogs / avgInv : 0;
    const daysOnHand = turnover > 0 ? Math.round(365 / turnover) : 0;
    return {
      ...period,
      turnover: Math.round(turnover * 100) / 100,
      daysOnHand
    };
  });
  const totalInventoryValue = itemsWithTotal.reduce(
    (sum, item) => sum + (item.totalValue || 0),
    0
  );
  const categoryCount = new Set(invData.items.map((i) => i.category)).size;
  const currentTurnover = turnoverWithCalcs.find((t) => t.period === "Current");
  const avgTurnover = currentTurnover?.turnover || 0;
  const avgDaysOnHand = currentTurnover?.daysOnHand || 0;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Inventory" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Track inventory levels, valuation, and turnover analysis" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total Inventory Value", value: totalInventoryValue, icon: DollarSign }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Categories", value: String(categoryCount), icon: Package }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Turnover Ratio", value: String(avgTurnover), icon: TrendingUp }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Days on Hand", value: String(avgDaysOnHand), icon: BarChart3 })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Inventory Listing" }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx(
          FinancialTable,
          {
            columns: itemColumns,
            data: itemsWithTotal,
            onDataChange: (items) => updateData({ ...invData, items }),
            newRowTemplate: {
              category: "",
              description: "",
              quantity: 0,
              unitCost: 0,
              totalValue: 0
            }
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "mt-4 p-4 bg-muted/50 rounded-lg", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Inventory Value" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-primary", children: [
            "$",
            totalInventoryValue.toLocaleString()
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Inventory Turnover Analysis" }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx(
          FinancialTable,
          {
            columns: turnoverColumns,
            data: turnoverWithCalcs,
            onDataChange: (turnoverAnalysis) => updateData({ ...invData, turnoverAnalysis }),
            allowAddRow: false,
            allowDeleteRow: false
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-4", children: "Turnover Ratio = COGS / Average Inventory. Days on Hand = 365 / Turnover Ratio. Higher turnover indicates more efficient inventory management." })
      ] })
    ] })
  ] });
};
export {
  InventorySection
};
