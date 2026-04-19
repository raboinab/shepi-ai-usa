import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Trash2, RefreshCw, Sparkles, ShieldCheck, Info, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Period, 
  CoverageType,
  DocumentCoverageConfig,
  calculatePeriodCoverage, 
  calculateAnnualCoverage,
  calculatePointInTimeCoverage,
  calculateFullPeriodCoverage,
  generateAnnualPeriods,
  generateFullPeriodMarker,
  groupConsecutivePeriods 
} from "@/lib/periodUtils";
import { CoverageTimeline } from "../shared/CoverageTimeline";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useWorkflowStatus } from "@/hooks/useWorkflowStatus";
import { WorkflowProgress, WorkflowError } from "@/components/workflow";
import { CIMInsightsCard, type CIMInsights } from "./CIMInsightsCard";
import { TaxReturnInsightsCard, type TaxReturnAnalysis } from "./TaxReturnInsightsCard";
import { DocumentValidationDialog, type ValidationResult } from "../shared/DocumentValidationDialog";
import { DocumentChecklistReference } from "../shared/DocumentChecklistReference";


interface DocumentUploadSectionProps {
  projectId: string;
  periods: Period[];
  data: Record<string, unknown>;
  updateData: (data: Record<string, unknown>) => void;
  fullWizardData?: Record<string, unknown>;
  initialDocType?: string | null;
}

interface Document {
  id: string;
  name: string;
  file_path: string;
  institution: string | null;
  account_label: string | null;
  account_type: string | null;
  period_start: string | null;
  period_end: string | null;
  processing_status: string | null;
  parsed_summary: Record<string, unknown> | null;
  coverage_validated: boolean | null;
  created_at: string | null;
}

const INSTITUTIONS = [
  { value: "wells_fargo", label: "Wells Fargo" },
  { value: "chase", label: "Chase" },
  { value: "bank_of_america", label: "Bank of America" },
  { value: "citi", label: "Citibank" },
  { value: "capital_one", label: "Capital One" },
  { value: "amex", label: "American Express" },
  { value: "us_bank", label: "US Bank" },
  { value: "pnc", label: "PNC Bank" },
  { value: "truist", label: "Truist" },
  { value: "td_bank", label: "TD Bank" },
  { value: "other", label: "Other" },
];

// CIM - First for business context
const CIM_TYPES = [
  { value: "cim", label: "CIM" },
];

// Core financials from QuickBooks
const CORE_QUICKBOOKS_TYPES = [
  { value: "chart_of_accounts", label: "Chart of Accounts" },
  { value: "trial_balance", label: "Trial Balance" },
];

// Optional verification documents (derived from Trial Balance)
const OPTIONAL_VERIFICATION_TYPES = [
  { value: "balance_sheet", label: "Balance Sheet", optional: true, verifiable: true },
  { value: "income_statement", label: "Income Statement (P&L)", optional: true, verifiable: true },
  { value: "cash_flow", label: "Cash Flow Statement", optional: true, verifiable: false },
];

// Helper to check if a document type is optional verification
const isOptionalVerificationType = (type: string) => 
  OPTIONAL_VERIFICATION_TYPES.some(t => t.value === type);

// Helper to check if a document type supports validation against TB
const isVerifiableType = (type: string) => 
  OPTIONAL_VERIFICATION_TYPES.find(t => t.value === type)?.verifiable === true;

// Transaction-level documents (grouped together for reconciliation)
const TRANSACTION_TYPES = [
  { value: "general_ledger", label: "General Ledger" },
  { value: "bank_statement", label: "Bank Statements" },
  { value: "credit_card", label: "Credit Card Statements" },
  { value: "journal_entries", label: "Journal Entries" },
];

// Supporting documents for analysis
const SUPPORTING_TYPES = [
  { value: "accounts_receivable", label: "Accounts Receivable" },
  { value: "accounts_payable", label: "Accounts Payable" },
  { value: "customer_concentration", label: "Customer Concentration" },
  { value: "vendor_concentration", label: "Vendor Concentration" },
  { value: "payroll", label: "Payroll Reports" },
  { value: "depreciation_schedule", label: "Depreciation Schedule" },
  { value: "fixed_asset_register", label: "Fixed Asset Register" },
  { value: "tax_return", label: "Tax Returns" },
  { value: "debt_schedule", label: "Debt Schedule" },
  { value: "material_contract", label: "Material Contract" },
];

// Combined list for UI in workflow order
const DOCUMENT_TYPES = [
  ...CIM_TYPES,
  ...CORE_QUICKBOOKS_TYPES,
  ...OPTIONAL_VERIFICATION_TYPES,
  ...TRANSACTION_TYPES,
  ...SUPPORTING_TYPES,
];

