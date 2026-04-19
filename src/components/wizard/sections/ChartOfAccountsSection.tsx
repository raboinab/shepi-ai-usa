import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FinancialTable } from "../shared/FinancialTable";
import { SummaryCard } from "../shared/SummaryCard";
import { FileSpreadsheet, Layers, BarChart3, AlertCircle, Upload, FileUp, Database, ChevronDown, Loader2, BookOpen, Sparkles, X, RefreshCw, MessageSquare, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CoaAccount, transformCoaData, mergeCoaAccounts, MergeResult } from "@/lib/chartOfAccountsUtils";
import { DocumentValidationDialog, ValidationResult } from "../shared/DocumentValidationDialog";
import { CoreDataGuideBanner } from "../shared/CoreDataGuideBanner";
import { DocumentChecklistReference } from "../shared/DocumentChecklistReference";



type CoaUploadType = 'chart_of_accounts';

interface ChartOfAccountsData {
  accounts: CoaAccount[];
}

interface ChartOfAccountsSectionProps {
  projectId: string;
  data: ChartOfAccountsData;
  updateData: (data: ChartOfAccountsData) => void;
  onAutoImport?: () => void;
  onNavigate?: (phase: number, section: number) => void;
  onOpenAssistant?: () => void;
  onSave?: (overrides?: Record<string, unknown>) => void;
  wizardData?: Record<string, unknown>;
}

const defaultData: ChartOfAccountsData = {
  accounts: [],
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
  { value: "Other Income", label: "Other Income/Expense" },
];

const TYPE_LABEL = "Chart of Accounts";

