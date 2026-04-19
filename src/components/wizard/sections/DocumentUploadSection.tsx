import { useState, useEffect, useMemo, useCallback } from "react";
import { parseLocalDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Trash2, RefreshCw, Sparkles, ShieldCheck, Info, Scale, Check, ChevronsUpDown, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { PayrollInsightsCard, type PayrollAnalysisData } from "./PayrollInsightsCard";
import { GeneralLedgerInsightsCard, type GLAnalysisData } from "./GeneralLedgerInsightsCard";
import { JournalEntryInsightsCard, type JEAnalysisData } from "./JournalEntryInsightsCard";
import { AnalysisRunButton } from "./AnalysisRunButton";
import { DocumentValidationDialog, type ValidationResult } from "../shared/DocumentValidationDialog";
import { DocumentChecklistReference } from "../shared/DocumentChecklistReference";
import { FinancialStatementValidationCard, type FinancialStatementValidationResult } from "../shared/FinancialStatementValidationCard";
import { Spinner } from "@/components/ui/spinner";
import { getUploadErrorMessage, logUploadError } from "@/lib/uploadErrorLogger";

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
  validation_result: FinancialStatementValidationResult | null;
}

const INSTITUTION_GROUPS: { label: string; items: { value: string; label: string }[] }[] = [
  {
    label: "Major Banks",
    items: [
      { value: "jpmorgan_chase", label: "JPMorgan Chase" },
      { value: "bank_of_america", label: "Bank of America" },
      { value: "wells_fargo", label: "Wells Fargo" },
      { value: "citibank", label: "Citibank" },
      { value: "us_bank", label: "U.S. Bank" },
      { value: "capital_one", label: "Capital One" },
      { value: "pnc_bank", label: "PNC Bank" },
      { value: "truist_bank", label: "Truist Bank" },
      { value: "td_bank", label: "TD Bank" },
      { value: "ally_bank", label: "Ally Bank" },
      { value: "hsbc_bank_usa", label: "HSBC Bank USA" },
      { value: "santander_bank", label: "Santander Bank" },
      { value: "regions_bank", label: "Regions Bank" },
      { value: "keybank", label: "KeyBank" },
      { value: "huntington_bank", label: "Huntington Bank" },
      { value: "fifth_third_bank", label: "Fifth Third Bank" },
      { value: "mt_bank", label: "M&T Bank" },
      { value: "citizens_bank", label: "Citizens Bank" },
      { value: "first_citizens_bank", label: "First Citizens Bank" },
      { value: "comerica_bank", label: "Comerica Bank" },
      { value: "zions_bank", label: "Zions Bank" },
      { value: "webster_bank", label: "Webster Bank" },
      { value: "first_horizon_bank", label: "First Horizon Bank" },
      { value: "synovus_bank", label: "Synovus Bank" },
      { value: "frost_bank", label: "Frost Bank" },
      { value: "east_west_bank", label: "East West Bank" },
    ],
  },
  {
    label: "Regional Banks",
    items: [
      { value: "bok_financial", label: "BOK Financial" },
      { value: "umb_bank", label: "UMB Bank" },
      { value: "arvest_bank", label: "Arvest Bank" },
      { value: "cadence_bank", label: "Cadence Bank" },
      { value: "southstate_bank", label: "SouthState Bank" },
      { value: "valley_national_bank", label: "Valley National Bank" },
      { value: "atlantic_union_bank", label: "Atlantic Union Bank" },
      { value: "bankunited", label: "BankUnited" },
      { value: "prosperity_bank", label: "Prosperity Bank" },
      { value: "hancock_whitney", label: "Hancock Whitney" },
      { value: "western_alliance_bank", label: "Western Alliance Bank" },
      { value: "customers_bank", label: "Customers Bank" },
    ],
  },
  {
    label: "SBA Banks",
    items: [
      { value: "live_oak_bank", label: "Live Oak Bank" },
      { value: "first_national_bank_omaha", label: "First National Bank of Omaha" },
      { value: "ready_capital_bank", label: "Ready Capital Bank" },
      { value: "celtic_bank", label: "Celtic Bank" },
      { value: "byline_bank", label: "Byline Bank" },
    ],
  },
  {
    label: "Credit Card Issuers",
    items: [
      { value: "american_express", label: "American Express" },
      { value: "discover", label: "Discover" },
      { value: "chase_credit_cards", label: "Chase Credit Cards" },
      { value: "citi_credit_cards", label: "Citi Credit Cards" },
      { value: "capital_one_credit_cards", label: "Capital One Credit Cards" },
      { value: "boa_credit_cards", label: "Bank of America Credit Cards" },
      { value: "wells_fargo_credit_cards", label: "Wells Fargo Credit Cards" },
      { value: "us_bank_credit_cards", label: "U.S. Bank Credit Cards" },
      { value: "barclays_us", label: "Barclays US" },
      { value: "synchrony_financial", label: "Synchrony Financial" },
      { value: "td_bank_credit_cards", label: "TD Bank Credit Cards" },
      { value: "apple_card", label: "Apple Card" },
    ],
  },
  {
    label: "Digital Banks / Fintech",
    items: [
      { value: "mercury", label: "Mercury" },
      { value: "brex", label: "Brex" },
      { value: "ramp", label: "Ramp" },
      { value: "novo", label: "Novo" },
      { value: "relay_financial", label: "Relay Financial" },
      { value: "bluevine", label: "Bluevine" },
      { value: "sofi", label: "SoFi" },
      { value: "chime", label: "Chime" },
      { value: "current", label: "Current" },
      { value: "varo_bank", label: "Varo Bank" },
    ],
  },
  {
    label: "Payment Platforms",
    items: [
      { value: "paypal", label: "PayPal" },
      { value: "stripe", label: "Stripe" },
      { value: "square", label: "Square" },
      { value: "shopify_balance", label: "Shopify Balance" },
      { value: "affirm", label: "Affirm" },
      { value: "klarna", label: "Klarna" },
      { value: "amazon_pay", label: "Amazon Pay" },
      { value: "google_pay", label: "Google Pay" },
      { value: "venmo", label: "Venmo" },
      { value: "cash_app", label: "Cash App" },
    ],
  },
  {
    label: "Credit Unions",
    items: [
      { value: "navy_federal_cu", label: "Navy Federal Credit Union" },
      { value: "state_employees_cu", label: "State Employees Credit Union" },
      { value: "penfed_cu", label: "PenFed Credit Union" },
      { value: "alliant_cu", label: "Alliant Credit Union" },
      { value: "suncoast_cu", label: "Suncoast Credit Union" },
      { value: "golden_1_cu", label: "Golden 1 Credit Union" },
      { value: "becu", label: "BECU" },
      { value: "patelco_cu", label: "Patelco Credit Union" },
      { value: "first_tech_fcu", label: "First Tech Federal Credit Union" },
      { value: "america_first_cu", label: "America First Credit Union" },
      { value: "vystar_cu", label: "VyStar Credit Union" },
      { value: "mountain_america_cu", label: "Mountain America Credit Union" },
      { value: "schoolsfirst_cu", label: "SchoolsFirst Credit Union" },
    ],
  },
  {
    label: "Other",
    items: [
      { value: "other", label: "Other" },
    ],
  },
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
  { value: "cash_flow", label: "Cash Flow Statement", optional: true, verifiable: true },
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
  { value: "lease_agreement", label: "Lease Agreements" },
  { value: "inventory", label: "Inventory Reports" },
  { value: "supporting_documents", label: "Supporting Documents" },
];