// Coverage configuration by document type
const DOCUMENT_COVERAGE_CONFIG: Record<string, DocumentCoverageConfig> = {
  // No coverage UI
  cim: { type: 'none', label: '', description: '' },
  chart_of_accounts: { type: 'none', label: '', description: '' },
  
  // Annual coverage (Tax Returns)
  tax_return: { 
    type: 'annual', 
    label: 'Annual Coverage', 
    description: 'Upload tax returns for each fiscal year in your analysis period' 
  },
  
  // Monthly coverage (statements)
  bank_statement: { type: 'monthly', label: 'Monthly Coverage', description: 'Bank statements for each month' },
  credit_card: { type: 'monthly', label: 'Monthly Coverage', description: 'Credit card statements for each month' },
  
  // Monthly/Quarterly (financials)
  trial_balance: { type: 'monthly', label: 'Period Coverage', description: 'Trial balance for each reporting period' },
  balance_sheet: { type: 'monthly', label: 'Period Coverage', description: 'Balance sheet for each reporting period' },
  income_statement: { type: 'monthly', label: 'Period Coverage', description: 'P&L for each reporting period' },
  cash_flow: { type: 'monthly', label: 'Period Coverage', description: 'Cash flow for each reporting period' },
  
  // Full-period documents (one export covering entire range)
  general_ledger: { type: 'full-period', label: 'Full Period', description: 'One export covering the entire analysis period' },
  journal_entries: { type: 'none', label: '', description: '' },
  
  // Point-in-time (aging reports, concentration)
  accounts_receivable: { type: 'point-in-time', label: 'Point-in-Time', description: 'Snapshot as of a specific date' },
  accounts_payable: { type: 'point-in-time', label: 'Point-in-Time', description: 'Snapshot as of a specific date' },
  customer_concentration: { type: 'point-in-time', label: 'Point-in-Time', description: 'Concentration analysis per year or latest' },
  vendor_concentration: { type: 'point-in-time', label: 'Point-in-Time', description: 'Concentration analysis per year or latest' },
  
  // Payroll - treat as monthly
  payroll: { type: 'monthly', label: 'Period Coverage', description: 'Payroll reports for each period' },
  
  // Fixed assets - point-in-time snapshots
  depreciation_schedule: { type: 'point-in-time', label: 'Point-in-Time', description: 'Depreciation schedule as of a specific date' },
  fixed_asset_register: { type: 'point-in-time', label: 'Point-in-Time', description: 'Fixed asset register as of a specific date' },
};

// Helper arrays for processing route determination
const QUICKBOOKS_TYPES = [
  ...CORE_QUICKBOOKS_TYPES,
  ...OPTIONAL_VERIFICATION_TYPES.map(t => ({ value: t.value, label: t.label })),
  { value: "general_ledger", label: "General Ledger" },
  { value: "journal_entries", label: "Journal Entries" },
  { value: "accounts_receivable", label: "Accounts Receivable" },
  { value: "accounts_payable", label: "Accounts Payable" },
  { value: "customer_concentration", label: "Customer Concentration" },
  { value: "vendor_concentration", label: "Vendor Concentration" },
];

const DOCUCLIPPER_TYPES = [
  { value: "bank_statement", label: "Bank Statements" },
  { value: "credit_card", label: "Credit Card Statements" },
  // Note: tax_return removed - DocuClipper doesn't support it, using AI extraction only
];

// Only these document types require institution selection
const REQUIRES_INSTITUTION = ["bank_statement", "credit_card"];

// Helper to check document type category
const isQuickBooksType = (type: string) => 
  QUICKBOOKS_TYPES.some(t => t.value === type);

const isDocuClipperType = (type: string) => 
  DOCUCLIPPER_TYPES.some(t => t.value === type);

// Get accepted file types based on document category
const getAcceptedFileTypes = (docType: string): string => {
  if (docType === 'cim') return '.pdf,.docx,.doc';
  if (isDocuClipperType(docType)) return '.pdf';
  if (docType === 'trial_balance') return '.xlsx,.xls,.pdf'; // No CSV for Trial Balance
  if (docType === 'journal_entries') return '.xlsx,.xls,.csv'; // No PDF - parsing unreliable
  if (isQuickBooksType(docType)) return '.xlsx,.xls,.csv,.pdf';
  return '.pdf,.xlsx,.xls,.csv,.docx,.doc';
};

// Get user-friendly label for accepted file types
const getFileTypeLabel = (docType: string): string => {
  if (docType === 'cim') return 'PDF or Word documents';
  if (isDocuClipperType(docType)) return 'PDF files only';
  if (docType === 'trial_balance') return 'Excel or PDF files';
  if (docType === 'journal_entries') return 'Excel or CSV files only';
  if (isQuickBooksType(docType)) return 'Excel, CSV, or PDF files';
  return 'PDF, Excel, CSV, or Word files';
};

