import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { s as supabase, C as Card, f as CardContent, B as Button, b as CardHeader, d as CardTitle, e as CardDescription, r as parseLocalDate } from "../main.mjs";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { A as Alert, b as AlertDescription } from "./alert-FolYmCWY.js";
import { I as Input } from "./input-CSM87NBF.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-sNpTUd89.js";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { Download, Loader2, FileText, AlertCircle, AlertTriangle, CheckCircle2, Scale, ShieldAlert, Users, Building2, Home, User, Edit3, ChevronDown, BookOpen, Plus, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import "@radix-ui/react-tabs";
import "@radix-ui/react-dialog";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-dropdown-menu";
const confidenceConfig = {
  high: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "High Confidence",
    description: "Contract terms extracted with high accuracy"
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
function MaterialContractsImportDialog({
  open,
  onOpenChange,
  projectId,
  onImport
}) {
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState([]);
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  useEffect(() => {
    if (open) {
      fetchContractData();
    }
  }, [open, projectId]);
  const fetchContractData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("processed_data").select("*").eq("project_id", projectId).eq("data_type", "material_contract").order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      const typedData = (data || []).map((record) => ({
        ...record,
        data: record.data
      }));
      setContractData(typedData);
      setSelectedIds(new Set(typedData.map((d) => d.id)));
    } catch (error) {
      console.error("Error fetching contract data:", error);
      toast.error("Failed to load contract data");
    } finally {
      setLoading(false);
    }
  };
  const toggleSelection = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };
  const handleImport = () => {
    const selectedRecords = contractData.filter((d) => selectedIds.has(d.id));
    const allContracts = [];
    selectedRecords.forEach((record, recordIndex) => {
      record.data.contracts.forEach((contract, contractIndex) => {
        allContracts.push({
          ...contract,
          id: recordIndex * 100 + contractIndex + 1
        });
      });
    });
    if (allContracts.length === 0) {
      toast.error("No contracts selected");
      return;
    }
    onImport(allContracts);
    onOpenChange(false);
    toast.success(`Imported ${allContracts.length} contract(s)`);
  };
  const totalSelected = contractData.filter((d) => selectedIds.has(d.id)).reduce((sum, d) => sum + (d.data.contracts?.length || 0), 0);
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh]", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Download, { className: "h-5 w-5" }),
        "Import Material Contracts"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Select extracted contracts from uploaded documents. You can select multiple documents." })
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "max-h-[50vh]", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : contractData.length === 0 ? /* @__PURE__ */ jsxs(Alert, { children: [
      /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: "No contract documents have been processed yet. Upload material contracts in the Documents section first." })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Select Documents" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          selectedIds.size,
          " selected · ",
          totalSelected,
          " contracts"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: contractData.map((record) => {
        const conf = confidenceConfig[record.data.confidence || "low"];
        const ConfIcon = conf.icon;
        const isSelected = selectedIds.has(record.id);
        const hasCoC = record.data.summary?.hasChangeOfControlRisk;
        return /* @__PURE__ */ jsx(
          Card,
          {
            className: `cursor-pointer transition-colors ${isSelected ? "ring-2 ring-primary" : "hover:bg-muted/50"}`,
            onClick: () => toggleSelection(record.id),
            children: /* @__PURE__ */ jsxs(CardContent, { className: "p-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Scale, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-sm truncate", children: record.data.documentName || "Contract Document" }),
                    hasCoC && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "text-xs gap-1", children: [
                      /* @__PURE__ */ jsx(ShieldAlert, { className: "h-3 w-3" }),
                      "CoC Risk"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1 flex-wrap", children: [
                    /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: `${conf.bgColor} ${conf.color} border-0 text-xs`, children: [
                      /* @__PURE__ */ jsx(ConfIcon, { className: "h-3 w-3 mr-1" }),
                      conf.label
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                      record.data.contracts?.length || 0,
                      " contract(s)"
                    ] }),
                    record.data.contracts?.[0]?.counterparty && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                      "· ",
                      record.data.contracts[0].counterparty
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground text-right", children: new Date(record.created_at).toLocaleDateString() }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: isSelected,
                      onChange: () => toggleSelection(record.id),
                      className: "h-4 w-4 rounded border-input",
                      onClick: (e) => e.stopPropagation()
                    }
                  )
                ] })
              ] }),
              isSelected && record.data.contracts && record.data.contracts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t space-y-2", children: [
                record.data.contracts.slice(0, 2).map((contract, i) => /* @__PURE__ */ jsxs("div", { className: "text-xs p-2 bg-muted/50 rounded", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: contract.counterparty }),
                    /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: contract.contractType })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1 line-clamp-2", children: contract.description }),
                  contract.changeOfControl && contract.changeOfControl.toLowerCase() !== "none" && /* @__PURE__ */ jsxs("div", { className: "mt-1 p-1.5 bg-destructive/10 rounded text-destructive text-xs", children: [
                    /* @__PURE__ */ jsx("strong", { children: "CoC:" }),
                    " ",
                    contract.changeOfControl
                  ] })
                ] }, i)),
                record.data.contracts.length > 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-primary", children: [
                  "+",
                  record.data.contracts.length - 2,
                  " more"
                ] })
              ] })
            ] })
          },
          record.id
        );
      }) })
    ] }) }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: handleImport,
          disabled: selectedIds.size === 0 || loading,
          children: [
            "Import ",
            totalSelected,
            " Contract",
            totalSelected !== 1 ? "s" : ""
          ]
        }
      )
    ] })
  ] }) });
}
const CONTRACT_TYPES = [
  { value: "Customer", label: "Customer", icon: Users },
  { value: "Vendor/Supplier", label: "Vendor/Supplier", icon: Building2 },
  { value: "Lease", label: "Lease", icon: Home },
  { value: "Employment", label: "Employment", icon: User },
  { value: "Other", label: "Other", icon: FileText }
];
const defaultData = {
  contracts: []
};
const MaterialContractsSection = ({
  data,
  updateData,
  projectId
}) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const contractData = { ...defaultData, ...data };
  const contracts = contractData.contracts || [];
  const shouldShowGuidance = showGuidance || contracts.length === 0;
  const formatCurrency = (value) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return parseLocalDate(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };
  const totalContracts = contracts.length;
  const totalValue = contracts.reduce((sum, c) => sum + (c.contractValue || c.annualValue || 0), 0);
  const cocRiskCount = contracts.filter((c) => c.changeOfControl && c.changeOfControl.toLowerCase() !== "none").length;
  const now = /* @__PURE__ */ new Date();
  const oneYearFromNow = /* @__PURE__ */ new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const expiringCount = contracts.filter((c) => {
    if (!c.expirationDate) return false;
    const expDate = new Date(c.expirationDate);
    return expDate >= now && expDate <= oneYearFromNow;
  }).length;
  const contractsByType = CONTRACT_TYPES.map((type) => ({
    ...type,
    contracts: contracts.filter((c) => c.contractType === type.value || type.value === "Other" && !CONTRACT_TYPES.slice(0, -1).some((t) => t.value === c.contractType))
  }));
  const handleImport = (importedContracts) => {
    const maxId = contracts.reduce((max, c) => Math.max(max, c.id || 0), 0);
    const newContracts = importedContracts.map((c, i) => ({
      ...c,
      id: maxId + i + 1
    }));
    updateData({ contracts: [...contracts, ...newContracts] });
  };
  const addContract = (type) => {
    const maxId = contracts.reduce((max, c) => Math.max(max, c.id || 0), 0);
    const newContract = {
      id: maxId + 1,
      contractType: type,
      counterparty: "",
      description: ""
    };
    updateData({ contracts: [...contracts, newContract] });
    setShowGuidance(false);
  };
  const removeContract = (id) => {
    updateData({ contracts: contracts.filter((c) => c.id !== id) });
  };
  const updateContract = (id, field, value) => {
    const updated = contracts.map((c) => {
      if (c.id === id) {
        if (field === "contractValue" || field === "annualValue") {
          return { ...c, [field]: parseFloat(value) || 0 };
        }
        return { ...c, [field]: value };
      }
      return c;
    });
    updateData({ contracts: updated });
  };
  const handleCellClick = (id, field) => {
    setEditingCell({ id, field });
  };
  const handleCellBlur = () => {
    setEditingCell(null);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setEditingCell(null);
    }
  };
  const renderEditableCell = (contract, field, displayValue, type = "text") => {
    const isEditing = editingCell?.id === contract.id && editingCell?.field === field;
    if (isEditing) {
      return /* @__PURE__ */ jsx(
        Input,
        {
          type,
          defaultValue: contract[field]?.toString() || "",
          className: "h-8 w-full min-w-[100px]",
          autoFocus: true,
          onBlur: (e) => {
            updateContract(contract.id, field, e.target.value);
            handleCellBlur();
          },
          onKeyDown: handleKeyDown
        }
      );
    }
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: "cursor-pointer hover:bg-muted/50 px-2 py-1 rounded -mx-2 -my-1 min-h-[28px] flex items-center",
        onClick: () => handleCellClick(contract.id, field),
        children: displayValue || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground italic", children: "Click to edit" })
      }
    );
  };
  const renderContractsTable = (typeContracts, type) => {
    if (typeContracts.length === 0) {
      return /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(FileText, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
          "No ",
          type.toLowerCase(),
          " contracts yet"
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "mt-2",
            onClick: () => addContract(type),
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
              " Add Contract"
            ]
          }
        )
      ] });
    }
    return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { children: "Counterparty" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Description" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Value" }),
          /* @__PURE__ */ jsx(TableHead, { children: "Expiration" }),
          /* @__PURE__ */ jsx(TableHead, { children: "CoC Provision" }),
          /* @__PURE__ */ jsx(TableHead, { className: "w-12" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: typeContracts.map((contract) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            renderEditableCell(contract, "counterparty", contract.counterparty || ""),
            contract.changeOfControl && contract.changeOfControl.toLowerCase() !== "none" && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "text-xs shrink-0", children: [
              /* @__PURE__ */ jsx(ShieldAlert, { className: "h-3 w-3 mr-1" }),
              "CoC"
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "max-w-[200px]", children: renderEditableCell(contract, "description", contract.description || "") }),
          /* @__PURE__ */ jsx(TableCell, { children: renderEditableCell(contract, "contractValue", formatCurrency(contract.contractValue || contract.annualValue), "number") }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-sm", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3 text-muted-foreground shrink-0" }),
            renderEditableCell(contract, "expirationDate", formatDate(contract.expirationDate), "date")
          ] }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "max-w-[150px]", children: renderEditableCell(contract, "changeOfControl", contract.changeOfControl || "") }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => removeContract(contract.id),
              children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-muted-foreground hover:text-destructive" })
            }
          ) })
        ] }, contract.id)) })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          onClick: () => addContract(type),
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
            " Add Contract"
          ]
        }
      )
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Material Contracts" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Review key agreements and change of control provisions" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setImportDialogOpen(true), children: [
          /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-2" }),
          "Import from Document"
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", children: [
            /* @__PURE__ */ jsx(Edit3, { className: "h-4 w-4 mr-2" }),
            "Enter Manually",
            /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 ml-2" })
          ] }) }),
          /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", className: "bg-popover", children: [
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => setShowGuidance(true), children: [
              /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4 mr-2" }),
              "Show Entry Guide"
            ] }),
            /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => addContract("Customer"), children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-2" }),
              "Quick Add Contract"
            ] })
          ] })
        ] })
      ] })
    ] }),
    shouldShowGuidance && /* @__PURE__ */ jsxs(Card, { className: "border-primary/30 bg-primary/5", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4 text-primary" }),
        "Manual Entry Mode"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No contract documents? Enter contract details manually:" }),
        /* @__PURE__ */ jsxs("ul", { className: "text-sm text-muted-foreground list-disc list-inside space-y-1", children: [
          /* @__PURE__ */ jsx("li", { children: "Select a contract type tab (Customer, Vendor, etc.)" }),
          /* @__PURE__ */ jsxs("li", { children: [
            'Click "',
            /* @__PURE__ */ jsx("strong", { children: "+ Add Contract" }),
            '" to add a new entry'
          ] }),
          /* @__PURE__ */ jsx("li", { children: "Click any cell in the table to edit values inline" })
        ] }),
        /* @__PURE__ */ jsxs(Alert, { className: "mt-3 border-amber-500/50 bg-amber-500/10", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-amber-600" }),
          /* @__PURE__ */ jsxs(AlertDescription, { className: "text-sm", children: [
            /* @__PURE__ */ jsx("strong", { children: "IMPORTANT:" }),
            " Always capture Change of Control provisions. These can terminate contracts upon acquisition and should be flagged for legal review during due diligence."
          ] })
        ] }),
        contracts.length > 0 && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowGuidance(false), className: "mt-2", children: "Hide Guide" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total Contracts", value: totalContracts, icon: Scale, isCurrency: false }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total Value", value: totalValue, icon: FileText }),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Expiring Soon",
          value: expiringCount,
          icon: Calendar,
          isCurrency: false,
          className: expiringCount > 0 ? "border-amber-500/50" : ""
        }
      ),
      /* @__PURE__ */ jsxs(Card, { className: cocRiskCount > 0 ? "border-destructive" : "", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(CardDescription, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ShieldAlert, { className: "h-4 w-4" }),
          "Change of Control Risk"
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: `text-2xl font-bold ${cocRiskCount > 0 ? "text-destructive" : ""}`, children: cocRiskCount > 0 ? `${cocRiskCount} contract${cocRiskCount !== 1 ? "s" : ""}` : "None" }) })
      ] })
    ] }),
    cocRiskCount > 0 && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsx(ShieldAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        /* @__PURE__ */ jsxs("strong", { children: [
          cocRiskCount,
          " contract",
          cocRiskCount !== 1 ? "s" : ""
        ] }),
        " ha",
        cocRiskCount !== 1 ? "ve" : "s",
        " change of control provisions that may impact the transaction. Review these carefully during due diligence."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "Customer", className: "w-full", children: [
      /* @__PURE__ */ jsx(TabsList, { className: "grid w-full grid-cols-5", children: CONTRACT_TYPES.map((type) => /* @__PURE__ */ jsxs(TabsTrigger, { value: type.value, className: "gap-2", children: [
        /* @__PURE__ */ jsx(type.icon, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: type.label }),
        contractsByType.find((t) => t.value === type.value).contracts.length > 0 && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1", children: contractsByType.find((t) => t.value === type.value).contracts.length })
      ] }, type.value)) }),
      CONTRACT_TYPES.map((type) => /* @__PURE__ */ jsx(TabsContent, { value: type.value, children: /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(type.icon, { className: "h-5 w-5" }),
          type.label,
          " Contracts"
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: renderContractsTable(
          contractsByType.find((t) => t.value === type.value).contracts,
          type.value
        ) })
      ] }) }, type.value))
    ] }),
    /* @__PURE__ */ jsx(
      MaterialContractsImportDialog,
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
  MaterialContractsSection
};