export const ChartOfAccountsSection = ({ projectId, data, updateData, onAutoImport, onNavigate, onOpenAssistant, onSave, wizardData = {} }: ChartOfAccountsSectionProps) => {
  const coaData = { ...defaultData, ...data };
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [processingDocIds, setProcessingDocIds] = useState<string[]>([]);
  const [showDismiss, setShowDismiss] = useState(false);
  const [derivedFromGL, setDerivedFromGL] = useState(false);
  const [derivedSourceCount, setDerivedSourceCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload dialog state
  const [selectedUploadType] = useState<CoaUploadType>('chart_of_accounts');
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Track external COA data (from Documents Hub GL uploads)
  const [pendingExternalCoa, setPendingExternalCoa] = useState<{
    accounts: CoaAccount[];
    source: string;
    documentId: string;
  } | null>(null);
  const [importedDocIds, setImportedDocIds] = useState<Set<string>>(new Set());

  const columns = [
    { key: "accountNumber", label: "Account #", type: "text" as const },
    { key: "accountName", label: "Account Name", type: "text" as const },
    { key: "fsType", label: "FS Type", type: "text" as const },
    { key: "category", label: "Category", type: "text" as const },
  ];

  const bsAccounts = coaData.accounts.filter((a) => a.fsType === "BS");
  const isAccounts = coaData.accounts.filter((a) => a.fsType === "IS");

  const categories = [...new Set(coaData.accounts.map((a) => a.category))];

  // Check for missing required categories
  const requiredCategories = ["Revenue", "COGS", "Operating Expenses", "Current Assets", "Current Liabilities", "Equity"];
  const missingCategories = requiredCategories.filter((cat) => !categories.includes(cat));

  // Subscribe to processed_data changes for realtime updates (internal uploads)
  useEffect(() => {
    if (processingDocIds.length === 0) return;

    const completedDocs = new Set<string>();
    let currentAccounts = coaData.accounts;
    let glDerivedCount = 0;
    const mergeStats = { added: 0, merged: 0, preserved: 0 };

    const channel = supabase
      .channel(`coa-processing-batch-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processed_data',
        },
        (payload) => {
          const processedData = payload.new;
          const docId = processedData.source_document_id;
          
          // Only process if this is one of our documents
          if (!processingDocIds.includes(docId) || completedDocs.has(docId)) return;
          
          completedDocs.add(docId);
          setImportedDocIds(prev => new Set([...prev, docId]));
          console.log('[ChartOfAccounts] Received processed data for doc:', docId, `(${completedDocs.size}/${processingDocIds.length})`);
          
          // Check if COA was derived from GL
          const wasDerivedFromGL = processedData.source_type === 'derived_from_gl';
          
          if (wasDerivedFromGL) {
            setDerivedFromGL(true);
            glDerivedCount++;
            setDerivedSourceCount(prev => prev + 1);
          }
          
          // Handle chart_of_accounts data type (either direct or derived)
          if (processedData?.data && processedData.data_type === 'chart_of_accounts') {
            const newAccounts = transformCoaData(processedData.data as any);
            if (newAccounts.length > 0) {
              const mergeResult = mergeCoaAccounts(currentAccounts, newAccounts);
              currentAccounts = mergeResult.accounts;
              mergeStats.added += mergeResult.stats.added;
              mergeStats.merged += mergeResult.stats.merged;
              mergeStats.preserved += mergeResult.stats.preserved;
              updateData({ ...coaData, accounts: currentAccounts });
            }
          }
          
          // When all documents are processed, clear the state
          if (completedDocs.size === processingDocIds.length) {
            setProcessingDocIds([]);
            setIsUploading(false);
            
            const fileWord = completedDocs.size === 1 ? 'file' : 'files';
            const statParts: string[] = [];
            if (mergeStats.added > 0) statParts.push(`+${mergeStats.added} new`);
            if (mergeStats.merged > 0) statParts.push(`${mergeStats.merged} updated`);
            if (mergeStats.preserved > 0) statParts.push(`${mergeStats.preserved} preserved`);
            const statsStr = statParts.length > 0 ? ` (${statParts.join(', ')})` : '';
            
            let toastMessage: string;
            if (glDerivedCount > 0) {
              toastMessage = `Derived from ${glDerivedCount} GL ${fileWord}. ${currentAccounts.length} total accounts${statsStr}.`;
            } else {
              toastMessage = `Processed ${completedDocs.size} COA ${fileWord}. ${currentAccounts.length} total accounts${statsStr}.`;
            }
            
            toast({
              title: glDerivedCount > 0 ? "COA Derived from GL" : "Import complete",
              description: toastMessage,
            });
          }
        }
      )
      .subscribe();

    // Catch-up: check if records already exist (race condition fix)
    const catchUp = async () => {
      const { data: existing } = await supabase
        .from('processed_data')
        .select('*')
        .in('source_document_id', processingDocIds)
        .eq('project_id', projectId)
        .limit(1000000);

      if (existing && existing.length > 0) {
        for (const processedData of existing) {
          const docId = processedData.source_document_id;
          if (!docId || completedDocs.has(docId)) continue;

          completedDocs.add(docId);
          setImportedDocIds(prev => new Set([...prev, docId]));

          const wasDerivedFromGL = processedData.source_type === 'derived_from_gl';
          if (wasDerivedFromGL) {
            setDerivedFromGL(true);
            glDerivedCount++;
            setDerivedSourceCount(prev => prev + 1);
          }

          if (processedData?.data && processedData.data_type === 'chart_of_accounts') {
            const newAccounts = transformCoaData(processedData.data as any);
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
          const fileWord = completedDocs.size === 1 ? 'file' : 'files';
          const statParts: string[] = [];
          if (mergeStats.added > 0) statParts.push(`+${mergeStats.added} new`);
          if (mergeStats.merged > 0) statParts.push(`${mergeStats.merged} updated`);
          if (mergeStats.preserved > 0) statParts.push(`${mergeStats.preserved} preserved`);
          const statsStr = statParts.length > 0 ? ` (${statParts.join(', ')})` : '';
          toast({
            title: glDerivedCount > 0 ? "COA Derived from GL" : "Import complete",
            description: glDerivedCount > 0
              ? `Derived from ${glDerivedCount} GL ${fileWord}. ${currentAccounts.length} total accounts${statsStr}.`
              : `Processed ${completedDocs.size} COA ${fileWord}. ${currentAccounts.length} total accounts${statsStr}.`,
          });
        }
      }
    };
    catchUp();

    // Poll safety net: check document status every 10s
    const pollInterval = setInterval(async () => {
      if (processingDocIds.length === 0) return;
      
      const { data: docs } = await supabase
        .from('documents')
        .select('id, processing_status')
        .in('id', processingDocIds);
      
      if (docs) {
        const allDone = docs.every(d => 
          d.processing_status === 'completed' || d.processing_status === 'failed'
        );
        if (allDone) {
          console.log('[ChartOfAccounts] Poll safety net: clearing stuck processing state');
          await loadFromProcessedDataRef.current();
          setProcessingDocIds([]);
          setIsUploading(false);
          clearInterval(pollInterval);
        }
      }
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [processingDocIds, projectId, selectedUploadType]);

  // Persistent subscription for external COA data (from Documents Hub GL uploads)
  useEffect(() => {
    const channel = supabase
      .channel(`coa-external-updates-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processed_data',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const processedData = payload.new as {
            data_type?: string;
            source_type?: string;
            source_document_id?: string;
            data?: unknown;
          };
          
          // Only interested in COA data
          if (processedData.data_type !== 'chart_of_accounts') return;
          
          const docId = processedData.source_document_id;
          
          // Skip if we uploaded this ourselves or already imported it
          if (!docId || processingDocIds.includes(docId) || importedDocIds.has(docId)) return;
          
          // Check if this is GL-derived COA
          const isFromGL = processedData.source_type === 'derived_from_gl';
          
          // Transform and store for user review
          const newAccounts = transformCoaData(processedData.data as any);
          if (newAccounts.length > 0) {
            setPendingExternalCoa({
              accounts: newAccounts,
              source: isFromGL ? 'General Ledger' : 'Document Upload',
              documentId: docId,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, processingDocIds, importedDocIds]);

  // Refs to avoid stale closures in auto-import
  const updateDataRef = useRef(updateData);
  const onAutoImportRef = useRef(onAutoImport);
  const loadFromProcessedDataRef = useRef<() => Promise<CoaAccount[]>>(async () => []);
  useEffect(() => { updateDataRef.current = updateData; }, [updateData]);
  useEffect(() => { onAutoImportRef.current = onAutoImport; }, [onAutoImport]);

  // Extracted loader so it can be called from effect and manual button
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const loadFromProcessedData = useCallback(async (): Promise<CoaAccount[]> => {
    setIsAutoLoading(true);
    try {
      const { data: processedDataList, error } = await supabase
        .from('processed_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_type', 'chart_of_accounts')
        .order('created_at', { ascending: true })
        .limit(1000000);

      if (error) {
        console.error('[ChartOfAccounts] Auto-import error:', error);
        return [];
      }

      if (!processedDataList || processedDataList.length === 0) {
        console.log('[ChartOfAccounts] Auto-import: no processed COA data found');
        return [];
      }

      console.log('[ChartOfAccounts] Auto-import: found', processedDataList.length, 'processed COA records');

      let mergedAccounts: CoaAccount[] = [];
      const importStats = { added: 0, merged: 0, preserved: 0 };
      const importedIds: string[] = [];

      for (const processedData of processedDataList) {
        if (processedData?.data) {
          const newAccounts = transformCoaData(processedData.data as any);
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
        console.log('[ChartOfAccounts] Auto-import: updating with', mergedAccounts.length, 'total accounts');
        // Use ref to avoid stale closure — pass only accounts, not stale coaData
        updateDataRef.current({ accounts: mergedAccounts });
        setImportedDocIds(new Set(importedIds));

        setTimeout(() => {
          onAutoImportRef.current?.();
        }, 100);

        const statParts: string[] = [];
        if (importStats.added > 0) statParts.push(`${importStats.added} accounts`);
        const statsStr = statParts.length > 0 ? statParts.join(', ') : `${mergedAccounts.length} accounts`;

        toast({
          title: "Chart of Accounts loaded",
          description: `Loaded ${statsStr} from processed data.`,
        });
      }

      return mergedAccounts;
    } finally {
      setIsAutoLoading(false);
    }
  }, [projectId]);

  // Keep ref in sync for timeout safety net
  useEffect(() => { loadFromProcessedDataRef.current = loadFromProcessedData; }, [loadFromProcessedData]);

  // Auto-import on mount with single retry after 3s (only if no accounts)
  const hasAccountsRef = useRef(coaData.accounts.length > 0);
  useEffect(() => { hasAccountsRef.current = coaData.accounts.length > 0; });

  useEffect(() => {
    if (hasAccountsRef.current) {
      console.log('[ChartOfAccounts] Auto-import skipped, already have accounts');
      return;
    }

    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      const accounts = await loadFromProcessedData();
      if (accounts.length === 0) {
        // Retry once after 3s in case file is still processing
        retryTimer = setTimeout(() => {
          loadFromProcessedData();
        }, 3000);
      }
    };

    run();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [projectId, loadFromProcessedData]);

  // Handle merging pending external COA
  const handleMergeExternalCoa = useCallback(() => {
    if (!pendingExternalCoa) return;
    
    const result = mergeCoaAccounts(coaData.accounts, pendingExternalCoa.accounts);
    updateData({ ...coaData, accounts: result.accounts });
    setImportedDocIds(prev => new Set([...prev, pendingExternalCoa.documentId]));
    setDerivedFromGL(true);
    setDerivedSourceCount(prev => prev + 1);
    setPendingExternalCoa(null);
    
    const statParts: string[] = [];
    if (result.stats.added > 0) statParts.push(`+${result.stats.added} new`);
    if (result.stats.merged > 0) statParts.push(`${result.stats.merged} updated`);
    if (result.stats.preserved > 0) statParts.push(`${result.stats.preserved} preserved`);
    const statsStr = statParts.length > 0 ? ` (${statParts.join(', ')})` : '';
    
    toast({
      title: "COA Updated",
      description: `${result.accounts.length} total accounts${statsStr}`,
    });
  }, [pendingExternalCoa, coaData, updateData]);

  const handleDismissExternalCoa = useCallback(() => {
    if (pendingExternalCoa) {
      setImportedDocIds(prev => new Set([...prev, pendingExternalCoa.documentId]));
    }
    setPendingExternalCoa(null);
  }, [pendingExternalCoa]);


  // Layer 2: Validate document with AI after file is selected
  const validateDocumentType = async (file: File, selectedType: CoaUploadType): Promise<ValidationResult | null> => {
    try {
      // Read file as base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      
      const { data, error } = await supabase.functions.invoke('validate-document-type', {
        body: {
          fileBase64: base64,
          selectedType,
          fileName: file.name,
        },
      });
      
      if (error) {
        console.warn('[ChartOfAccounts] Validation failed, proceeding anyway:', error);
        return null; // Fail open
      }
      
      return data as ValidationResult;
    } catch (err) {
      console.warn('[ChartOfAccounts] Validation error, proceeding anyway:', err);
      return null; // Fail open
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setPendingFiles(fileArray);

    // Layer 2: AI validation on first file
    const firstFile = fileArray[0];
    const validation = await validateDocumentType(firstFile, selectedUploadType);
    
    if (validation && !validation.isValid && validation.suggestedType) {
      // Show mismatch dialog
      setValidationResult(validation);
      setShowValidationDialog(true);
    } else {
      // Proceed with upload
      await processUpload(fileArray, selectedUploadType);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle validation dialog actions
  const handleValidationChangeType = async () => {
    // No longer supporting type switching - just proceed with upload
    if (pendingFiles.length > 0) {
      setShowValidationDialog(false);
      await processUpload(pendingFiles, 'chart_of_accounts');
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

  // Upload and process files
  const processUpload = async (files: File[], uploadType: CoaUploadType) => {
    setIsUploading(true);
    const uploadedDocIds: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const subfolder = 'chart-of-accounts';

      // Upload each file
      for (const file of files) {
        const filePath = `${user.id}/${projectId}/${subfolder}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert({
            project_id: projectId,
            user_id: user.id,
            name: file.name,
            file_path: filePath,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            category: uploadType,
            account_type: uploadType,
            processing_status: 'pending',
          })
          .select()
          .single();

        if (docError) throw docError;
        uploadedDocIds.push(docData.id);

        // Fire off processing (don't await)
        supabase.functions.invoke('process-quickbooks-file', {
          body: { documentId: docData.id }
        });
      }

      // Track all processing documents
      setProcessingDocIds(uploadedDocIds);
      
      toast({
        title: "Processing files",
        description: `Processing ${files.length} Chart of Accounts file(s)...`,
      });

    } catch (error) {
      console.error('[ChartOfAccounts] Upload error:', error);
      setIsUploading(false);
      setProcessingDocIds([]);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    }

    // Clear pending state
    setPendingFiles([]);
  };

  const handleImportFromDocuments = async () => {
    setIsImporting(true);

    try {
      // Query ALL processed_data for chart of accounts data
      const { data: processedDataList, error } = await supabase
        .from('processed_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_type', 'chart_of_accounts')
        .order('created_at', { ascending: true })
        .limit(1000000);

      if (error) throw error;
      
      if (!processedDataList || processedDataList.length === 0) {
        toast({
          title: "No chart of accounts found",
          description: "Upload a chart of accounts file first using the Upload File option.",
        });
        return;
      }

      // Merge all COA data
      let mergedAccounts = [...coaData.accounts];
      let importedCount = 0;
      const importStats = { added: 0, merged: 0, preserved: 0 };
      
      for (const processedData of processedDataList) {
        if (processedData?.data) {
          const newAccounts = transformCoaData(processedData.data as any);
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
        const statParts: string[] = [];
        if (importStats.added > 0) statParts.push(`+${importStats.added} new`);
        if (importStats.merged > 0) statParts.push(`${importStats.merged} updated`);
        if (importStats.preserved > 0) statParts.push(`${importStats.preserved} preserved`);
        const statsStr = statParts.length > 0 ? ` (${statParts.join(', ')})` : '';
        toast({
          title: "Import successful",
          description: `Imported from ${importedCount} document(s). ${mergedAccounts.length} total accounts${statsStr}.`,
        });
      } else {
        toast({
          title: "No accounts found",
          description: "The chart of accounts data could not be parsed.",
        });
      }

    } catch (error) {
      console.error('[ChartOfAccounts] Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import chart of accounts",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const isProcessing = isUploading || processingDocIds.length > 0;

  // Show dismiss button after 5 seconds of processing
  useEffect(() => {
    if (!isProcessing) {
      setShowDismiss(false);
      return;
    }
    const timer = setTimeout(() => setShowDismiss(true), 5000);
    return () => clearTimeout(timer);
  }, [isProcessing]);

  const handleDismissProcessing = useCallback(async () => {
    setProcessingDocIds([]);
    setIsUploading(false);
    setShowDismiss(false);
    await loadFromProcessedData();
  }, [loadFromProcessedData]);

  const isQBUser = (wizardData?.chartOfAccounts as Record<string, unknown>)?.syncSource === "quickbooks";
  const settings = (wizardData?.settings as Record<string, unknown>) || {};
  const coreDataGuideComplete = settings.coreDataGuideComplete === true;
  const coaReviewComplete = settings.coaReviewComplete === true;

  const handleDismissGuide = () => {
    onSave?.({
      wizard_data: {
        ...wizardData,
        settings: { ...settings, coreDataGuideComplete: true },
      },
    } as any);
  };

  const handleReviewComplete = () => {
    onSave?.({
      wizard_data: {
        ...wizardData,
        settings: { ...settings, coaReviewComplete: true },
      },
    } as any);
    onNavigate?.(2, 2);
  };

  return (
    <div className="space-y-6">
      {/* Core Data Guide Banner */}
      <CoreDataGuideBanner
        currentStep={1}
        onNavigate={(p, s) => onNavigate?.(p, s)}
        onDismiss={handleDismissGuide}
        isQBUser={isQBUser}
        hasCOA={coaData.accounts.length > 0}
        hasTB={!!((wizardData?.trialBalance as Record<string, unknown>)?.accounts as unknown[] || []).length}
        visible={!coreDataGuideComplete && !!settings.onboardingComplete}
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Chart of Accounts</h2>
          <p className="text-muted-foreground">Define the account structure for your trial balance</p>
        </div>
        <div className="flex items-center gap-3">
          {coaData.accounts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {coaData.accounts.length} {coaData.accounts.length === 1 ? 'account' : 'accounts'}
            </Badge>
          )}
          {missingCategories.length > 0 && coaData.accounts.length > 0 && (
            <Badge variant="outline" className="gap-1 text-xs">
              <AlertCircle className="w-3 h-3" />
              Missing: {missingCategories.slice(0, 2).join(", ")}{missingCategories.length > 2 ? '...' : ''}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={isProcessing || isImporting}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing {processingDocIds.length > 0 ? `(${processingDocIds.length})` : ''}...
                  </>
                ) : isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Import <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            {isProcessing && showDismiss && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismissProcessing} title="Dismiss processing">
                <X className="w-4 h-4" />
              </Button>
            )}
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2">
                <FileUp className="w-4 h-4" />
                Upload Chart of Accounts (Excel/CSV/PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportFromDocuments} className="gap-2">
                <Database className="w-4 h-4" />
                Import from Documents
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* AI Validation Dialog */}
      {validationResult && (
        <DocumentValidationDialog
          open={showValidationDialog}
          onOpenChange={setShowValidationDialog}
          fileName={pendingFiles[0]?.name || "Unknown file"}
          selectedType={selectedUploadType}
          selectedTypeLabel={TYPE_LABEL}
          validationResult={validationResult}
          suggestedTypeLabel={null}
          onChangeType={handleValidationChangeType}
          onUploadAnyway={handleValidationUploadAnyway}
          onCancel={handleValidationCancel}
        />
      )}

      {/* Post-COA AI Review Prompt */}
      {coaData.accounts.length > 0 && !coaReviewComplete && (
        <Alert className="bg-primary/5 border-primary/20">
          <MessageSquare className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Review Account Mappings</AlertTitle>
          <AlertDescription className="text-sm">
            <p className="mb-2">
              Your Chart of Accounts has been loaded with <strong>{coaData.accounts.length} accounts</strong>. 
              Open the AI Assistant to verify all accounts are mapped to the correct financial statement categories.
            </p>
            <p className="text-muted-foreground mb-3">
              Try asking: <em>"Are all my accounts mapped correctly?"</em> or <em>"Which accounts might be miscategorized?"</em>
            </p>
            <div className="flex items-center gap-2">
              {onOpenAssistant && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onOpenAssistant?.()}>
                  <Sparkles className="h-3.5 w-3.5" /> Open AI Assistant
                </Button>
              )}
              <Button size="sm" variant="default" className="gap-1.5" onClick={handleReviewComplete}>
                I've reviewed, continue <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Assistant Education Banner (shown after review is complete) */}
      {coaData.accounts.length > 0 && coaReviewComplete && (
        <Alert className="bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">AI-Powered Account Validation</AlertTitle>
          <AlertDescription className="text-sm">
            The AI Assistant can review your Chart of Accounts against QuickBooks mapping rules to identify 
            miscategorized accounts. Try asking: <strong>"Review my Chart of Accounts for mapping errors"</strong> or 
            <strong>"Which accounts might be miscategorized?"</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending External COA Alert (from Documents Hub GL uploads) */}
      {pendingExternalCoa && (
        <Alert className="bg-primary/5 border-primary/30">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="flex items-center gap-2">
            New COA Data Available
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {pendingExternalCoa.accounts.length} accounts
            </Badge>
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {pendingExternalCoa.accounts.length} accounts were derived from a {pendingExternalCoa.source} upload in the Documents Hub.
            </span>
            <div className="flex gap-2 ml-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDismissExternalCoa}
                className="gap-1"
              >
                <X className="h-3 w-3" />
                Dismiss
              </Button>
              <Button 
                size="sm"
                onClick={handleMergeExternalCoa}
                className="gap-1"
              >
                <Database className="h-3 w-3" />
                Merge {pendingExternalCoa.accounts.length} Accounts
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {derivedFromGL && coaData.accounts.length > 0 && (
        <Alert className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
            Derived from General Ledger
            {derivedSourceCount > 0 && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                {derivedSourceCount} source {derivedSourceCount === 1 ? 'file' : 'files'}
              </Badge>
            )}
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
              Review Required
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {coaData.accounts.length} accounts were extracted from your General Ledger file{derivedSourceCount > 1 ? 's' : ''}. 
            Please verify the FS Type (BS/IS) and Category classifications against your Balance Sheet and Profit & Loss statements.
          </AlertDescription>
        </Alert>
      )}


      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Accounts" value={coaData.accounts.length} icon={FileSpreadsheet} isCurrency={false} />
        <SummaryCard title="Balance Sheet" value={bsAccounts.length} icon={Layers} subtitle="accounts" isCurrency={false} />
        <SummaryCard title="Income Statement" value={isAccounts.length} icon={BarChart3} subtitle="accounts" isCurrency={false} />
        <SummaryCard title="Categories" value={categories.length} icon={Layers} subtitle="defined" isCurrency={false} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Account Mapping
            <div className="flex gap-2">
              <Badge variant="outline">BS = Balance Sheet</Badge>
              <Badge variant="outline">IS = Income Statement</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coaData.accounts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <p className="text-muted-foreground text-sm">No accounts loaded yet. Upload a file or load from existing processed data.</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isAutoLoading}
                onClick={() => loadFromProcessedData()}
              >
                {isAutoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Load from processed data
              </Button>
            </div>
          )}
          <FinancialTable
            columns={columns}
            data={coaData.accounts as unknown as Record<string, unknown>[]}
            onDataChange={(accounts) => {
              // Mark changed accounts as user-edited
              const updatedAccounts = (accounts as unknown as CoaAccount[]).map((acc) => {
                const original = coaData.accounts.find(o => o.id === acc.id);
                
                // Check if any field changed
                const wasEdited = original && (
                  original.accountNumber !== acc.accountNumber ||
                  original.accountName !== acc.accountName ||
                  original.fsType !== acc.fsType ||
                  original.category !== acc.category
                );
                
                return {
                  ...acc,
                  isUserEdited: acc.isUserEdited || wasEdited,
                };
              });
              
              updateData({ ...coaData, accounts: updatedAccounts });
            }}
            newRowTemplate={{ accountNumber: "", accountName: "", fsType: "IS", category: "" }}
          />
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>FS Type:</strong> Use "BS" for Balance Sheet accounts (assets, liabilities, equity) or "IS" for Income Statement accounts (revenue, expenses).
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Categories:</strong> {CATEGORY_OPTIONS.map((c) => c.label).join(", ")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Balance Sheet Accounts ({bsAccounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bsAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="font-mono text-sm">{account.accountNumber}</span>
                  <span className="text-sm flex-1 ml-3">
                    {account.accountName}
                    {account.isUserEdited && (
                      <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                        Edited
                      </Badge>
                    )}
                  </span>
                  <Badge variant="secondary" className="text-xs">{account.category}</Badge>
                </div>
              ))}
              {bsAccounts.length === 0 && (
                <p className="text-muted-foreground text-sm">No Balance Sheet accounts defined</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Statement Accounts ({isAccounts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="font-mono text-sm">{account.accountNumber}</span>
                  <span className="text-sm flex-1 ml-3">
                    {account.accountName}
                    {account.isUserEdited && (
                      <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                        Edited
                      </Badge>
                    )}
                  </span>
                  <Badge variant="secondary" className="text-xs">{account.category}</Badge>
                </div>
              ))}
              {isAccounts.length === 0 && (
                <p className="text-muted-foreground text-sm">No Income Statement accounts defined</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Checklist */}
      <DocumentChecklistReference
        projectId={projectId}
        wizardData={wizardData}
        onNavigate={(p, s, docType) => onNavigate?.(p, s)}
      />
    </div>
  );
};