export const DocumentUploadSection = ({
  projectId,
  periods,
  data,
  updateData,
  fullWizardData = {},
  initialDocType,
}: DocumentUploadSectionProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState(initialDocType || "cim");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [customInstitution, setCustomInstitution] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [cimInsights, setCimInsights] = useState<CIMInsights | null>(null);
  const [parsingCim, setParsingCim] = useState(false);
  const [taxReturnInsights, setTaxReturnInsights] = useState<TaxReturnAnalysis[]>([]);
  const [parsingTaxReturn, setParsingTaxReturn] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [selectedTaxYear, setSelectedTaxYear] = useState<number | null>(null);
  const [pendingValidation, setPendingValidation] = useState<{
    file: File;
    result: ValidationResult;
    selectedType: string;
  } | null>(null);
  
  // QuickBooks synced periods from processed_data
  const [processedDataPeriods, setProcessedDataPeriods] = useState<{ period_start: string | null; period_end: string | null }[]>([]);

  // Get unique years from periods for tax year selection
  const availableTaxYears = useMemo(() => {
    const years = new Set(periods.map(p => p.year));
    return Array.from(years).sort((a, b) => b - a); // descending order
  }, [periods]);
  
  const { triggerWorkflow, cancelWorkflow, retryWorkflow, isLoading: isWorkflowLoading } = useWorkflow();
  const { workflow } = useWorkflowStatus(activeWorkflowId);

  // Get coverage configuration for current document type
  const coverageConfig = useMemo(() => 
    DOCUMENT_COVERAGE_CONFIG[selectedType] || { type: 'monthly' as CoverageType, label: 'Period Coverage', description: '' },
    [selectedType]
  );

  // Map document types to processed_data data_types
  const dataTypeMap: Record<string, string> = useMemo(() => ({
    trial_balance: 'trial_balance',
    balance_sheet: 'balance_sheet',
    income_statement: 'income_statement',
    cash_flow: 'cash_flow',
    accounts_receivable: 'ar_aging',
    accounts_payable: 'ap_aging',
    chart_of_accounts: 'chart_of_accounts',
    general_ledger: 'general_ledger',
    customer_concentration: 'customer_concentration',
    vendor_concentration: 'vendor_concentration',
  }), []);

  // Fetch processed_data periods for QB synced data
  useEffect(() => {
    if (!projectId || !selectedType) return;
    
    const dataType = dataTypeMap[selectedType];
    if (!dataType) {
      setProcessedDataPeriods([]);
      return;
    }
    
    const fetchProcessedPeriods = async () => {
      const { data } = await supabase
        .from('processed_data')
        .select('period_start, period_end')
        .eq('project_id', projectId)
        .eq('data_type', dataType)
        .eq('source_type', 'quickbooks_api');
      
      setProcessedDataPeriods(data || []);
    };
    
    fetchProcessedPeriods();
  }, [projectId, selectedType, dataTypeMap]);

  // Calculate coverage for the current document type (uploaded documents only)
  const filteredDocs = useMemo(() => 
    documents.filter(doc => doc.account_type === selectedType),
    [documents, selectedType]
  );

  // Merge uploaded docs with QB synced periods for unified coverage calculation
  const allCoverageSources = useMemo(() => {
    const uploadedDocs = documents
      .filter(doc => doc.account_type === selectedType)
      .map(doc => ({ period_start: doc.period_start, period_end: doc.period_end }));
    
    // Combine both sources - coverage functions only need period_start/period_end
    return [...uploadedDocs, ...processedDataPeriods];
  }, [documents, selectedType, processedDataPeriods]);

  // Generate appropriate periods based on coverage type
  const effectivePeriods = useMemo(() => {
    if (coverageConfig.type === 'none' || periods.length === 0) return [];
    
    if (coverageConfig.type === 'annual') {
      // Get year range from the project periods
      const startYear = periods[0]?.year || new Date().getFullYear();
      const endYear = periods[periods.length - 1]?.year || new Date().getFullYear();
      return generateAnnualPeriods(startYear, endYear);
    }
    
    if (coverageConfig.type === 'full-period') {
      const startMonth = periods[0]?.month || 1;
      const startYear = periods[0]?.year || new Date().getFullYear();
      const endMonth = periods[periods.length - 1]?.month || 12;
      const endYear = periods[periods.length - 1]?.year || new Date().getFullYear();
      return generateFullPeriodMarker(startMonth, startYear, endMonth, endYear);
    }
    
    // For point-in-time and monthly, use regular periods
    return periods;
  }, [periods, coverageConfig.type]);

  // Calculate coverage using appropriate function based on type (includes QB synced data)
  const coverage = useMemo(() => {
    if (coverageConfig.type === 'none') {
      return { status: 'full' as const, coveredPeriods: [], missingPeriods: [], coveragePercentage: 100 };
    }
    
    if (coverageConfig.type === 'annual') {
      const years = effectivePeriods.map(p => p.year);
      return calculateAnnualCoverage(years, allCoverageSources);
    }
    
    if (coverageConfig.type === 'point-in-time') {
      return calculatePointInTimeCoverage(allCoverageSources);
    }
    
    if (coverageConfig.type === 'full-period' && periods.length > 0) {
      const startMonth = periods[0]?.month || 1;
      const startYear = periods[0]?.year || new Date().getFullYear();
      const endMonth = periods[periods.length - 1]?.month || 12;
      const endYear = periods[periods.length - 1]?.year || new Date().getFullYear();
      return calculateFullPeriodCoverage(startMonth, startYear, endMonth, endYear, allCoverageSources);
    }
    
    // Default: monthly coverage
    return calculatePeriodCoverage(effectivePeriods, allCoverageSources);
  }, [coverageConfig.type, effectivePeriods, allCoverageSources, periods]);
  
  // Check if we have QB-synced coverage for this document type
  const hasQBCoverage = processedDataPeriods.length > 0;

  const missingPeriodRanges = useMemo(() => 
    groupConsecutivePeriods(coverage.missingPeriods),
    [coverage.missingPeriods]
  );

  // On mount, check if CIM was parsing (persisted state)
  useEffect(() => {
    const pending = localStorage.getItem(`cim-parsing-${projectId}`);
    if (pending === "true") {
      setParsingCim(true);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocuments();
    fetchCimInsights().then((insights) => {
      // If we had a pending parse and now have insights, clear the pending state
      if (insights && localStorage.getItem(`cim-parsing-${projectId}`) === "true") {
        localStorage.removeItem(`cim-parsing-${projectId}`);
        setParsingCim(false);
        toast.success("CIM insights ready!");
      }
    });
    fetchTaxReturnInsights();
  }, [projectId]);

  // Realtime subscription for CIM insights
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`cim-insights-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processed_data',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newData = payload.new as { data_type?: string; data?: unknown };
          if (newData.data_type === 'cim_insights' && newData.data) {
            setCimInsights(newData.data as CIMInsights);
            localStorage.removeItem(`cim-parsing-${projectId}`);
            setParsingCim(false);
            toast.success("CIM insights ready!");
          }
          if (newData.data_type === 'tax_return_analysis' && newData.data) {
            const analysis = newData.data as TaxReturnAnalysis;
            setTaxReturnInsights(prev => {
              const existing = prev.findIndex(a => a.documentId === analysis.documentId);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = analysis;
                return updated;
              }
              return [...prev, analysis];
            });
            localStorage.removeItem(`tax-parsing-${projectId}`);
            setParsingTaxReturn(false);
            toast.success("Tax return analysis complete!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // CIM parsing timeout (3 minutes)
  useEffect(() => {
    if (!parsingCim) return;
    
    const timeout = setTimeout(() => {
      localStorage.removeItem(`cim-parsing-${projectId}`);
      setParsingCim(false);
      toast.error("CIM parsing timed out. Please try re-uploading.");
    }, 180000); // 3 minutes
    
    return () => clearTimeout(timeout);
  }, [parsingCim, projectId]);

  const fetchDocuments = async () => {
    try {
      const { data: docs, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(docs as Document[]);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchCimInsights = async (): Promise<CIMInsights | null> => {
    try {
      const { data, error } = await supabase
        .from("processed_data")
        .select("data")
        .eq("project_id", projectId)
        .eq("data_type", "cim_insights")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data?.data) {
        const insights = data.data as unknown as CIMInsights;
        setCimInsights(insights);
        return insights;
      }
      return null;
    } catch (error) {
      console.error("Error fetching CIM insights:", error);
      return null;
    }
  };

  const fetchTaxReturnInsights = async (): Promise<TaxReturnAnalysis[]> => {
    try {
      const { data, error } = await supabase
        .from("processed_data")
        .select("data")
        .eq("project_id", projectId)
        .eq("data_type", "tax_return_analysis")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        const insights = data.map(d => d.data as unknown as TaxReturnAnalysis);
        setTaxReturnInsights(insights);
        return insights;
      }
      return [];
    } catch (error) {
      console.error("Error fetching tax return insights:", error);
      return [];
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  // Get label for a document type
  const getTypeLabel = (typeValue: string): string => {
    const type = DOCUMENT_TYPES.find(t => t.value === typeValue);
    return type?.label || typeValue;
  };

  // Validate a single file using AI
  const validateFile = async (file: File, docType: string): Promise<ValidationResult | null> => {
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('validate-document-type', {
        body: {
          fileBase64: base64,
          selectedType: docType,
          fileName: file.name,
        },
      });

      if (error) {
        console.warn("Validation function error:", error);
        return null;
      }

      return data as ValidationResult;
    } catch (err) {
      console.warn("Validation error:", err);
      return null;
    }
  };

  // Proceed with upload after validation passes or is skipped
  const proceedWithUpload = async (files: File[], docType: string) => {
    const requiresInstitution = REQUIRES_INSTITUTION.includes(docType);
    
    const institution = requiresInstitution
      ? (selectedInstitution === "other" ? customInstitution : selectedInstitution)
      : null;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload each file
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // For tax returns, set period dates based on selected tax year
        let periodStart: string | null = null;
        let periodEnd: string | null = null;
        
        if (docType === "tax_return" && selectedTaxYear) {
          // Set period to cover the full fiscal year
          periodStart = `${selectedTaxYear}-01-01`;
          periodEnd = `${selectedTaxYear}-12-31`;
        }

        // Create document record
        const { data: insertedDoc, error: insertError } = await supabase
          .from("documents")
          .insert({
            project_id: projectId,
            user_id: user.id,
            name: file.name,
            file_path: filePath,
            file_type: fileExt || null,
            file_size: file.size,
            institution: institution,
            account_label: accountLabel || null,
            account_type: docType,
            processing_status: "pending",
            period_start: periodStart,
            period_end: periodEnd,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Call appropriate edge function based on document type
        try {
          if (docType === "cim") {
            // Use specialized CIM parser - fire-and-forget with localStorage persistence
            localStorage.setItem(`cim-parsing-${projectId}`, "true");
            setParsingCim(true);
            
            // Fire the request but don't await - let realtime handle completion
            supabase.functions.invoke('parse-cim', {
              body: {
                documentId: insertedDoc.id,
                projectId,
              },
            }).then(({ data: parseResult, error: parseError }) => {
              if (parseError) {
                console.warn("CIM parsing failed:", parseError);
                localStorage.removeItem(`cim-parsing-${projectId}`);
                setParsingCim(false);
                toast.error("Failed to extract CIM insights");
              } else if (parseResult?.insights) {
                setCimInsights(parseResult.insights);
                localStorage.removeItem(`cim-parsing-${projectId}`);
                setParsingCim(false);
                toast.success("CIM business insights extracted!");
              }
            }).catch((fnError) => {
              console.warn("CIM parse edge function call failed:", fnError);
              localStorage.removeItem(`cim-parsing-${projectId}`);
              setParsingCim(false);
              toast.error("Failed to parse CIM");
            });
          } else if (docType === "payroll") {
            // Use AI-powered payroll extractor
            const { error: processError } = await supabase.functions.invoke('process-payroll-document', {
              body: {
                documentId: insertedDoc.id,
                projectId,
                periods,
              },
            });

            if (processError) {
              console.warn("Payroll processing failed:", processError);
              if (processError.message?.includes('429')) {
                toast.error("Rate limit exceeded. Please try again in a few minutes.");
              } else if (processError.message?.includes('402')) {
                toast.error("AI credits exhausted. Please add funds to continue.");
              } else {
                toast.error("Failed to extract payroll data");
              }
            } else {
              toast.success("Payroll data extracted! Go to Payroll section to review and import.", { duration: 5000 });
            }
          } else if (docType === "depreciation_schedule" || docType === "fixed_asset_register") {
            // Use AI-powered fixed assets extractor
            const { error: processError } = await supabase.functions.invoke('process-fixed-assets', {
              body: {
                documentId: insertedDoc.id,
                projectId,
              },
            });

            if (processError) {
              console.warn("Fixed assets processing failed:", processError);
              if (processError.message?.includes('429')) {
                toast.error("Rate limit exceeded. Please try again in a few minutes.");
              } else if (processError.message?.includes('402')) {
                toast.error("AI credits exhausted. Please add funds to continue.");
              } else {
                toast.error("Failed to extract fixed assets data");
              }
            } else {
              toast.success("Fixed assets extracted! Go to Fixed Assets section to review and import.", { duration: 5000 });
            }
          } else if (isQuickBooksType(docType)) {
            // Fire-and-forget: don't block the upload loop
            supabase.functions.invoke('process-quickbooks-file', {
              body: {
                documentId: insertedDoc.id,
              },
            }).then(({ error: processError }) => {
              if (processError) {
                console.warn("QuickBooks processing failed:", processError);
                if (processError.message?.includes('401') || processError.message?.includes('Unauthorized')) {
                  toast.error("API authentication failed. Please contact support.");
                }
              }
            }).catch((fnError) => {
              console.warn("QuickBooks processing call failed:", fnError);
            });
          } else if (docType === "tax_return") {
            // Tax returns use AI extraction directly (DocuClipper doesn't support them)
            localStorage.setItem(`tax-parsing-${projectId}`, "true");
            setParsingTaxReturn(true);
            
            // Mark as processing
            await supabase
              .from('documents')
              .update({ processing_status: 'processing' })
              .eq('id', insertedDoc.id);
            
            supabase.functions.invoke('parse-tax-return', {
              body: {
                documentId: insertedDoc.id,
                projectId,
              },
            }).then(({ data: parseResult, error: parseError }) => {
              if (parseError) {
                console.warn("Tax return parsing failed:", parseError);
                localStorage.removeItem(`tax-parsing-${projectId}`);
                setParsingTaxReturn(false);
                if (parseError.message?.includes('429')) {
                  toast.error("Rate limit exceeded. Please try again in a few minutes.");
                } else if (parseError.message?.includes('402')) {
                  toast.error("AI credits exhausted. Please add funds to continue.");
                } else {
                  toast.error("Failed to analyze tax return");
                }
              } else if (parseResult?.analysis) {
                setTaxReturnInsights(prev => {
                  const existing = prev.findIndex(a => a.documentId === insertedDoc.id);
                  if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = parseResult.analysis;
                    return updated;
                  }
                  return [...prev, parseResult.analysis];
                });
                localStorage.removeItem(`tax-parsing-${projectId}`);
                setParsingTaxReturn(false);
                toast.success("Tax return analyzed! Review the comparison summary below.", { duration: 5000 });
              }
            }).catch((fnError) => {
              console.warn("Tax return parse edge function failed:", fnError);
              localStorage.removeItem(`tax-parsing-${projectId}`);
              setParsingTaxReturn(false);
              toast.error("Failed to analyze tax return");
            });
          } else if (docType === "debt_schedule") {
            // Trigger AI debt schedule extraction
            await supabase.from('documents').update({ processing_status: "processing" }).eq('id', insertedDoc.id);
            
            try {
              const fileBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });

              const response = await supabase.functions.invoke('process-debt-schedule', {
                body: { 
                  documentId: insertedDoc.id, 
                  fileBase64,
                  fileName: file.name,
                  projectId 
                }
              });
              
              if (response.error) throw response.error;
              
              await supabase.from('documents').update({ 
                processing_status: "completed",
                parsed_summary: response.data 
              }).eq('id', insertedDoc.id);
              
              toast.success("Debt schedule extracted successfully");
            } catch (debtError) {
              console.warn("Debt schedule processing failed:", debtError);
              await supabase.from('documents').update({ processing_status: "failed" }).eq('id', insertedDoc.id);
              toast.error("Failed to process debt schedule");
            }
          } else if (docType === "material_contract") {
            // Trigger AI contract extraction
            await supabase.from('documents').update({ processing_status: "processing" }).eq('id', insertedDoc.id);
            
            try {
              const fileBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });

              const response = await supabase.functions.invoke('process-material-contract', {
                body: { 
                  documentId: insertedDoc.id, 
                  fileBase64,
                  fileName: file.name,
                  projectId 
                }
              });
              
              if (response.error) throw response.error;
              
              await supabase.from('documents').update({ 
                processing_status: "completed",
                parsed_summary: response.data 
              }).eq('id', insertedDoc.id);
              
              toast.success("Contract terms extracted successfully");
            } catch (contractError) {
              console.warn("Material contract processing failed:", contractError);
              await supabase.from('documents').update({ processing_status: "failed" }).eq('id', insertedDoc.id);
              toast.error("Failed to extract contract terms");
            }
          } else if (isDocuClipperType(docType)) {
            // Use DocuClipper for bank/credit statements only
            const { error: processError } = await supabase.functions.invoke('process-statement', {
              body: {
                projectId,
                filePath,
                documentName: file.name,
                documentType: docType,
              },
            });

            if (processError) {
              console.warn("Document processing failed:", processError);
            }
          } else {
            // Other types - just mark as completed (no processing needed)
            await supabase
              .from('documents')
              .update({ 
                processing_status: "completed",
                parsed_summary: { note: "Document stored successfully. This document type does not require parsing." }
              })
              .eq('id', insertedDoc.id);
          }
        } catch (fnError) {
          console.warn("Edge function call failed:", fnError);
        }
      }

      toast.success(`${files.length} file(s) uploaded successfully`);
      setSelectedFiles(null);
      setAccountLabel("");
      setSelectedTaxYear(null);
      
      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  // Main upload handler with validation
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    const requiresInstitution = REQUIRES_INSTITUTION.includes(selectedType);
    
    if (requiresInstitution && !selectedInstitution) {
      toast.error("Please select an institution");
      return;
    }

    const institution = requiresInstitution
      ? (selectedInstitution === "other" ? customInstitution : selectedInstitution)
      : null;
      
    if (requiresInstitution && !institution) {
      toast.error("Please enter the institution name");
      return;
    }

    const files = Array.from(selectedFiles);
    
    // For single file uploads of parseable types, validate first
    if (files.length === 1 && (isDocuClipperType(selectedType) || isQuickBooksType(selectedType))) {
      const file = files[0];
      
      setIsValidating(true);
      
      // Set a timeout - if validation takes too long, skip it
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 5000)
      );
      
      const validationPromise = validateFile(file, selectedType);
      
      const result = await Promise.race([validationPromise, timeoutPromise]);
      
      setIsValidating(false);
      
      // If validation returned a mismatch, show dialog
      if (result && !result.isValid && result.suggestedType) {
        setPendingValidation({
          file,
          result,
          selectedType,
        });
        setValidationDialogOpen(true);
        return;
      }
      
      // Validation passed or was skipped - proceed
      toast.success("Document validated", { icon: <ShieldCheck className="h-4 w-4 text-green-500" /> });
    }
    
    // Proceed with upload
    await proceedWithUpload(files, selectedType);
  };

  // Handle validation dialog actions
  const handleChangeType = () => {
    if (!pendingValidation?.result.suggestedType) return;
    
    const newType = pendingValidation.result.suggestedType;
    setSelectedType(newType);
    setValidationDialogOpen(false);
    
    // Proceed with the corrected type
    proceedWithUpload([pendingValidation.file], newType);
    setPendingValidation(null);
  };

  const handleUploadAnyway = () => {
    if (!pendingValidation) return;
    
    setValidationDialogOpen(false);
    proceedWithUpload([pendingValidation.file], pendingValidation.selectedType);
    setPendingValidation(null);
  };

  const handleCancelValidation = () => {
    setValidationDialogOpen(false);
    setPendingValidation(null);
  };

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from("documents").remove([filePath]);

      // Delete record
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleRefresh = async (docId: string) => {
    toast.info("Refreshing document status...");
    fetchDocuments();
  };

  const handleRetry = async (doc: Document) => {
    if (!doc.file_path || !doc.account_type) return;
    
    try {
      toast.info("Retrying document processing...");
      
      // Reset status to processing
      await supabase
        .from('documents')
        .update({ processing_status: 'processing', parsed_summary: null })
        .eq('id', doc.id);

      // Re-invoke process-statement
      const { error } = await supabase.functions.invoke('process-statement', {
        body: {
          projectId,
          filePath: doc.file_path,
          documentName: doc.name,
          documentType: doc.account_type,
        },
      });

      if (error) {
        console.error("Retry failed:", error);
        toast.error("Retry failed. Please try again.");
        await supabase
          .from('documents')
          .update({ processing_status: 'failed' })
          .eq('id', doc.id);
      } else {
        toast.success("Document re-submitted for processing");
      }
      
      fetchDocuments();
    } catch (err) {
      console.error("Retry error:", err);
      toast.error("Failed to retry processing");
    }
  };

  const isStuckProcessing = (doc: Document): boolean => {
    if (doc.processing_status !== 'processing') return false;
    if (!doc.created_at) return false;
    const createdAt = new Date(doc.created_at).getTime();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return createdAt < tenMinutesAgo;
  };

  const handleCimReupload = async (file: File) => {
    localStorage.setItem(`cim-parsing-${projectId}`, "true");
    setParsingCim(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete existing CIM documents and processed data
      const existingCimDocs = documents.filter(doc => doc.account_type === "cim");
      for (const doc of existingCimDocs) {
        await supabase.storage.from("documents").remove([doc.file_path]);
        await supabase.from("documents").delete().eq("id", doc.id);
      }
      
      // Delete existing CIM insights
      await supabase
        .from("processed_data")
        .delete()
        .eq("project_id", projectId)
        .eq("data_type", "cim_insights");

      // Upload new file
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: insertedDoc, error: insertError } = await supabase
        .from("documents")
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          file_type: fileExt || null,
          file_size: file.size,
          account_type: "cim",
          processing_status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      fetchDocuments();

      // Fire-and-forget the CIM parse - realtime will catch completion
      supabase.functions.invoke('parse-cim', {
        body: {
          documentId: insertedDoc.id,
          projectId,
        },
      }).then(({ data: parseResult, error: parseError }) => {
        if (parseError) {
          console.warn("CIM parsing failed:", parseError);
          localStorage.removeItem(`cim-parsing-${projectId}`);
          setParsingCim(false);
          toast.error("Failed to extract CIM insights");
        } else if (parseResult?.insights) {
          setCimInsights(parseResult.insights);
          localStorage.removeItem(`cim-parsing-${projectId}`);
          setParsingCim(false);
          toast.success("CIM re-processed successfully!");
        }
      }).catch((fnError) => {
        console.warn("CIM re-parse edge function call failed:", fnError);
        localStorage.removeItem(`cim-parsing-${projectId}`);
        setParsingCim(false);
        toast.error("Failed to parse CIM");
      });
    } catch (error) {
      console.error("CIM re-upload error:", error);
      localStorage.removeItem(`cim-parsing-${projectId}`);
      setParsingCim(false);
      toast.error("Failed to re-upload CIM");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "processing":
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Document Upload</h2>
        <p className="text-muted-foreground">
          Upload bank statements and financial documents for parsing
        </p>
      </div>

      {/* Document Checklist Reference - shows what's required/optional */}
      <DocumentChecklistReference 
        projectId={projectId}
        currentDocType={selectedType}
        wizardData={fullWizardData}
      />

      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          {DOCUMENT_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value} className="text-xs px-3 gap-1">
              {type.label}
              {isOptionalVerificationType(type.value) && (
                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 font-normal opacity-70">
                  Verify
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {DOCUMENT_TYPES.map((type) => (
          <TabsContent key={type.value} value={type.value} className="space-y-6">
            {/* Educational Banner for Optional Verification Documents */}
            {isOptionalVerificationType(type.value) && (
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <span className="font-medium text-primary">Optional Verification Document</span>
                  <p className="mt-1 text-muted-foreground">
                    Your <strong>Trial Balance</strong> is the source of truth — the {type.label} is automatically derived from it. 
                    Upload the seller's {type.label} here to <strong>verify it matches your calculated values</strong>. 
                    Any discrepancies will be highlighted.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* CIM Insights Card - only show on CIM tab */}
            {type.value === "cim" && (cimInsights || parsingCim) && (
              parsingCim ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center gap-3">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                      <p className="text-sm text-muted-foreground">Extracting business insights from CIM...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : cimInsights ? (
                <CIMInsightsCard 
                  insights={cimInsights} 
                  onReupload={handleCimReupload}
                  isReuploading={parsingCim}
                />
              ) : null
            )}

            {/* Tax Return Insights Card - only show on tax_return tab */}
            {type.value === "tax_return" && (taxReturnInsights.length > 0 || parsingTaxReturn) && (
              parsingTaxReturn ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center gap-3">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                      <p className="text-sm text-muted-foreground">Analyzing tax return and comparing with financial data...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {taxReturnInsights.map((analysis) => (
                    <TaxReturnInsightsCard 
                      key={analysis.documentId}
                      analysis={analysis}
                    />
                  ))}
                </div>
              )
            )}

            {/* Period Coverage Analysis - hide for 'none' coverage type */}
            {coverageConfig.type !== 'none' && effectivePeriods.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{coverageConfig.label || 'Period Coverage Analysis'}</CardTitle>
                      <CardDescription>
                        {coverageConfig.description || 'Comparing uploaded documents against required periods'}
                      </CardDescription>
                    </div>
                    {/* Only show percentage badge for monthly/annual coverage */}
                    {(coverageConfig.type === 'monthly' || coverageConfig.type === 'annual') && (
                      <div className="flex items-center gap-2">
                        <Badge variant={coverage.status === 'full' ? 'default' : coverage.status === 'partial' ? 'secondary' : 'destructive'}>
                          {coverage.coveragePercentage}% Coverage
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Only show progress bar for monthly/annual coverage */}
                  {(coverageConfig.type === 'monthly' || coverageConfig.type === 'annual') && (
                    <Progress value={coverage.coveragePercentage} className="h-2" />
                  )}
                  
                  <CoverageTimeline 
                    periods={effectivePeriods} 
                    coverage={coverage} 
                    coverageType={coverageConfig.type}
                    documentCount={filteredDocs.length}
                    hasQBCoverage={hasQBCoverage}
                  />

                  {/* Missing periods alert - only for monthly/annual */}
                  {(coverageConfig.type === 'monthly' || coverageConfig.type === 'annual') && 
                   coverage.status !== 'full' && missingPeriodRanges.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Missing coverage: </span>
                        {missingPeriodRanges.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Full coverage alert */}
                  {coverage.status === 'full' && coverageConfig.type === 'monthly' && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription>
                        All required periods are covered by uploaded documents
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upload Form */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Upload {type.label}
                      {isOptionalVerificationType(type.value) && (
                        <Badge variant="secondary" className="font-normal">
                          <Scale className="w-3 h-3 mr-1" />
                          Optional - Verification
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {type.value === "cim" 
                        ? "Upload the Confidential Information Memorandum for AI-powered business context extraction"
                        : isOptionalVerificationType(type.value)
                          ? `Upload the seller's ${type.label} to compare against your Trial Balance-derived values`
                          : "Upload PDF or CSV files for automatic parsing"
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {REQUIRES_INSTITUTION.includes(type.value) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select institution" />
                        </SelectTrigger>
                        <SelectContent>
                          {INSTITUTIONS.map((inst) => (
                            <SelectItem key={inst.value} value={inst.value}>
                              {inst.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedInstitution === "other" && (
                      <div className="space-y-2">
                        <Label>Institution Name</Label>
                        <Input
                          placeholder="Enter institution name"
                          value={customInstitution}
                          onChange={(e) => setCustomInstitution(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Account Label (Optional)</Label>
                      <Input
                        placeholder="e.g., Operating Account, Payroll"
                        value={accountLabel}
                        onChange={(e) => setAccountLabel(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Tax Year Selector - only for tax returns */}
                {type.value === "tax_return" && (
                  <div className="space-y-2">
                    <Label>Tax Year <span className="text-destructive">*</span></Label>
                    <Select 
                      value={selectedTaxYear?.toString() || ""} 
                      onValueChange={(v) => setSelectedTaxYear(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select the tax year this return covers" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTaxYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year} Tax Year
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select the fiscal year this tax return covers for accurate coverage tracking
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Files</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept={getAcceptedFileTypes(type.value)}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getFileTypeLabel(type.value)}
                      </span>
                    </label>
                    {selectedFiles && selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-1">
                        {Array.from(selectedFiles).map((file, i) => (
                          <div key={i} className="flex items-center gap-2 justify-center text-sm">
                            <FileText className="w-4 h-4" />
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Disable CIM upload while parsing */}
                {parsingCim && type.value === "cim" && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      CIM is currently being processed. Please wait for completion before uploading another.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={uploading || isValidating || !selectedFiles || (type.value === "cim" && parsingCim) || (type.value === "tax_return" && !selectedTaxYear)}
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2 animate-pulse" />
                      Validating...
                    </>
                  ) : uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : parsingCim && type.value === "cim" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      CIM Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </Button>

                {/* Workflow Progress */}
                {workflow && (workflow.status === 'running' || workflow.status === 'pending') && (
                  <WorkflowProgress 
                    workflow={workflow} 
                    onCancel={() => {
                      if (activeWorkflowId) {
                        cancelWorkflow(activeWorkflowId);
                        setActiveWorkflowId(null);
                      }
                    }}
                    compact
                  />
                )}

                {workflow?.status === 'failed' && (
                  <WorkflowError 
                    workflow={workflow} 
                    onRetry={() => activeWorkflowId && retryWorkflow(activeWorkflowId)}
                    isRetrying={isWorkflowLoading}
                  />
                )}
              </CardContent>
            </Card>

            {/* Documents Table */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>
                  {filteredDocs.length} document(s) uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents uploaded yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocs.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              {doc.name}
                              {doc.account_type === 'general_ledger' && doc.parsed_summary?.coa_derived && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 text-xs">
                                  COA Derived
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{doc.institution || "-"}</TableCell>
                          <TableCell>{doc.account_label || "-"}</TableCell>
                          <TableCell>
                            {doc.period_start && doc.period_end
                              ? `${formatDate(doc.period_start)} - ${formatDate(doc.period_end)}`
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.processing_status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {(doc.processing_status === 'failed' || isStuckProcessing(doc)) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetry(doc)}
                                  className="text-xs gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Retry
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRefresh(doc.id)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(doc.id, doc.file_path as string)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Validation Dialog */}
      {pendingValidation && (
        <DocumentValidationDialog
          open={validationDialogOpen}
          onOpenChange={setValidationDialogOpen}
          fileName={pendingValidation.file.name}
          selectedType={pendingValidation.selectedType}
          selectedTypeLabel={getTypeLabel(pendingValidation.selectedType)}
          validationResult={pendingValidation.result}
          suggestedTypeLabel={pendingValidation.result.suggestedType ? getTypeLabel(pendingValidation.result.suggestedType) : null}
          onChangeType={handleChangeType}
          onUploadAnyway={handleUploadAnyway}
          onCancel={handleCancelValidation}
        />
      )}
    </div>
  );
};
