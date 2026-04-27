import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { g as getFiscalYears, a as getLTMReferencePeriods, b as getYTDReferencePeriods, p as parseCurrencyInput, S as SHORT_MONTHS, f as formatCurrency, d as calculateFYTotalForYear, e as calculateLTMAtPeriod, h as calculateYTDAtPeriod, i as calculateBalanceCheck, t as transformQbTrialBalanceData, m as mergeAccounts, c as crossReferenceWithCOA, j as createEmptyAccount } from "./trialBalanceUtils-BTe9uefW.js";
import { m as cn, n as Tooltip, o as TooltipTrigger, p as TooltipContent, B as Button, s as supabase, t as toast } from "../main.mjs";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./dropdown-menu-CfWYww5V.js";
import { CheckCircle2, AlertCircle, Trash2, Plus, Lock, ArrowRight, Loader2, RefreshCw, Upload, ChevronDown, X, FileUp, Database, Sparkles } from "lucide-react";
import { A as Alert, a as AlertTitle, b as AlertDescription } from "./alert-FolYmCWY.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { I as Input } from "./input-CSM87NBF.js";
import { i as isTBCacheIncomplete } from "./loadTrialBalanceFromProcessedData-BKEnTKAJ.js";
import { C as CoreDataGuideBanner } from "./CoreDataGuideBanner-DUt6n3v6.js";
import { D as DocumentChecklistReference } from "./DocumentChecklistReference-BfK18ncS.js";
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
import "@radix-ui/react-dropdown-menu";
import "./progress-DNO9VJ6D.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "date-fns";
import "./documentChecklist-BAkBsBzh.js";
function MultiPeriodTable({
  accounts,
  periods,
  fiscalYearEnd,
  onAccountsChange,
  onAddAccount,
  showMatchIndicators = false
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const tableRef = useRef(null);
  const displayPeriods = periods;
  const regularPeriods = periods.filter((p) => !p.isStub);
  const fiscalYears = useMemo(() => getFiscalYears(regularPeriods, fiscalYearEnd), [regularPeriods, fiscalYearEnd]);
  const ltmPeriods = useMemo(() => getLTMReferencePeriods(regularPeriods, fiscalYearEnd), [regularPeriods, fiscalYearEnd]);
  const ytdPeriods = useMemo(() => getYTDReferencePeriods(regularPeriods, fiscalYearEnd), [regularPeriods, fiscalYearEnd]);
  const displayAccounts = useMemo(() => {
    const sortedPeriodIds = regularPeriods.map((p) => p.id);
    const fyStartMonth = fiscalYearEnd % 12 + 1;
    const parsePeriodMonth = (periodId) => {
      const match = periodId.match(/(\d{4})-(\d{2})/);
      if (match) return parseInt(match[2], 10);
      return void 0;
    };
    return accounts.map((acc) => {
      if (acc.fsType !== "IS") return acc;
      const balances = { ...acc.monthlyValues };
      const orderedIds = sortedPeriodIds.filter((id) => id in balances);
      for (let i = orderedIds.length - 1; i > 0; i--) {
        const curMonth = parsePeriodMonth(orderedIds[i]);
        const prevMonth = parsePeriodMonth(orderedIds[i - 1]);
        if (curMonth === fyStartMonth) continue;
        if (prevMonth !== void 0 && curMonth !== void 0) {
          balances[orderedIds[i]] -= balances[orderedIds[i - 1]];
        }
      }
      return { ...acc, monthlyValues: balances };
    });
  }, [accounts, regularPeriods, fiscalYearEnd]);
  const handleCellClick = useCallback((accountId, periodId, currentValue) => {
    setEditingCell({ accountId, periodId });
    setEditValue(currentValue === 0 ? "" : String(currentValue));
  }, []);
  const handleCellBlur = useCallback(() => {
    if (editingCell) {
      const newValue = parseCurrencyInput(editValue);
      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === editingCell.accountId) {
          return {
            ...acc,
            monthlyValues: {
              ...acc.monthlyValues,
              [editingCell.periodId]: newValue
            }
          };
        }
        return acc;
      });
      onAccountsChange(updatedAccounts);
      setEditingCell(null);
      setEditValue("");
    }
  }, [editingCell, editValue, accounts, onAccountsChange]);
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  }, [handleCellBlur]);
  const handleRemoveAccount = useCallback((accountId) => {
    onAccountsChange(accounts.filter((acc) => acc.id !== accountId));
  }, [accounts, onAccountsChange]);
  const handleMetadataChange = useCallback((accountId, field, value) => {
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === accountId) {
        return { ...acc, [field]: value };
      }
      return acc;
    });
    onAccountsChange(updatedAccounts);
  }, [accounts, onAccountsChange]);
  const getBalanceCheck = (periodId) => calculateBalanceCheck(displayAccounts, periodId);
  return /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg overflow-hidden relative", children: [
    /* @__PURE__ */ jsx("div", { className: "overflow-auto max-h-[calc(100vh-280px)]", ref: tableRef, children: /* @__PURE__ */ jsxs("div", { className: "min-w-max", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex bg-muted border-b-2 border-border sticky top-0 z-20 shadow-[0_2px_4px_-1px_hsl(var(--border)/0.5)]", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex sticky left-0 z-30 bg-muted shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border", children: "FS" }),
          /* @__PURE__ */ jsx("div", { className: "w-20 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border", children: "Acct #" }),
          /* @__PURE__ */ jsx("div", { className: "w-48 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border", children: "Account Name" }),
          /* @__PURE__ */ jsx("div", { className: "w-44 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border", children: "FS Line Item" }),
          /* @__PURE__ */ jsx("div", { className: "w-36 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border", children: "Sub-acct 1" }),
          /* @__PURE__ */ jsx("div", { className: "w-36 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border border-r-2", children: "Sub-acct 2" })
        ] }),
        displayPeriods.map((period) => /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "w-28 px-2 py-2.5 text-xs font-semibold text-muted-foreground text-right border-r border-border bg-muted",
              period.isStub && "bg-accent/50 italic"
            ),
            children: period.label
          },
          period.id
        )),
        fiscalYears.map((fy) => /* @__PURE__ */ jsxs("div", { className: "w-28 px-2 py-2.5 text-xs font-semibold text-primary text-right border-r border-border bg-primary/10", children: [
          "FY",
          fy.toString().slice(-2)
        ] }, `fy-${fy}`)),
        ltmPeriods.map((p) => /* @__PURE__ */ jsxs("div", { className: "w-28 px-2 py-2.5 text-xs font-semibold text-primary text-right border-r border-border bg-primary/10", children: [
          "LTM ",
          SHORT_MONTHS[p.month - 1],
          "-",
          p.year.toString().slice(-2)
        ] }, `ltm-${p.id}`)),
        ytdPeriods.map((p) => /* @__PURE__ */ jsxs("div", { className: "w-28 px-2 py-2.5 text-xs font-semibold text-primary text-right border-r border-border bg-primary/10", children: [
          "YTD ",
          SHORT_MONTHS[p.month - 1],
          "-",
          p.year.toString().slice(-2)
        ] }, `ytd-${p.id}`)),
        /* @__PURE__ */ jsx("div", { className: "w-12 px-2 py-2.5 sticky right-0 z-30 bg-muted" })
      ] }),
      displayAccounts.map((account, index) => {
        const isMatched = account._matchedFromCOA;
        const showIndicator = showMatchIndicators && isMatched !== void 0;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              `flex border-b border-border hover:bg-accent/50`,
              index % 2 === 0 ? "bg-background" : "bg-muted/30",
              showIndicator && !isMatched && "border-l-2 border-l-amber-400"
            ),
            children: [
              /* @__PURE__ */ jsxs("div", { className: cn("flex sticky left-0 z-10 shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]", index % 2 === 0 ? "bg-background" : "bg-muted"), children: [
                /* @__PURE__ */ jsxs("div", { className: "w-16 px-1 py-2 border-r border-border flex items-center gap-1", children: [
                  showIndicator && /* @__PURE__ */ jsxs(Tooltip, { children: [
                    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx("span", { className: "flex-shrink-0", children: isMatched ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3 text-green-600" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "h-3 w-3 text-amber-500" }) }) }),
                    /* @__PURE__ */ jsx(TooltipContent, { children: isMatched ? "Matched from Chart of Accounts" : "No COA match - verify classification" })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: account.fsType,
                      onChange: (e) => handleMetadataChange(account.id, "fsType", e.target.value),
                      className: "w-full h-8 text-xs bg-transparent border-0 focus:ring-1 focus:ring-ring rounded",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "BS", children: "BS" }),
                        /* @__PURE__ */ jsx("option", { value: "IS", children: "IS" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "w-20 px-1 py-2 border-r border-border", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: account.accountNumber,
                    onChange: (e) => handleMetadataChange(account.id, "accountNumber", e.target.value),
                    className: "h-8 text-xs px-1",
                    placeholder: "#"
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "w-48 px-1 py-2 border-r border-border", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: account.accountName,
                    onChange: (e) => handleMetadataChange(account.id, "accountName", e.target.value),
                    className: "h-8 text-xs px-1",
                    placeholder: "Account name"
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "w-44 px-1 py-2 border-r border-border", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: account.fsLineItem || "",
                    onChange: (e) => handleMetadataChange(account.id, "fsLineItem", e.target.value),
                    className: "h-8 text-xs px-1 w-full truncate",
                    placeholder: "FS Line Item"
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "w-36 px-1 py-2 border-r border-border", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: account.subAccount1 || "",
                    onChange: (e) => handleMetadataChange(account.id, "subAccount1", e.target.value),
                    className: "h-8 text-xs px-1 w-full truncate",
                    placeholder: "Sub-acct 1"
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "w-36 px-1 py-2 border-r border-border border-r-2", children: /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: account.subAccount2 || "",
                    onChange: (e) => handleMetadataChange(account.id, "subAccount2", e.target.value),
                    className: "h-8 text-xs px-1 w-full truncate",
                    placeholder: "Sub-acct 2"
                  }
                ) })
              ] }),
              displayPeriods.map((period) => {
                const value = account.monthlyValues[period.id] || 0;
                const isEditing = editingCell?.accountId === account.id && editingCell?.periodId === period.id;
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: cn("w-28 px-1 py-2 border-r border-border", period.isStub && "bg-accent/20"),
                    onClick: () => !isEditing && handleCellClick(account.id, period.id, value),
                    children: isEditing ? /* @__PURE__ */ jsx(
                      Input,
                      {
                        value: editValue,
                        onChange: (e) => setEditValue(e.target.value),
                        onBlur: handleCellBlur,
                        onKeyDown: handleKeyDown,
                        className: "h-8 text-xs text-right px-1",
                        autoFocus: true
                      }
                    ) : /* @__PURE__ */ jsx("div", { className: `h-8 flex items-center justify-end text-xs cursor-pointer hover:bg-accent/50 rounded px-1 ${value < 0 ? "text-destructive" : ""}`, children: formatCurrency(value) })
                  },
                  period.id
                );
              }),
              fiscalYears.map((fy) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-1.5 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end font-medium", children: formatCurrency(calculateFYTotalForYear(account, periods, fiscalYearEnd, fy)) }, `fy-${fy}`)),
              ltmPeriods.map((p) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-1.5 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end font-medium", children: formatCurrency(calculateLTMAtPeriod(account, periods, p)) }, `ltm-${p.id}`)),
              ytdPeriods.map((p) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-1.5 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end font-medium", children: formatCurrency(calculateYTDAtPeriod(account, periods, fiscalYearEnd, p)) }, `ytd-${p.id}`)),
              /* @__PURE__ */ jsx("div", { className: cn("w-12 px-1 py-2 flex items-center justify-center sticky right-0 z-10", index % 2 === 0 ? "bg-background" : "bg-muted"), children: /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  onClick: () => handleRemoveAccount(account.id),
                  className: "h-8 w-8 p-0 text-muted-foreground hover:text-destructive",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                }
              ) })
            ]
          },
          account.id
        );
      }),
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-border bg-muted/40", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex sticky left-0 z-10 bg-muted/40 shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 px-2 py-2.5 text-xs font-semibold border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-20 px-2 py-2.5 text-xs font-semibold border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-48 px-2 py-2.5 text-xs font-semibold border-r border-border", children: "Balance Sheet Total" }),
          /* @__PURE__ */ jsx("div", { className: "w-44 px-2 py-2.5 border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-36 px-2 py-2.5 border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-36 px-2 py-2.5 border-r border-border border-r-2" })
        ] }),
        displayPeriods.map((period) => /* @__PURE__ */ jsx("div", { className: cn("w-28 px-2 py-2.5 text-xs text-right border-r border-border font-medium", period.isStub && "bg-accent/20"), children: formatCurrency(getBalanceCheck(period.id).bsTotal) }, period.id)),
        fiscalYears.map((fy) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `fy-${fy}`)),
        ltmPeriods.map((p) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `ltm-${p.id}`)),
        ytdPeriods.map((p) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `ytd-${p.id}`)),
        /* @__PURE__ */ jsx("div", { className: "w-12 sticky right-0 bg-muted/40" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-border bg-muted/40", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex sticky left-0 z-10 bg-muted/40 shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 px-2 py-2.5 text-xs font-semibold border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-20 px-2 py-2.5 text-xs font-semibold border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-48 px-2 py-2.5 text-xs font-semibold border-r border-border", children: "Income Statement Total" }),
          /* @__PURE__ */ jsx("div", { className: "w-44 px-2 py-2.5 border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-36 px-2 py-2.5 border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-36 px-2 py-2.5 border-r border-border border-r-2" })
        ] }),
        displayPeriods.map((period) => /* @__PURE__ */ jsx("div", { className: cn("w-28 px-2 py-2.5 text-xs text-right border-r border-border font-medium", period.isStub && "bg-accent/20"), children: formatCurrency(getBalanceCheck(period.id).isTotal) }, period.id)),
        fiscalYears.map((fy) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `fy-${fy}`)),
        ltmPeriods.map((p) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `ltm-${p.id}`)),
        ytdPeriods.map((p) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `ytd-${p.id}`)),
        /* @__PURE__ */ jsx("div", { className: "w-12 sticky right-0 bg-muted/40" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex bg-muted/60", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex sticky left-0 z-10 bg-muted/60 shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 px-2 py-2.5 text-xs font-semibold border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-20 px-2 py-2.5 text-xs font-semibold border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-48 px-2 py-2.5 text-xs font-bold border-r border-border", children: "Check (should be 0)" }),
          /* @__PURE__ */ jsx("div", { className: "w-44 px-2 py-2.5 border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-36 px-2 py-2.5 border-r border-border" }),
          /* @__PURE__ */ jsx("div", { className: "w-36 px-2 py-2.5 border-r border-border border-r-2" })
        ] }),
        displayPeriods.map((period) => {
          const check = getBalanceCheck(period.id).checkTotal;
          const isBalanced = Math.abs(check) < 0.01;
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: cn("w-28 px-2 py-2.5 text-xs text-right border-r border-border font-bold", isBalanced ? "text-green-600" : "text-destructive", period.isStub && "bg-accent/20"),
              children: formatCurrency(check)
            },
            period.id
          );
        }),
        fiscalYears.map((fy) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `fy-${fy}`)),
        ltmPeriods.map((p) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `ltm-${p.id}`)),
        ytdPeriods.map((p) => /* @__PURE__ */ jsx("div", { className: "w-28 px-2 py-2.5 border-r border-border bg-primary/5" }, `ytd-${p.id}`)),
        /* @__PURE__ */ jsx("div", { className: "w-12 sticky right-0 bg-muted/60" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-border bg-muted/20", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: onAddAccount, className: "gap-2", children: [
      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
      "Add Account"
    ] }) })
  ] });
}
const TrialBalanceSection = ({
  projectId,
  data,
  updateData,
  periods = [],
  fiscalYearEnd = 12,
  coaAccounts = [],
  onNavigate,
  onSave,
  wizardData = {}
}) => {
  const accounts = data.accounts || [];
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [processingDocIds, setProcessingDocIds] = useState([]);
  const [showDismiss, setShowDismiss] = useState(false);
  const fileInputRef = useRef(null);
  const updateDataRef = useRef(updateData);
  useEffect(() => {
    updateDataRef.current = updateData;
  }, [updateData]);
  const accountsRef = useRef(accounts);
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);
  const [isGLDerivedCOA, setIsGLDerivedCOA] = useState(false);
  useEffect(() => {
    if (!projectId) return;
    supabase.from("processed_data").select("id").eq("project_id", projectId).eq("data_type", "chart_of_accounts").eq("source_type", "derived_from_gl").limit(1).then(({ data: records }) => {
      setIsGLDerivedCOA(!!(records && records.length > 0));
    });
  }, [projectId]);
  const outOfBalancePeriods = useMemo(() => {
    if (!isGLDerivedCOA || accounts.length === 0) return [];
    return periods.filter((p) => !p.isStub).filter((p) => {
      const check = calculateBalanceCheck(accounts, p.id);
      return Math.abs(check.checkTotal) >= 0.01;
    });
  }, [isGLDerivedCOA, accounts, periods]);
  const matchStats = useMemo(() => {
    if (!coaAccounts?.length || !accounts.length) return null;
    let matched = 0;
    let unmatched = 0;
    accounts.forEach((acc) => {
      if (acc._matchedFromCOA === true) matched++;
      else if (acc._matchedFromCOA === false) unmatched++;
    });
    if (matched === 0 && unmatched === 0) return null;
    return { matched, unmatched, total: accounts.length };
  }, [accounts, coaAccounts]);
  const handleAccountsChange = (newAccounts) => {
    updateData({ ...data, accounts: newAccounts });
  };
  const handleAddAccount = () => {
    const newAccount = createEmptyAccount();
    handleAccountsChange([...accounts, newAccount]);
  };
  const loadFromProcessedData = useCallback(async () => {
    const regularPeriods = periods.filter((p) => !p.isStub);
    if (regularPeriods.length === 0) {
      console.log("[TrialBalance] loadFromProcessedData skipped, no periods configured");
      return false;
    }
    console.log("[TrialBalance] loadFromProcessedData: querying processed_data...");
    const { data: processedDataList, error } = await supabase.from("processed_data").select("*").eq("project_id", projectId).eq("data_type", "trial_balance").order("period_start", { ascending: true }).limit(1e6);
    if (error) {
      console.error("[TrialBalance] loadFromProcessedData error:", error);
      return false;
    }
    if (!processedDataList || processedDataList.length === 0) {
      console.log("[TrialBalance] loadFromProcessedData: no processed TB data found");
      return false;
    }
    console.log("[TrialBalance] loadFromProcessedData: found", processedDataList.length, "processed TB records");
    let mergedAccounts = [];
    for (const processedData of processedDataList) {
      if (processedData?.data) {
        const dataWithDate = {
          ...processedData.data,
          reportDate: processedData.period_end || processedData.period_start
        };
        console.log("[TrialBalance] loadFromProcessedData processing period:", processedData.period_start, "→", processedData.period_end);
        const newAccounts = transformQbTrialBalanceData(dataWithDate, periods);
        if (newAccounts.length > 0) {
          mergedAccounts = mergeAccounts(mergedAccounts, newAccounts);
        }
      }
    }
    const allMatched = mergedAccounts.every((acc) => acc._matchedFromCOA === true);
    if (!allMatched && coaAccounts && coaAccounts.length > 0 && mergedAccounts.length > 0) {
      console.log("[TrialBalance] loadFromProcessedData: applying COA cross-reference");
      const { accounts: enriched } = crossReferenceWithCOA(mergedAccounts, coaAccounts);
      mergedAccounts = enriched;
    }
    if (mergedAccounts.length > 0) {
      console.log("[TrialBalance] loadFromProcessedData: loaded", mergedAccounts.length, "accounts from", processedDataList.length, "periods");
      updateDataRef.current({ accounts: mergedAccounts });
      regularPeriods.map((p) => p.id || `${p.year}-${String(p.month).padStart(2, "0")}`);
      const populatedPeriods = /* @__PURE__ */ new Set();
      mergedAccounts.forEach((acc) => {
        Object.keys(acc.monthlyValues || {}).forEach((pid) => {
          if (acc.monthlyValues[pid] !== 0) populatedPeriods.add(pid);
        });
      });
      const populatedCount = populatedPeriods.size;
      if (populatedCount > 0 && populatedCount < regularPeriods.length) {
        toast({
          title: "Partial period coverage",
          description: `Data loaded for ${populatedCount} of ${regularPeriods.length} configured periods. Upload additional files to fill remaining periods.`
        });
      } else {
        toast({
          title: "Trial Balance loaded",
          description: `Loaded ${mergedAccounts.length} accounts from ${processedDataList.length} period(s).`
        });
      }
      return true;
    }
    console.warn("[TrialBalance] loadFromProcessedData: processed records exist but produced 0 usable accounts");
    toast({
      title: "Trial balance data issue",
      description: "A trial balance file was processed but contained no usable data. Try re-uploading or check the file format.",
      variant: "destructive"
    });
    return false;
  }, [projectId, periods, coaAccounts]);
  useEffect(() => {
    const shouldRebuild = accountsRef.current.length === 0 || isTBCacheIncomplete(accountsRef.current, periods);
    if (!shouldRebuild) {
      console.log("[TrialBalance] Auto-import skipped, already have", accountsRef.current.length, "accounts with sufficient coverage");
      return;
    }
    let retryTimer = null;
    const run = async () => {
      const loaded = await loadFromProcessedData();
      if (!loaded && accountsRef.current.length === 0) {
        console.log("[TrialBalance] Auto-import: retrying in 3s...");
        retryTimer = setTimeout(async () => {
          if (accountsRef.current.length === 0) {
            await loadFromProcessedData();
          }
        }, 3e3);
      }
    };
    run();
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [projectId, periods.length, coaAccounts?.length]);
  useEffect(() => {
    if (processingDocIds.length === 0) return;
    const completedDocs = /* @__PURE__ */ new Set();
    const channel = supabase.channel(`tb-processing-batch-${projectId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "processed_data"
      },
      (payload) => {
        const processedData = payload.new;
        const docId = processedData.source_document_id;
        if (!processingDocIds.includes(docId) || completedDocs.has(docId)) return;
        completedDocs.add(docId);
        console.log("[TrialBalance] Received processed data for doc:", docId, `(${completedDocs.size}/${processingDocIds.length})`);
        if (processedData?.data) {
          let newAccounts = transformQbTrialBalanceData(processedData.data, periods);
          const allMatched = newAccounts.every((acc) => acc._matchedFromCOA === true);
          if (!allMatched && coaAccounts && coaAccounts.length > 0 && newAccounts.length > 0) {
            const { accounts: enriched } = crossReferenceWithCOA(newAccounts, coaAccounts);
            newAccounts = enriched;
          }
          if (newAccounts.length > 0) {
            const currentAccounts = mergeAccounts(accountsRef.current, newAccounts);
            updateDataRef.current({ accounts: currentAccounts });
          }
        }
        if (completedDocs.size === processingDocIds.length) {
          setProcessingDocIds([]);
          setIsUploading(false);
          toast({
            title: "Import complete",
            description: `Processed ${completedDocs.size} trial balance file(s)`
          });
        }
      }
    ).subscribe();
    const catchUp = async () => {
      const { data: existing } = await supabase.from("processed_data").select("*").in("source_document_id", processingDocIds).eq("project_id", projectId).limit(1e6);
      if (existing && existing.length > 0) {
        for (const processedData of existing) {
          const docId = processedData.source_document_id;
          if (!docId || completedDocs.has(docId)) continue;
          completedDocs.add(docId);
          if (processedData?.data) {
            let newAccounts = transformQbTrialBalanceData(processedData.data, periods);
            const allMatched = newAccounts.every((acc) => acc._matchedFromCOA === true);
            if (!allMatched && coaAccounts && coaAccounts.length > 0 && newAccounts.length > 0) {
              const { accounts: enriched } = crossReferenceWithCOA(newAccounts, coaAccounts);
              newAccounts = enriched;
            }
            if (newAccounts.length > 0) {
              const currentAccounts = mergeAccounts(accountsRef.current, newAccounts);
              updateDataRef.current({ accounts: currentAccounts });
            }
          }
        }
        if (completedDocs.size >= processingDocIds.length) {
          setProcessingDocIds([]);
          setIsUploading(false);
          toast({
            title: "Import complete",
            description: `Processed ${completedDocs.size} trial balance file(s)`
          });
        }
      }
    };
    catchUp();
    const pollInterval = setInterval(async () => {
      if (processingDocIds.length === 0) return;
      const { data: docs } = await supabase.from("documents").select("id, processing_status").in("id", processingDocIds);
      if (docs) {
        const allDone = docs.every(
          (d) => d.processing_status === "completed" || d.processing_status === "failed"
        );
        if (allDone) {
          console.log("[TrialBalance] Poll safety net: clearing stuck processing state");
          await loadFromProcessedData();
          setProcessingDocIds([]);
          setIsUploading(false);
          clearInterval(pollInterval);
        }
      }
    }, 1e4);
    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [processingDocIds, periods, projectId, coaAccounts, loadFromProcessedData]);
  const handleManualLoad = useCallback(async () => {
    setIsManualLoading(true);
    try {
      const loaded = await loadFromProcessedData();
      if (!loaded) {
        toast({
          title: "No trial balance found",
          description: "No processed trial balance data available yet. Upload or sync data first."
        });
      }
    } finally {
      setIsManualLoading(false);
    }
  }, [loadFromProcessedData]);
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const fileArray = Array.from(files);
    const uploadedDocIds = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      for (const file of fileArray) {
        const filePath = `${user.id}/${projectId}/trial-balance/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: docData, error: docError } = await supabase.from("documents").insert({
          project_id: projectId,
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          category: "trial_balance",
          account_type: "trial_balance",
          processing_status: "pending"
        }).select().single();
        if (docError) throw docError;
        uploadedDocIds.push(docData.id);
        supabase.functions.invoke("process-quickbooks-file", {
          body: { documentId: docData.id }
        });
      }
      setProcessingDocIds(uploadedDocIds);
      toast({
        title: "Processing files",
        description: `Processing ${fileArray.length} trial balance file(s)...`
      });
    } catch (error) {
      console.error("[TrialBalance] Upload error:", error);
      setIsUploading(false);
      setProcessingDocIds([]);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file"
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleImportFromDocuments = async () => {
    const regularPeriods = periods.filter((p) => !p.isStub);
    if (regularPeriods.length === 0) {
      toast({
        variant: "destructive",
        title: "Periods not configured",
        description: "Please set and save Financial Periods in Project Setup first."
      });
      return;
    }
    setIsImporting(true);
    try {
      const { data: processedDataList, error } = await supabase.from("processed_data").select("*").eq("project_id", projectId).eq("data_type", "trial_balance").order("created_at", { ascending: true }).limit(1e6);
      if (error) throw error;
      if (!processedDataList || processedDataList.length === 0) {
        toast({
          title: "No trial balance found",
          description: "Upload a trial balance file first in Document Upload or use the Upload File option."
        });
        return;
      }
      let mergedAccounts = [...accountsRef.current];
      let importedCount = 0;
      for (const processedData of processedDataList) {
        if (processedData?.data) {
          const dataWithDate = {
            ...processedData.data,
            reportDate: processedData.period_end || processedData.period_start
          };
          const newAccounts = transformQbTrialBalanceData(dataWithDate, periods);
          if (newAccounts.length > 0) {
            mergedAccounts = mergeAccounts(mergedAccounts, newAccounts);
            importedCount++;
          }
        }
      }
      if (coaAccounts && coaAccounts.length > 0 && mergedAccounts.length > 0) {
        const { accounts: enriched, matchStats: stats } = crossReferenceWithCOA(mergedAccounts, coaAccounts);
        mergedAccounts = enriched;
        if (importedCount > 0) {
          updateDataRef.current({ accounts: mergedAccounts });
          toast({
            title: "Import successful",
            description: `Imported ${importedCount} file(s). ${stats.matched} accounts matched with COA, ${stats.unmatched} unmatched.`
          });
        }
      } else if (importedCount > 0) {
        updateDataRef.current({ accounts: mergedAccounts });
        toast({
          title: "Import successful",
          description: `Imported ${importedCount} file(s). Upload Chart of Accounts first for auto-classification.`
        });
      }
      if (importedCount === 0) {
        toast({
          title: "No accounts found",
          description: "The trial balance data could not be mapped to your configured periods."
        });
      }
    } catch (error) {
      console.error("[TrialBalance] Import error:", error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import trial balance"
      });
    } finally {
      setIsImporting(false);
    }
  };
  const hasNoPeriods = periods.filter((p) => !p.isStub).length === 0;
  const isProcessing = isUploading || processingDocIds.length > 0;
  useEffect(() => {
    if (!isProcessing) {
      setShowDismiss(false);
      return;
    }
    const timer = setTimeout(() => setShowDismiss(true), 5e3);
    return () => clearTimeout(timer);
  }, [isProcessing]);
  const handleDismissProcessing = useCallback(async () => {
    setProcessingDocIds([]);
    setIsUploading(false);
    setShowDismiss(false);
    await loadFromProcessedData();
  }, [loadFromProcessedData]);
  const isQBUser = wizardData?.chartOfAccounts?.syncSource === "quickbooks";
  const settings = wizardData?.settings || {};
  const coreDataGuideComplete = settings.coreDataGuideComplete === true;
  const coaLocked = coaAccounts.length === 0 && !isQBUser;
  const handleDismissGuide = () => {
    onSave?.({
      wizard_data: {
        ...wizardData,
        settings: { ...settings, coreDataGuideComplete: true }
      }
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx(
      CoreDataGuideBanner,
      {
        currentStep: 2,
        onNavigate: (p, s) => onNavigate?.(p, s),
        onDismiss: handleDismissGuide,
        isQBUser,
        hasCOA: coaAccounts.length > 0,
        hasTB: accounts.length > 0,
        visible: !coreDataGuideComplete && !!settings.onboardingComplete
      }
    ) }),
    coaLocked ? /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center max-w-md space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx(Lock, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Chart of Accounts Required" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Upload or sync your Chart of Accounts first so Trial Balance accounts can be properly classified with the correct FS Type and Category." }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "default",
          className: "gap-2",
          onClick: () => onNavigate?.(2, 1),
          children: [
            "Go to Chart of Accounts ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Trial Balance" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Enter account data for each period to build your QoE analysis" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          accounts.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-xs", children: [
            accounts.length,
            " ",
            accounts.length === 1 ? "account" : "accounts"
          ] }),
          matchStats && matchStats.matched > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3 h-3 mr-1" }),
            matchStats.matched,
            " matched from COA"
          ] }),
          matchStats && matchStats.unmatched > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3 mr-1" }),
            matchStats.unmatched,
            " unmatched"
          ] }),
          accounts.length === 0 && !isProcessing && !isImporting && /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "gap-2",
              onClick: handleManualLoad,
              disabled: isManualLoading,
              children: [
                isManualLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                "Load from processed data"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", className: "gap-2", disabled: isProcessing || isImporting, children: isProcessing ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              " Processing ",
              processingDocIds.length > 0 ? `(${processingDocIds.length})` : "",
              "..."
            ] }) : isImporting ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              " Importing..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
              " Import ",
              /* @__PURE__ */ jsx(ChevronDown, { className: "w-3 h-3" })
            ] }) }) }),
            isProcessing && showDismiss && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: handleDismissProcessing, title: "Dismiss processing", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "end", children: [
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: () => fileInputRef.current?.click(), className: "gap-2", children: [
                /* @__PURE__ */ jsx(FileUp, { className: "w-4 h-4" }),
                "Upload Files (Excel/PDF)"
              ] }),
              /* @__PURE__ */ jsxs(DropdownMenuItem, { onClick: handleImportFromDocuments, className: "gap-2", children: [
                /* @__PURE__ */ jsx(Database, { className: "w-4 h-4" }),
                "Import from Documents"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: ".xlsx,.xls,.pdf",
              multiple: true,
              onChange: handleFileUpload,
              className: "hidden"
            }
          )
        ] })
      ] }),
      accounts.length > 0 && /* @__PURE__ */ jsxs(Alert, { className: "mb-4 bg-primary/5 border-primary/20", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
        /* @__PURE__ */ jsx(AlertTitle, { className: "text-primary", children: "AI-Powered Balance Verification" }),
        /* @__PURE__ */ jsxs(AlertDescription, { className: "text-sm", children: [
          "The AI Assistant can verify your Trial Balance is balanced (BS + IS = 0) for all periods, identify unusual monthly variances, and flag accounts not found in your Chart of Accounts. Try asking: ",
          /* @__PURE__ */ jsx("strong", { children: '"Is my Trial Balance balanced for all periods?"' }),
          " or",
          /* @__PURE__ */ jsx("strong", { children: '"Which accounts have unusual monthly fluctuations?"' })
        ] })
      ] }),
      (!coaAccounts || coaAccounts.length === 0) && accounts.length > 0 && /* @__PURE__ */ jsxs(Alert, { className: "mb-4 bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-amber-600 dark:text-amber-400" }),
        /* @__PURE__ */ jsx(AlertTitle, { className: "text-amber-800 dark:text-amber-200", children: "No Chart of Accounts found" }),
        /* @__PURE__ */ jsx(AlertDescription, { className: "text-amber-700 dark:text-amber-300", children: "Upload your Chart of Accounts first for automatic account classification. Without it, you'll need to manually set FS Type and Category for each account." })
      ] }),
      outOfBalancePeriods.length > 0 && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "mb-4", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx(AlertTitle, { children: "Trial Balance out of balance" }),
        /* @__PURE__ */ jsxs(AlertDescription, { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            outOfBalancePeriods.length,
            " period",
            outOfBalancePeriods.length > 1 ? "s" : "",
            " ha",
            outOfBalancePeriods.length > 1 ? "ve" : "s",
            " BS + IS ≠ 0. This likely means one or more accounts have the wrong FS Type (BS vs IS) from heuristic classification."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: "To fix:" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-sm", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              "Correct the account category in the",
              " ",
              /* @__PURE__ */ jsx(Button, { variant: "link", className: "h-auto p-0 text-sm", onClick: () => onNavigate?.(2, 1), children: "Chart of Accounts" }),
              " ",
              "— changes will carry over automatically"
            ] }),
            /* @__PURE__ */ jsx("li", { children: 'Or edit the "FS" column directly in the table below' })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0", children: hasNoPeriods ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-2", children: "No periods configured yet." }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
          "Go to ",
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Company Info" }),
          " to set up your analysis periods first."
        ] })
      ] }) : /* @__PURE__ */ jsx(
        MultiPeriodTable,
        {
          accounts,
          periods,
          fiscalYearEnd,
          onAccountsChange: handleAccountsChange,
          onAddAccount: handleAddAccount,
          showMatchIndicators: coaAccounts && coaAccounts.length > 0
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
        DocumentChecklistReference,
        {
          projectId,
          wizardData,
          onNavigate: (p, s, docType) => onNavigate?.(p, s)
        }
      ) })
    ] })
  ] });
};
export {
  TrialBalanceSection
};