// Combined list for UI in workflow order
const DOCUMENT_TYPES = [
  ...CIM_TYPES,
  ...CORE_QUICKBOOKS_TYPES,
  ...OPTIONAL_VERIFICATION_TYPES,
  ...TRANSACTION_TYPES,
  ...SUPPORTING_TYPES,
];

// Grouped categories for vertical sidebar
const DOC_TYPE_GROUPS = [
  { label: "Business Context", items: CIM_TYPES },
  { label: "Core Financials", items: CORE_QUICKBOOKS_TYPES },
  { label: "Verification", items: OPTIONAL_VERIFICATION_TYPES },
  { label: "Transactions", items: TRANSACTION_TYPES },
  { label: "Supporting", items: SUPPORTING_TYPES },
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
  journal_entries: { type: 'full-period', label: 'Full Period', description: 'Journal entries covering the analysis period' },
  
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
  
  // Debt & contracts - upload once
  debt_schedule: { type: 'point-in-time', label: 'Point-in-Time', description: 'Snapshot of outstanding debt as of a date' },
  material_contract: { type: 'point-in-time', label: 'Point-in-Time', description: 'Contract effective date' },
  lease_agreement: { type: 'point-in-time', label: 'Point-in-Time', description: 'Lease effective date' },
  
  // Inventory - point-in-time snapshot
  inventory: { type: 'point-in-time', label: 'Point-in-Time', description: 'Inventory snapshot as of a specific date' },
  
  // Supporting documents - no coverage tracking needed
  supporting_documents: { type: 'point-in-time', label: 'Point-in-Time', description: 'Document date (invoice, receipt, etc.)' },
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
const MAX_FILE_BYTES = 50 * 1024 * 1024;

// Helper to check document type category
const isQuickBooksType = (type: string) => 
  QUICKBOOKS_TYPES.some(t => t.value === type);

const isDocuClipperType = (type: string) => 
  DOCUCLIPPER_TYPES.some(t => t.value === type);

// Get accepted file types based on document category
const getAcceptedFileTypes = (docType: string): string => {
  if (docType === 'cim') return '.pdf,.docx,.doc';
  if (isDocuClipperType(docType)) return '.pdf,.csv';
  if (docType === 'trial_balance') return '.xlsx,.xls,.csv,.pdf';
  if (docType === 'journal_entries') return '.xlsx,.xls,.csv'; // No PDF - parsing unreliable
  if (docType === 'general_ledger') return '.xlsx,.xls,.csv'; // No PDF - structured data only
  if (isQuickBooksType(docType)) return '.xlsx,.xls,.csv,.pdf';
  return '.pdf,.xlsx,.xls,.csv,.docx,.doc';
};

// Get user-friendly label for accepted file types
const getFileTypeLabel = (docType: string): string => {
  if (docType === 'cim') return 'PDF or Word documents';
  if (isDocuClipperType(docType)) return 'PDF or CSV files';
  if (docType === 'trial_balance') return 'Excel, CSV, or PDF files';
  if (docType === 'journal_entries') return 'Excel or CSV files only';
  if (docType === 'general_ledger') return 'Excel or CSV files only';
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
  const [institutionOpen, setInstitutionOpen] = useState(false);
  const [customInstitution, setCustomInstitution] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [cimInsights, setCimInsights] = useState<CIMInsights | null>(null);
  const [parsingCim, setParsingCim] = useState(false);
  const [taxReturnInsights, setTaxReturnInsights] = useState<TaxReturnAnalysis[]>([]);
  const [parsingTaxReturn, setParsingTaxReturn] = useState(false);
  const [payrollAnalysis, setPayrollAnalysis] = useState<{ docName: string; data: PayrollAnalysisData }[]>([]);
  const [glAnalysis, setGlAnalysis] = useState<{ docName: string; data: GLAnalysisData }[]>([]);
  const [jeAnalysis, setJeAnalysis] = useState<{ docName: string; data: JEAnalysisData }[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [selectedTaxYear, setSelectedTaxYear] = useState<number | null>(null);
  const [pendingValidation, setPendingValidation] = useState<{
    file: File;
    result: ValidationResult;
    selectedType: string;
  } | null>(null);
  
  // Financial statement validation state
  const [financialValidationResults, setFinancialValidationResults] = useState<Record<string, FinancialStatementValidationResult | null>>({});
  const [validatingFinancialStatement, setValidatingFinancialStatement] = useState<string | null>(null);

  // QuickBooks synced periods from processed_data
  const [processedDataPeriods, setProcessedDataPeriods] = useState<{ period_start: string | null; period_end: string | null }[]>([]);

  // Get unique years from periods for tax year selection
  const availableTaxYears = useMemo(() => {
    const years = new Set(periods.map(p => p.year));
    return Array.from(years).sort((a, b) => b - a); // descending order
  }, [periods]);
  
  const { triggerWorkflow, cancelWorkflow, retryWorkflow, isLoading: isWorkflowLoading } = useWorkflow();
  const { workflow } = useWorkflowStatus(activeWorkflowId);
  const isMobile = useIsMobile();

  // Count docs per type for sidebar badges
  const docCountByType = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of documents) {
      if (doc.account_type) {
        counts[doc.account_type] = (counts[doc.account_type] || 0) + 1;
      }
    }
    return counts;
  }, [documents]);

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
        .eq('source_type', 'quickbooks_api')
        .limit(1000000);
      
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
    fetchPayrollAnalysis();
    fetchGLAnalysis();
    fetchJEAnalysis();
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
          if (newData.data_type === 'payroll' && newData.data) {
            fetchPayrollAnalysis();
          }
          if (newData.data_type === 'general_ledger_analysis' && newData.data) {
            fetchGLAnalysis();
            toast.success("General ledger analysis complete!");
          }
          if (newData.data_type === 'journal_entry_analysis' && newData.data) {
            fetchJEAnalysis();
            toast.success("Journal entry analysis complete!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Realtime subscription for document status updates (processing → completed/failed)
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`doc-status-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updated = payload.new as Document;
          setDocuments(prev =>
            prev.map(doc => doc.id === updated.id ? { ...doc, ...updated } : doc)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Fallback polling while any document is still processing
  useEffect(() => {
    const transitionalStatuses = ['processing', 'healing', 'queued_for_healing', 'reprocessing'];
    const hasTransitional = documents.some(d => transitionalStatuses.includes(d.processing_status || ''));
    if (!hasTransitional || !projectId) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, name, file_path, institution, account_label, account_type, period_start, period_end, processing_status, parsed_summary, coverage_validated, created_at, validation_result')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1000000);
      if (data) setDocuments(data as unknown as Document[]);
    }, 10000);

    return () => clearInterval(interval);
  }, [documents, projectId]);

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
        .order("created_at", { ascending: false })
        .limit(1000000);

      if (error) throw error;
      setDocuments((docs || []).map(d => ({ ...d, validation_result: d.validation_result as unknown as FinancialStatementValidationResult | null })) as Document[]);
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

  const fetchPayrollAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from("processed_data")
        .select("data, source_document_id")
        .eq("project_id", projectId)
        .eq("data_type", "payroll")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const results = data.map(d => {
          const pData = d.data as unknown as PayrollAnalysisData;
          return { docName: pData.documentName || "Payroll Document", data: pData };
        });
        setPayrollAnalysis(results);
      }
    } catch (e) { console.error("Error fetching payroll analysis:", e); }
  };

  const fetchGLAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from("processed_data")
        .select("data")
        .eq("project_id", projectId)
        .eq("data_type", "general_ledger_analysis")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setGlAnalysis(data.map(d => ({ docName: "General Ledger", data: d.data as unknown as GLAnalysisData })));
      }
    } catch (e) { console.error("Error fetching GL analysis:", e); }
  };

  const fetchJEAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from("processed_data")
        .select("data")
        .eq("project_id", projectId)
        .eq("data_type", "journal_entry_analysis")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setJeAnalysis(data.map(d => ({ docName: "Journal Entries", data: d.data as unknown as JEAnalysisData })));
      }
    } catch (e) { console.error("Error fetching JE analysis:", e); }
  };

  // Trigger financial statement validation against Trial Balance
  const triggerFinancialValidation = useCallback(async (documentId: string, docType: string) => {
    setValidatingFinancialStatement(docType);
    try {
      // Fetch document period context for accurate TB derivation
      const { data: docPeriod } = await supabase
        .from("documents")
        .select("period_start, period_end")
        .eq("id", documentId)
        .single();

      const { data: result, error } = await supabase.functions.invoke('validate-financial-statement', {
        body: {
          projectId,
          documentId,
          documentType: docType,
          periodStart: docPeriod?.period_start || null,
          periodEnd: docPeriod?.period_end || null,
        },
      });

      if (error) {
        console.error("Financial validation error:", error);
        toast.error("Failed to validate against Trial Balance");
        return;
      }

      if (result?.error) {
        if (result.code === 'NO_TRIAL_BALANCE') {
          toast.error("Upload a Trial Balance first before validating");
        } else {
          toast.error(result.error);
        }
        return;
      }

      setFinancialValidationResults(prev => ({ ...prev, [docType]: result as FinancialStatementValidationResult }));
      toast.success(`${docType === 'balance_sheet' ? 'Balance Sheet' : docType === 'income_statement' ? 'Income Statement' : 'Cash Flow'} validation complete`);
    } catch (err) {
      console.error("Financial validation failed:", err);
      toast.error("Validation failed");
    } finally {
      setValidatingFinancialStatement(null);
    }
  }, [projectId]);

  // Hydrate existing validation results from DB when documents load
  useEffect(() => {
    if (documents.length === 0) return;
    
    const verificationTypes = ['balance_sheet', 'income_statement', 'cash_flow'];
    for (const docType of verificationTypes) {
      const doc = documents.find(d => d.account_type === docType && (d as any).validation_result);
      if (doc && (doc as any).validation_result) {
        setFinancialValidationResults(prev => ({ ...prev, [docType]: (doc as any).validation_result as FinancialStatementValidationResult }));
      }
    }
  }, [documents]);

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        await logUploadError({
          context: "document_upload_section",
          stage: "auth_check",
          error: authError ?? new Error("Not authenticated"),
          projectId,
          fileName: "(auth)",
        });
        throw authError ?? new Error("Not authenticated");
      }

      // Process all files in parallel
      const uploadPromises = files.map(async (file) => {
        try {
          const fileExt = file.name.split(".").pop();
          if (file.size > MAX_FILE_BYTES) {
            const sizeError = new Error(`File exceeds 50 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
            await logUploadError({
              context: "document_upload_section",
              stage: "preflight_size",
              error: sizeError,
              projectId,
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: fileExt || null,
            });
            throw sizeError;
          }

          const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, file);

          if (uploadError) {
            await logUploadError({
              context: "document_upload_section",
              stage: "storage_upload",
              error: uploadError,
              projectId,
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: fileExt || null,
            });
            throw uploadError;
          }

          // For tax returns, set period dates based on selected tax year
          let periodStart: string | null = null;
          let periodEnd: string | null = null;
          
          if (docType === "tax_return" && selectedTaxYear) {
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
              ...(docType === "supporting_documents" && docDescription ? { description: docDescription } : {}),
            })
            .select()
            .single();

          if (insertError) {
            await logUploadError({
              context: "document_upload_section",
              stage: "db_insert",
              error: insertError,
              projectId,
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: fileExt || null,
              extra: { docType },
            });
            throw insertError;
          }

          // Call appropriate edge function based on document type
          try {
            if (docType === "cim") {
              localStorage.setItem(`cim-parsing-${projectId}`, "true");
              setParsingCim(true);
              
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
              }).catch(async (fnError) => {
                await logUploadError({
                  context: "document_upload_section",
                  stage: "edge_function",
                  error: fnError,
                  projectId,
                  userId: user.id,
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: fileExt || null,
                  extra: { docType, functionName: "parse-cim" },
                });
                console.warn("CIM parse edge function call failed:", fnError);
                localStorage.removeItem(`cim-parsing-${projectId}`);
                setParsingCim(false);
                toast.error("Failed to parse CIM");
              });
            } else if (docType === "payroll") {
              supabase.functions.invoke('process-payroll-document', {
                body: {
                  documentId: insertedDoc.id,
                  projectId,
                  periods,
                },
              }).then(({ error: processError }) => {
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
              }).catch((err) => console.warn("Payroll processing failed:", err));
            } else if (docType === "depreciation_schedule" || docType === "fixed_asset_register") {
              supabase.functions.invoke('process-fixed-assets', {
                body: {
                  documentId: insertedDoc.id,
                  projectId,
                },
              }).then(({ error: processError }) => {
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
              }).catch((err) => console.warn("Fixed assets processing failed:", err));
            } else if (isQuickBooksType(docType)) {
              supabase.functions.invoke('process-quickbooks-file', {
                body: {
                  documentId: insertedDoc.id,
                },
              }).catch((fnError) => {
                console.warn("QuickBooks processing call failed:", fnError);
              });
            } else if (docType === "tax_return") {
              localStorage.setItem(`tax-parsing-${projectId}`, "true");
              setParsingTaxReturn(true);
              
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
            } else if (docType === "lease_agreement") {
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

                const response = await supabase.functions.invoke('process-lease-agreement', {
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
                
                toast.success("Lease agreement analyzed successfully");
              } catch (leaseError) {
                console.warn("Lease agreement processing failed:", leaseError);
                await supabase.from('documents').update({ processing_status: "failed" }).eq('id', insertedDoc.id);
                toast.error("Failed to analyze lease agreement");
              }
            } else if (docType === "inventory") {
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

                const response = await supabase.functions.invoke('process-inventory-report', {
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
                
                toast.success("Inventory report analyzed successfully");
              } catch (invError) {
                console.warn("Inventory report processing failed:", invError);
                await supabase.from('documents').update({ processing_status: "failed" }).eq('id', insertedDoc.id);
                toast.error("Failed to analyze inventory report");
              }
            } else if (docType === "supporting_documents") {
              try {
                await supabase.from('documents').update({ processing_status: "processing" }).eq('id', insertedDoc.id);

                const fileBase64: string = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });

                const response = await supabase.functions.invoke('process-supporting-document', {
                  body: {
                    documentId: insertedDoc.id,
                    fileBase64,
                    fileName: file.name,
                    projectId,
                    description: insertedDoc.description || undefined,
                  }
                });

                if (response.error) throw response.error;

                await supabase.from('documents').update({
                  processing_status: "completed",
                  parsed_summary: response.data
                }).eq('id', insertedDoc.id);

                toast.success("Supporting document analyzed successfully");
              } catch (supportError) {
                console.warn("Supporting document processing failed:", supportError);
                await supabase.from('documents').update({ processing_status: "failed" }).eq('id', insertedDoc.id);
                toast.error("Failed to analyze supporting document");
              }
            } else if (isDocuClipperType(docType)) {
              // Both CSV and PDF — batched after all uploads via create-processing-tasks
              console.log(`[UPLOAD] Skipping per-file processing for ${file.name} (will batch via create-processing-tasks)`);

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
            await logUploadError({
              context: "document_upload_section",
              stage: "edge_function",
              error: fnError,
              projectId,
              userId: user.id,
              fileName: file.name,
              fileSize: file.size,
              fileType: fileExt || null,
              extra: { docType },
            });
            console.warn("Edge function call failed:", fnError);
          }

          return { success: true, filename: file.name, docId: insertedDoc.id };
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          return { success: false, filename: file.name, error, message: getUploadErrorMessage(error) };
        }
      });

      // Wait for all uploads to complete (not processing)
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      // For DocuClipper types (bank/credit card), batch-submit all uploads (PDF + CSV)
      if (isDocuClipperType(docType) && successful.length > 0) {
        const allDocIds = successful
          .map(r => r.docId)
          .filter(Boolean) as string[];
        
        if (allDocIds.length > 0) {
          console.log(`[UPLOAD] Submitting ${allDocIds.length} documents for parallel processing...`);
          
          supabase.functions.invoke('create-processing-tasks', {
            body: { documentIds: allDocIds, projectId },
          }).then(({ data, error }) => {
            if (error) {
              console.error("Batch processing submission failed:", error);
              toast.error("Documents uploaded but processing failed to start");
            } else {
              console.log(`Parallel processing started: ${data?.tasksCreated} tasks created`);
            }
          }).catch(err => console.warn("Batch processing failed:", err));
        }
        
        toast.success(`${successful.length} file(s) uploaded and processing`);
      } else if (successful.length > 0) {
        toast.success(`${successful.length} file(s) uploaded and processing`);
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} file(s) failed. ${failed[0].filename}: ${failed[0].message || getUploadErrorMessage(failed[0].error)}`, { duration: 10000 });
      }

      setSelectedFiles(null);
      setAccountLabel("");
      setDocDescription("");
      setSelectedTaxYear(null);
      
      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      fetchDocuments();

      // Auto-trigger financial statement validation for verification doc types
      if (isVerifiableType(docType) && files.length === 1 && successful.length === 1) {
        const { data: latestDoc } = await supabase
          .from("documents")
          .select("id")
          .eq("project_id", projectId)
          .eq("account_type", docType)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        if (latestDoc) {
          setTimeout(() => triggerFinancialValidation(latestDoc.id, docType), 2000);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      await logUploadError({
        context: "document_upload_section",
        stage: "unexpected",
        error,
        projectId,
        extra: { docType },
      });
      toast.error(getUploadErrorMessage(error, "Failed to upload files"));
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
      // 1. Delete derived processed_data (analysis results, parsed data)
      await supabase
        .from("processed_data")
        .delete()
        .eq("source_document_id", docId);

      // 2. Delete canonical_transactions linked to this document
      await supabase
        .from("canonical_transactions")
        .delete()
        .eq("source_document_id", docId);

      // 3. Delete file from storage
      await supabase.storage.from("documents").remove([filePath]);

      // 4. Delete document record
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

      if (isDocuClipperType(doc.account_type)) {
        // Use batch endpoint for bank/credit card statements
        const { error } = await supabase.functions.invoke('create-processing-tasks', {
          body: { documentIds: [doc.id], projectId },
        });

        if (error) {
          console.error("Retry (batch) failed:", error);
          toast.error("Retry failed. Please try again.");
          await supabase
            .from('documents')
            .update({ processing_status: 'failed' })
            .eq('id', doc.id);
        } else {
          toast.success("Document re-submitted for processing");
        }
      } else if (isQuickBooksType(doc.account_type)) {
        // GL, TB, IS, BS, etc. → process-quickbooks-file
        const { error } = await supabase.functions.invoke('process-quickbooks-file', {
          body: { documentId: doc.id },
        });

        if (error) {
          console.error("Retry (QB type) failed:", error);
          toast.error("Retry failed. Please try again.");
          await supabase
            .from('documents')
            .update({ processing_status: 'failed' })
            .eq('id', doc.id);
        } else {
          toast.success("Document re-submitted for processing");
        }
      } else {
        // Non-DocuClipper types use process-statement
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
      }
      
      fetchDocuments();
    } catch (err) {
      console.error("Retry error:", err);
      toast.error("Failed to retry processing");
    }
  };

  const isStuckProcessing = (doc: Document): boolean => {
    if (!doc.created_at) return false;
    const createdAt = new Date(doc.created_at).getTime();

    if (doc.processing_status === 'healing' || doc.processing_status === 'queued_for_healing') {
      return createdAt < Date.now() - 45 * 60 * 1000;
    }
    if (doc.processing_status === 'reprocessing') {
      return createdAt < Date.now() - 10 * 60 * 1000;
    }
    if (doc.processing_status !== 'processing') return false;
    return createdAt < Date.now() - 10 * 60 * 1000;
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
      case "healing":
        return <Badge variant="default" className="bg-purple-600"><Sparkles className="w-3 h-3 mr-1 animate-pulse" /> Self-Healing</Badge>;
      case "queued_for_healing":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Queued for Healing</Badge>;
      case "reprocessing":
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Reprocessing</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return parseLocalDate(dateStr).toLocaleDateString();
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

      <Tabs value={selectedType} onValueChange={setSelectedType} className="flex flex-col md:flex-row gap-4">
        {/* Mobile: Select dropdown */}
        {isMobile && (
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPE_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                      {docCountByType[item.value] ? ` (${docCountByType[item.value]})` : ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Desktop: Vertical grouped sidebar */}
        {!isMobile && (
          <ScrollArea className="w-64 shrink-0 border rounded-md">
            <nav className="p-2 space-y-3">
              {DOC_TYPE_GROUPS.map((group) => (
                <div key={group.label}>
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                    {group.label}
                  </h4>
                  <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-0.5">
                    {group.items.map((item) => (
                      <TabsTrigger
                        key={item.value}
                        value={item.value}
                        className="w-full justify-start text-xs px-2 py-1.5 rounded-sm gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                      >
                        <span className="truncate">{item.label}</span>
                        {isOptionalVerificationType(item.value) && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal opacity-70 shrink-0">
                            Verify
                          </Badge>
                        )}
                        {docCountByType[item.value] ? (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 ml-auto shrink-0">
                            {docCountByType[item.value]}
                          </Badge>
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              ))}
            </nav>
          </ScrollArea>
        )}

        {/* Right column: tab content */}
        <div className="flex-1 min-w-0">
        {DOCUMENT_TYPES.map((type) => (
          <TabsContent key={type.value} value={type.value} className="space-y-6 mt-0">
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

            {/* Financial Statement Validation Results */}
            {isOptionalVerificationType(type.value) && (
              validatingFinancialStatement === type.value ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center gap-3">
                      <Spinner className="w-8 h-8 text-primary" />
                      <p className="text-sm text-muted-foreground">Validating {type.label} against Trial Balance...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : financialValidationResults[type.value] ? (
                <FinancialStatementValidationCard 
                  result={financialValidationResults[type.value]!}
                  onDismiss={() => setFinancialValidationResults(prev => ({ ...prev, [type.value]: null }))}
                />
              ) : null
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

            {/* Payroll Insights Cards */}
            {type.value === "payroll" && payrollAnalysis.length > 0 && (
              <div className="space-y-4">
                {payrollAnalysis.map((item, i) => (
                  <PayrollInsightsCard
                    key={i}
                    analysisData={item.data}
                    documentName={item.docName}
                  />
                ))}
              </div>
            )}

            {/* General Ledger Insights Cards */}
            {type.value === "general_ledger" && (
              <div className="space-y-4">
                {glAnalysis.map((item, i) => (
                  <GeneralLedgerInsightsCard
                    key={i}
                    analysisData={item.data}
                    documentName={item.docName}
                  />
                ))}
                <AnalysisRunButton
                  projectId={projectId}
                  functionName="analyze-general-ledger"
                  resultDataType="general_ledger_analysis"
                  label="General Ledger"
                  hasDocuments={filteredDocs.length > 0}
                  hasAnalysis={glAnalysis.length > 0}
                />
              </div>
            )}

            {/* Journal Entry Insights Cards */}
            {type.value === "journal_entries" && (
              <div className="space-y-4">
                {jeAnalysis.map((item, i) => (
                  <JournalEntryInsightsCard
                    key={i}
                    analysisData={item.data}
                    documentName={item.docName}
                  />
                ))}
                <AnalysisRunButton
                  projectId={projectId}
                  functionName="analyze-journal-entries"
                  resultDataType="journal_entry_analysis"
                  label="Journal Entry"
                  hasDocuments={filteredDocs.length > 0}
                  hasAnalysis={jeAnalysis.length > 0}
                />
              </div>
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
                          : `Upload ${getFileTypeLabel(type.value)} for automatic parsing`
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
                      <Popover open={institutionOpen} onOpenChange={setInstitutionOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={institutionOpen}
                            className="w-full justify-between font-normal"
                          >
                            {selectedInstitution
                              ? INSTITUTION_GROUPS.flatMap(g => g.items).find(i => i.value === selectedInstitution)?.label ?? selectedInstitution
                              : "Select institution..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search institution..." />
                            <CommandList>
                              <CommandEmpty>No institution found.</CommandEmpty>
                              {INSTITUTION_GROUPS.map((group) => (
                                <CommandGroup key={group.label} heading={group.label}>
                                  {group.items.map((inst) => (
                                    <CommandItem
                                      key={inst.value}
                                      value={inst.label}
                                      onSelect={() => {
                                        setSelectedInstitution(inst.value);
                                        setInstitutionOpen(false);
                                      }}
                                    >
                                      <Check className={`mr-2 h-4 w-4 ${selectedInstitution === inst.value ? "opacity-100" : "opacity-0"}`} />
                                      {inst.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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

                {/* Supporting Documents description */}
                {type.value === "supporting_documents" && (
                  <>
                    <Alert className="border-accent/30 bg-accent/5">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Upload invoices, receipts, contracts, or other evidence to support your adjustments and verification.
                        These documents will be available to the AI verification engine as supporting context.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input
                        placeholder="e.g., Receipt for $15K personal expense reclassification"
                        value={docDescription}
                        onChange={(e) => setDocDescription(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Describe what this document supports to help with verification
                      </p>
                    </div>
                  </>
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
                ) : (() => {
                  const showInstitutionCols = filteredDocs.some(d =>
                    ['bank_statement', 'credit_card'].includes(d.account_type || '')
                  );
                  return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        {showInstitutionCols && <TableHead>Institution</TableHead>}
                        {showInstitutionCols && <TableHead>Account</TableHead>}
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
                          {showInstitutionCols && <TableCell>{doc.institution || "-"}</TableCell>}
                          {showInstitutionCols && <TableCell>{doc.account_label || "-"}</TableCell>}
                          <TableCell>
                            {doc.period_start && doc.period_end
                              ? `${formatDate(doc.period_start)} - ${formatDate(doc.period_end)}`
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.processing_status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isVerifiableType(doc.account_type || '') && doc.processing_status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => triggerFinancialValidation(doc.id, doc.account_type!)}
                                  disabled={validatingFinancialStatement === doc.account_type}
                                  className="text-xs gap-1"
                                >
                                  {validatingFinancialStatement === doc.account_type ? (
                                    <Spinner className="w-3 h-3" />
                                  ) : (
                                    <Scale className="w-3 h-3" />
                                  )}
                                  Validate
                                </Button>
                              )}
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
                  );
                })()}

                {/* Self-healing info alert */}
                {filteredDocs.some(doc => doc.processing_status === 'healing') && (
                  <Alert className="mt-4 border-purple-200 dark:border-purple-800">
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <AlertDescription>
                      <strong>AI Self-Healing Active:</strong>{' '}
                      Our system is automatically updating to support this document's format. 
                      This typically takes 5–15 minutes. The status will update automatically when complete.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
        </div>
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
