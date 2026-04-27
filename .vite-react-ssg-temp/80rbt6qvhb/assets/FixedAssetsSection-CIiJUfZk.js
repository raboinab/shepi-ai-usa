import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase, C as Card, f as CardContent, r as parseLocalDate, b as CardHeader, d as CardTitle, B as Button } from "../main.mjs";
import { F as FinancialTable } from "./FinancialTable-C338IkVp.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-sNpTUd89.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { A as Alert, b as AlertDescription, a as AlertTitle } from "./alert-FolYmCWY.js";
import { Download, Loader2, FileText, AlertCircle, AlertTriangle, CheckCircle2, Building, Edit3, ChevronDown, Info, FileSpreadsheet, TrendingDown, DollarSign, Wrench } from "lucide-react";
import { toast } from "sonner";
import { f as formatCurrency } from "./trialBalanceUtils-BTe9uefW.js";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./dropdown-menu-CfWYww5V.js";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "./table-CVoj8f5R.js";
import "./input-CSM87NBF.js";
import "@radix-ui/react-dialog";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-dropdown-menu";
const confidenceConfig = {
  high: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "High Confidence",
    description: "Data extracted with high accuracy"
  },
  medium: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Medium Confidence",
    description: "Review recommended before applying"
  },
  low: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Low Confidence",
    description: "Manual review required"
  }
};
function FixedAssetsImportDialog({
  open,
  onOpenChange,
  projectId,
  onImport
}) {
  const [loading, setLoading] = useState(true);
  const [fixedAssetsData, setFixedAssetsData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (open) {
      fetchFixedAssetsData();
    }
  }, [open, projectId]);
  const fetchFixedAssetsData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("processed_data").select("*").eq("project_id", projectId).eq("data_type", "fixed_assets").order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      const typedData = (data || []).map((record) => ({
        ...record,
        data: record.data
      }));
      setFixedAssetsData(typedData);
      if (typedData.length > 0) {
        setSelectedId(typedData[0].id);
      }
    } catch (error) {
      console.error("Error fetching fixed assets data:", error);
      toast.error("Failed to load fixed assets data");
    } finally {
      setLoading(false);
    }
  };
  const selectedRecord = fixedAssetsData.find((d) => d.id === selectedId);
  const selectedData = selectedRecord?.data;
  const handleImport = () => {
    if (!selectedData?.extractedData?.assets) {
      toast.error("No data to import");
      return;
    }
    const convertedAssets = selectedData.extractedData.assets.map((asset, index) => ({
      id: index + 1,
      description: asset.description,
      cost: asset.cost,
      accumDepr: asset.accumDepreciation,
      usefulLife: asset.usefulLife || "N/A"
    }));
    onImport({ assets: convertedAssets });
    onOpenChange(false);
    toast.success("Fixed assets data imported successfully");
  };
  const renderAssetPreview = (assets) => {
    if (!assets || assets.length === 0) return null;
    const byCategory = assets.reduce((acc, asset) => {
      const cat = asset.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(asset);
      return acc;
    }, {});
    return /* @__PURE__ */ jsx("div", { className: "space-y-2", children: Object.entries(byCategory).map(([category, categoryAssets]) => {
      const categoryTotal = categoryAssets.reduce((sum, a) => sum + a.cost, 0);
      return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: category }),
          /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
            categoryAssets.length,
            " items · ",
            formatCurrency(categoryTotal)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pl-4 text-xs text-muted-foreground space-y-0.5", children: [
          categoryAssets.slice(0, 2).map((asset, i) => /* @__PURE__ */ jsx("div", { className: "truncate", children: asset.description }, i)),
          categoryAssets.length > 2 && /* @__PURE__ */ jsxs("div", { className: "text-primary", children: [
            "+",
            categoryAssets.length - 2,
            " more"
          ] })
        ] })
      ] }, category);
    }) });
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh]", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Download, { className: "h-5 w-5" }),
        "Import Fixed Assets Data"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Select extracted fixed asset data from uploaded depreciation schedules." })
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-[50vh]", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : fixedAssetsData.length === 0 ? /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: "No depreciation schedules have been processed yet. Upload a depreciation schedule or fixed asset register in the Documents section first." })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Select Document" }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: fixedAssetsData.map((record) => {
          const conf = confidenceConfig[record.data.confidence || "low"];
          const ConfIcon = conf.icon;
          const isSelected = selectedId === record.id;
          const assetCount = record.data.extractedData?.assets?.length || 0;
          return /* @__PURE__ */ jsx(
            Card,
            {
              className: `cursor-pointer transition-colors ${isSelected ? "ring-2 ring-primary" : "hover:bg-muted/50"}`,
              onClick: () => setSelectedId(record.id),
              children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Building, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-sm truncate", children: record.data.documentName || "Depreciation Schedule" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                    /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: `${conf.bgColor} ${conf.color} border-0 text-xs`, children: [
                      /* @__PURE__ */ jsx(ConfIcon, { className: "h-3 w-3 mr-1" }),
                      conf.label
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                      assetCount,
                      " assets"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground text-right", children: parseLocalDate(record.created_at.split("T")[0]).toLocaleDateString() })
              ] }) })
            },
            record.id
          );
        }) })
      ] }),
      selectedData && /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-sm", children: "Data Preview" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          selectedData.confidence !== "high" && /* @__PURE__ */ jsxs(Alert, { variant: selectedData.confidence === "low" ? "destructive" : "default", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx(AlertDescription, { className: "text-xs", children: confidenceConfig[selectedData.confidence].description })
          ] }),
          selectedData.extractedData?.asOfDate && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "As of: ",
            new Date(selectedData.extractedData.asOfDate).toLocaleDateString()
          ] }),
          selectedData.warnings && selectedData.warnings.length > 0 && /* @__PURE__ */ jsx("div", { className: "text-xs text-amber-600 space-y-1", children: selectedData.warnings.map((w, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-1", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: w })
          ] }, i)) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 pt-2", children: renderAssetPreview(selectedData.extractedData?.assets) }),
          selectedData.extractedData && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 pt-2 border-t", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Total Cost" }),
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm", children: formatCurrency(selectedData.extractedData.totalCost) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Accum. Depr." }),
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm", children: formatCurrency(selectedData.extractedData.totalAccumDepreciation) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Net Book Value" }),
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm text-primary", children: formatCurrency(selectedData.extractedData.totalNBV) })
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleImport,
          disabled: !selectedData || loading,
          children: "Import Data"
        }
      )
    ] })
  ] }) });
}
const defaultData = {
  assets: [
    { id: 1, description: "Land", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "N/A", method: "N/A" },
    { id: 2, description: "Buildings", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "39 years", method: "Straight-Line" },
    { id: 3, description: "Machinery & Equipment", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "7 years", method: "MACRS 7-Year" },
    { id: 4, description: "Furniture & Fixtures", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "5 years", method: "Straight-Line" },
    { id: 5, description: "Vehicles", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "5 years", method: "MACRS 5-Year" },
    { id: 6, description: "Computer Equipment", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "3 years", method: "MACRS 5-Year" }
  ],
  capexAnalysis: []
};
const getDefaultCapexAnalysis = (periods) => {
  if (periods && periods.length > 0) {
    return periods.map((period, index) => ({
      id: index + 1,
      period,
      capex: 0,
      maintenance: 0
    }));
  }
  return [
    { id: 1, period: "Y-2", capex: 0, maintenance: 0 },
    { id: 2, period: "Y-1", capex: 0, maintenance: 0 },
    { id: 3, period: "Current", capex: 0, maintenance: 0 }
  ];
};
const FixedAssetsSection = ({
  data,
  updateData,
  projectId,
  periods = [],
  balanceSheetData
}) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const initializeCapexAnalysis = () => {
    if (!data.capexAnalysis || data.capexAnalysis.length === 0) {
      return getDefaultCapexAnalysis(periods);
    }
    return data.capexAnalysis;
  };
  const faData = {
    ...defaultData,
    ...data,
    capexAnalysis: initializeCapexAnalysis()
  };
  const assetColumns = [
    { key: "description", label: "Asset Class", type: "text" },
    { key: "cost", label: "Cost", type: "currency" },
    { key: "accumDepr", label: "Accum. Depr.", type: "currency" },
    { key: "nbv", label: "Net Book Value", type: "currency", editable: false },
    { key: "usefulLife", label: "Useful Life", type: "text" },
    { key: "method", label: "Depr. Method", type: "text" }
  ];
  const capexColumns = [
    { key: "period", label: "Period", type: "text", editable: false },
    { key: "capex", label: "Capital Expenditure", type: "currency" },
    { key: "maintenance", label: "R&M Expense", type: "currency" }
  ];
  const assetsWithNBV = faData.assets.map((asset) => ({
    ...asset,
    nbv: (asset.cost || 0) - (asset.accumDepr || 0)
  }));
  const totalCost = faData.assets.reduce((sum, asset) => sum + (asset.cost || 0), 0);
  const totalAccumDepr = faData.assets.reduce((sum, asset) => sum + (asset.accumDepr || 0), 0);
  const totalNBV = totalCost - totalAccumDepr;
  const capexData = faData.capexAnalysis;
  const avgCapex = capexData.length > 0 ? capexData.reduce((sum, p) => sum + (p.capex || 0), 0) / capexData.length : 0;
  const avgMaintenance = capexData.length > 0 ? capexData.reduce((sum, p) => sum + (p.maintenance || 0), 0) / capexData.length : 0;
  const hasData = totalCost > 0 || totalAccumDepr > 0;
  const hasBalanceSheetData = balanceSheetData?.fixedAssets && balanceSheetData.fixedAssets.length > 0;
  const handleImport = (importedData) => {
    const assetsWithMethod = importedData.assets.map((asset) => ({
      ...asset,
      method: asset.description === "Land" ? "N/A" : "Straight-Line"
    }));
    updateData({
      assets: assetsWithMethod,
      capexAnalysis: faData.capexAnalysis
    });
  };
  const handlePullFromBalanceSheet = () => {
    if (!balanceSheetData?.fixedAssets) return;
    const mostRecentPeriod = periods[periods.length - 1] || "current";
    let totalFixedAssetsCost = 0;
    let totalAccumulatedDepr = 0;
    balanceSheetData.fixedAssets.forEach((item) => {
      const value = item.values[mostRecentPeriod] || 0;
      const accountLower = item.account.toLowerCase();
      if (accountLower.includes("accumulated") || accountLower.includes("accum")) {
        totalAccumulatedDepr += Math.abs(value);
      } else {
        totalFixedAssetsCost += value;
      }
    });
    const summaryAsset = {
      id: 1,
      description: "Fixed Assets (from Balance Sheet)",
      cost: totalFixedAssetsCost,
      accumDepr: totalAccumulatedDepr,
      nbv: totalFixedAssetsCost - totalAccumulatedDepr,
      usefulLife: "Various",
      method: "Various"
    };
    updateData({
      assets: [summaryAsset],
      capexAnalysis: faData.capexAnalysis
    });
    setShowGuidance(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Fixed Assets" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Track fixed assets, depreciation, and capital expenditure analysis" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => setImportDialogOpen(true),
            className: "gap-2",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
              "Import from Document"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "secondary", className: "gap-2", children: [
            /* @__PURE__ */ jsx(Edit3, { className: "h-4 w-4" }),
            "Enter Manually",
            /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
          ] }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setShowGuidance(true), children: [
              /* @__PURE__ */ jsx(Info, { className: "h-4 w-4 mr-2" }),
              "Show Entry Guide"
            ] }),
            hasBalanceSheetData && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: handlePullFromBalanceSheet, children: [
              /* @__PURE__ */ jsx(FileSpreadsheet, { className: "h-4 w-4 mr-2" }),
              "Pull Totals from Balance Sheet"
            ] })
          ] })
        ] })
      ] })
    ] }),
    (showGuidance || !hasData && !importDialogOpen) && /* @__PURE__ */ jsxs(Alert, { className: "bg-muted/50 border-primary/20", children: [
      /* @__PURE__ */ jsx(Edit3, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertTitle, { children: "Manual Entry Mode" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("p", { children: "No depreciation schedule from QuickBooks? No problem. Fixed asset schedules are only available in QuickBooks Online Advanced, but you can still complete this section:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-sm", children: [
          /* @__PURE__ */ jsx("li", { children: "Edit values directly in the table below" }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Add custom asset classes with the ",
            /* @__PURE__ */ jsx("strong", { children: "+ Add Row" }),
            " button"
          ] }),
          /* @__PURE__ */ jsx("li", { children: "Net Book Value calculates automatically (Cost − Accum. Depreciation)" }),
          /* @__PURE__ */ jsx("li", { children: "Common depreciation methods are pre-populated" })
        ] }),
        hasBalanceSheetData && /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: handlePullFromBalanceSheet,
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsx(FileSpreadsheet, { className: "h-4 w-4" }),
                "Pull Totals from Balance Sheet"
              ]
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground ml-2", children: "Quick-start with summary totals" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => setShowGuidance(false),
            children: "Dismiss"
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total Cost", value: totalCost, icon: Building }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Accum. Depreciation", value: totalAccumDepr, icon: TrendingDown }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Net Book Value", value: totalNBV, icon: DollarSign }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Avg Annual CapEx", value: avgCapex, icon: Wrench })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Fixed Asset Register" }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx(
          FinancialTable,
          {
            columns: assetColumns,
            data: assetsWithNBV,
            onDataChange: (assets) => updateData({ ...faData, assets }),
            newRowTemplate: { description: "New Asset Class", cost: 0, accumDepr: 0, usefulLife: "", method: "Straight-Line" }
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Cost" }),
            /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold", children: [
              "$",
              totalCost.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Accumulated Depreciation" }),
            /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold", children: [
              "$",
              totalAccumDepr.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Net Book Value" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold text-primary", children: [
              "$",
              totalNBV.toLocaleString()
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "CapEx vs. R&M Analysis" }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx(
          FinancialTable,
          {
            columns: capexColumns,
            data: faData.capexAnalysis,
            onDataChange: (capexAnalysis) => updateData({ ...faData, capexAnalysis }),
            allowAddRow: false,
            allowDeleteRow: false
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Average Annual CapEx" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
              "$",
              avgCapex.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Average Annual R&M" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
              "$",
              avgMaintenance.toLocaleString()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-4", children: "Compare capital expenditures to repairs & maintenance to assess whether expenses are being appropriately capitalized." })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      FixedAssetsImportDialog,
      {
        open: importDialogOpen,
        onOpenChange: setImportDialogOpen,
        projectId,
        onImport: handleImport
      }
    )
  ] });
};
export {
  FixedAssetsSection
};
