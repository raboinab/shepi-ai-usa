import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React__default, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { T as TooltipProvider, n as Tooltip, o as TooltipTrigger, p as TooltipContent, s as supabase, B as Button, A as Accordion, j as AccordionItem, k as AccordionTrigger, l as AccordionContent, m as cn, C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
import { I as Input } from "./input-CSM87NBF.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-dhx4sETc.js";
import { T as ToggleGroup, a as ToggleGroupItem } from "./InsightsView-BkA7fJjp.js";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-sNpTUd89.js";
import { S as SummaryCard } from "./SummaryCard-D2BKAjm6.js";
import { AlertTriangle, Clock, AlertCircle, XCircle, CheckCircle2, Plus, FileText, Loader2, Upload, Search, ChevronRight, Paperclip, Check, RefreshCw, Receipt, ShieldAlert, FileQuestion, ArrowRight, List, Lightbulb, Pencil, X, Flag, TrendingUp, TrendingDown, ChevronDown, Sparkles, Activity, Shield, ChevronsUpDown, HelpCircle, ClipboardList, Filter, Zap, Copy, Trash2 } from "lucide-react";
import { C as Checkbox } from "./checkbox-3bpvUXl3.js";
import { S as ScrollArea, a as ScrollBar } from "./scroll-area-DQ-itlDB.js";
import { S as Separator } from "./separator-BGlMS6na.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { a as logUploadTrace, g as getUploadErrorMessage, l as logUploadError } from "./uploadErrorLogger-CC95ChV1.js";
import { V as getProofHint, W as isITDAAnchor, X as INTENT_TO_SIGN, Y as INTENT_LABELS, M as computeSign, Z as getTemplateById, _ as TEMPLATES_BY_TYPE } from "./sanitizeWizardData-nrsUY-BP.js";
import { P as Progress } from "./progress-DNO9VJ6D.js";
import { u as useAdjustmentProofs } from "./useAdjustmentProofs-BvjUM7OL.js";
import { T as Textarea } from "./textarea-H3ZPGfnJ.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { C as Command, a as CommandInput, b as CommandList, c as CommandEmpty, d as CommandGroup, e as CommandItem } from "./command-CJVemXry.js";
import { P as Popover, a as PopoverTrigger, b as PopoverContent } from "./popover-C93YiWo6.js";
import { L as Label } from "./label-B2r_8dgk.js";
import { R as RadioGroup, a as RadioGroupItem } from "./radio-group-YtCmMBhU.js";
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
import "@radix-ui/react-select";
import "@radix-ui/react-tabs";
import "react-resizable-panels";
import "recharts";
import "date-fns";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-toggle";
import "./spinner-DXdBpr08.js";
import "react-markdown";
import "@radix-ui/react-dialog";
import "@radix-ui/react-checkbox";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-separator";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-progress";
import "cmdk";
import "@radix-ui/react-popover";
import "@radix-ui/react-label";
import "@radix-ui/react-radio-group";
const ProofValidationBadge = ({ score, status, keyFindings = [], redFlags = [], matchCount, contradictionCount, varianceAmount, onClick }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "validated":
        return {
          label: "Validated",
          icon: CheckCircle2,
          className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
          description: "Strong documentation fully supports this adjustment"
        };
      case "supported":
        return {
          label: "Supported",
          icon: CheckCircle2,
          className: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
          description: "Good documentation with minor gaps"
        };
      case "partial":
        return {
          label: "Partial",
          icon: AlertTriangle,
          className: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
          description: "Some support but significant gaps exist"
        };
      case "insufficient":
        return {
          label: "Insufficient",
          icon: XCircle,
          className: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
          description: "Documentation does not adequately support the claim"
        };
      case "contradictory":
        return {
          label: "Contradictory",
          icon: AlertCircle,
          className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
          description: "Documentation contradicts the claimed adjustment"
        };
      case "pending":
      default:
        return {
          label: "Pending",
          icon: Clock,
          className: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
          description: "Awaiting validation"
        };
    }
  };
  const config = getStatusConfig();
  const Icon = config.icon;
  const hasStats = matchCount !== void 0 || contradictionCount !== void 0;
  const tooltipContent = /* @__PURE__ */ jsxs("div", { className: "space-y-2 max-w-xs", children: [
    /* @__PURE__ */ jsx("div", { className: "font-medium", children: config.description }),
    score !== null && /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Confidence Score:" }),
      " ",
      /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
        score,
        "/100"
      ] })
    ] }),
    hasStats && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
      matchCount !== void 0 && /* @__PURE__ */ jsxs("span", { children: [
        matchCount,
        " matches"
      ] }),
      matchCount !== void 0 && contradictionCount !== void 0 && /* @__PURE__ */ jsx("span", { children: " · " }),
      contradictionCount !== void 0 && /* @__PURE__ */ jsxs("span", { children: [
        contradictionCount,
        " contradictions"
      ] })
    ] }),
    varianceAmount != null && varianceAmount !== 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-amber-600 font-medium flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }),
      "Verified amount differs by ",
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(Math.abs(varianceAmount))
    ] }),
    keyFindings.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground mb-1", children: "Key Findings:" }),
      /* @__PURE__ */ jsx("ul", { className: "list-disc list-inside space-y-0.5", children: keyFindings.slice(0, 3).map((finding, i) => /* @__PURE__ */ jsx("li", { className: "text-xs", children: finding }, i)) })
    ] }),
    redFlags.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsx("div", { className: "text-destructive mb-1", children: "Red Flags:" }),
      /* @__PURE__ */ jsx("ul", { className: "list-disc list-inside space-y-0.5", children: redFlags.slice(0, 3).map((flag, i) => /* @__PURE__ */ jsx("li", { className: "text-xs text-destructive", children: flag }, i)) })
    ] }),
    onClick && /* @__PURE__ */ jsx("div", { className: "text-xs text-primary font-medium pt-1 border-t border-border", children: "Click to view full report →" })
  ] });
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Badge,
      {
        variant: "outline",
        className: `gap-1 ${onClick ? "cursor-pointer" : "cursor-help"} ${config.className}`,
        onClick,
        children: [
          /* @__PURE__ */ jsx(Icon, { className: "w-3 h-3" }),
          config.label,
          score !== null && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs opacity-75", children: [
            "(",
            score,
            ")"
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(TooltipContent, { side: "top", align: "center", className: "p-3", children: tooltipContent })
  ] }) });
};
const GROUP_LABELS = {
  bank_statement: "Bank Statements",
  tax_return: "Tax Returns",
  financial_report: "Financial Reports",
  proof: "Proof Documents",
  other: "Other Documents"
};
const GROUP_ORDER = ["proof", "financial_report", "bank_statement", "tax_return", "other"];
function categorizeDoc(doc) {
  const cat = doc.category?.toLowerCase();
  const accountType = doc.account_type?.toLowerCase();
  if (cat === "proof" || cat === "supporting_documents" || accountType === "supporting_documents") return "proof";
  if (cat === "bank_statement") return "bank_statement";
  if (cat === "financial_statement" || ["trial_balance", "balance_sheet", "income_statement", "cash_flow", "general_ledger"].includes(accountType || "")) return "financial_report";
  if (accountType === "tax_return") return "tax_return";
  if (accountType === "bank_statement") return "bank_statement";
  const name = doc.name.toLowerCase();
  if (name.includes("tax return") || name.includes("1120") || name.includes("1040")) return "tax_return";
  if (name.includes("general ledger") || name.includes("trial balance") || name.includes("balance sheet") || name.includes("profit and loss") || name.includes("cash flow") || name.includes("account list")) return "financial_report";
  if (name.includes("bank") || name.includes("savings") || name.includes("checking") || /clearwater.*\d{4}/.test(name)) return "bank_statement";
  if (name.includes("payroll") || name.includes("invoice") || name.includes("vendor") || name.includes("aging") || name.includes("sales") || name.includes("journal") || name.includes("cim")) return "other";
  return "other";
}
const AttachProofDialog = ({
  open,
  onOpenChange,
  projectId,
  adjustmentId,
  adjustment,
  onProofInvalidate
}) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState(/* @__PURE__ */ new Set());
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (open && projectId) {
      fetchDocuments();
      setSearch("");
      setSelectedDocs([]);
      setPendingFiles([]);
      logUploadTrace({ context: "attach_proof_dialog", stage: "dialog_open", projectId, extra: { adjustmentId } });
    }
  }, [open, projectId, adjustmentId]);
  useEffect(() => {
    if (!open || extracting.length === 0) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from("documents").select("id, processing_status").in("id", extracting);
      if (data) {
        const stillProcessing = data.filter((d) => d.processing_status === "processing").map((d) => d.id);
        const completed = data.filter((d) => d.processing_status === "completed").map((d) => d.id);
        const failed = data.filter((d) => d.processing_status === "failed").map((d) => d.id);
        if (completed.length > 0 || failed.length > 0) {
          setExtracting(stillProcessing);
          fetchDocuments();
          if (completed.length > 0) toast.success(`${completed.length} document(s) processed`);
          if (failed.length > 0) toast.error(`${failed.length} document(s) failed to process`);
        }
      }
    }, 5e3);
    return () => clearInterval(interval);
  }, [open, extracting]);
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("documents").select("id, name, file_type, category, account_type, created_at, processing_status, parsed_summary").eq("project_id", projectId).order("created_at", { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };
  const processSupportingDocument = async (documentId, file, description) => {
    const fileBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const response = await supabase.functions.invoke("process-supporting-document", {
      body: {
        documentId,
        fileBase64,
        fileName: file.name,
        fileType: file.type || null,
        projectId,
        description
      }
    });
    if (response.error) throw response.error;
    if (response.data && response.data.success === false) {
      const err = new Error(response.data.error || "Extraction failed");
      err.stage = response.data.stage;
      err.details = response.data;
      throw err;
    }
    return response.data;
  };
  const MAX_FILE_BYTES = 20 * 1024 * 1024;
  const runDiagnosticProbe = async () => {
    try {
      const probeText = `Shepi proof-upload diagnostic
Project: ${projectId}
Adjustment: ${adjustmentId}
Time: ${(/* @__PURE__ */ new Date()).toISOString()}
Amount: $100.00 (synthetic test)
`;
      const file = new File([probeText], `proof-diagnostic-${Date.now()}.txt`, { type: "text/plain" });
      const dt = new DataTransfer();
      dt.items.add(file);
      toast.info("Running upload diagnostic...");
      await handleUpload(dt.files);
    } catch (err) {
      toast.error(`Diagnostic failed: ${getUploadErrorMessage(err)}`);
    }
  };
  const handleUpload = async (files) => {
    await logUploadTrace({ context: "attach_proof_dialog", stage: "file_selected", projectId, extra: { count: files.length, names: Array.from(files).map((f) => f.name) } });
    if (files.length === 0) return;
    setUploading(true);
    const uploadedDocIds = [];
    const failures = [];
    let userId = null;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        const msg = authError?.message || "Not authenticated — please sign in again.";
        await logUploadError({ context: "attach_proof_dialog", projectId, userId: null, fileName: "(auth)", fileSize: 0, fileType: null, stage: "auth", error: authError || new Error(msg) });
        toast.error(msg);
        setUploading(false);
        return;
      }
      userId = user.id;
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop() || null;
        await logUploadTrace({ context: "attach_proof_dialog", stage: "upload_started", projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt });
        try {
          if (file.size > MAX_FILE_BYTES) {
            const reason = `File exceeds 20 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
            failures.push({ name: file.name, reason });
            await logUploadError({ context: "attach_proof_dialog", projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, stage: "preflight_size", error: new Error(reason) });
            continue;
          }
          const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
          if (uploadError) {
            failures.push({ name: file.name, reason: uploadError.message });
            await logUploadError({ context: "attach_proof_dialog", projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, stage: "storage_upload", error: uploadError });
            continue;
          }
          await logUploadTrace({ context: "attach_proof_dialog", stage: "storage_uploaded", projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, extra: { filePath } });
          const { data: docData, error: insertError } = await supabase.from("documents").insert({
            project_id: projectId,
            user_id: user.id,
            name: file.name,
            file_path: filePath,
            file_type: fileExt,
            file_size: file.size,
            category: "supporting_documents",
            account_type: "supporting_documents",
            description: adjustment.description,
            processing_status: "processing"
          }).select("id").single();
          if (insertError) {
            failures.push({ name: file.name, reason: insertError.message });
            await logUploadError({ context: "attach_proof_dialog", projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, stage: "db_insert", error: insertError });
            continue;
          }
          if (docData) {
            uploadedDocIds.push(docData.id);
            await logUploadTrace({ context: "attach_proof_dialog", stage: "document_inserted", projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, extra: { documentId: docData.id } });
            logUploadTrace({ context: "attach_proof_dialog", stage: "edge_invoked", projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, extra: { documentId: docData.id } });
            processSupportingDocument(docData.id, file, adjustment.description).catch(async (processingError) => {
              await logUploadError({
                context: "attach_proof_dialog",
                projectId,
                userId,
                fileName: file.name,
                fileSize: file.size,
                fileType: fileExt,
                stage: processingError?.stage ? `edge_function:${processingError.stage}` : "edge_function",
                error: processingError,
                extra: processingError?.details ?? void 0
              });
              await supabase.from("documents").update({ processing_status: "failed" }).eq("id", docData.id);
              const reason = processingError?.message || "Extraction failed";
              toast.error(`${file.name}: ${reason}`, { duration: 12e3 });
            });
          }
        } catch (perFileErr) {
          failures.push({ name: file.name, reason: getUploadErrorMessage(perFileErr) });
          await logUploadError({ context: "attach_proof_dialog", projectId, userId, fileName: file.name, fileSize: file.size, fileType: fileExt, stage: "unexpected", error: perFileErr });
        }
      }
      const succeeded = uploadedDocIds.length;
      const total = files.length;
      if (succeeded > 0) {
        toast.success(`${succeeded} of ${total} file(s) uploaded${failures.length ? `. ${failures.length} failed.` : ", extracting text..."}`);
        await fetchDocuments();
        setSelectedDocs((prev) => [...prev, ...uploadedDocIds]);
        setExtracting((prev) => [...prev, ...uploadedDocIds]);
      }
      if (failures.length > 0) {
        const first = failures[0];
        toast.error(`${failures.length} file(s) failed. ${first.name}: ${first.reason}`, { duration: 1e4 });
      }
    } catch (error) {
      console.error("Upload error (outer):", error);
      await logUploadError({ context: "attach_proof_dialog", projectId, userId, fileName: "(batch)", fileSize: 0, fileType: null, stage: "batch", error });
      toast.error(getUploadErrorMessage(error, "Failed to upload files"));
    } finally {
      setUploading(false);
    }
  };
  const handleFileInputChange = (e) => {
    logUploadTrace({ context: "attach_proof_dialog", stage: "picker_change_received", projectId, extra: { fileCount: e.target.files?.length ?? 0 } });
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setPendingFiles((prev) => [...prev, ...files]);
      logUploadTrace({ context: "attach_proof_dialog", stage: "pending_files_set", projectId, extra: { names: files.map((f) => f.name) } });
      toast.success(`${files.length} file(s) selected — click "Upload" to proceed`);
    } else {
      logUploadTrace({ context: "attach_proof_dialog", stage: "picker_empty", projectId });
      toast.warning("No files were selected");
    }
    e.target.value = "";
  };
  const handleStartUpload = async () => {
    if (pendingFiles.length === 0) return;
    logUploadTrace({ context: "attach_proof_dialog", stage: "manual_upload_clicked", projectId, extra: { count: pendingFiles.length } });
    const dt = new DataTransfer();
    pendingFiles.forEach((f) => dt.items.add(f));
    setPendingFiles([]);
    await handleUpload(dt.files);
  };
  const removePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setPendingFiles((prev) => [...prev, ...files]);
      logUploadTrace({ context: "attach_proof_dialog", stage: "drop_received", projectId, extra: { names: files.map((f) => f.name) } });
      toast.success(`${files.length} file(s) selected — click "Upload" to proceed`);
    }
  };
  const toggleDocument = (docId) => {
    setSelectedDocs((prev) => prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]);
  };
  const handleAttach = async () => {
    if (selectedDocs.length === 0) {
      toast.error("Please select at least one document");
      return;
    }
    const processingDocs = documents.filter((d) => selectedDocs.includes(d.id) && d.processing_status === "processing");
    if (processingDocs.length > 0) {
      toast.error("Please wait for document processing to complete");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }
      const { data: existing } = await supabase.from("adjustment_proofs").select("document_id").eq("adjustment_id", adjustmentId).eq("verification_type", "document_attachment");
      const existingDocIds = new Set((existing || []).map((e) => e.document_id));
      const newDocs = selectedDocs.filter((id) => !existingDocIds.has(id));
      if (newDocs.length === 0 && selectedDocs.length > 0) {
        toast.info("All selected documents are already attached");
        onOpenChange(false);
        return;
      }
      for (const docId of newDocs) {
        await supabase.from("adjustment_proofs").insert({
          adjustment_id: adjustmentId,
          project_id: projectId,
          document_id: docId,
          user_id: user.id,
          verification_type: "document_attachment",
          validation_status: "pending"
        }).throwOnError();
      }
      onOpenChange(false);
      toast.success("Documents attached");
      onProofInvalidate?.();
    } catch (error) {
      console.error("Attach error:", error);
      toast.error(error.message || "Failed to attach documents");
    }
  };
  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [documents, search]);
  const groupedDocs = useMemo(() => {
    const groups = { proof: [], financial_report: [], bank_statement: [], tax_return: [], other: [] };
    for (const doc of filteredDocs) {
      groups[categorizeDoc(doc)].push(doc);
    }
    return groups;
  }, [filteredDocs]);
  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleGroupSelection = (key) => {
    const groupDocIds = groupedDocs[key].map((d) => d.id);
    const allSelected = groupDocIds.every((id) => selectedDocs.includes(id));
    if (allSelected) {
      setSelectedDocs((prev) => prev.filter((id) => !groupDocIds.includes(id)));
    } else {
      setSelectedDocs((prev) => [.../* @__PURE__ */ new Set([...prev, ...groupDocIds])]);
    }
  };
  const getProcessingStatusBadge = (doc) => {
    const isExtracting = extracting.includes(doc.id);
    if (isExtracting || doc.processing_status === "processing") {
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs bg-amber-500/10 text-amber-600 animate-pulse", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 mr-1 animate-spin" }),
        "Processing"
      ] });
    }
    if (doc.processing_status === "failed") {
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs bg-destructive/10 text-destructive", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3 mr-1" }),
        "Failed"
      ] });
    }
    if (doc.processing_status === "completed" && doc.parsed_summary) {
      return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs bg-green-500/10 text-green-600", children: [
        /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 mr-1" }),
        "Ready"
      ] });
    }
    if (doc.processing_status === "pending" || !doc.parsed_summary) {
      return /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs bg-muted text-muted-foreground", children: "Pending" });
    }
    return null;
  };
  const hasProcessingDocs = extracting.length > 0 || documents.some((d) => selectedDocs.includes(d.id) && d.processing_status === "processing");
  const renderDocItem = (doc) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedDocs.includes(doc.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`,
      onClick: () => toggleDocument(doc.id),
      children: [
        /* @__PURE__ */ jsx(Checkbox, { checked: selectedDocs.includes(doc.id) }),
        /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium text-sm truncate", children: doc.name }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-0.5 flex-wrap", children: [
            getProcessingStatusBadge(doc),
            doc.file_type && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: doc.file_type.toUpperCase() })
          ] })
        ] }),
        selectedDocs.includes(doc.id) && /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-primary flex-shrink-0" })
      ]
    },
    doc.id
  );
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Attach Proof Documents" }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Upload or select documents that support this adjustment" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg border p-3 bg-muted/50", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium mb-1", children: [
          '"',
          adjustment.description,
          '"'
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm space-y-1", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Amount:" }),
            " $",
            adjustment.amount?.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Category:" }),
            " ",
            adjustment.category
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}`,
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
          onDrop: handleDrop,
          children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                multiple: true,
                accept: ".pdf,.csv,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx",
                onChange: handleFileInputChange,
                className: "hidden"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-primary mb-1", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  type: "button",
                  className: "text-sm font-medium text-primary",
                  onClick: (e) => {
                    e.stopPropagation();
                    logUploadTrace({ context: "attach_proof_dialog", stage: "picker_open_requested", projectId });
                    fileInputRef.current?.click();
                  },
                  children: "Browse Files"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "or drop files here (PDF, images, CSV, Excel, Word)" })
          ]
        }
      ),
      pendingFiles.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-medium", children: [
          "Selected files (",
          pendingFiles.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1", children: pendingFiles.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 rounded border bg-muted/30", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-muted-foreground flex-shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm flex-1 truncate", children: f.name }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            (f.size / 1024).toFixed(0),
            " KB"
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => removePendingFile(i), children: /* @__PURE__ */ jsx(AlertCircle, { className: "w-3 h-3" }) })
        ] }, `${f.name}-${i}`)) }),
        /* @__PURE__ */ jsx(Button, { onClick: handleStartUpload, disabled: uploading, size: "sm", className: "w-full", children: uploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
          "Uploading..."
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
          "Upload ",
          pendingFiles.length,
          " file(s)"
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: runDiagnosticProbe, disabled: uploading, className: "text-xs h-7", children: "Run upload diagnostic" }) }),
      documents.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Separator, { className: "flex-1" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "or select existing" }),
        /* @__PURE__ */ jsx(Separator, { className: "flex-1" })
      ] }),
      documents.length > 0 && /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search documents...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: "pl-9 h-9"
          }
        )
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }) }) : documents.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-4 text-muted-foreground text-sm", children: [
        /* @__PURE__ */ jsx(FileText, { className: "w-8 h-8 mx-auto mb-2 opacity-50" }),
        /* @__PURE__ */ jsx("p", { children: "No existing documents" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs", children: "Upload files above to attach as proof" })
      ] }) : /* @__PURE__ */ jsx(ScrollArea, { className: "h-[400px] max-h-[60vh] pr-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        GROUP_ORDER.map((groupKey) => {
          const docs = groupedDocs[groupKey];
          if (docs.length === 0) return null;
          const isCollapsed = collapsedGroups.has(groupKey);
          const groupDocIds = docs.map((d) => d.id);
          const allSelected = groupDocIds.every((id) => selectedDocs.includes(id));
          const someSelected = groupDocIds.some((id) => selectedDocs.includes(id));
          return /* @__PURE__ */ jsxs(Collapsible, { open: !isCollapsed, onOpenChange: () => toggleGroup(groupKey), children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-1.5 px-1", children: [
              /* @__PURE__ */ jsx(
                Checkbox,
                {
                  checked: allSelected,
                  className: someSelected && !allSelected ? "opacity-50" : "",
                  onCheckedChange: (e) => {
                    toggleGroupSelection(groupKey);
                  },
                  onClick: (e) => e.stopPropagation()
                }
              ),
              /* @__PURE__ */ jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 flex-1 hover:text-foreground text-muted-foreground transition-colors", children: [
                /* @__PURE__ */ jsx(ChevronRight, { className: `w-4 h-4 transition-transform ${!isCollapsed ? "rotate-90" : ""}` }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: GROUP_LABELS[groupKey] }),
                /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs ml-auto", children: docs.length })
              ] })
            ] }),
            /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-1 pl-2", children: docs.map(renderDocItem) }) })
          ] }, groupKey);
        }),
        filteredDocs.length === 0 && search.trim() && /* @__PURE__ */ jsxs("div", { className: "text-center py-4 text-muted-foreground text-sm", children: [
          'No documents match "',
          search,
          '"'
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-4 border-t", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
          selectedDocs.length,
          " document",
          selectedDocs.length !== 1 ? "s" : "",
          " selected",
          hasProcessingDocs && /* @__PURE__ */ jsx("span", { className: "text-amber-600 ml-2", children: "(processing...)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
          /* @__PURE__ */ jsx(Button, { onClick: handleAttach, disabled: selectedDocs.length === 0 || uploading || hasProcessingDocs, children: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Paperclip, { className: "w-4 h-4 mr-2" }),
            "Attach"
          ] }) })
        ] })
      ] })
    ] })
  ] }) });
};
const PROGRESS_LABELS = {
  0: "Job queued",
  5: "Job claimed",
  10: "Resolving discovery job",
  20: "Account hint search",
  50: "Keyword search (scanning accounts)",
  70: "AI analysis",
  85: "Cross-source validation",
  100: "Storing results"
};
function getProgressLabel(percent) {
  const thresholds = Object.keys(PROGRESS_LABELS).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (percent >= t) return PROGRESS_LABELS[t];
  }
  return "Job queued";
}
function useVerificationJob({ jobId, adjustmentId, projectId, onComplete }) {
  const [status, setStatus] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const completedRef = useRef(false);
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  useEffect(() => {
    if (!jobId) {
      stopPolling();
      return;
    }
    completedRef.current = false;
    setStatus("queued");
    setProgressPercent(0);
    setError(null);
    const poll = async () => {
      if (completedRef.current) return;
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "poll-verification-job",
          { body: { jobId, adjustmentId, projectId } }
        );
        if (fnError) {
          console.error("[useVerificationJob] poll error:", fnError.message);
          return;
        }
        if (data?.error) {
          setError(data.error);
          setStatus("failed");
          stopPolling();
          completedRef.current = true;
          return;
        }
        setStatus(data.status);
        setProgressPercent(data.progress_percent ?? 0);
        if (data.status === "completed" && data.detector_summary) {
          completedRef.current = true;
          setResult(data.detector_summary);
          stopPolling();
          onComplete?.(data.detector_summary);
        } else if (data.status === "failed") {
          completedRef.current = true;
          setError(data.error_message || "Verification failed");
          stopPolling();
        }
      } catch (err) {
        console.error("[useVerificationJob] unexpected error:", err);
      }
    };
    poll();
    intervalRef.current = setInterval(poll, 8e3);
    return () => stopPolling();
  }, [jobId, adjustmentId, projectId, stopPolling, onComplete]);
  return {
    status,
    progressPercent,
    result,
    error,
    isRunning: status === "queued" || status === "running"
  };
}
const STATUS_MAP = {
  verified: "validated",
  partial_match: "partial",
  not_found: "insufficient"
};
const SEVERITY_CLASSES = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-muted text-muted-foreground border-border"
};
const VerifyAdjustmentDialog = ({
  open,
  onOpenChange,
  projectId,
  adjustmentId,
  jobId: discoveryJobId,
  viewOnly = false,
  adjustment,
  onVerificationComplete,
  onAttachProof
}) => {
  const [phase, setPhase] = useState("idle");
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const { progressPercent, error: jobError } = useVerificationJob({
    jobId: activeJobId,
    adjustmentId,
    projectId,
    onComplete: useCallback((result) => {
      setReport(result);
      setLastVerifiedAt((/* @__PURE__ */ new Date()).toISOString());
      setPhase("complete");
      setActiveJobId(null);
      toast.success(`Verification complete — ${result.status}`);
    }, [])
  });
  useEffect(() => {
    if (jobError && phase === "polling") {
      setError(jobError);
      setPhase("error");
      setActiveJobId(null);
    }
  }, [jobError, phase]);
  const loadCachedResult = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase.from("adjustment_proofs").select("traceability_data, validated_at").eq("adjustment_id", adjustmentId).eq("verification_type", "ai_verification").maybeSingle();
      if (queryError) {
        console.error("Failed to load cached proof:", queryError.message);
        return null;
      }
      if (data?.traceability_data && typeof data.traceability_data === "object") {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }, [adjustmentId]);
  const runVerification = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setReport(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "verify-management-adjustment",
        {
          body: { adjustmentId, adjustment, projectId, jobId: discoveryJobId }
        }
      );
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (data?.jobId) {
        setActiveJobId(data.jobId);
        setPhase("polling");
      } else {
        setReport(data);
        setLastVerifiedAt((/* @__PURE__ */ new Date()).toISOString());
        setPhase("complete");
        toast.success(`Verification complete — ${data.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      setPhase("error");
      toast.error(msg);
    }
  }, [adjustmentId, adjustment, projectId, discoveryJobId]);
  useEffect(() => {
    if (open && phase === "idle") {
      loadCachedResult().then((cached) => {
        if (cached) {
          setReport(cached.traceability_data);
          setLastVerifiedAt(cached.validated_at);
          setPhase("cached");
        }
      });
    }
    if (!open) {
      setPhase("idle");
      setReport(null);
      setError(null);
      setLastVerifiedAt(null);
      setActiveJobId(null);
    }
  }, [open, phase, loadCachedResult]);
  const formatCurrency2 = (n) => n != null ? new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0
  }).format(n) : "N/A";
  const formatTimestamp = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };
  const buildSummaryNote = (r) => {
    const parts = [];
    parts.push(`Verification: ${r.status}`);
    parts.push(`${r.match_count} matches, ${formatCurrency2(r.total_matched)} total`);
    if (r.variance.difference !== 0) {
      parts.push(`Variance: ${formatCurrency2(r.variance.difference)}`);
    }
    if ((r.contradictions?.length ?? 0) > 0) {
      parts.push(`${r.contradictions.length} contradiction(s)`);
    }
    if ((r.data_gaps?.length ?? 0) > 0) {
      parts.push(`${r.data_gaps.length} data gap(s)`);
    }
    return parts.join(" · ");
  };
  const showResults = (phase === "complete" || phase === "cached" || phase === "polling" && report) && report;
  const isPolling = phase === "polling";
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-5xl max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Search, { className: "h-5 w-5" }),
      "Verify Adjustment"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-lg border p-3 bg-muted/30", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm", children: adjustment.description || "Untitled adjustment" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-1 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Category: ",
          adjustment.category
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Amount: ",
          formatCurrency2(adjustment.amount)
        ] })
      ] })
    ] }),
    phase === "idle" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 py-8 text-center", children: [
      /* @__PURE__ */ jsx(Search, { className: "h-8 w-8 text-muted-foreground/50" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Run verification to trace this adjustment against your project's GL, bank statements, and uploaded documents." }),
      /* @__PURE__ */ jsxs(Button, { onClick: runVerification, className: "gap-2 mt-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "h-4 w-4" }),
        "Run Verification"
      ] })
    ] }),
    phase === "loading" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-6 justify-center text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 animate-spin" }),
      "Starting verification…"
    ] }),
    isPolling && /* @__PURE__ */ jsxs("div", { className: "space-y-3 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: getProgressLabel(progressPercent) }),
        /* @__PURE__ */ jsxs("span", { className: "font-mono text-xs text-muted-foreground", children: [
          progressPercent,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-2" }),
      report && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "h-3 w-3 animate-spin" }),
        "Refreshing — previous result shown below"
      ] })
    ] }),
    phase === "error" && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-sm text-destructive", children: [
        /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { children: error }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "This can happen if the project is missing GL or Trial Balance data. Make sure financial data has been uploaded and processed before verifying." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: runVerification, className: "gap-2", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }),
        "Retry Verification"
      ] })
    ] }),
    showResults && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      (phase === "cached" || phase === "polling" && lastVerifiedAt) && lastVerifiedAt && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
        "Last verified ",
        formatTimestamp(lastVerifiedAt)
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsx(
        ProofValidationBadge,
        {
          score: null,
          status: STATUS_MAP[report.status],
          keyFindings: report.matching_transactions.slice(0, 3).map((t) => t.description || "Transaction"),
          redFlags: (report.contradictions ?? []).map((c) => c.description)
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 text-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Seller Amount" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono font-medium text-sm mt-1", children: formatCurrency2(report.variance.seller_amount) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Actual Amount" }),
          /* @__PURE__ */ jsx("div", { className: "font-mono font-medium text-sm mt-1", children: formatCurrency2(report.variance.actual_amount) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border p-3", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Difference" }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `font-mono font-medium text-sm mt-1 ${report.variance.difference !== 0 ? "text-destructive" : "text-primary"}`,
              children: formatCurrency2(report.variance.difference)
            }
          )
        ] })
      ] }),
      report.summary && /* @__PURE__ */ jsx("p", { className: "text-sm", children: report.summary }),
      report.matching_transactions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-medium flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-primary" }),
          "Matching Transactions",
          /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground font-normal ml-1", children: [
            "(",
            report.match_count,
            " matches · ",
            formatCurrency2(report.total_matched),
            " total)"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: report.matching_transactions.map((t) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "rounded border p-2 text-xs flex items-center justify-between gap-2",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                /* @__PURE__ */ jsx(Receipt, { className: "h-3 w-3 shrink-0 text-muted-foreground" }),
                /* @__PURE__ */ jsx("span", { className: "truncate", children: t.description || "—" }),
                t.vendor && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground shrink-0", children: [
                  "· ",
                  t.vendor
                ] }),
                t.date && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground shrink-0", children: t.date })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t.account_name }),
                /* @__PURE__ */ jsx("span", { className: "font-mono", children: formatCurrency2(t.amount) })
              ] })
            ]
          },
          t.id
        )) })
      ] }),
      report.matching_transactions.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-3", children: "No matching transactions found in project data." }),
      ((report.contradictions?.length ?? 0) > 0 || (report.data_gaps?.length ?? 0) > 0) && /* @__PURE__ */ jsxs(Accordion, { type: "multiple", className: "w-full", children: [
        (report.contradictions?.length ?? 0) > 0 && /* @__PURE__ */ jsxs(AccordionItem, { value: "contradictions", children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm py-2", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(ShieldAlert, { className: "h-4 w-4 text-destructive" }),
            "Contradictions (",
            report.contradictions.length,
            ")"
          ] }) }),
          /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: report.contradictions.map((c, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-xs", children: [
            /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: `shrink-0 text-[10px] px-1.5 ${SEVERITY_CLASSES[c.severity]}`,
                children: c.severity
              }
            ),
            /* @__PURE__ */ jsx("span", { children: c.description })
          ] }, i)) }) })
        ] }),
        (report.data_gaps?.length ?? 0) > 0 && /* @__PURE__ */ jsxs(AccordionItem, { value: "data-gaps", children: [
          /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm py-2", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(FileQuestion, { className: "h-4 w-4 text-amber-500" }),
            "Data Gaps (",
            report.data_gaps.length,
            ")"
          ] }) }),
          /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: report.data_gaps.map((g, i) => /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-xs", children: [
              /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: "outline",
                  className: `shrink-0 text-[10px] px-1.5 ${SEVERITY_CLASSES[g.severity]}`,
                  children: g.severity
                }
              ),
              /* @__PURE__ */ jsx("span", { children: g.description })
            ] }),
            g.recommendation && /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground ml-12", children: [
              "→ ",
              g.recommendation
            ] })
          ] }, i)) }) })
        ] })
      ] }),
      report.methodology_audit && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-medium flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-primary" }),
          "Methodology"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border p-3 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm", children: report.methodology_audit.method }),
            /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: cn(
              "text-xs",
              report.methodology_audit.confidence >= 0.8 ? "text-green-600 border-green-500/30" : report.methodology_audit.confidence >= 0.5 ? "text-amber-600 border-amber-500/30" : "text-destructive border-destructive/30"
            ), children: [
              Math.round(report.methodology_audit.confidence * 100),
              "% confidence"
            ] })
          ] }),
          report.methodology_audit.limitations.length > 0 && /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: report.methodology_audit.limitations.map((l, i) => /* @__PURE__ */ jsxs("li", { className: "text-xs text-muted-foreground flex items-start gap-1.5", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3 mt-0.5 shrink-0 text-amber-500" }),
            l
          ] }, i)) })
        ] })
      ] }),
      report.cross_source_validation && report.cross_source_validation.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-medium flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-primary" }),
          "Cross-Source Validation"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: report.cross_source_validation.map((v, i) => {
          const statusConfig = {
            confirmed: { bg: "bg-green-500/10 border-green-500/30 text-green-700", icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }) },
            verified: { bg: "bg-green-500/10 border-green-500/30 text-green-700", icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }) },
            partial_match: { bg: "bg-amber-500/10 border-amber-500/30 text-amber-700", icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }) },
            conflict: { bg: "bg-amber-500/10 border-amber-500/30 text-amber-700", icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }) },
            not_found: { bg: "bg-destructive/10 border-destructive/30 text-destructive", icon: /* @__PURE__ */ jsx(XCircle, { className: "h-3 w-3" }) },
            missing: { bg: "bg-destructive/10 border-destructive/30 text-destructive", icon: /* @__PURE__ */ jsx(XCircle, { className: "h-3 w-3" }) }
          };
          const cfg = statusConfig[v.status] || { bg: "bg-muted border-muted-foreground/20 text-muted-foreground", icon: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }) };
          return /* @__PURE__ */ jsxs("div", { className: cn("rounded-md border px-2.5 py-1.5 text-xs flex items-center gap-1.5", cfg.bg), children: [
            cfg.icon,
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: v.source }),
            /* @__PURE__ */ jsxs("span", { className: "opacity-75", children: [
              "— ",
              v.detail
            ] })
          ] }, i);
        }) })
      ] }),
      report.comprehensive_accounts && report.comprehensive_accounts.length > 0 && /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "w-full", children: /* @__PURE__ */ jsxs(AccordionItem, { value: "accounts", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm py-2", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Receipt, { className: "h-4 w-4 text-primary" }),
          "Account Comparison (",
          report.comprehensive_accounts.length,
          ")"
        ] }) }),
        /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("div", { className: "rounded-md border overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b bg-muted/50", children: [
            /* @__PURE__ */ jsx("th", { className: "text-left p-2 font-medium", children: "Account" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-2 font-medium", children: "GL Total" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-2 font-medium", children: "Matched" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-2 font-medium", children: "Variance" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: report.comprehensive_accounts.map((a, i) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0", children: [
            /* @__PURE__ */ jsxs("td", { className: "p-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-mono text-muted-foreground", children: [
                "#",
                a.account_number
              ] }),
              " ",
              a.account_name
            ] }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-mono", children: formatCurrency2(a.gl_total) }),
            /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-mono", children: formatCurrency2(a.matched_total) }),
            /* @__PURE__ */ jsx("td", { className: cn("p-2 text-right font-mono", Math.abs(a.variance) > 0.01 ? "text-destructive" : "text-primary"), children: formatCurrency2(a.variance) })
          ] }, i)) })
        ] }) }) })
      ] }) }),
      report.auto_detected_proposal_id && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5 text-primary" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "This adjustment was also detected by AI Discovery (proposal",
          " ",
          /* @__PURE__ */ jsx("code", { className: "font-mono text-primary", children: report.auto_detected_proposal_id.slice(0, 8) }),
          ")"
        ] })
      ] }),
      !isPolling && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-3 border-t gap-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: runVerification,
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
              "Re-verify"
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10",
              onClick: () => {
                const notes = buildSummaryNote(report);
                onVerificationComplete?.("rejected", notes);
                onOpenChange(false);
              },
              children: [
                /* @__PURE__ */ jsx(XCircle, { className: "h-3.5 w-3.5" }),
                "Reject"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-500/10",
              onClick: () => {
                const notes = buildSummaryNote(report);
                onVerificationComplete?.("proposed", notes);
                onOpenChange(false);
              },
              children: [
                /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3.5 w-3.5" }),
                "Flag for Review"
              ]
            }
          ),
          report.variance.difference !== 0 && /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              className: "gap-1.5 border-primary/50 text-primary hover:bg-primary/10",
              onClick: () => {
                const notes = buildSummaryNote(report) + ` · Amount reconciled to ${formatCurrency2(report.variance.actual_amount)}`;
                onVerificationComplete?.("accepted", notes, report.variance.actual_amount);
                onOpenChange(false);
              },
              children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5" }),
                "Accept at ",
                formatCurrency2(report.variance.actual_amount)
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              className: "gap-1.5",
              onClick: () => {
                const notes = buildSummaryNote(report);
                onVerificationComplete?.("accepted", notes);
                onOpenChange(false);
              },
              children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5" }),
                "Accept"
              ]
            }
          )
        ] })
      ] }),
      !isPolling && report.status !== "verified" && onAttachProof && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground", children: getProofHint(adjustment.description).hint }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "gap-1.5",
            onClick: () => {
              onOpenChange(false);
              onAttachProof();
            },
            children: [
              /* @__PURE__ */ jsx(Paperclip, { className: "h-3.5 w-3.5" }),
              "Attach Proof Documents"
            ]
          }
        )
      ] })
    ] })
  ] }) });
};
function proposalToLedgerAdjustment(p) {
  const periodValues = p.edited_period_values ?? p.proposed_period_values ?? {};
  return {
    id: crypto.randomUUID(),
    block: p.block || "DD",
    effectType: "EBITDA",
    adjustmentClass: p.adjustment_class || "nonrecurring",
    intent: p.intent || "remove_expense",
    linkedAccountNumber: p.linked_account_number ?? "",
    linkedAccountName: p.linked_account_name ?? void 0,
    description: p.title,
    evidenceNotes: p.ai_rationale ?? p.description,
    periodValues,
    sourceType: "ai",
    templateId: p.template_id ?? void 0,
    status: "proposed",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function extractBridgeSummary(detectorSummary) {
  if (!detectorSummary) return null;
  const bridge = detectorSummary.ebitda_bridge ?? detectorSummary;
  if (bridge.add_backs_total == null) return null;
  return {
    addBacksTotal: bridge.add_backs_total,
    haircutsTotal: bridge.haircuts_total,
    netEbitdaImpact: bridge.net_ebitda_impact,
    flagCount: bridge.flag_count ?? 0
  };
}
const STALE_JOB_MINUTES = 15;
const POLL_INTERVAL_MS = 15e3;
function useDiscoveryProposals(projectId) {
  const [job, setJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState(null);
  const [hasDiscoveryJobs, setHasDiscoveryJobs] = useState(null);
  const [staleWarning, setStaleWarning] = useState(null);
  const jobIdRef = useRef(null);
  const inflightRef = useRef(false);
  const lastFetchedProgressRef = useRef(0);
  const bridgeSummary = extractBridgeSummary(job?.detector_summary);
  const clearDiscoveryState = useCallback(() => {
    jobIdRef.current = null;
    setJob(null);
    setProposals([]);
    setIsRunning(false);
    setProgressPercent(0);
    setError(null);
    setStaleWarning(null);
    lastFetchedProgressRef.current = 0;
  }, []);
  const isJobStale = useCallback((jobData) => {
    if (jobData.status !== "running" && jobData.status !== "queued") return false;
    const startedAt = jobData.started_at ?? jobData.requested_at;
    if (!startedAt) return false;
    const elapsed = Date.now() - new Date(startedAt).getTime();
    return elapsed > STALE_JOB_MINUTES * 60 * 1e3;
  }, []);
  const fetchProposals = useCallback(
    async (filters) => {
      if (!projectId) {
        setProposals([]);
        return;
      }
      let query = supabase.from("adjustment_proposals").select("*").eq("project_id", projectId).neq("status", "duplicate").order("internal_score", { ascending: false }).limit(1e6);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.strength) query = query.eq("evidence_strength", filters.strength);
      if (filters?.detector_type) query = query.eq("detector_type", filters.detector_type);
      const { data, error: fetchErr } = await query;
      if (fetchErr) {
        console.error("Failed to fetch proposals:", fetchErr);
        return;
      }
      setProposals(data ?? []);
    },
    [projectId]
  );
  const checkForExistingJobs = useCallback(async () => {
    if (!projectId) {
      setHasDiscoveryJobs(false);
      clearDiscoveryState();
      return;
    }
    const { data, error: err } = await supabase.from("analysis_jobs").select("*").eq("project_id", projectId).order("requested_at", { ascending: false }).limit(1);
    if (err) {
      console.error("Failed to check discovery jobs:", err);
      setHasDiscoveryJobs(false);
      clearDiscoveryState();
      return;
    }
    const jobs = data ?? [];
    if (jobs.length === 0) {
      setHasDiscoveryJobs(false);
      clearDiscoveryState();
      return;
    }
    const latestJob = jobs[0];
    const running = latestJob.status === "queued" || latestJob.status === "running";
    if (running && isJobStale(latestJob)) {
      setHasDiscoveryJobs(true);
      setJob(latestJob);
      setIsRunning(false);
      setProgressPercent(latestJob.progress_percent ?? 0);
      setStaleWarning("Analysis may have stalled — showing available results");
      setError(null);
      jobIdRef.current = null;
      void fetchProposals();
      return;
    }
    setHasDiscoveryJobs(true);
    setJob(latestJob);
    setIsRunning(running);
    setProgressPercent(latestJob.progress_percent ?? 0);
    setStaleWarning(null);
    if (running || latestJob.status === "completed" || latestJob.status === "partial") {
      setError(null);
    } else {
      setError(latestJob.status === "failed" ? latestJob.error_message || "Analysis failed" : null);
    }
    jobIdRef.current = running ? latestJob.id : null;
  }, [clearDiscoveryState, projectId, isJobStale, fetchProposals]);
  useEffect(() => {
    void checkForExistingJobs();
    void fetchProposals();
  }, [checkForExistingJobs, fetchProposals]);
  useEffect(() => {
    if (!projectId) return;
    const refreshDiscoveryState = () => {
      void checkForExistingJobs();
      void fetchProposals();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDiscoveryState();
      }
    };
    const intervalId = window.setInterval(refreshDiscoveryState, POLL_INTERVAL_MS);
    window.addEventListener("focus", refreshDiscoveryState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDiscoveryState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkForExistingJobs, fetchProposals, projectId]);
  useEffect(() => {
    const currentJobId = jobIdRef.current;
    if (!currentJobId) return;
    const channel = supabase.channel(`discovery-job-${currentJobId}`).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "analysis_jobs",
        filter: `id=eq.${currentJobId}`
      },
      (payload) => {
        const updated = payload.new;
        const running = updated.status === "queued" || updated.status === "running";
        setJob(updated);
        setProgressPercent(updated.progress_percent);
        setIsRunning(running);
        setError(updated.status === "failed" ? updated.error_message || "Analysis failed" : null);
        jobIdRef.current = running ? updated.id : null;
        if (!running) inflightRef.current = false;
        if (updated.status === "completed" || updated.status === "partial") {
          void fetchProposals();
        } else if (running && updated.progress_percent >= lastFetchedProgressRef.current + 10) {
          lastFetchedProgressRef.current = updated.progress_percent;
          void fetchProposals();
        }
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProposals, job?.id, job?.status]);
  const runDiscovery = useCallback(async () => {
    if (!projectId || inflightRef.current || isRunning) return;
    inflightRef.current = true;
    setError(null);
    setIsRunning(true);
    setProgressPercent(0);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "trigger-discovery",
        { body: { project_id: projectId } }
      );
      if (invokeError) {
        setError(invokeError.message);
        setIsRunning(false);
        inflightRef.current = false;
        return;
      }
      const jobId = data?.job_id;
      const alreadyRunning = data?.status === "already_running";
      if (jobId) {
        jobIdRef.current = jobId;
        setJob({ id: jobId, status: alreadyRunning ? "running" : "queued", progress_percent: 0 });
        setHasDiscoveryJobs(true);
        setError(null);
        if (alreadyRunning) {
          inflightRef.current = false;
          void checkForExistingJobs();
        }
      }
    } catch (err) {
      setError(err.message || "Failed to start discovery");
      setIsRunning(false);
      inflightRef.current = false;
    }
  }, [projectId, isRunning, checkForExistingJobs]);
  const getProposalDetail = useCallback(
    async (proposalId) => {
      const [proposalRes, evidenceRes] = await Promise.all([
        supabase.from("adjustment_proposals").select("*").eq("id", proposalId).single(),
        supabase.from("proposal_evidence").select("*").eq("proposal_id", proposalId).limit(1e6)
      ]);
      return {
        proposal: proposalRes.data,
        evidence: evidenceRes.data ?? []
      };
    },
    []
  );
  const acceptProposal = useCallback(
    async (proposalId, edits) => {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const user = (await supabase.auth.getUser()).data.user;
      const updateData = {
        status: edits?.edited_amount != null || edits?.edited_period_values ? "accepted_with_edits" : "accepted",
        reviewer_user_id: user?.id,
        reviewer_notes: edits?.reviewer_notes ?? null,
        reviewed_at: now,
        updated_at: now
      };
      if (edits?.edited_amount != null) updateData.edited_amount = edits.edited_amount;
      if (edits?.edited_period_values) updateData.edited_period_values = edits.edited_period_values;
      const { data: updated, error: updateErr } = await supabase.from("adjustment_proposals").update(updateData).eq("id", proposalId).select().single();
      if (updateErr || !updated) {
        console.error("Failed to accept proposal:", updateErr);
        return null;
      }
      setProposals(
        (prev) => prev.map((p) => p.id === proposalId ? updated : p)
      );
      return proposalToLedgerAdjustment(updated);
    },
    []
  );
  const rejectProposal = useCallback(
    async (proposalId, notes) => {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("adjustment_proposals").update({
        status: "rejected",
        reviewer_user_id: user?.id,
        reviewer_notes: notes ?? null,
        reviewed_at: now,
        updated_at: now
      }).eq("id", proposalId);
      setProposals(
        (prev) => prev.map(
          (p) => p.id === proposalId ? { ...p, status: "rejected", reviewer_notes: notes ?? null } : p
        )
      );
    },
    []
  );
  const deferProposal = useCallback(async (proposalId) => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await supabase.from("adjustment_proposals").update({ status: "deferred", updated_at: now }).eq("id", proposalId);
    setProposals(
      (prev) => prev.map((p) => p.id === proposalId ? { ...p, status: "deferred" } : p)
    );
  }, []);
  return {
    job,
    proposals,
    isRunning,
    progressPercent,
    error,
    staleWarning,
    hasDiscoveryJobs,
    bridgeSummary,
    runDiscovery,
    fetchProposals,
    getProposalDetail,
    acceptProposal,
    rejectProposal,
    deferProposal
  };
}
const fmt = (num) => {
  if (num == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};
function parseRationaleJson(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch {
  }
  return null;
}
function groupEvidenceByAccount(evidence) {
  const map = /* @__PURE__ */ new Map();
  for (const ev of evidence) {
    const key = `${ev.account_number ?? "—"}::${ev.account_name ?? "Unknown"}`;
    const existing = map.get(key);
    if (existing) {
      existing.total += ev.amount ?? 0;
      existing.count += 1;
    } else {
      map.set(key, {
        accountNumber: ev.account_number,
        accountName: ev.account_name,
        total: ev.amount ?? 0,
        count: 1
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}
function extractKeySignals(aiKeySignals, parsedRationale) {
  if (aiKeySignals && aiKeySignals.length > 0) return aiKeySignals;
  if (!parsedRationale) return [];
  return parsedRationale.key_signals ?? parsedRationale.signals ?? parsedRationale.key_findings ?? [];
}
function MetricCard({
  label,
  value,
  sub,
  icon,
  variant = "default"
}) {
  const bg = {
    default: "bg-muted/50 border-border",
    success: "bg-green-500/5 border-green-500/20",
    warning: "bg-yellow-500/5 border-yellow-500/20",
    danger: "bg-destructive/5 border-destructive/20"
  };
  const text = {
    default: "text-foreground",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-destructive"
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("rounded-lg border p-3 space-y-1", bg[variant]), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
      icon,
      label
    ] }),
    /* @__PURE__ */ jsx("div", { className: cn("text-lg font-semibold font-mono", text[variant]), children: value }),
    sub && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: sub })
  ] });
}
function SectionHeader({ children }) {
  return /* @__PURE__ */ jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2", children });
}
function CollapsibleSection({
  title,
  icon,
  count,
  defaultOpen = false,
  variant,
  children
}) {
  const [open, setOpen] = useState(defaultOpen);
  const wrapperCn = variant === "warning" ? "rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3" : variant === "danger" ? "rounded-md border border-destructive/30 bg-destructive/5 p-3" : "";
  return /* @__PURE__ */ jsx(Collapsible, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs("div", { className: wrapperCn, children: [
    /* @__PURE__ */ jsxs(CollapsibleTrigger, { className: "flex items-center gap-2 w-full", children: [
      /* @__PURE__ */ jsxs(SectionHeader, { children: [
        icon,
        title,
        count != null ? ` (${count})` : ""
      ] }),
      open ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5 text-muted-foreground" })
    ] }),
    /* @__PURE__ */ jsx(CollapsibleContent, { children })
  ] }) });
}
function ProposalDetailCard({
  proposal,
  evidence,
  onAccept,
  onAcceptWithEdits,
  onReject,
  onDefer
}) {
  const parsedRationale = useMemo(
    () => parseRationaleJson(proposal.ai_rationale),
    [proposal.ai_rationale]
  );
  const rawSupport = proposal.support_json ?? {};
  const support = useMemo(() => ({
    confidence: rawSupport.confidence ?? parsedRationale?.confidence,
    direction: rawSupport.direction ?? parsedRationale?.direction,
    reported_amount: rawSupport.reported_amount ?? parsedRationale?.reported_amount,
    proposed_adjustment: rawSupport.proposed_adjustment ?? parsedRationale?.proposed_adjustment,
    assumptions: rawSupport.assumptions?.length ? rawSupport.assumptions : parsedRationale?.assumptions,
    skeptic: rawSupport.skeptic?.score != null ? rawSupport.skeptic : parsedRationale?.skeptic,
    display: rawSupport.display
  }), [rawSupport, parsedRationale]);
  const skeptic = support.skeptic;
  const isActioned = ["accepted", "accepted_with_edits", "rejected", "deferred"].includes(proposal.status);
  const isITDA = isITDAAnchor(proposal.linked_account_name || "") || isITDAAnchor(proposal.title || "");
  const reportedAmt = support.reported_amount;
  const proposedAmt = support.proposed_adjustment ?? proposal.proposed_amount;
  const pctOfGL = reportedAmt && proposedAmt ? Math.round(proposedAmt / reportedAmt * 100) : null;
  const displayMeta = support.display;
  const DIR_LABEL_MAP = {
    add_back: "Add-Back",
    deduction: "Deduction",
    remove_expense: "Add-Back",
    remove_revenue: "Haircut",
    add_expense: "Missing Cost",
    add_revenue: "Revenue Add",
    normalize_up_expense: "Normalize ↑",
    normalize_down_expense: "Normalize ↓",
    other: "Flag for Review"
  };
  const dirKey = support.direction || proposal.intent || "other";
  const dirLabel = displayMeta?.direction_label ?? DIR_LABEL_MAP[dirKey] ?? "Adjustment";
  const isNeutralFlag = displayMeta?.impact_type === "neutral_flag" || dirKey === "other";
  const ebitdaSign = isNeutralFlag ? 0 : displayMeta?.impact_type === "increase_ebitda" ? 1 : displayMeta?.impact_type === "decrease_ebitda" ? -1 : INTENT_TO_SIGN[dirKey] ?? 0;
  const ebitdaPositive = ebitdaSign > 0;
  const ebitdaNegative = ebitdaSign < 0;
  const accountGroups = useMemo(() => groupEvidenceByAccount(evidence), [evidence]);
  const keySignals = useMemo(
    () => extractKeySignals(proposal.ai_key_signals, parsedRationale),
    [proposal.ai_key_signals, parsedRationale]
  );
  const rationaleText = parsedRationale?.rationale ?? // If ai_rationale wasn't JSON, use it as plain text
  (parsedRationale === null ? proposal.ai_rationale : null);
  const directionIcon = isNeutralFlag ? /* @__PURE__ */ jsx(Flag, { className: "h-3.5 w-3.5" }) : ebitdaPositive ? /* @__PURE__ */ jsx(TrendingUp, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "h-3.5 w-3.5" });
  const metricVariant = isNeutralFlag ? "default" : ebitdaPositive ? "success" : ebitdaNegative ? "warning" : "default";
  const metricLabel = isNeutralFlag ? "Flagged Amount" : dirLabel;
  return /* @__PURE__ */ jsxs("div", { className: "p-4 pt-0 space-y-4 border-t", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 pt-4", children: [
      reportedAmt != null && /* @__PURE__ */ jsx(MetricCard, { label: "GL Amount", value: fmt(reportedAmt), icon: /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3" }) }),
      /* @__PURE__ */ jsx(
        MetricCard,
        {
          label: metricLabel,
          value: fmt(proposedAmt),
          sub: pctOfGL != null ? `${pctOfGL}% of GL` : void 0,
          icon: directionIcon,
          variant: metricVariant
        }
      )
    ] }),
    Object.keys(proposal.proposed_period_values || {}).length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(proposal.proposed_period_values).map(([period, amount]) => /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs font-mono", children: [
      period,
      ": ",
      fmt(amount)
    ] }, period)) }),
    accountGroups.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(SectionHeader, { children: [
        /* @__PURE__ */ jsx(List, { className: "h-3.5 w-3.5" }),
        "Account Breakdown"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-md border overflow-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
        /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs w-[60px]", children: "Acct" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Name" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right w-[90px]", children: "Amount" }),
          /* @__PURE__ */ jsx(TableHead, { className: "text-xs w-[50px] text-center", children: "Txns" })
        ] }) }),
        /* @__PURE__ */ jsx(TableBody, { children: accountGroups.map((g) => /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs font-mono text-muted-foreground", children: g.accountNumber ? `#${g.accountNumber}` : "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs font-medium", children: g.accountName ?? "—" }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-right font-mono", children: fmt(g.total) }),
          /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-center text-muted-foreground", children: g.count })
        ] }, `${g.accountNumber}-${g.accountName}`)) })
      ] }) })
    ] }),
    keySignals.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(SectionHeader, { children: [
        /* @__PURE__ */ jsx(Lightbulb, { className: "h-3.5 w-3.5" }),
        "Key Signals"
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-1.5", children: keySignals.map((s, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx("span", { className: "mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" }),
        s
      ] }, i)) })
    ] }),
    support.assumptions && support.assumptions.length > 0 && /* @__PURE__ */ jsx(CollapsibleSection, { title: "Assumptions", icon: /* @__PURE__ */ jsx(FileText, { className: "h-3.5 w-3.5" }), count: support.assumptions.length, children: /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1.5", children: support.assumptions.map((a, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { className: "mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" }),
      a
    ] }, i)) }) }),
    proposal.ai_warnings?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-sm font-medium text-yellow-600", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3.5 w-3.5" }),
        "Warnings"
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: proposal.ai_warnings.map((w, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-yellow-600/80", children: [
        /* @__PURE__ */ jsx("span", { className: "mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500/50 shrink-0" }),
        w
      ] }, i)) })
    ] }),
    skeptic?.challenges && skeptic.challenges.length > 0 && /* @__PURE__ */ jsx(CollapsibleSection, { title: "Lender Challenges", icon: /* @__PURE__ */ jsx(ShieldAlert, { className: "h-3.5 w-3.5" }), count: skeptic.challenges.length, defaultOpen: true, variant: "danger", children: /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1", children: skeptic.challenges.map((c, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2 text-sm text-destructive/80", children: [
      /* @__PURE__ */ jsx("span", { className: "mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" }),
      c
    ] }, i)) }) }),
    evidence.length > 0 && /* @__PURE__ */ jsx(CollapsibleSection, { title: "Evidence Transactions", icon: /* @__PURE__ */ jsx(FileText, { className: "h-3.5 w-3.5" }), count: evidence.length, children: /* @__PURE__ */ jsx("div", { className: "rounded-md border overflow-auto max-h-48 mt-2", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Date" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Vendor" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs text-right", children: "Amount" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Description" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-xs", children: "Match" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: evidence.map((ev) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs", children: ev.txn_date ?? "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs", children: ev.vendor ?? "—" }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs text-right font-mono", children: fmt(ev.amount) }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-xs max-w-[180px] truncate", children: ev.description ?? "—" }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn(
          "text-[9px]",
          ev.match_quality === "strong" && "text-green-600",
          ev.match_quality === "moderate" && "text-yellow-600",
          ev.match_quality === "weak" && "text-muted-foreground"
        ), children: ev.match_quality }) })
      ] }, ev.id)) })
    ] }) }) }),
    rationaleText && /* @__PURE__ */ jsx(CollapsibleSection, { title: "Full AI Analysis", icon: /* @__PURE__ */ jsx(Lightbulb, { className: "h-3.5 w-3.5" }), children: /* @__PURE__ */ jsx("div", { className: "rounded-md border bg-muted/30 p-3 mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed max-h-64 overflow-auto", children: rationaleText }) }),
    !isActioned && isITDA && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-amber-500 shrink-0" }),
      /* @__PURE__ */ jsx("span", { children: "Interest, Taxes, Depreciation & Amortization are already excluded from EBITDA — this cannot be added as an adjustment." })
    ] }),
    !isActioned && !isITDA && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2 border-t", children: [
      /* @__PURE__ */ jsxs(Button, { size: "sm", className: "gap-1.5", onClick: onAccept, children: [
        /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5" }),
        "Accept"
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "gap-1.5", onClick: onAcceptWithEdits, children: [
        /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5" }),
        "Accept with Edits"
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", className: "gap-1.5", onClick: onReject, children: [
        /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" }),
        "Reject"
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "ghost", className: "gap-1.5", onClick: onDefer, children: [
        /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
        "Defer"
      ] })
    ] })
  ] });
}
function PriorityBadge({ priority }) {
  const styles = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    normal: "bg-primary/10 text-primary border-primary/20",
    low: "bg-muted text-muted-foreground border-border"
  };
  return /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px] capitalize", styles[priority] || styles.normal), children: priority });
}
function StrengthBadge({ strength }) {
  const styles = {
    strong: "bg-green-500/10 text-green-600 border-green-500/20",
    moderate: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    weak: "bg-muted text-muted-foreground border-border"
  };
  return /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: cn("text-[10px] capitalize", styles[strength] || styles.moderate), children: [
    /* @__PURE__ */ jsx(Shield, { className: "w-2.5 h-2.5 mr-1" }),
    strength
  ] });
}
function StatusBadge({ status }) {
  const styles = {
    new: "bg-primary/10 text-primary",
    triaged: "bg-primary/10 text-primary",
    needs_review: "bg-yellow-500/10 text-yellow-600",
    accepted: "bg-green-500/10 text-green-600",
    accepted_with_edits: "bg-green-500/10 text-green-600",
    rejected: "bg-destructive/10 text-destructive",
    deferred: "bg-muted text-muted-foreground"
  };
  return /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px] capitalize", styles[status] || ""), children: status.replace(/_/g, " ") });
}
const formatCurrency = (num) => {
  if (num == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};
function getProposalSign(p) {
  const display = p.support_json?.display;
  if (display?.impact_type === "increase_ebitda") return 1;
  if (display?.impact_type === "decrease_ebitda") return -1;
  if (display?.impact_type === "neutral_flag") return 0;
  const intent = p.intent || "other";
  return INTENT_TO_SIGN[intent] ?? 0;
}
function DirectionIndicator({ proposal }) {
  const sign = getProposalSign(proposal);
  if (sign === 0) return /* @__PURE__ */ jsx(Flag, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" });
  if (sign > 0) return /* @__PURE__ */ jsx(TrendingUp, { className: "h-3.5 w-3.5 text-green-600 shrink-0" });
  return /* @__PURE__ */ jsx(TrendingDown, { className: "h-3.5 w-3.5 text-yellow-600 shrink-0" });
}
function DiscoveryProposalsSection({
  projectId,
  onConvertToAdjustment,
  isDemo,
  mockProposals
}) {
  const {
    job,
    proposals: hookProposals,
    isRunning,
    progressPercent,
    error,
    runDiscovery,
    acceptProposal,
    rejectProposal,
    deferProposal,
    getProposalDetail
  } = useDiscoveryProposals(projectId);
  const proposals = isDemo && mockProposals ? mockProposals : hookProposals;
  const [expandedIds, setExpandedIds] = useState(/* @__PURE__ */ new Set());
  const [evidenceMap, setEvidenceMap] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [groupMode, setGroupMode] = useState("direction");
  const bridgeStats = useMemo(() => {
    const detectorSummary = job?.detector_summary;
    const bridge = detectorSummary?.ebitda_bridge ?? detectorSummary;
    if (bridge?.add_backs_total != null) {
      return {
        addBacks: bridge.add_backs_total,
        haircuts: bridge.haircuts_total,
        net: bridge.net_ebitda_impact,
        flagCount: detectorSummary.flag_count,
        fromBackend: true
      };
    }
    let addBacks = 0;
    let haircuts = 0;
    let flagCount = 0;
    for (const p of proposals) {
      const sign = getProposalSign(p);
      const amt = p.proposed_amount ?? 0;
      if (sign === 0) {
        flagCount++;
      } else if (sign > 0) {
        addBacks += amt;
      } else {
        haircuts += amt;
      }
    }
    return { addBacks, haircuts, net: addBacks - haircuts, flagCount, fromBackend: false };
  }, [proposals, job?.detector_summary]);
  const grouped = useMemo(() => {
    if (groupMode === "strength") {
      return {
        groups: [
          { label: "Strong Evidence", items: proposals.filter((p) => p.evidence_strength === "strong") },
          { label: "Moderate Evidence", items: proposals.filter((p) => p.evidence_strength === "moderate") },
          { label: "Weak Evidence", items: proposals.filter((p) => p.evidence_strength === "weak") }
        ]
      };
    }
    if (groupMode === "block") {
      return {
        groups: [
          { label: "Management Adjustments", items: proposals.filter((p) => p.block === "MA") },
          { label: "Due Diligence Adjustments", items: proposals.filter((p) => p.block === "DD") },
          { label: "Pro Forma Adjustments", items: proposals.filter((p) => p.block === "PF") }
        ]
      };
    }
    return {
      groups: [
        { label: "Add-Backs (↑ EBITDA)", items: proposals.filter((p) => getProposalSign(p) > 0) },
        { label: "Haircuts (↓ EBITDA)", items: proposals.filter((p) => getProposalSign(p) < 0) },
        { label: "Flags for Review", items: proposals.filter((p) => getProposalSign(p) === 0) }
      ]
    };
  }, [proposals, groupMode]);
  const fetchEvidence = async (proposalId) => {
    if (evidenceMap[proposalId]) return;
    if (isDemo) {
      setEvidenceMap((prev) => ({ ...prev, [proposalId]: [] }));
      return;
    }
    const detail = await getProposalDetail(proposalId);
    setEvidenceMap((prev) => ({ ...prev, [proposalId]: detail.evidence }));
  };
  const handleToggle = async (proposalId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(proposalId)) {
        next.delete(proposalId);
      } else {
        next.add(proposalId);
        fetchEvidence(proposalId);
      }
      return next;
    });
  };
  const allExpanded = proposals.length > 0 && expandedIds.size === proposals.length;
  const handleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds(/* @__PURE__ */ new Set());
    } else {
      const allIds = new Set(proposals.map((p) => p.id));
      setExpandedIds(allIds);
      proposals.forEach((p) => fetchEvidence(p.id));
    }
  };
  const handleAccept = async (proposal) => {
    if (isDemo) {
      toast.info("Preview mode", { description: "Sign up to accept proposals on a real project." });
      return;
    }
    const adj = await acceptProposal(proposal.id);
    if (adj) onConvertToAdjustment(adj);
  };
  const openEditDialog = (proposal) => {
    setEditingProposal(proposal);
    setEditAmount(String(proposal.proposed_amount ?? 0));
    setEditNotes("");
    setEditDialogOpen(true);
  };
  const handleAcceptWithEdits = async () => {
    if (!editingProposal) return;
    const adj = await acceptProposal(editingProposal.id, {
      edited_amount: parseFloat(editAmount) || void 0,
      reviewer_notes: editNotes || void 0
    });
    if (adj) {
      const editedAmt = parseFloat(editAmount);
      if (!isNaN(editedAmt) && editedAmt !== editingProposal.proposed_amount) {
        adj.periodValues = { ...adj.periodValues };
        const periods = Object.keys(adj.periodValues);
        if (periods.length > 0) {
          const perPeriod = editedAmt / periods.length;
          periods.forEach((p) => adj.periodValues[p] = perPeriod);
        }
      }
      onConvertToAdjustment(adj);
    }
    setEditDialogOpen(false);
  };
  const openRejectDialog = (proposalId) => {
    if (isDemo) {
      toast.info("Preview mode", { description: "Sign up to reject proposals on a real project." });
      return;
    }
    setRejectingId(proposalId);
    setRejectNotes("");
    setRejectDialogOpen(true);
  };
  const handleReject = async () => {
    if (!rejectingId) return;
    await rejectProposal(rejectingId, rejectNotes || void 0);
    setRejectDialogOpen(false);
  };
  const renderProposalCard = (proposal) => {
    const isExpanded = expandedIds.has(proposal.id);
    const evidence = evidenceMap[proposal.id] ?? [];
    const isActioned = ["accepted", "accepted_with_edits", "rejected", "deferred"].includes(
      proposal.status
    );
    const sign = getProposalSign(proposal);
    return /* @__PURE__ */ jsxs(Card, { className: cn("overflow-hidden", isActioned && "opacity-60"), children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
          onClick: () => handleToggle(proposal.id),
          children: [
            isExpanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 shrink-0" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 shrink-0" }),
            /* @__PURE__ */ jsx(PriorityBadge, { priority: proposal.review_priority }),
            /* @__PURE__ */ jsx(StrengthBadge, { strength: proposal.evidence_strength }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium truncate block", children: proposal.title }),
              proposal.linked_account_name && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                proposal.linked_account_number,
                " — ",
                proposal.linked_account_name
              ] })
            ] }),
            /* @__PURE__ */ jsx(DirectionIndicator, { proposal }),
            /* @__PURE__ */ jsxs("div", { className: cn(
              "text-sm font-mono font-medium",
              sign > 0 && "text-green-600",
              sign < 0 && "text-yellow-600",
              sign === 0 && "text-muted-foreground"
            ), children: [
              sign > 0 && "+",
              sign === 0 ? "—" : formatCurrency(proposal.proposed_amount)
            ] }),
            /* @__PURE__ */ jsx(StatusBadge, { status: proposal.status })
          ]
        }
      ),
      isExpanded && /* @__PURE__ */ jsx(
        ProposalDetailCard,
        {
          proposal,
          evidence,
          onAccept: () => handleAccept(proposal),
          onAcceptWithEdits: () => openEditDialog(proposal),
          onReject: () => openRejectDialog(proposal.id),
          onDefer: () => deferProposal(proposal.id)
        }
      )
    ] }, proposal.id);
  };
  const renderGroup = (label, items) => {
    if (items.length === 0) return null;
    return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("h4", { className: "text-sm font-medium text-muted-foreground", children: [
        label,
        " (",
        items.length,
        ")"
      ] }),
      items.map(renderProposalCard)
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5" }),
            "AI Adjustment Discovery"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "AI-powered analysis of your financial data and documents to identify potential adjustments" })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            onClick: () => {
              if (isDemo) {
                toast.info("AI Discovery requires real financial data", {
                  description: "Sign up to use this feature on a real project."
                });
                return;
              }
              runDiscovery();
            },
            disabled: isRunning,
            className: "gap-2",
            children: [
              /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4" }),
              isRunning ? "Running..." : proposals.length > 0 ? "Re-run Discovery" : "Run Discovery"
            ]
          }
        )
      ] }) }),
      isRunning && /* @__PURE__ */ jsx(CardContent, { className: "pt-0 pb-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: job?.status === "queued" ? "Queued..." : "Analyzing..." }),
          /* @__PURE__ */ jsxs("span", { className: "font-mono", children: [
            progressPercent,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-2" }),
        job?.id && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground font-mono mt-1", children: [
          "Job: ",
          job.id.slice(0, 8),
          "… | Status: ",
          job.status,
          " | Attempt: ",
          job.attempt_number ?? 1
        ] })
      ] }) }),
      error && /* @__PURE__ */ jsx(CardContent, { className: "pt-0 pb-4", children: /* @__PURE__ */ jsx("div", { className: "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive", children: error }) }),
      proposals.length > 0 && !isRunning && /* @__PURE__ */ jsxs(CardContent, { className: "pt-0 pb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-3 mb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Proposals" }),
            /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", children: proposals.length })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-green-500/20 bg-green-500/5 p-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3" }),
              " Add-Backs"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold font-mono text-green-600", children: [
              "+",
              formatCurrency(bridgeStats.addBacks)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(TrendingDown, { className: "h-3 w-3" }),
              " Haircuts"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold font-mono text-yellow-600", children: [
              "−",
              formatCurrency(bridgeStats.haircuts)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-primary/20 bg-primary/5 p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Net EBITDA Impact" }),
            /* @__PURE__ */ jsxs("div", { className: cn(
              "text-lg font-bold font-mono",
              bridgeStats.net >= 0 ? "text-green-600" : "text-destructive"
            ), children: [
              bridgeStats.net >= 0 ? "+" : "",
              formatCurrency(bridgeStats.net)
            ] }),
            bridgeStats.flagCount > 0 && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Flag, { className: "h-2.5 w-2.5" }),
              " ",
              bridgeStats.flagCount,
              " flags excluded"
            ] })
          ] })
        ] }),
        job?.id && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground font-mono", children: [
          "Job: ",
          job.id.slice(0, 8),
          "… | Completed: ",
          job.completed_at ? new Date(job.completed_at).toLocaleTimeString() : "—"
        ] })
      ] })
    ] }),
    proposals.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: handleExpandAll, className: "text-xs gap-1.5", children: allExpanded ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5" }),
          " Collapse All"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5" }),
          " Expand All"
        ] }) }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-medium", children: "Group by:" }),
        /* @__PURE__ */ jsxs(
          ToggleGroup,
          {
            type: "single",
            value: groupMode,
            onValueChange: (v) => v && setGroupMode(v),
            size: "sm",
            children: [
              /* @__PURE__ */ jsx(ToggleGroupItem, { value: "direction", className: "text-xs", children: "Direction" }),
              /* @__PURE__ */ jsx(ToggleGroupItem, { value: "strength", className: "text-xs", children: "Evidence" }),
              /* @__PURE__ */ jsx(ToggleGroupItem, { value: "block", className: "text-xs", children: "Block" })
            ]
          }
        )
      ] }),
      grouped.groups.map((g) => renderGroup(g.label, g.items))
    ] }),
    !isRunning && proposals.length === 0 && !error && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-12 text-center text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }),
      /* @__PURE__ */ jsx("p", { children: 'Click "Run Discovery" to analyze your financial data for potential adjustments' })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: editDialogOpen, onOpenChange: setEditDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Accept with Edits" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Modify the proposed amount before accepting this adjustment." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Adjusted Amount" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              value: editAmount,
              onChange: (e) => setEditAmount(e.target.value),
              placeholder: "Enter adjusted amount..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Notes" }),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: editNotes,
              onChange: (e) => setEditNotes(e.target.value),
              placeholder: "Reason for edit...",
              rows: 2
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setEditDialogOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleAcceptWithEdits, children: "Accept with Edits" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: rejectDialogOpen, onOpenChange: setRejectDialogOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Reject Proposal" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Optionally provide a reason for rejecting." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "py-2", children: /* @__PURE__ */ jsx(
        Textarea,
        {
          value: rejectNotes,
          onChange: (e) => setRejectNotes(e.target.value),
          placeholder: "Reason for rejection (optional)...",
          rows: 3
        }
      ) }),
      /* @__PURE__ */ jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setRejectDialogOpen(false), children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: handleReject, children: "Reject" })
      ] })
    ] }) })
  ] });
}
function AccountPicker({
  accounts,
  value,
  onChange,
  placeholder = "Select account...",
  filterFsType,
  disabled = false,
  required = false,
  showWarningIfNotFound = true
}) {
  const [open, setOpen] = useState(false);
  const filteredAccounts = useMemo(() => {
    if (!filterFsType) return accounts;
    return accounts.filter((acc) => {
      const type = acc.fsType?.toUpperCase();
      if (filterFsType === "IS") {
        return type === "IS" || type === "INCOME" || type === "EXPENSE";
      }
      if (filterFsType === "BS") {
        return type === "BS" || type === "ASSET" || type === "LIABILITY" || type === "EQUITY";
      }
      return true;
    });
  }, [accounts, filterFsType]);
  const groupedAccounts = useMemo(() => {
    const groups = {};
    for (const acc of filteredAccounts) {
      const group = acc.fsType || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(acc);
    }
    return groups;
  }, [filteredAccounts]);
  const selectedAccount = useMemo(() => {
    if (!value) return null;
    return accounts.find(
      (acc) => acc.accountNumber === value || acc.accountId === value
    );
  }, [accounts, value]);
  const displayValue = selectedAccount ? `${selectedAccount.accountNumber || selectedAccount.accountId} - ${selectedAccount.accountName}` : value || "";
  const isUnmapped = value && !selectedAccount && showWarningIfNotFound;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-full", children: [
    /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
      /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          role: "combobox",
          "aria-expanded": open,
          disabled,
          className: cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            isUnmapped && "border-destructive",
            required && !value && "border-destructive/50"
          ),
          children: [
            /* @__PURE__ */ jsx("span", { className: "truncate", children: displayValue || placeholder }),
            /* @__PURE__ */ jsx(ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(PopoverContent, { className: "w-[400px] p-0", align: "start", children: /* @__PURE__ */ jsxs(Command, { children: [
        /* @__PURE__ */ jsx(CommandInput, { placeholder: "Search accounts..." }),
        /* @__PURE__ */ jsxs(CommandList, { children: [
          /* @__PURE__ */ jsx(CommandEmpty, { children: "No account found." }),
          Object.entries(groupedAccounts).map(([group, accs]) => /* @__PURE__ */ jsx(CommandGroup, { heading: group, children: accs.map((acc) => {
            const accKey = acc.accountNumber || acc.accountId || acc.accountName;
            return /* @__PURE__ */ jsxs(
              CommandItem,
              {
                value: `${accKey} ${acc.accountName} ${acc.fsLineItem || ""}`,
                onSelect: () => {
                  onChange(acc.accountNumber || acc.accountId || "", acc.accountName);
                  setOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsx(
                    Check,
                    {
                      className: cn(
                        "mr-2 h-4 w-4",
                        value === accKey ? "opacity-100" : "opacity-0"
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                    /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                      acc.accountNumber || acc.accountId,
                      " - ",
                      acc.accountName
                    ] }),
                    acc.fsLineItem && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: acc.fsLineItem })
                  ] })
                ]
              },
              accKey
            );
          }) }, group))
        ] })
      ] }) })
    ] }),
    isUnmapped && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "shrink-0 gap-1", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-3 w-3" }),
      "Unmapped"
    ] })
  ] });
}
const COMMON_INTENTS = [
  "remove_expense",
  "remove_revenue",
  "add_expense",
  "add_revenue",
  "normalize_up_expense",
  "normalize_down_expense"
];
function IntentSelector({
  value,
  onChange,
  disabled = false,
  compact = false
}) {
  const getSignIcon = (intent) => {
    const sign = INTENT_TO_SIGN[intent];
    if (sign === 1) return /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3 text-green-600" });
    if (sign === -1) return /* @__PURE__ */ jsx(TrendingDown, { className: "h-3 w-3 text-red-600" });
    return /* @__PURE__ */ jsx(HelpCircle, { className: "h-3 w-3 text-muted-foreground" });
  };
  const getSignLabel = (intent) => {
    const sign = INTENT_TO_SIGN[intent];
    if (sign === 1) return "+EBITDA";
    if (sign === -1) return "−EBITDA";
    return "Manual";
  };
  if (compact) {
    return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: COMMON_INTENTS.map((intent) => {
      const info = INTENT_LABELS[intent];
      const isSelected = value === intent;
      return /* @__PURE__ */ jsxs(Tooltip, { children: [
        /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            disabled,
            onClick: () => onChange(intent),
            className: cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              "border",
              isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border",
              disabled && "opacity-50 cursor-not-allowed"
            ),
            children: [
              getSignIcon(intent),
              /* @__PURE__ */ jsx("span", { className: "truncate max-w-[120px]", children: info.label })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs(TooltipContent, { side: "bottom", className: "max-w-xs", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: info.label }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: info.description }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium mt-1", children: getSignLabel(intent) })
        ] })
      ] }, intent);
    }) }) });
  }
  return /* @__PURE__ */ jsx(
    RadioGroup,
    {
      value,
      onValueChange: (v) => onChange(v),
      disabled,
      className: "space-y-2",
      children: COMMON_INTENTS.map((intent) => {
        const info = INTENT_LABELS[intent];
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
              value === intent ? "bg-primary/5 border-primary" : "hover:bg-muted/50 border-border"
            ),
            children: [
              /* @__PURE__ */ jsx(RadioGroupItem, { value: intent, id: intent, className: "mt-0.5" }),
              /* @__PURE__ */ jsxs(
                Label,
                {
                  htmlFor: intent,
                  className: "flex-1 cursor-pointer space-y-1",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      getSignIcon(intent),
                      /* @__PURE__ */ jsx("span", { className: "font-medium", children: info.label }),
                      /* @__PURE__ */ jsx("span", { className: cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        INTENT_TO_SIGN[intent] === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      ), children: getSignLabel(intent) })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: info.description })
                  ]
                }
              )
            ]
          },
          intent
        );
      })
    }
  );
}
function BufferedNumberInput({
  value,
  onCommit,
  disabled
}) {
  const [local, setLocal] = useState(value?.toString() ?? "");
  useEffect(() => {
    setLocal(value?.toString() ?? "");
  }, [value]);
  return /* @__PURE__ */ jsx(
    Input,
    {
      type: "number",
      value: local,
      onChange: (e) => setLocal(e.target.value),
      onBlur: () => {
        const num = parseFloat(local) || 0;
        onCommit(num);
      },
      disabled,
      className: cn(
        "w-[75px] h-8 text-right text-sm",
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      ),
      placeholder: "0"
    }
  );
}
function PeriodValueGrid({
  periods,
  values,
  onChange,
  disabled = false,
  showTotal = true
}) {
  const [applyTotalInput, setApplyTotalInput] = useState("");
  const [distributionMethod, setDistributionMethod] = useState("even");
  const formatPeriodLabel = useCallback((period) => {
    if (period.label) return period.label;
    const [year, month] = period.id.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex] || month} ${year?.slice(2)}`;
  }, []);
  const total = useMemo(() => {
    return Object.values(values).reduce((sum, val) => sum + (val || 0), 0);
  }, [values]);
  const handleCellCommit = useCallback((periodId, numValue) => {
    const newValues = { ...values };
    if (numValue === 0) {
      delete newValues[periodId];
    } else {
      newValues[periodId] = numValue;
    }
    onChange(newValues);
  }, [values, onChange]);
  const applyTotal = useCallback(() => {
    const totalAmount = parseFloat(applyTotalInput) || 0;
    if (totalAmount === 0 || periods.length === 0) return;
    const newValues = {};
    if (distributionMethod === "last_period") {
      newValues[periods[periods.length - 1].id] = totalAmount;
    } else {
      const count = periods.length;
      const base = Math.floor(totalAmount / count);
      let remainder = totalAmount - base * count;
      for (let i = 0; i < count; i++) {
        let cellVal = base;
        if (remainder > 0) {
          cellVal += 1;
          remainder -= 1;
        }
        if (cellVal !== 0) {
          newValues[periods[i].id] = cellVal;
        }
      }
    }
    onChange(newValues);
    setApplyTotalInput("");
  }, [applyTotalInput, distributionMethod, periods, onChange]);
  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };
  if (periods.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground p-4 text-center border rounded-lg", children: "No periods configured. Set up project periods first." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    !disabled && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          type: "number",
          value: applyTotalInput,
          onChange: (e) => setApplyTotalInput(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") applyTotal();
          },
          placeholder: "Enter total to distribute...",
          className: cn(
            "w-[200px] h-8 text-sm",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )
        }
      ),
      /* @__PURE__ */ jsxs(
        Select,
        {
          value: distributionMethod,
          onValueChange: (v) => setDistributionMethod(v),
          children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[150px] h-8 text-xs", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "even", children: "Even split" }),
              /* @__PURE__ */ jsx(SelectItem, { value: "last_period", children: "Last period only" })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: applyTotal,
          disabled: !applyTotalInput || parseFloat(applyTotalInput) === 0,
          className: cn(
            "text-xs font-medium px-3 h-8 rounded-md transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50 disabled:pointer-events-none"
          ),
          children: "Apply"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(ScrollArea, { className: "w-full whitespace-nowrap rounded-md border", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex p-2 gap-1", children: [
        periods.map((period) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex flex-col items-center gap-1 min-w-[80px]",
            children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: formatPeriodLabel(period) }),
              /* @__PURE__ */ jsx(
                BufferedNumberInput,
                {
                  value: values[period.id],
                  onCommit: (v) => handleCellCommit(period.id, v),
                  disabled
                }
              )
            ]
          },
          period.id
        )),
        showTotal && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1 min-w-[90px] pl-2 border-l", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold", children: "Total" }),
          /* @__PURE__ */ jsx("div", { className: cn(
            "w-[85px] h-8 flex items-center justify-end px-2 rounded-md text-sm font-medium",
            "bg-muted"
          ), children: formatNumber(total) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(ScrollBar, { orientation: "horizontal" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Enter absolute values. Sign will be applied based on adjustment intent." })
  ] });
}
function createEmptyAdjustment(block, templateId) {
  return {
    id: crypto.randomUUID(),
    block,
    effectType: "EBITDA",
    adjustmentClass: block === "PF" ? "proforma" : block === "MA" ? "normalization" : "nonrecurring",
    intent: "remove_expense",
    linkedAccountNumber: "",
    description: "",
    periodValues: {},
    sourceType: templateId ? "template" : "manual",
    templateId,
    status: "proposed",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function BufferedInput({
  value,
  onCommit,
  placeholder,
  className
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);
  return /* @__PURE__ */ jsx(
    Input,
    {
      value: local,
      onChange: (e) => setLocal(e.target.value),
      onBlur: () => {
        if (local !== value) onCommit(local);
      },
      placeholder,
      className
    }
  );
}
function BufferedTextarea({
  value,
  onCommit,
  placeholder,
  rows
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);
  return /* @__PURE__ */ jsx(
    Textarea,
    {
      value: local,
      onChange: (e) => setLocal(e.target.value),
      onBlur: () => {
        if (local !== value) onCommit(local);
      },
      placeholder,
      rows
    }
  );
}
const DDAdjustmentsSection = ({
  data,
  updateData,
  projectId,
  periods = [],
  fiscalYearEnd = 12,
  coaAccounts = [],
  trialBalanceAccounts = [],
  onGuideContextChange,
  onOpenGuide,
  isDemo,
  mockProposals
}) => {
  const rawAdjustments = data.adjustments || [];
  const adjustments = useMemo(() => {
    const clean = rawAdjustments.filter(
      (a) => !isITDAAnchor(a.linkedAccountName || "") && !isITDAAnchor(a.description || "")
    );
    return clean;
  }, [rawAdjustments]);
  useEffect(() => {
    if (rawAdjustments.length > 0 && adjustments.length < rawAdjustments.length) {
      updateData({ adjustments });
    }
  }, [adjustments.length, rawAdjustments.length]);
  const [activeTab, setActiveTab] = useState("manual");
  const { job, proposals, hasDiscoveryJobs, isRunning } = useDiscoveryProposals(projectId);
  const { proofMap, invalidate: invalidateProofs } = useAdjustmentProofs(projectId);
  const lastFocusRef = React__default.useRef(null);
  const clearTimerRef = React__default.useRef(null);
  useEffect(() => {
    onGuideContextChange?.({
      sectionKey: "3-1",
      hasData: adjustments.length > 0,
      hasAIFlags: Boolean(projectId),
      mode: activeTab === "ai-discovery" ? "ai-discovery" : "ledger"
    });
  }, [adjustments.length, activeTab, projectId]);
  const emitFocus = (control) => {
    if (lastFocusRef.current === control) return;
    lastFocusRef.current = control;
    onGuideContextChange?.({ focusedControl: control });
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      lastFocusRef.current = null;
      onGuideContextChange?.({ focusedControl: void 0 });
    }, 8e3);
  };
  const [blockFilter, setBlockFilter] = useState("ALL");
  const [expandedAdjustments, setExpandedAdjustments] = useState(/* @__PURE__ */ new Set());
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyViewOnly, setVerifyViewOnly] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [dismissedTips, setDismissedTips] = useState(/* @__PURE__ */ new Set());
  const adjustmentsByType = useMemo(() => ({
    MA: adjustments.filter((a) => a.block === "MA"),
    DD: adjustments.filter((a) => a.block === "DD"),
    PF: adjustments.filter((a) => a.block === "PF")
  }), [adjustments]);
  const filteredAdjustments = useMemo(() => {
    if (blockFilter === "ALL") return adjustments;
    return adjustments.filter((a) => a.block === blockFilter);
  }, [adjustments, blockFilter]);
  const calculateBlockTotal = useCallback((blockAdjs) => {
    return blockAdjs.reduce((sum, adj) => {
      const adjTotal = Object.values(adj.periodValues).reduce((s, v) => s + (v || 0), 0);
      const sign = computeSign(adj.intent);
      return sum + adjTotal * sign;
    }, 0);
  }, []);
  const totals = useMemo(() => ({
    MA: calculateBlockTotal(adjustmentsByType.MA),
    DD: calculateBlockTotal(adjustmentsByType.DD),
    PF: calculateBlockTotal(adjustmentsByType.PF),
    total: calculateBlockTotal(adjustments)
  }), [adjustmentsByType, adjustments, calculateBlockTotal]);
  const addAdjustment = useCallback((block, templateId) => {
    const newAdj = createEmptyAdjustment(block, templateId);
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        newAdj.description = template.label;
        newAdj.intent = template.defaultIntent;
        newAdj.adjustmentClass = template.adjustmentClass;
      }
    }
    updateData({ adjustments: [...adjustments, newAdj] });
    setExpandedAdjustments((prev) => /* @__PURE__ */ new Set([...prev, newAdj.id]));
  }, [adjustments, updateData]);
  const updateAdjustment = useCallback((id, updates) => {
    const newAdjustments = adjustments.map(
      (adj) => adj.id === id ? { ...adj, ...updates } : adj
    );
    updateData({ adjustments: newAdjustments });
  }, [adjustments, updateData]);
  const deleteAdjustment = useCallback((id) => {
    updateData({ adjustments: adjustments.filter((adj) => adj.id !== id) });
    setExpandedAdjustments((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [adjustments, updateData]);
  const toggleExpanded = (id) => {
    setExpandedAdjustments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        onGuideContextChange?.({ expandedCardId: null });
      } else {
        next.add(id);
        onGuideContextChange?.({ expandedCardId: id });
      }
      return next;
    });
  };
  const openProofDialog = (adj) => {
    setSelectedAdjustment(adj);
    setProofDialogOpen(true);
  };
  const openVerifyDialog = (adj, viewOnly = false) => {
    setSelectedAdjustment(adj);
    setVerifyViewOnly(viewOnly);
    setVerifyDialogOpen(true);
  };
  const formatCurrency2 = (num) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: "exceptZero"
    }).format(num);
  };
  const getBlockBadgeClass = (block) => {
    switch (block) {
      case "MA":
        return "bg-primary/10 text-primary border-primary/20";
      case "DD":
        return "bg-secondary text-secondary-foreground border-secondary";
      case "PF":
        return "bg-accent text-accent-foreground border-accent";
    }
  };
  const renderAdjustmentRow = (adj) => {
    const isExpanded = expandedAdjustments.has(adj.id);
    const adjTotal = Object.values(adj.periodValues).reduce((s, v) => s + (v || 0), 0);
    const signedTotal = adjTotal * computeSign(adj.intent);
    const hasAccount = !!adj.linkedAccountNumber;
    const accountInCoa = coaAccounts.some(
      (a) => a.accountNumber === adj.linkedAccountNumber || a.accountId === adj.linkedAccountNumber
    );
    return /* @__PURE__ */ jsxs(Card, { className: "overflow-hidden", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
            isExpanded && "border-b"
          ),
          onClick: () => toggleExpanded(adj.id),
          children: [
            isExpanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 shrink-0" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 shrink-0" }),
            /* @__PURE__ */ jsx(Badge, { variant: "outline", className: cn("text-[10px]", getBlockBadgeClass(adj.block)), children: adj.block }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium truncate", children: adj.description || "Untitled adjustment" }),
                adj.templateId && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px]", children: "Template" }),
                adj.sourceType === "ai" && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] bg-primary/10 text-primary border-primary/20", children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "w-2.5 h-2.5 mr-1" }),
                  "AI"
                ] }),
                !hasAccount && /* @__PURE__ */ jsxs(Badge, { variant: "destructive", className: "text-[10px] gap-1", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { className: "h-2.5 w-2.5" }),
                  "No Account"
                ] }),
                hasAccount && !accountInCoa && coaAccounts.length > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-[10px] gap-1 border-destructive/50 text-destructive", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { className: "h-2.5 w-2.5" }),
                  "Unmapped"
                ] }),
                (() => {
                  const proofSet = proofMap.get(adj.id);
                  if (!proofSet || proofSet.bestStatus === "pending") return null;
                  const v = proofSet.verification;
                  if (!v) return null;
                  return /* @__PURE__ */ jsx(
                    ProofValidationBadge,
                    {
                      score: proofSet.bestScore,
                      status: proofSet.bestStatus,
                      keyFindings: v.key_findings,
                      redFlags: v.red_flags,
                      matchCount: v.matchCount,
                      contradictionCount: v.contradictionCount,
                      varianceAmount: v.varianceAmount,
                      onClick: (e) => {
                        e?.stopPropagation();
                        openVerifyDialog(adj, true);
                      }
                    }
                  );
                })()
              ] }),
              adj.linkedAccountNumber && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "Account: ",
                adj.linkedAccountNumber,
                adj.linkedAccountName && ` - ${adj.linkedAccountName}`
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: cn(
              "text-sm font-mono font-medium",
              signedTotal > 0 ? "text-primary" : signedTotal < 0 ? "text-destructive" : "text-muted-foreground"
            ), children: formatCurrency2(signedTotal) }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8 shrink-0",
                onClick: (e) => {
                  e.stopPropagation();
                  deleteAdjustment(adj.id);
                },
                children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-muted-foreground hover:text-destructive" })
              }
            )
          ]
        }
      ),
      isExpanded && /* @__PURE__ */ jsxs(CardContent, { className: "p-4 space-y-4", children: [
        !dismissedTips.has(adj.id) && !adj.evidenceNotes && adj.status === "proposed" && /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "💡 ",
            /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: "Tip:" }),
            " ",
            getProofHint(adj.description).hint
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "h-6 px-2 text-xs shrink-0",
              onClick: (e) => {
                e.stopPropagation();
                setDismissedTips((prev) => /* @__PURE__ */ new Set([...prev, adj.id]));
              },
              children: "Dismiss"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Description" }),
          /* @__PURE__ */ jsx(
            BufferedInput,
            {
              value: adj.description,
              onCommit: (v) => updateAdjustment(adj.id, { description: v }),
              placeholder: "Enter adjustment description..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Adjustment Type" }),
          /* @__PURE__ */ jsxs(
            Select,
            {
              value: adj.block,
              onValueChange: (block) => updateAdjustment(adj.id, { block }),
              children: [
                /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[200px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "MA", children: "MA - Management Adjustments" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "DD", children: "DD - Due Diligence" }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "PF", children: "PF - Pro Forma" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", onPointerDown: () => emitFocus("tbAccount"), children: [
          /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium", children: [
            "Trial Balance Account ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            AccountPicker,
            {
              accounts: coaAccounts,
              value: adj.linkedAccountNumber,
              onChange: (accNum, accName) => {
                if (isITDAAnchor(accName || "")) {
                  toast.error("Interest, Taxes, Depreciation, and Amortization are already excluded from EBITDA by definition. Adjustments to these accounts are not permitted.");
                  return;
                }
                updateAdjustment(adj.id, {
                  linkedAccountNumber: accNum,
                  linkedAccountName: accName
                });
              },
              placeholder: "Select TB account...",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", onPointerDown: () => emitFocus("intent"), children: [
          /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium", children: [
            "Adjustment Effect ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            IntentSelector,
            {
              value: adj.intent,
              onChange: (intent) => updateAdjustment(adj.id, { intent }),
              compact: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", onPointerDown: () => emitFocus("periodValues"), children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Monthly Values" }),
          /* @__PURE__ */ jsx(
            PeriodValueGrid,
            {
              periods,
              values: adj.periodValues,
              onChange: (periodValues) => updateAdjustment(adj.id, { periodValues })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Evidence / Notes" }),
          /* @__PURE__ */ jsx(
            BufferedTextarea,
            {
              value: adj.evidenceNotes || "",
              onCommit: (v) => updateAdjustment(adj.id, { evidenceNotes: v }),
              placeholder: "Add supporting documentation notes...",
              rows: 2
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2 border-t", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", onPointerDown: () => emitFocus("status"), children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Status:" }),
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: adj.status,
                onValueChange: (status) => updateAdjustment(adj.id, { status }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[130px] h-8", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "proposed", children: "Proposed" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "accepted", children: "Accepted" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "rejected", children: "Rejected" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  setDismissedTips((prev) => /* @__PURE__ */ new Set([...prev, adj.id]));
                  openVerifyDialog(adj);
                },
                onPointerDown: () => emitFocus("verify"),
                className: "gap-1.5",
                disabled: !projectId,
                children: [
                  /* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5" }),
                  "Verify"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  setDismissedTips((prev) => /* @__PURE__ */ new Set([...prev, adj.id]));
                  openProofDialog(adj);
                },
                onPointerDown: () => emitFocus("proof"),
                className: "gap-1.5",
                disabled: !projectId,
                children: [
                  /* @__PURE__ */ jsx(Paperclip, { className: "w-3.5 h-3.5" }),
                  "Attach Proof"
                ]
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "ID: ",
              adj.id.slice(0, 8)
            ] })
          ] })
        ] })
      ] })
    ] }, adj.id);
  };
  const getDefaultBlock = () => {
    if (blockFilter !== "ALL") return blockFilter;
    return "DD";
  };
  const availableTemplates = useMemo(() => {
    if (blockFilter === "ALL") {
      return [...TEMPLATES_BY_TYPE.MA, ...TEMPLATES_BY_TYPE.DD, ...TEMPLATES_BY_TYPE.PF];
    }
    return TEMPLATES_BY_TYPE[blockFilter];
  }, [blockFilter]);
  const acceptedCount = adjustments.filter((adj) => adj.status === "accepted").length;
  const aiDiscoveredCount = adjustments.filter((adj) => adj.sourceType === "ai").length;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-serif font-bold", children: "Due Diligence Adjustments" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Track and manage all earnings adjustments with AI-powered discovery and proof validation" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Management Adjustments",
          value: adjustmentsByType.MA.length,
          icon: TrendingUp,
          subtitle: formatCurrency2(totals.MA),
          isCurrency: false
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Due Diligence Adjustments",
          value: adjustmentsByType.DD.length,
          icon: TrendingUp,
          subtitle: formatCurrency2(totals.DD),
          isCurrency: false
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Pro Forma Adjustments",
          value: adjustmentsByType.PF.length,
          icon: TrendingDown,
          subtitle: formatCurrency2(totals.PF),
          isCurrency: false
        }
      ),
      /* @__PURE__ */ jsx(
        SummaryCard,
        {
          title: "Net Adjustment",
          value: formatCurrency2(totals.total),
          icon: FileText,
          subtitle: `${adjustments.length} total • ${acceptedCount} accepted`
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: (v) => {
      setActiveTab(v);
      onGuideContextChange?.({ mode: v === "ai-discovery" ? "ai-discovery" : "ledger" });
    }, children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-2 max-w-md", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "manual", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4" }),
          "Adjustment Ledger",
          adjustments.length > 0 && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1", children: adjustments.length })
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "ai-discovery", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
          "AI Discovery",
          (isRunning || proposals.length > 0 || hasDiscoveryJobs) && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1", children: isRunning ? "…" : proposals.length })
        ] })
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "manual", className: "mt-6", children: /* @__PURE__ */ jsxs(Card, { className: "mb-4", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "pb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(CardTitle, { children: "Adjustment Ledger" }),
            aiDiscoveredCount > 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
              aiDiscoveredCount,
              " adjustment",
              aiDiscoveredCount > 1 ? "s" : "",
              " from AI Discovery"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxs(
              ToggleGroup,
              {
                type: "single",
                value: blockFilter,
                onValueChange: (value) => value && setBlockFilter(value),
                className: "justify-start",
                children: [
                  /* @__PURE__ */ jsxs(ToggleGroupItem, { value: "ALL", size: "sm", className: "text-xs", children: [
                    "All",
                    /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1 text-[10px]", children: adjustments.length })
                  ] }),
                  /* @__PURE__ */ jsxs(ToggleGroupItem, { value: "MA", size: "sm", className: "text-xs", children: [
                    "MA",
                    /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1 text-[10px]", children: adjustmentsByType.MA.length })
                  ] }),
                  /* @__PURE__ */ jsxs(ToggleGroupItem, { value: "DD", size: "sm", className: "text-xs", children: [
                    "DD",
                    /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1 text-[10px]", children: adjustmentsByType.DD.length })
                  ] }),
                  /* @__PURE__ */ jsxs(ToggleGroupItem, { value: "PF", size: "sm", className: "text-xs", children: [
                    "PF",
                    /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1 text-[10px]", children: adjustmentsByType.PF.length })
                  ] })
                ]
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "pt-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap mb-4", children: [
            /* @__PURE__ */ jsxs(Button, { onClick: () => addAdjustment(getDefaultBlock()), className: "gap-2", children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              "Add ",
              blockFilter === "ALL" ? "DD" : blockFilter,
              " Adjustment"
            ] }),
            coaAccounts.length > 0 && /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setQuickAddOpen(true), className: "gap-2", children: [
              /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4" }),
              "Quick Add"
            ] }),
            /* @__PURE__ */ jsxs(Select, { onValueChange: (templateId) => {
              const template = getTemplateById(templateId);
              if (template) addAdjustment(template.type, templateId);
            }, children: [
              /* @__PURE__ */ jsxs(SelectTrigger, { className: "w-[220px]", children: [
                /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4 mr-2" }),
                /* @__PURE__ */ jsx(SelectValue, { placeholder: "From template..." })
              ] }),
              /* @__PURE__ */ jsx(SelectContent, { children: availableTemplates.map((t) => /* @__PURE__ */ jsx(SelectItem, { value: t.id, children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[9px] py-0", children: t.type }),
                t.label
              ] }) }, t.id)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "ml-auto text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Filtered Total: " }),
              /* @__PURE__ */ jsx("span", { className: cn(
                "font-mono font-medium",
                calculateBlockTotal(filteredAdjustments) > 0 ? "text-primary" : calculateBlockTotal(filteredAdjustments) < 0 ? "text-destructive" : ""
              ), children: formatCurrency2(calculateBlockTotal(filteredAdjustments)) })
            ] })
          ] }),
          filteredAdjustments.length === 0 ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }),
            /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground", children: blockFilter !== "ALL" ? `No ${blockFilter} adjustments yet` : "No adjustments recorded yet" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-center text-muted-foreground mt-1", children: 'Click "Add Adjustment" to begin, or use AI Discovery to find potential adjustments automatically' }),
            onOpenGuide && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "text-sm text-primary hover:underline mt-2 block mx-auto",
                onClick: () => onOpenGuide(),
                children: "Not sure where to start? Open the guide →"
              }
            )
          ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: filteredAdjustments.map(renderAdjustmentRow) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "ai-discovery", className: "mt-6", children: projectId ? /* @__PURE__ */ jsx(
        DiscoveryProposalsSection,
        {
          projectId,
          isDemo,
          mockProposals: isDemo ? mockProposals : void 0,
          onConvertToAdjustment: (adj) => {
            if (isITDAAnchor(adj.linkedAccountName || "") || isITDAAnchor(adj.description || "")) {
              toast.error("Interest, Taxes, Depreciation, and Amortization are already excluded from EBITDA by definition. Adjustments to these accounts are not permitted.");
              return;
            }
            updateData({ adjustments: [...adjustments, adj] });
            setExpandedAdjustments((prev) => /* @__PURE__ */ new Set([...prev, adj.id]));
            setActiveTab("manual");
          }
        },
        `${projectId}:${job?.id ?? "none"}:${proposals.length}:${hasDiscoveryJobs ? "jobs" : "empty"}`
      ) : /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-12 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }),
        /* @__PURE__ */ jsx("p", { children: "Save your project to enable AI-powered adjustment discovery" })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(
      QuickAddDialog,
      {
        open: quickAddOpen,
        onOpenChange: setQuickAddOpen,
        coaAccounts,
        trialBalanceAccounts,
        periods,
        fiscalYearEnd,
        defaultBlock: getDefaultBlock(),
        onAdd: (newAdj) => {
          updateData({ adjustments: [...adjustments, newAdj] });
          setExpandedAdjustments((prev) => /* @__PURE__ */ new Set([...prev, newAdj.id]));
        }
      }
    ),
    selectedAdjustment && projectId && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        AttachProofDialog,
        {
          open: proofDialogOpen,
          onOpenChange: setProofDialogOpen,
          projectId,
          adjustmentId: selectedAdjustment.id,
          adjustment: {
            description: selectedAdjustment.description,
            category: selectedAdjustment.block,
            amount: Object.values(selectedAdjustment.periodValues).reduce((s, v) => s + (v || 0), 0),
            status: selectedAdjustment.status,
            notes: selectedAdjustment.evidenceNotes || ""
          },
          onProofInvalidate: invalidateProofs
        }
      ),
      /* @__PURE__ */ jsx(
        VerifyAdjustmentDialog,
        {
          open: verifyDialogOpen,
          onOpenChange: setVerifyDialogOpen,
          viewOnly: verifyViewOnly,
          projectId,
          adjustmentId: selectedAdjustment.id,
          jobId: job?.id,
          adjustment: {
            description: selectedAdjustment.description,
            category: selectedAdjustment.block,
            intent: selectedAdjustment.intent,
            linkedAccountName: selectedAdjustment.linkedAccountName,
            amount: Object.values(selectedAdjustment.periodValues).reduce((s, v) => s + (v || 0), 0),
            periodRange: periods.length ? `${periods[0].id} to ${periods[periods.length - 1].id}` : void 0,
            periodValues: selectedAdjustment.periodValues
          },
          onVerificationComplete: (action, notes, verifiedAmount) => {
            if (selectedAdjustment) {
              const updates = { status: action };
              if (notes) {
                updates.evidenceNotes = selectedAdjustment.evidenceNotes ? `${selectedAdjustment.evidenceNotes}
${notes}` : notes;
              }
              if (verifiedAmount != null) {
                const currentTotal = Object.values(selectedAdjustment.periodValues).reduce((s, v) => s + (v || 0), 0);
                if (currentTotal !== 0) {
                  const ratio = verifiedAmount / currentTotal;
                  const newPeriodValues = {};
                  for (const [period, val] of Object.entries(selectedAdjustment.periodValues)) {
                    newPeriodValues[period] = Math.round((val || 0) * ratio * 100) / 100;
                  }
                  updates.periodValues = newPeriodValues;
                }
              }
              updateAdjustment(selectedAdjustment.id, updates);
              invalidateProofs();
            }
          },
          onAttachProof: () => {
            setVerifyDialogOpen(false);
            if (selectedAdjustment) {
              setDismissedTips((prev) => /* @__PURE__ */ new Set([...prev, selectedAdjustment.id]));
              openProofDialog(selectedAdjustment);
            }
          }
        }
      )
    ] })
  ] });
};
function QuickAddDialog({
  open,
  onOpenChange,
  coaAccounts,
  trialBalanceAccounts = [],
  periods,
  fiscalYearEnd = 12,
  defaultBlock,
  onAdd
}) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");
  const [block, setBlock] = useState(defaultBlock);
  const [intent, setIntent] = useState("remove_expense");
  const [totalAmount, setTotalAmount] = useState("");
  const [distribution, setDistribution] = useState("even");
  const tbMatch = useMemo(() => {
    if (!selectedAccount || trialBalanceAccounts.length === 0) return null;
    return trialBalanceAccounts.find(
      (a) => a.accountNumber === selectedAccount || a.accountName === selectedAccountName
    ) || null;
  }, [selectedAccount, selectedAccountName, trialBalanceAccounts]);
  const tbTotal = useMemo(() => {
    if (!tbMatch) return null;
    const balances = tbMatch.monthlyValues || tbMatch.balances;
    if (!balances) return null;
    const entries = Object.entries(balances).filter(([, v]) => typeof v === "number");
    if (entries.length === 0) return null;
    if (tbMatch.fsType === "IS") {
      const sortedKeys = entries.map(([k]) => k).sort();
      const fyStartMonth = fiscalYearEnd % 12 + 1;
      const monthly = {};
      for (let i = 0; i < sortedKeys.length; i++) {
        const key = sortedKeys[i];
        const curMonth = parseInt(key.split("-")[1] || "0", 10);
        if (i === 0 || curMonth === fyStartMonth) {
          monthly[key] = balances[key];
        } else {
          monthly[key] = balances[key] - balances[sortedKeys[i - 1]];
        }
      }
      const sum = Object.values(monthly).reduce((acc, v) => acc + v, 0);
      return { sum, periodCount: entries.length };
    }
    return {
      sum: entries.reduce((acc, [, v]) => acc + v, 0),
      periodCount: entries.length
    };
  }, [tbMatch, fiscalYearEnd]);
  useEffect(() => {
    if (open) {
      setSelectedAccount("");
      setSelectedAccountName("");
      setBlock(defaultBlock);
      setIntent("remove_expense");
      setTotalAmount("");
      setDistribution("even");
    }
  }, [open, defaultBlock]);
  const handleSubmit = () => {
    const amount = parseFloat(totalAmount) || 0;
    if (!selectedAccount || amount === 0 || periods.length === 0) return;
    if (isITDAAnchor(selectedAccountName || "")) {
      toast.error("Interest, Taxes, Depreciation, and Amortization are already excluded from EBITDA by definition. Adjustments to these accounts are not permitted.");
      return;
    }
    const newAdj = createEmptyAdjustment(block);
    newAdj.description = selectedAccountName || selectedAccount;
    newAdj.intent = intent;
    newAdj.linkedAccountNumber = selectedAccount;
    newAdj.linkedAccountName = selectedAccountName;
    const periodValues = {};
    if (distribution === "last_period") {
      periodValues[periods[periods.length - 1].id] = amount;
    } else {
      const count = periods.length;
      const base = Math.floor(amount / count);
      let remainder = amount - base * count;
      for (let i = 0; i < count; i++) {
        let cellVal = base;
        if (remainder > 0) {
          cellVal += 1;
          remainder -= 1;
        }
        if (cellVal !== 0) {
          periodValues[periods[i].id] = cellVal;
        }
      }
    }
    newAdj.periodValues = periodValues;
    onAdd(newAdj);
    onOpenChange(false);
  };
  const signedPreview = (parseFloat(totalAmount) || 0) * computeSign(intent);
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-lg", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Zap, { className: "h-5 w-5" }),
        "Quick Add Adjustment"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "Select an account and enter a total — amounts will be distributed automatically." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium", children: [
          "Trial Balance Account ",
          /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          AccountPicker,
          {
            accounts: coaAccounts,
            value: selectedAccount,
            onChange: (accNum, accName) => {
              setSelectedAccount(accNum);
              setSelectedAccountName(accName || "");
            },
            placeholder: "Select account...",
            required: true
          }
        ),
        selectedAccount && tbTotal !== null && /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-accent/50 border border-accent px-3 py-2 flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
            "TB Total:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold text-foreground", children: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(tbTotal.sum) }),
            /* @__PURE__ */ jsxs("span", { className: "ml-1 text-xs text-muted-foreground", children: [
              "across ",
              tbTotal.periodCount,
              " ",
              tbTotal.periodCount === 1 ? "period" : "periods"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "link",
              size: "sm",
              className: "h-auto p-0 text-xs",
              onClick: () => setTotalAmount(String(Math.abs(tbTotal.sum))),
              children: "Use this amount"
            }
          )
        ] }),
        selectedAccount && tbTotal === null && trialBalanceAccounts.length > 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "No trial balance data for this account" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Type" }),
        /* @__PURE__ */ jsxs(Select, { value: block, onValueChange: (v) => setBlock(v), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "MA", children: "MA - Management" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "DD", children: "DD - Due Diligence" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "PF", children: "PF - Pro Forma" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium", children: [
          "Adjustment Effect ",
          /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(IntentSelector, { value: intent, onChange: setIntent, compact: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium", children: [
            "Total Amount ",
            /* @__PURE__ */ jsx("span", { className: "text-destructive", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              value: totalAmount,
              onChange: (e) => setTotalAmount(e.target.value),
              placeholder: "120000",
              className: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Distribution" }),
          /* @__PURE__ */ jsxs(Select, { value: distribution, onValueChange: (v) => setDistribution(v), children: [
            /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxs(SelectItem, { value: "even", children: [
                "Even split (",
                periods.length,
                " periods)"
              ] }),
              /* @__PURE__ */ jsx(SelectItem, { value: "last_period", children: "Last period only" })
            ] })
          ] })
        ] })
      ] }),
      totalAmount && parseFloat(totalAmount) !== 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-muted p-3 text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "EBITDA Impact: " }),
        /* @__PURE__ */ jsx("span", { className: cn(
          "font-mono font-semibold",
          signedPreview > 0 ? "text-primary" : "text-destructive"
        ), children: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          signDisplay: "exceptZero"
        }).format(signedPreview) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: handleSubmit,
          disabled: !selectedAccount || !totalAmount || parseFloat(totalAmount) === 0,
          className: "gap-2",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
            "Add Adjustment"
          ]
        }
      )
    ] })
  ] }) });
}
export {
  DDAdjustmentsSection
};
