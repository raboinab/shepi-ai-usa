import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { s as supabase, C as Card, f as CardContent, b as CardHeader, d as CardTitle, B as Button, r as parseLocalDate, m as cn } from "../main.mjs";
import { F as FinancialTable } from "./FinancialTable-C338IkVp.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { Download, Loader2, FileText, AlertCircle, AlertTriangle, CheckCircle2, CreditCard, Home, DollarSign, Calendar, ArrowRight, Upload, PenLine, ChevronDown, Info, ArrowDownToLine, Scale } from "lucide-react";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-sNpTUd89.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { A as Alert, b as AlertDescription, a as AlertTitle } from "./alert-FolYmCWY.js";
import { toast } from "sonner";
import { C as Checkbox } from "./checkbox-3bpvUXl3.js";
import { cva } from "class-variance-authority";
import { S as Separator } from "./separator-BGlMS6na.js";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./dropdown-menu-CfWYww5V.js";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
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
import "@radix-ui/react-tabs";
import "@radix-ui/react-dialog";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-checkbox";
import "@radix-ui/react-separator";
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
function DebtScheduleImportDialog({
  open,
  onOpenChange,
  projectId,
  onImport
}) {
  const [loading, setLoading] = useState(true);
  const [debtData, setDebtData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (open) {
      fetchDebtData();
    }
  }, [open, projectId]);
  const fetchDebtData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("processed_data").select("*").eq("project_id", projectId).eq("data_type", "debt_schedule").order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      const typedData = (data || []).map((record) => ({
        ...record,
        data: record.data
      }));
      setDebtData(typedData);
      if (typedData.length > 0) {
        setSelectedId(typedData[0].id);
      }
    } catch (error) {
      console.error("Error fetching debt data:", error);
      toast.error("Failed to load debt schedule data");
    } finally {
      setLoading(false);
    }
  };
  const selectedRecord = debtData.find((d) => d.id === selectedId);
  const selectedData = selectedRecord?.data;
  const handleImport = () => {
    if (!selectedData?.debts) {
      toast.error("No data to import");
      return;
    }
    const transformed = selectedData.debts.map((debt, index) => ({
      id: index + 1,
      lender: `${debt.lender}${debt.facilityType ? ` - ${debt.facilityType}` : ""}`,
      originalAmount: debt.originalAmount || 0,
      currentBalance: debt.currentBalance || 0,
      interestRate: debt.interestRate || 0,
      maturityDate: debt.maturityDate || ""
    }));
    onImport(transformed);
    onOpenChange(false);
    toast.success(`Imported ${transformed.length} debt facilities`);
  };
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh]", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Download, { className: "h-5 w-5" }),
        "Import Debt Schedule"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Select extracted debt data from uploaded documents to import into your analysis." })
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-[50vh]", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : debtData.length === 0 ? /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: "No debt schedule documents have been processed yet. Upload a debt schedule in the Documents section first." })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Select Document" }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: debtData.map((record) => {
          const conf = confidenceConfig[record.data.confidence || "low"];
          const ConfIcon = conf.icon;
          const isSelected = selectedId === record.id;
          return /* @__PURE__ */ jsx(
            Card,
            {
              className: `cursor-pointer transition-colors ${isSelected ? "ring-2 ring-primary" : "hover:bg-muted/50"}`,
              onClick: () => setSelectedId(record.id),
              children: /* @__PURE__ */ jsx(CardContent, { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CreditCard, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-sm truncate", children: record.data.documentName || "Debt Schedule" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                    /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: `${conf.bgColor} ${conf.color} border-0 text-xs`, children: [
                      /* @__PURE__ */ jsx(ConfIcon, { className: "h-3 w-3 mr-1" }),
                      conf.label
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                      record.data.debts?.length || 0,
                      " facilities · ",
                      formatCurrency(record.data.totalOutstanding || 0)
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground text-right", children: new Date(record.created_at).toLocaleDateString() })
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
          selectedData.warnings && selectedData.warnings.length > 0 && /* @__PURE__ */ jsx("div", { className: "text-xs text-amber-600 space-y-1", children: selectedData.warnings.map((w, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-1", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { children: w })
          ] }, i)) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2 pt-2", children: selectedData.debts?.map((debt, i) => /* @__PURE__ */ jsxs("div", { className: "text-sm p-2 bg-muted/50 rounded", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: debt.lender }),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: debt.facilityType })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mt-1", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "Balance: ",
                formatCurrency(debt.currentBalance)
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                debt.interestRate,
                "% · ",
                debt.maturityDate
              ] })
            ] })
          ] }, i)) }),
          /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-medium", children: [
              /* @__PURE__ */ jsx("span", { children: "Total Outstanding" }),
              /* @__PURE__ */ jsx("span", { children: formatCurrency(selectedData.totalOutstanding) })
            ] }),
            selectedData.asOfDate && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
              "As of: ",
              selectedData.asOfDate
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
const LeaseImportDialog = ({
  open,
  onOpenChange,
  materialContracts,
  onImport
}) => {
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  const leaseContracts = useMemo(() => {
    return materialContracts.filter(
      (c) => c.contractType?.toLowerCase() === "lease"
    );
  }, [materialContracts]);
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };
  const selectAll = () => {
    if (selectedIds.size === leaseContracts.length) {
      setSelectedIds(/* @__PURE__ */ new Set());
    } else {
      setSelectedIds(new Set(leaseContracts.map((c) => c.id)));
    }
  };
  const calculateRemainingYears = (expirationDate) => {
    if (!expirationDate) return 0;
    try {
      const expDate = new Date(expirationDate);
      const now = /* @__PURE__ */ new Date();
      const diffYears = (expDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24 * 365);
      return Math.max(0, Math.round(diffYears * 10) / 10);
    } catch {
      return 0;
    }
  };
  const handleImport = () => {
    const selectedLeases = leaseContracts.filter((c) => selectedIds.has(c.id)).map((contract, idx) => ({
      id: idx + 1,
      description: `${contract.counterparty || "Lease"}${contract.description ? ` - ${contract.description}` : ""}`,
      type: "Operating",
      // Default, user can edit
      annualPayment: contract.annualValue || contract.contractValue || 0,
      remainingTerm: calculateRemainingYears(contract.expirationDate),
      sourceContractId: contract.id
    }));
    onImport(selectedLeases);
    setSelectedIds(/* @__PURE__ */ new Set());
    onOpenChange(false);
  };
  const formatCurrency = (value) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return parseLocalDate(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short"
      });
    } catch {
      return dateStr;
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-lg", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Home, { className: "h-5 w-5" }),
        "Import Leases from Material Contracts"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Select lease contracts to import into Lease Obligations. Values can be edited after import." })
    ] }),
    leaseContracts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-8 text-center text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Home, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }),
      /* @__PURE__ */ jsx("p", { children: "No lease-type contracts found in Material Contracts." }),
      /* @__PURE__ */ jsx("p", { className: "text-sm mt-1", children: "Add lease contracts there first, or enter leases manually." })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: selectAll, children: selectedIds.size === leaseContracts.length ? "Deselect All" : "Select All" }),
        /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
          selectedIds.size,
          " of ",
          leaseContracts.length,
          " selected"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2", children: leaseContracts.map((contract) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${selectedIds.has(contract.id) ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted/50 border border-transparent"}`,
          onClick: () => toggleSelection(contract.id),
          children: [
            /* @__PURE__ */ jsx(
              Checkbox,
              {
                checked: selectedIds.has(contract.id),
                className: "mt-1"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium truncate", children: contract.counterparty || "Unknown Lessor" }),
              contract.description && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground truncate", children: contract.description }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mt-1 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(DollarSign, { className: "h-3 w-3" }),
                  formatCurrency(contract.annualValue || contract.contractValue),
                  "/yr"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
                  "Exp: ",
                  formatDate(contract.expirationDate)
                ] })
              ] })
            ] })
          ]
        },
        contract.id
      )) }),
      selectedIds.size > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 rounded-lg p-3 text-sm", children: [
        /* @__PURE__ */ jsxs("p", { className: "font-medium flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" }),
          "Will import as:"
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-1 text-muted-foreground list-disc list-inside", children: [
          /* @__PURE__ */ jsx("li", { children: "Lease type: Operating (editable)" }),
          /* @__PURE__ */ jsx("li", { children: "Annual payment from contract value" }),
          /* @__PURE__ */ jsx("li", { children: "Remaining term calculated from expiration" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: handleImport,
          disabled: selectedIds.size === 0,
          children: [
            "Import ",
            selectedIds.size,
            " Lease",
            selectedIds.size !== 1 ? "s" : ""
          ]
        }
      )
    ] })
  ] }) });
};
const buttonGroupVariants = cva(
  "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal: "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical: "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none"
      }
    },
    defaultVariants: {
      orientation: "horizontal"
    }
  }
);
function ButtonGroup({
  className,
  orientation,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "group",
      "data-slot": "button-group",
      "data-orientation": orientation,
      className: cn(buttonGroupVariants({ orientation }), className),
      ...props
    }
  );
}
function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Separator,
    {
      "data-slot": "button-group-separator",
      orientation,
      className: cn("relative !m-0 self-stretch bg-input data-[orientation=vertical]:h-auto", className),
      ...props
    }
  );
}
const defaultData = {
  debtSchedule: [
    { id: 1, lender: "Bank Term Loan", originalAmount: 0, currentBalance: 0, interestRate: 0, maturityDate: "" }
  ],
  leaseObligations: [
    { id: 1, description: "Office Lease", type: "Operating", annualPayment: 0, remainingTerm: 0 }
  ],
  contingentLiabilities: [
    { id: 1, description: "", estimatedAmount: 0, likelihood: "Possible", notes: "" }
  ]
};
const DEBT_LINE_PATTERNS = [
  { pattern: /line of credit/i, facilityType: "Line of Credit" },
  { pattern: /notes payable/i, facilityType: "Notes Payable" },
  { pattern: /long.?term debt/i, facilityType: "Long-term Debt" },
  { pattern: /current portion.*(debt|loan)/i, facilityType: "Current Portion of LT Debt" },
  { pattern: /term loan/i, facilityType: "Term Loan" },
  { pattern: /mortgage/i, facilityType: "Mortgage" },
  { pattern: /loan payable/i, facilityType: "Loan Payable" },
  { pattern: /debt/i, facilityType: "Debt" }
];
const CONTINGENT_LINE_PATTERNS = [
  { pattern: /warranty/i, category: "Warranty Reserve" },
  { pattern: /litigation/i, category: "Litigation Reserve" },
  { pattern: /legal.?reserve/i, category: "Legal Reserve" },
  { pattern: /contingent/i, category: "Contingent Liability" },
  { pattern: /self.?insurance/i, category: "Self-Insurance Reserve" },
  { pattern: /environmental/i, category: "Environmental Reserve" },
  { pattern: /restructuring/i, category: "Restructuring Reserve" }
];
const SupplementarySection = ({
  data,
  updateData,
  projectId,
  balanceSheetData,
  materialContracts = []
}) => {
  const [showDebtImport, setShowDebtImport] = useState(false);
  const [showLeaseImport, setShowLeaseImport] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [showContingentGuide, setShowContingentGuide] = useState(false);
  const suppData = { ...defaultData, ...data };
  const debtColumns = [
    { key: "lender", label: "Lender/Facility", type: "text" },
    { key: "originalAmount", label: "Original Amount", type: "currency" },
    { key: "currentBalance", label: "Current Balance", type: "currency" },
    { key: "interestRate", label: "Interest Rate %", type: "number" },
    { key: "maturityDate", label: "Maturity", type: "text" }
  ];
  const leaseColumns = [
    { key: "description", label: "Description", type: "text" },
    { key: "type", label: "Type", type: "text" },
    { key: "annualPayment", label: "Annual Payment", type: "currency" },
    { key: "remainingTerm", label: "Remaining Years", type: "number" }
  ];
  const contingentColumns = [
    { key: "description", label: "Description", type: "text" },
    { key: "estimatedAmount", label: "Estimated Amount", type: "currency" },
    { key: "likelihood", label: "Likelihood", type: "text" },
    { key: "notes", label: "Notes", type: "text" }
  ];
  const totalDebt = suppData.debtSchedule.reduce((sum, d) => sum + (d.currentBalance || 0), 0);
  const totalLeasePayments = suppData.leaseObligations.reduce((sum, l) => sum + (l.annualPayment || 0), 0);
  const totalContingent = suppData.contingentLiabilities.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
  const isDebtEmpty = useMemo(() => {
    if (suppData.debtSchedule.length === 0) return true;
    if (suppData.debtSchedule.length === 1) {
      const first = suppData.debtSchedule[0];
      return first.lender === "Bank Term Loan" && (first.currentBalance || 0) === 0 && (first.originalAmount || 0) === 0;
    }
    return false;
  }, [suppData.debtSchedule]);
  const hasBalanceSheetDebtData = useMemo(() => {
    if (!balanceSheetData || balanceSheetData.length === 0) return false;
    return balanceSheetData.some((row) => {
      const account = String(row.account || row.Account || row.description || "").toLowerCase();
      return DEBT_LINE_PATTERNS.some((p) => p.pattern.test(account));
    });
  }, [balanceSheetData]);
  const hasBalanceSheetContingentData = useMemo(() => {
    if (!balanceSheetData || balanceSheetData.length === 0) return false;
    return balanceSheetData.some((row) => {
      const account = String(row.account || row.Account || row.description || "").toLowerCase();
      return CONTINGENT_LINE_PATTERNS.some((p) => p.pattern.test(account));
    });
  }, [balanceSheetData]);
  const hasMaterialContractLeases = useMemo(() => {
    return materialContracts.some((c) => c.contractType?.toLowerCase() === "lease");
  }, [materialContracts]);
  const isLeaseEmpty = useMemo(() => {
    if (suppData.leaseObligations.length === 0) return true;
    if (suppData.leaseObligations.length === 1) {
      const first = suppData.leaseObligations[0];
      return first.description === "Office Lease" && (first.annualPayment || 0) === 0;
    }
    return false;
  }, [suppData.leaseObligations]);
  const isContingentEmpty = useMemo(() => {
    if (suppData.contingentLiabilities.length === 0) return true;
    if (suppData.contingentLiabilities.length === 1) {
      const first = suppData.contingentLiabilities[0];
      return !first.description && (first.estimatedAmount || 0) === 0;
    }
    return false;
  }, [suppData.contingentLiabilities]);
  const handleDebtImport = (debts) => {
    const maxId = Math.max(0, ...suppData.debtSchedule.map((d) => d.id || 0));
    const newDebts = debts.map((debt, idx) => ({
      ...debt,
      id: maxId + idx + 1
    }));
    updateData({
      ...suppData,
      debtSchedule: [...suppData.debtSchedule.filter((d) => d.lender !== "Bank Term Loan" || d.currentBalance > 0), ...newDebts]
    });
    setShowManualGuide(false);
  };
  const handleLeaseImport = (leases) => {
    const filteredExisting = suppData.leaseObligations.filter(
      (l) => l.description !== "Office Lease" || (l.annualPayment || 0) > 0
    );
    const maxId = Math.max(0, ...filteredExisting.map((l) => l.id || 0));
    const newLeases = leases.map((lease, idx) => ({
      ...lease,
      id: maxId + idx + 1
    }));
    updateData({
      ...suppData,
      leaseObligations: [...filteredExisting, ...newLeases]
    });
  };
  const handlePullFromBalanceSheet = () => {
    if (!balanceSheetData) return;
    const extractedDebts = [];
    let idCounter = 1;
    balanceSheetData.forEach((row) => {
      const account = String(row.account || row.Account || row.description || "");
      const amount = Math.abs(Number(row.balance || row.Balance || row.amount || row.Amount || 0));
      if (amount === 0) return;
      const matchedPattern = DEBT_LINE_PATTERNS.find((p) => p.pattern.test(account));
      if (matchedPattern) {
        extractedDebts.push({
          id: idCounter++,
          lender: account.trim(),
          facilityType: matchedPattern.facilityType,
          originalAmount: amount,
          currentBalance: amount,
          interestRate: 0,
          maturityDate: ""
        });
      }
    });
    if (extractedDebts.length > 0) {
      updateData({
        ...suppData,
        debtSchedule: extractedDebts
      });
      setShowManualGuide(false);
    }
  };
  const handlePullContingentFromBalanceSheet = () => {
    if (!balanceSheetData) return;
    const extractedContingent = [];
    let idCounter = 1;
    balanceSheetData.forEach((row) => {
      const account = String(row.account || row.Account || row.description || "");
      const amount = Math.abs(Number(row.balance || row.Balance || row.amount || row.Amount || 0));
      if (amount === 0) return;
      const matchedPattern = CONTINGENT_LINE_PATTERNS.find((p) => p.pattern.test(account));
      if (matchedPattern) {
        extractedContingent.push({
          id: idCounter++,
          description: account.trim(),
          estimatedAmount: amount,
          likelihood: "Probable",
          // Already accrued = probable
          notes: `Pulled from Balance Sheet - ${matchedPattern.category}`
        });
      }
    });
    if (extractedContingent.length > 0) {
      updateData({
        ...suppData,
        contingentLiabilities: extractedContingent
      });
      setShowContingentGuide(false);
    }
  };
  const shouldShowGuide = showManualGuide || isDebtEmpty;
  const shouldShowContingentGuide = showContingentGuide || isContingentEmpty;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Supplementary Schedules" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Debt, leases, and contingent liabilities analysis" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total Debt", value: totalDebt, icon: CreditCard }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Annual Lease Payments", value: totalLeasePayments, icon: FileText }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Contingent Liabilities", value: totalContingent, icon: AlertCircle })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "debt", className: "w-full", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [
        /* @__PURE__ */ jsx(TabsTrigger, { value: "debt", children: "Debt Schedule" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "leases", children: "Lease Obligations" }),
        /* @__PURE__ */ jsx(TabsTrigger, { value: "contingent", children: "Contingent Liabilities" })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "debt", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Debt Schedule" }),
          /* @__PURE__ */ jsxs(ButtonGroup, { children: [
            /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowDebtImport(true), children: [
              /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
              "Import from Document"
            ] }),
            /* @__PURE__ */ jsx(ButtonGroupSeparator, {}),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", children: [
                /* @__PURE__ */ jsx(PenLine, { className: "w-4 h-4 mr-2" }),
                "Enter Manually",
                /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 ml-1" })
              ] }) }),
              /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "bg-popover", children: [
                /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setShowManualGuide((prev) => !prev), children: [
                  /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 mr-2" }),
                  showManualGuide ? "Hide Entry Guide" : "Show Entry Guide"
                ] }),
                hasBalanceSheetDebtData && /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: handlePullFromBalanceSheet, children: [
                  /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-4 h-4 mr-2" }),
                  "Pull from Balance Sheet"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          shouldShowGuide && /* @__PURE__ */ jsxs(Alert, { children: [
            /* @__PURE__ */ jsx(PenLine, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx(AlertTitle, { children: "Manual Entry Mode" }),
            /* @__PURE__ */ jsxs(AlertDescription, { className: "mt-2", children: [
              /* @__PURE__ */ jsx("p", { className: "mb-3", children: "No debt schedule document? You can:" }),
              /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-sm", children: [
                /* @__PURE__ */ jsx("li", { children: "Edit values directly in the table below" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "Add new facilities with the ",
                  /* @__PURE__ */ jsx("strong", { children: "+ Add Row" }),
                  " button"
                ] }),
                /* @__PURE__ */ jsx("li", { children: "Total Outstanding calculates automatically" })
              ] }),
              hasBalanceSheetDebtData && /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "secondary",
                  size: "sm",
                  onClick: handlePullFromBalanceSheet,
                  children: [
                    /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-4 h-4 mr-2" }),
                    "Pull Totals from Balance Sheet"
                  ]
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            FinancialTable,
            {
              columns: debtColumns,
              data: suppData.debtSchedule,
              onDataChange: (debtSchedule) => updateData({ ...suppData, debtSchedule }),
              newRowTemplate: { lender: "New Facility", originalAmount: 0, currentBalance: 0, interestRate: 0, maturityDate: "" }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Outstanding Debt" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
              "$",
              totalDebt.toLocaleString()
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "leases", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Home, { className: "h-5 w-5" }),
            "Lease Obligations"
          ] }),
          /* @__PURE__ */ jsxs(ButtonGroup, { children: [
            hasMaterialContractLeases && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowLeaseImport(true), children: [
                /* @__PURE__ */ jsx(Scale, { className: "w-4 h-4 mr-2" }),
                "Pull from Material Contracts"
              ] }),
              /* @__PURE__ */ jsx(ButtonGroupSeparator, {})
            ] }),
            /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
            }, children: [
              /* @__PURE__ */ jsx(PenLine, { className: "w-4 h-4 mr-2" }),
              "Manual Entry"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          isLeaseEmpty && /* @__PURE__ */ jsxs(Alert, { children: [
            /* @__PURE__ */ jsx(Home, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx(AlertTitle, { children: "Lease Obligations" }),
            /* @__PURE__ */ jsxs(AlertDescription, { className: "mt-2", children: [
              /* @__PURE__ */ jsx("p", { className: "mb-3", children: "Enter lease data to analyze operating vs. finance lease impact:" }),
              /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-sm", children: [
                /* @__PURE__ */ jsx("li", { children: "Edit values directly in the table below" }),
                /* @__PURE__ */ jsxs("li", { children: [
                  "Add leases with the ",
                  /* @__PURE__ */ jsx("strong", { children: "+ Add Row" }),
                  " button"
                ] }),
                hasMaterialContractLeases && /* @__PURE__ */ jsx("li", { className: "text-primary font-medium", children: "Or pull from Material Contracts (lease contracts already captured)" })
              ] }),
              hasMaterialContractLeases && /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "secondary",
                  size: "sm",
                  onClick: () => setShowLeaseImport(true),
                  children: [
                    /* @__PURE__ */ jsx(Scale, { className: "w-4 h-4 mr-2" }),
                    "Import from Material Contracts"
                  ]
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            FinancialTable,
            {
              columns: leaseColumns,
              data: suppData.leaseObligations,
              onDataChange: (leaseObligations) => updateData({ ...suppData, leaseObligations }),
              newRowTemplate: { description: "New Lease", type: "Operating", annualPayment: 0, remainingTerm: 0 }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Annual Lease Payments" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
              "$",
              totalLeasePayments.toLocaleString()
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "contingent", children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5" }),
            "Contingent Liabilities"
          ] }),
          /* @__PURE__ */ jsxs(ButtonGroup, { children: [
            hasBalanceSheetContingentData && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: handlePullContingentFromBalanceSheet, children: [
                /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-4 h-4 mr-2" }),
                "Pull from Balance Sheet"
              ] }),
              /* @__PURE__ */ jsx(ButtonGroupSeparator, {})
            ] }),
            /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowContingentGuide((prev) => !prev), children: [
              /* @__PURE__ */ jsx(PenLine, { className: "w-4 h-4 mr-2" }),
              "Manual Entry"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          shouldShowContingentGuide && /* @__PURE__ */ jsxs(Alert, { children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx(AlertTitle, { children: "Contingent Liabilities" }),
            /* @__PURE__ */ jsxs(AlertDescription, { className: "mt-2", children: [
              /* @__PURE__ */ jsx("p", { className: "mb-3", children: "Enter known or potential contingent items for due diligence:" }),
              /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-sm", children: [
                /* @__PURE__ */ jsx("li", { children: "Pending litigation or legal claims" }),
                /* @__PURE__ */ jsx("li", { children: "Warranty obligations and reserves" }),
                /* @__PURE__ */ jsx("li", { children: "Environmental liabilities" }),
                /* @__PURE__ */ jsx("li", { children: "Guarantees and indemnifications" })
              ] }),
              hasBalanceSheetContingentData && /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "secondary",
                  size: "sm",
                  onClick: handlePullContingentFromBalanceSheet,
                  children: [
                    /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-4 h-4 mr-2" }),
                    "Pull Accrued Items from Balance Sheet"
                  ]
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            FinancialTable,
            {
              columns: contingentColumns,
              data: suppData.contingentLiabilities,
              onDataChange: (contingentLiabilities) => updateData({ ...suppData, contingentLiabilities }),
              newRowTemplate: { description: "New Item", estimatedAmount: 0, likelihood: "Possible", notes: "" }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-destructive/10 rounded-lg", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Total Estimated Contingent Liabilities" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold", children: [
              "$",
              totalContingent.toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "These amounts may require disclosure or accrual depending on likelihood" })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(
      DebtScheduleImportDialog,
      {
        open: showDebtImport,
        onOpenChange: setShowDebtImport,
        projectId,
        onImport: handleDebtImport
      }
    ),
    /* @__PURE__ */ jsx(
      LeaseImportDialog,
      {
        open: showLeaseImport,
        onOpenChange: setShowLeaseImport,
        materialContracts,
        onImport: handleLeaseImport
      }
    )
  ] });
};
export {
  SupplementarySection
};
