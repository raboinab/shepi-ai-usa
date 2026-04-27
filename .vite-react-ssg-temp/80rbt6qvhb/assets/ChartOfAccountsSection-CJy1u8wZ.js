import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { s as supabase, t as toast, B as Button, C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./dropdown-menu-CfWYww5V.js";
import { F as FinancialTable } from "./FinancialTable-C338IkVp.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { AlertCircle, Loader2, Upload, ChevronDown, X, FileUp, Database, MessageSquare, Sparkles, ArrowRight, BookOpen, FileSpreadsheet, Layers, BarChart3, RefreshCw } from "lucide-react";
import { A as Alert, a as AlertTitle, b as AlertDescription } from "./alert-FolYmCWY.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { D as DocumentValidationDialog } from "./DocumentValidationDialog-CUugaJUt.js";
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
import "./table-CVoj8f5R.js";
import "./input-CSM87NBF.js";
import "./dialog-sNpTUd89.js";
import "@radix-ui/react-dialog";
import "./progress-DNO9VJ6D.js";
import "@radix-ui/react-progress";
import "./collapsible-DUtqt5i7.js";
import "@radix-ui/react-collapsible";
import "date-fns";
import "./documentChecklist-BAkBsBzh.js";
const ABBREVIATION_MAP = {
  "accounts receivable": ["a/r", "ar", "accts rec", "acct receivable", "accts receivable"],
  "accounts payable": ["a/p", "ap", "accts pay", "acct payable", "accts payable"],
  "cash": ["cash on hand", "cash in bank", "petty cash"],
  "retained earnings": ["ret earnings", "r/e", "re", "retained earn"],
  "cost of goods sold": ["cogs", "cost of sales", "cos"],
  "depreciation": ["depr", "deprec", "accum depr", "accumulated depreciation"],
  "prepaid expenses": ["prepaid", "prepaids", "prepaid exp"],
  "accrued expenses": ["accrued exp", "accruals", "accrued liabilities"],
  "notes payable": ["notes pay", "n/p"],
  "notes receivable": ["notes rec", "n/r"],
  "inventory": ["inv", "merchandise inventory", "merchandise inv"],
  "payroll expenses": ["payroll", "payroll exp", "salaries", "wages", "salaries & wages"],
  "office supplies": ["office sup", "supplies"],
  "rent expense": ["rent", "rent exp"],
  "utilities expense": ["utilities", "utilities exp", "util exp"],
  "insurance expense": ["insurance", "insurance exp", "ins exp"],
  "professional fees": ["prof fees", "legal fees", "consulting fees"]
};
function normalizeAccountName(name) {
  const lower = (name || "").toLowerCase().trim();
  for (const [canonical, variations] of Object.entries(ABBREVIATION_MAP)) {
    if (variations.includes(lower) || lower === canonical) {
      return canonical;
    }
  }
  return lower.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}
function findMatchingAccount(account, existingAccounts) {
  const normalizedName = normalizeAccountName(account.accountName);
  const accountNum = (account.accountNumber || "").trim();
  return existingAccounts.find((existing) => {
    const existingNum = (existing.accountNumber || "").trim();
    if (accountNum && existingNum && accountNum === existingNum) {
      return true;
    }
    const existingNormalized = normalizeAccountName(existing.accountName);
    if (normalizedName && existingNormalized && normalizedName === existingNormalized) {
      return true;
    }
    if (existing.originalName) {
      const originalNormalized = normalizeAccountName(existing.originalName);
      if (normalizedName && originalNormalized && normalizedName === originalNormalized) {
        return true;
      }
    }
    return false;
  });
}
function transformCoaData(data) {
  let accounts;
  if (Array.isArray(data)) {
    accounts = data;
  } else {
    accounts = data?.accounts || data?.Accounts || [];
  }
  if (!Array.isArray(accounts)) return [];
  const result = accounts.map((acc, index) => {
    const accountName = acc.Name || acc.name || acc.accountName || acc.fullyQualifiedName || "";
    const accountNumber = acc.AcctNum || acc.acctNum || acc.accountNumber || acc.number || acc.id?.toString() || "";
    const accountSubtype = acc.accountSubType || acc.accountSubtype || acc.subtype || "";
    const classification = acc.classification || acc.Classification || "";
    const hasPreprocessedData = acc.fsType && acc.category;
    if (hasPreprocessedData) {
      return {
        id: index + 1,
        accountNumber,
        accountName,
        fsType: acc.fsType,
        category: acc.category,
        accountSubtype,
        classification,
        originalName: accountName
      };
    }
    return {
      id: index + 1,
      accountNumber,
      accountName,
      fsType: acc.fsType || "BS",
      // Simple default, not derived
      category: acc.category || "",
      // Empty = bug visible
      accountSubtype,
      classification,
      originalName: accountName
      // Store for future matching
    };
  });
  let nextAutoNum = 1e4;
  const usedNumbers = new Set(result.map((a) => a.accountNumber).filter(Boolean));
  for (const acc of result) {
    if (!acc.accountNumber) {
      while (usedNumbers.has(String(nextAutoNum))) nextAutoNum++;
      acc.accountNumber = String(nextAutoNum);
      usedNumbers.add(acc.accountNumber);
      nextAutoNum++;
    }
  }
  return result;
}
function mergeCoaAccounts(existing, incoming) {
  const result = [...existing];
  const stats = { added: 0, merged: 0, preserved: 0 };
  for (const incomingAcc of incoming) {
    const match = findMatchingAccount(incomingAcc, result);
    if (match) {
      const matchIndex = result.findIndex((a) => a.id === match.id);
      if (match.isUserEdited) {
        stats.preserved++;
        result[matchIndex] = {
          ...match,
          originalName: match.originalName || incomingAcc.accountName
        };
      } else {
        stats.merged++;
        result[matchIndex] = {
          ...incomingAcc,
          id: match.id,
          // Keep the original ID
          originalName: match.accountName
          // Store for future matching
        };
      }
    } else {
      stats.added++;
      result.push({
        ...incomingAcc,
        id: result.length + 1,
        originalName: incomingAcc.accountName
      });
    }
  }
  const finalAccounts = result.map((acc, index) => ({
    ...acc,
    id: index + 1
  }));
  return { accounts: finalAccounts, stats };
}
const defaultData = {
  accounts: []
};
const CATEGORY_OPTIONS = [
  // Balance Sheet
  { value: "Current Assets", label: "Current Assets" },
  { value: "Fixed Assets", label: "Fixed Assets" },
  { value: "Other Assets", label: "Other Assets" },
  { value: "Current Liabilities", label: "Current Liabilities" },
  { value: "Long-Term Liabilities", label: "Long-Term Liabilities" },
  { value: "Equity", label: "Equity" },
  // Income Statement
  { value: "Revenue", label: "Revenue" },
  { value: "COGS", label: "Cost of Goods Sold" },
  { value: "Operating Expenses", label: "Operating Expenses" },
  { value: "Other Income", label: "Other Income/Expense" }
];
const TYPE_LABEL = "Chart of Accounts";
const ChartOfAccountsSection = ({ projectId, data, updateData, onAutoImport, onNavigate, onOpenAssistant, onSave, wizardData = {} }) => {
  const coaData = { ...defaultData, ...data };
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [processingDocIds, setProcessingDocIds] = useState([]);
  const [showDismiss, setShowDismiss] = useState(false);
  const [derivedFromGL, setDerivedFromGL] = useState(false);
  const [derivedSourceCount, setDerivedSourceCount] = useState(0);
  const fileInputRef = useRef(null);
  const [selectedUploadType] = useState("chart_of_accounts");
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [pendingExternalCoa, setPendingExternalCoa] = useState(null);
  const [importedDocIds, setImportedDocIds] = useState(/* @__PURE__ */ new Set());
  const columns = [
    { key: "accountNumber", label: "Account #", type: "text" },
    { key: "accountName", label: "Account Name", type: "text" },
    { key: "fsType", label: "FS Type", type: "text" },
    { key: "category", label: "Category", type: "text" }
  ];
  const bsAccounts = coaData.accounts.filter((a) => a.fsType === "BS");
  const isAccounts = coaData.accounts.filter((a) => a.fsType === "IS");
  const categories = [...new Set(coaData.accounts.map((a) => a.category))];
  const requiredCategories = ["Revenue", "COGS", "Operating Expenses", "Current Assets", "Current Liabilities", "Equity"];
  const missingCategories = requiredCategories.filter((cat) => !categories.includes(cat));
  useEffect(() => {
    if (processingDocIds.length === 0) return;
    const completedDocs = /* @__PURE__ */ new Set();
    let currentAccounts = coaData.accounts;
    let glDerivedCount = 0;
    const mergeStats = { added: 0, merged: 0, preserved: 0 };
    const channel = supabase.channel(`coa-processing-batch-${projectId}`).on(
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
        setImportedDocIds((prev) => /* @__PURE__ */ new Set([...prev, docId]));
        console.log("[ChartOfAccounts] Received processed data for doc:", docId, `(${completedDocs.size}/${processingDocIds.length})`);
        const wasDerivedFromGL = processedData.source_type === "derived_from_gl";
        if (wasDerivedFromGL) {
          setDerivedFromGL(true);
          glDerivedCount++;
          setDerivedSourceCount((prev) => prev + 1);
        }
        if (processedData?.data && processedData.data_type === "chart_of_accounts") {
          const newAccounts = transformCoaData(processedData.data);
          if (newAccounts.length > 0) {
            const mergeResult = mergeCoaAccounts(currentAccounts, newAccounts);
            currentAccounts = mergeResult.accounts;
            mergeStats.added += mergeResult.stats.added;
            mergeStats.merged += mergeResult.stats.merged;
            mergeStats.preserved += mergeResult.stats.preserved;
            updateData({ ...coaData, accounts: currentAccounts });
          }
        }
        if (completedDocs.size === processingDocIds.length) {
          setProcessingDocIds([]);
          setIsUploading(false);
          const fileWord = completedDocs.size === 1 ? "file" : "files";
          const statParts = [];
          if (mergeStats.added > 0) statParts.push(`+${mergeStats.added} new`);
          if (mergeStats.merged > 0) statParts.push(`${mergeStats.merged} updated`);
          if (mergeStats.preserved > 0) statParts.push(`${mergeStats.preserved} preserved`);
          const statsStr = statParts.length > 0 ? ` (${statParts.join(", ")})` : "";
          let toastMessage;
          if (glDerivedCount > 0) {
            toastMessage = `Derived from ${glDerivedCount} GL ${fileWord}. ${currentAccounts.length} total accounts${statsStr}.`;
          } else {
            toastMessage = `Processed ${completedDocs.size} COA ${fileWord}. ${currentAccounts.length} total accounts${statsStr}.`;
          }
          toast({
            title: glDerivedCount > 0 ? "COA Derived from GL" : "Import complete",
            description: toastMessage
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
          setImportedDocIds((prev) => /* @__PURE__ */ new Set([...prev, docId]));
          const wasDerivedFromGL = processedData.source_type === "derived_from_gl";
          if (wasDerivedFromGL) {
            setDerivedFromGL(true);
            glDerivedCount++;
            setDerivedSourceCount((prev) => prev + 1);
          }
          if (processedData?.data && processedData.data_type === "chart_of_accounts") {
            const newAccounts = transformCoaData(processedData.data);
            if (newAccounts.length > 0) {
              const mergeResult = mergeCoaAccounts(currentAccounts, newAccounts);
              currentAccounts = mergeResult.accounts;
              mergeStats.added += mergeResult.stats.added;
              mergeStats.merged += mergeResult.stats.merged;
              mergeStats.preserved += mergeResult.stats.preserved;
              updateData({ ...coaData, accounts: currentAccounts });
            }
          }
        }
        if (completedDocs.size >= processingDocIds.length) {
          setProcessingDocIds([]);
          setIsUploading(false);
          const fileWord = completedDocs.size === 1 ? "file" : "files";
          const statParts = [];
          if (mergeStats.added > 0) statParts.push(`+${mergeStats.added} new`);
          if (mergeStats.merged > 0) statParts.push(`${mergeStats.merged} updated`);
          if (mergeStats.preserved > 0) statParts.push(`${mergeStats.preserved} preserved`);
          const statsStr = statParts.length > 0 ? ` (${statParts.join(", ")})` : "";
          toast({
            title: glDerivedCount > 0 ? "COA Derived from GL" : "Import complete",
            description: glDerivedCount > 0 ? `Derived from ${glDerivedCount} GL ${fileWord}. ${currentAccounts.length} total accounts${statsStr}.` : `Processed ${completedDocs.size} COA ${fileWord}. ${currentAccounts.length} total accounts${statsStr}.`
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
          console.log("[ChartOfAccounts] Poll safety net: clearing stuck processing state");
          await loadFromProcessedDataRef.current();
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
  }, [processingDocIds, projectId, selectedUploadType]);
  useEffect(() => {
    const channel = supabase.channel(`coa-external-updates-${projectId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "processed_data",
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        const processedData = payload.new;
        if (processedData.data_type !== "chart_of_accounts") return;
        const docId = processedData.source_document_id;
        if (!docId || processingDocIds.includes(docId) || importedDocIds.has(docId)) return;
        const isFromGL = processedData.source_type === "derived_from_gl";
        const newAccounts = transformCoaData(processedData.data);
        if (newAccounts.length > 0) {
          setPendingExternalCoa({
            accounts: newAccounts,
            source: isFromGL ? "General Ledger" : "Document Upload",
            documentId: docId
          });
        }
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, processingDocIds, importedDocIds]);
  const updateDataRef = useRef(updateData);
  const onAutoImportRef = useRef(onAutoImport);
  const loadFromProcessedDataRef = useRef(async () => []);
  useEffect(() => {
    updateDataRef.current = updateData;
  }, [updateData]);
  useEffect(() => {
    onAutoImportRef.current = onAutoImport;
  }, [onAutoImport]);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const loadFromProcessedData = useCallback(async () => {
    setIsAutoLoading(true);
    try {
      const { data: processedDataList, error } = await supabase.from("processed_data").select("*").eq("project_id", projectId).eq("data_type", "chart_of_accounts").order("created_at", { ascending: true }).limit(1e6);
      if (error) {
        console.error("[ChartOfAccounts] Auto-import error:", error);
        return [];
      }
      if (!processedDataList || processedDataList.length === 0) {
        console.log("[ChartOfAccounts] Auto-import: no processed COA data found");
        return [];
      }
      console.log("[ChartOfAccounts] Auto-import: found", processedDataList.length, "processed COA records");
      let mergedAccounts = [];
      const importStats = { added: 0, merged: 0, preserved: 0 };
      const importedIds = [];
      for (const processedData of processedDataList) {
        if (processedData?.data) {
          const newAccounts = transformCoaData(processedData.data);
          if (newAccounts.length > 0) {
            const mergeResult = mergeCoaAccounts(mergedAccounts, newAccounts);
            mergedAccounts = mergeResult.accounts;
            importStats.added += mergeResult.stats.added;
            importStats.merged += mergeResult.stats.merged;
            importStats.preserved += mergeResult.stats.preserved;
          }
          if (processedData.source_document_id) {
            importedIds.push(processedData.source_document_id);
          }
        }
      }
      if (mergedAccounts.length > 0) {
        console.log("[ChartOfAccounts] Auto-import: updating with", mergedAccounts.length, "total accounts");
        updateDataRef.current({ accounts: mergedAccounts });
        setImportedDocIds(new Set(importedIds));
        setTimeout(() => {
          onAutoImportRef.current?.();
        }, 100);
        const statParts = [];
        if (importStats.added > 0) statParts.push(`${importStats.added} accounts`);
        const statsStr = statParts.length > 0 ? statParts.join(", ") : `${mergedAccounts.length} accounts`;
        toast({
          title: "Chart of Accounts loaded",
          description: `Loaded ${statsStr} from processed data.`
        });
      }
      return mergedAccounts;
    } finally {
      setIsAutoLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    loadFromProcessedDataRef.current = loadFromProcessedData;
  }, [loadFromProcessedData]);
  const hasAccountsRef = useRef(coaData.accounts.length > 0);
  useEffect(() => {
    hasAccountsRef.current = coaData.accounts.length > 0;
  });
  useEffect(() => {
    if (hasAccountsRef.current) {
      console.log("[ChartOfAccounts] Auto-import skipped, already have accounts");
      return;
    }
    let retryTimer;
    const run = async () => {
      const accounts = await loadFromProcessedData();
      if (accounts.length === 0) {
        retryTimer = setTimeout(() => {
          loadFromProcessedData();
        }, 3e3);
      }
    };
    run();
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [projectId, loadFromProcessedData]);
  const handleMergeExternalCoa = useCallback(() => {
    if (!pendingExternalCoa) return;
    const result = mergeCoaAccounts(coaData.accounts, pendingExternalCoa.accounts);
    updateData({ ...coaData, accounts: result.accounts });
    setImportedDocIds((prev) => /* @__PURE__ */ new Set([...prev, pendingExternalCoa.documentId]));
    setDerivedFromGL(true);
    setDerivedSourceCount((prev) => prev + 1);
    setPendingExternalCoa(null);
    const statParts = [];
    if (result.stats.added > 0) statParts.push(`+${result.stats.added} new`);
    if (result.stats.merged > 0) statParts.push(`${result.stats.merged} updated`);
    if (result.stats.preserved > 0) statParts.push(`${result.stats.preserved} preserved`);
    const statsStr = statParts.length > 0 ? ` (${statParts.join(", ")})` : "";
    toast({
      title: "COA Updated",
      description: `${result.accounts.length} total accounts${statsStr}`
    });
  }, [pendingExternalCoa, coaData, updateData]);
  const handleDismissExternalCoa = useCallback(() => {
    if (pendingExternalCoa) {
      setImportedDocIds((prev) => /* @__PURE__ */ new Set([...prev, pendingExternalCoa.documentId]));
    }
    setPendingExternalCoa(null);
  }, [pendingExternalCoa]);
  const validateDocumentType = async (file, selectedType) => {
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const { data: data2, error } = await supabase.functions.invoke("validate-document-type", {
        body: {
          fileBase64: base64,
          selectedType,
          fileName: file.name
        }
      });
      if (error) {
        console.warn("[ChartOfAccounts] Validation failed, proceeding anyway:", error);
        return null;
      }
      return data2;
    } catch (err) {
      console.warn("[ChartOfAccounts] Validation error, proceeding anyway:", err);
      return null;
    }
  };
  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setPendingFiles(fileArray);
    const firstFile = fileArray[0];
    const validation = await validateDocumentType(firstFile, selectedUploadType);
    if (validation && !validation.isValid && validation.suggestedType) {
      setValidationResult(validation);
      setShowValidationDialog(true);
    } else {
      await processUpload(fileArray, selectedUploadType);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleValidationChangeType = async () => {
    if (pendingFiles.length > 0) {
      setShowValidationDialog(false);
      await processUpload(pendingFiles, "chart_of_accounts");
    }
  };
  const handleValidationUploadAnyway = async () => {
    if (pendingFiles.length > 0) {
      setShowValidationDialog(false);
      await processUpload(pendingFiles, selectedUploadType);
    }
  };
  const handleValidationCancel = () => {
    setShowValidationDialog(false);
    setPendingFiles([]);
    setValidationResult(null);
  };
  const processUpload = async (files, uploadType) => {
    setIsUploading(true);
    const uploadedDocIds = [];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const subfolder = "chart-of-accounts";
      for (const file of files) {
        const filePath = `${user.id}/${projectId}/${subfolder}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: docData, error: docError } = await supabase.from("documents").insert({
          project_id: projectId,
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          category: uploadType,
          account_type: uploadType,
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
        description: `Processing ${files.length} Chart of Accounts file(s)...`
      });
    } catch (error) {
      console.error("[ChartOfAccounts] Upload error:", error);
      setIsUploading(false);
      setProcessingDocIds([]);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file"
      });
    }
    setPendingFiles([]);
  };
  const handleImportFromDocuments = async () => {
    setIsImporting(true);
    try {
      const { data: processedDataList, error } = await supabase.from("processed_data").select("*").eq("project_id", projectId).eq("data_type", "chart_of_accounts").order("created_at", { ascending: true }).limit(1e6);
      if (error) throw error;
      if (!processedDataList || processedDataList.length === 0) {
        toast({
          title: "No chart of accounts found",
          description: "Upload a chart of accounts file first using the Upload File option."
        });
        return;
      }
      let mergedAccounts = [...coaData.accounts];
      let importedCount = 0;
      const importStats = { added: 0, merged: 0, preserved: 0 };
      for (const processedData of processedDataList) {
        if (processedData?.data) {
          const newAccounts = transformCoaData(processedData.data);
          if (newAccounts.length > 0) {
            const mergeResult = mergeCoaAccounts(mergedAccounts, newAccounts);
            mergedAccounts = mergeResult.accounts;
            importStats.added += mergeResult.stats.added;
            importStats.merged += mergeResult.stats.merged;
            importStats.preserved += mergeResult.stats.preserved;
            importedCount++;
          }
        }
      }
      if (importedCount > 0) {
        updateData({ ...coaData, accounts: mergedAccounts });
        const statParts = [];
        if (importStats.added > 0) statParts.push(`+${importStats.added} new`);
        if (importStats.merged > 0) statParts.push(`${importStats.merged} updated`);
        if (importStats.preserved > 0) statParts.push(`${importStats.preserved} preserved`);
        const statsStr = statParts.length > 0 ? ` (${statParts.join(", ")})` : "";
        toast({
          title: "Import successful",
          description: `Imported from ${importedCount} document(s). ${mergedAccounts.length} total accounts${statsStr}.`
        });
      } else {
        toast({
          title: "No accounts found",
          description: "The chart of accounts data could not be parsed."
        });
      }
    } catch (error) {
      console.error("[ChartOfAccounts] Import error:", error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import chart of accounts"
      });
    } finally {
      setIsImporting(false);
    }
  };
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
  const coaReviewComplete = settings.coaReviewComplete === true;
  const handleDismissGuide = () => {
    onSave?.({
      wizard_data: {
        ...wizardData,
        settings: { ...settings, coreDataGuideComplete: true }
      }
    });
  };
  const handleReviewComplete = () => {
    onSave?.({
      wizard_data: {
        ...wizardData,
        settings: { ...settings, coaReviewComplete: true }
      }
    });
    onNavigate?.(2, 2);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(
      CoreDataGuideBanner,
      {
        currentStep: 1,
        onNavigate: (p, s) => onNavigate?.(p, s),
        onDismiss: handleDismissGuide,
        isQBUser,
        hasCOA: coaData.accounts.length > 0,
        hasTB: !!(wizardData?.trialBalance?.accounts || []).length,
        visible: !coreDataGuideComplete && !!settings.onboardingComplete
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Chart of Accounts" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Define the account structure for your trial balance" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        coaData.accounts.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-xs", children: [
          coaData.accounts.length,
          " ",
          coaData.accounts.length === 1 ? "account" : "accounts"
        ] }),
        missingCategories.length > 0 && coaData.accounts.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1 text-xs", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }),
          "Missing: ",
          missingCategories.slice(0, 2).join(", "),
          missingCategories.length > 2 ? "..." : ""
        ] }),
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
              "Upload Chart of Accounts (Excel/CSV/PDF)"
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
            accept: ".xlsx,.xls,.csv,.pdf",
            multiple: true,
            onChange: handleFileSelect,
            className: "hidden"
          }
        )
      ] })
    ] }),
    validationResult && /* @__PURE__ */ jsx(
      DocumentValidationDialog,
      {
        open: showValidationDialog,
        onOpenChange: setShowValidationDialog,
        fileName: pendingFiles[0]?.name || "Unknown file",
        selectedType: selectedUploadType,
        selectedTypeLabel: TYPE_LABEL,
        validationResult,
        suggestedTypeLabel: null,
        onChangeType: handleValidationChangeType,
        onUploadAnyway: handleValidationUploadAnyway,
        onCancel: handleValidationCancel
      }
    ),
    coaData.accounts.length > 0 && !coaReviewComplete && /* @__PURE__ */ jsxs(Alert, { className: "bg-primary/5 border-primary/20", children: [
      /* @__PURE__ */ jsx(MessageSquare, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ jsx(AlertTitle, { className: "text-primary", children: "Review Account Mappings" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-sm", children: [
        /* @__PURE__ */ jsxs("p", { className: "mb-2", children: [
          "Your Chart of Accounts has been loaded with ",
          /* @__PURE__ */ jsxs("strong", { children: [
            coaData.accounts.length,
            " accounts"
          ] }),
          ". Open the AI Assistant to verify all accounts are mapped to the correct financial statement categories."
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground mb-3", children: [
          "Try asking: ",
          /* @__PURE__ */ jsx("em", { children: '"Are all my accounts mapped correctly?"' }),
          " or ",
          /* @__PURE__ */ jsx("em", { children: '"Which accounts might be miscategorized?"' })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          onOpenAssistant && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "gap-1.5", onClick: () => onOpenAssistant?.(), children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5" }),
            " Open AI Assistant"
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "default", className: "gap-1.5", onClick: handleReviewComplete, children: [
            "I've reviewed, continue ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" })
          ] })
        ] })
      ] })
    ] }),
    coaData.accounts.length > 0 && coaReviewComplete && /* @__PURE__ */ jsxs(Alert, { className: "bg-primary/5 border-primary/20", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ jsx(AlertTitle, { className: "text-primary", children: "AI-Powered Account Validation" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-sm", children: [
        "The AI Assistant can review your Chart of Accounts against QuickBooks mapping rules to identify miscategorized accounts. Try asking: ",
        /* @__PURE__ */ jsx("strong", { children: '"Review my Chart of Accounts for mapping errors"' }),
        " or",
        /* @__PURE__ */ jsx("strong", { children: '"Which accounts might be miscategorized?"' })
      ] })
    ] }),
    pendingExternalCoa && /* @__PURE__ */ jsxs(Alert, { className: "bg-primary/5 border-primary/30", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ jsxs(AlertTitle, { className: "flex items-center gap-2", children: [
        "New COA Data Available",
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-primary/10 text-primary border-primary/30", children: [
          pendingExternalCoa.accounts.length,
          " accounts"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          pendingExternalCoa.accounts.length,
          " accounts were derived from a ",
          pendingExternalCoa.source,
          " upload in the Documents Hub."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 ml-4", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: handleDismissExternalCoa,
              className: "gap-1",
              children: [
                /* @__PURE__ */ jsx(X, { className: "h-3 w-3" }),
                "Dismiss"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              onClick: handleMergeExternalCoa,
              className: "gap-1",
              children: [
                /* @__PURE__ */ jsx(Database, { className: "h-3 w-3" }),
                "Merge ",
                pendingExternalCoa.accounts.length,
                " Accounts"
              ]
            }
          )
        ] })
      ] })
    ] }),
    derivedFromGL && coaData.accounts.length > 0 && /* @__PURE__ */ jsxs(Alert, { className: "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800", children: [
      /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4 text-amber-600 dark:text-amber-400" }),
      /* @__PURE__ */ jsxs(AlertTitle, { className: "text-amber-800 dark:text-amber-200 flex items-center gap-2", children: [
        "Derived from General Ledger",
        derivedSourceCount > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700", children: [
          derivedSourceCount,
          " source ",
          derivedSourceCount === 1 ? "file" : "files"
        ] }),
        /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700", children: "Review Required" })
      ] }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-amber-700 dark:text-amber-300", children: [
        coaData.accounts.length,
        " accounts were extracted from your General Ledger file",
        derivedSourceCount > 1 ? "s" : "",
        ". Please verify the FS Type (BS/IS) and Category classifications against your Balance Sheet and Profit & Loss statements."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(SummaryCard, { title: "Total Accounts", value: coaData.accounts.length, icon: FileSpreadsheet, isCurrency: false }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Balance Sheet", value: bsAccounts.length, icon: Layers, subtitle: "accounts", isCurrency: false }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Income Statement", value: isAccounts.length, icon: BarChart3, subtitle: "accounts", isCurrency: false }),
      /* @__PURE__ */ jsx(SummaryCard, { title: "Categories", value: categories.length, icon: Layers, subtitle: "defined", isCurrency: false })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        "Account Mapping",
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "BS = Balance Sheet" }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "IS = Income Statement" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        coaData.accounts.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-8 gap-3 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No accounts loaded yet. Upload a file or load from existing processed data." }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "gap-2",
              disabled: isAutoLoading,
              onClick: () => loadFromProcessedData(),
              children: [
                isAutoLoading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                "Load from processed data"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          FinancialTable,
          {
            columns,
            data: coaData.accounts,
            onDataChange: (accounts) => {
              const updatedAccounts = accounts.map((acc) => {
                const original = coaData.accounts.find((o) => o.id === acc.id);
                const wasEdited = original && (original.accountNumber !== acc.accountNumber || original.accountName !== acc.accountName || original.fsType !== acc.fsType || original.category !== acc.category);
                return {
                  ...acc,
                  isUserEdited: acc.isUserEdited || wasEdited
                };
              });
              updateData({ ...coaData, accounts: updatedAccounts });
            },
            newRowTemplate: { accountNumber: "", accountName: "", fsType: "IS", category: "" }
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-muted/50 rounded-lg", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx("strong", { children: "FS Type:" }),
            ' Use "BS" for Balance Sheet accounts (assets, liabilities, equity) or "IS" for Income Statement accounts (revenue, expenses).'
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [
            /* @__PURE__ */ jsx("strong", { children: "Categories:" }),
            " ",
            CATEGORY_OPTIONS.map((c) => c.label).join(", ")
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { children: [
          "Balance Sheet Accounts (",
          bsAccounts.length,
          ")"
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: [
          bsAccounts.map((account) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 bg-muted/30 rounded", children: [
            /* @__PURE__ */ jsx("span", { className: "font-mono text-sm", children: account.accountNumber }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm flex-1 ml-3", children: [
              account.accountName,
              account.isUserEdited && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-2 text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700", children: "Edited" })
            ] }),
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: account.category })
          ] }, account.id)),
          bsAccounts.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No Balance Sheet accounts defined" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { children: [
          "Income Statement Accounts (",
          isAccounts.length,
          ")"
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: [
          isAccounts.map((account) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 bg-muted/30 rounded", children: [
            /* @__PURE__ */ jsx("span", { className: "font-mono text-sm", children: account.accountNumber }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm flex-1 ml-3", children: [
              account.accountName,
              account.isUserEdited && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-2 text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700", children: "Edited" })
            ] }),
            /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: account.category })
          ] }, account.id)),
          isAccounts.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No Income Statement accounts defined" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      DocumentChecklistReference,
      {
        projectId,
        wizardData,
        onNavigate: (p, s, docType) => onNavigate?.(p, s)
      }
    )
  ] });
};
export {
  ChartOfAccountsSection
};
