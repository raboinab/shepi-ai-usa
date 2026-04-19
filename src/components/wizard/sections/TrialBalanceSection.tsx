import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { calculateBalanceCheck } from "@/lib/trialBalanceUtils";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, FileUp, Database, ChevronDown, Loader2, Info, CheckCircle2, AlertCircle, Sparkles, RefreshCw, X, Lock, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MultiPeriodTable } from "@/components/wizard/shared/MultiPeriodTable";
import { TrialBalanceAccount, createEmptyAccount, transformQbTrialBalanceData, mergeAccounts, crossReferenceWithCOA } from "@/lib/trialBalanceUtils";
import { Period } from "@/lib/periodUtils";
import { supabase } from "@/integrations/supabase/client";
import { isTBCacheIncomplete } from "@/lib/loadTrialBalanceFromProcessedData";
import { CoaAccount } from "@/lib/chartOfAccountsUtils";
import { CoreDataGuideBanner } from "@/components/wizard/shared/CoreDataGuideBanner";
import { DocumentChecklistReference } from "@/components/wizard/shared/DocumentChecklistReference";

interface TrialBalanceSectionProps {
  projectId: string;
  data: Record<string, unknown>;
  updateData: (data: Record<string, unknown>) => void;
  periods?: Period[];
  fiscalYearEnd?: number;
  coaAccounts?: CoaAccount[];
  onNavigate?: (phase: number, section: number) => void;
  onSave?: (overrides?: Record<string, unknown>) => void;
  wizardData?: Record<string, unknown>;
}

export const TrialBalanceSection = ({
  projectId,
  data,
  updateData,
  periods = [],
  fiscalYearEnd = 12,
  coaAccounts = [],
  onNavigate,
  onSave,
  wizardData = {},
}: TrialBalanceSectionProps) => {
  const accounts = (data.accounts as TrialBalanceAccount[]) || [];
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [processingDocIds, setProcessingDocIds] = useState<string[]>([]);
  const [showDismiss, setShowDismiss] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs to avoid stale closures in async callbacks
  const updateDataRef = useRef(updateData);
  useEffect(() => { updateDataRef.current = updateData; }, [updateData]);

  const accountsRef = useRef(accounts);
  useEffect(() => { accountsRef.current = accounts; }, [accounts]);

  // Check if COA was derived from GL (heuristic-based, prone to fsType errors)
  const [isGLDerivedCOA, setIsGLDerivedCOA] = useState(false);
  useEffect(() => {
    if (!projectId) return;
    supabase
      .from('processed_data')
      .select('id')
      .eq('project_id', projectId)
      .eq('data_type', 'chart_of_accounts')
      .eq('source_type', 'derived_from_gl')
      .limit(1)
      .then(({ data: records }) => {
        setIsGLDerivedCOA(!!(records && records.length > 0));
      });
  }, [projectId]);

  // Compute out-of-balance periods (only relevant for GL-derived COA)
  const outOfBalancePeriods = useMemo(() => {
    if (!isGLDerivedCOA || accounts.length === 0) return [];
    return periods
      .filter(p => !p.isStub)
      .filter(p => {
        const check = calculateBalanceCheck(accounts, p.id);
        return Math.abs(check.checkTotal) >= 0.01;
      });
  }, [isGLDerivedCOA, accounts, periods]);

  // Calculate match stats for COA cross-referencing
  const matchStats = useMemo(() => {
    if (!coaAccounts?.length || !accounts.length) return null;
    
    let matched = 0;
    let unmatched = 0;
    accounts.forEach(acc => {
      if ((acc as any)._matchedFromCOA === true) matched++;
      else if ((acc as any)._matchedFromCOA === false) unmatched++;
    });
    
    if (matched === 0 && unmatched === 0) return null;
    
    return { matched, unmatched, total: accounts.length };
  }, [accounts, coaAccounts]);

  const handleAccountsChange = (newAccounts: TrialBalanceAccount[]) => {
    updateData({ ...data, accounts: newAccounts });
  };

  const handleAddAccount = () => {
    const newAccount = createEmptyAccount();
    handleAccountsChange([...accounts, newAccount]);
  };

  // Extracted loader so it can be called from both auto-import and manual button
  const loadFromProcessedData = useCallback(async (): Promise<boolean> => {
    const regularPeriods = periods.filter(p => !p.isStub);
    if (regularPeriods.length === 0) {
      console.log('[TrialBalance] loadFromProcessedData skipped, no periods configured');
      return false;
    }

    console.log('[TrialBalance] loadFromProcessedData: querying processed_data...');

    const { data: processedDataList, error } = await supabase
      .from('processed_data')
      .select('*')
      .eq('project_id', projectId)
      .eq('data_type', 'trial_balance')
      .order('period_start', { ascending: true })
      .limit(1000000);

    if (error) {
      console.error('[TrialBalance] loadFromProcessedData error:', error);
      return false;
    }

    if (!processedDataList || processedDataList.length === 0) {
      console.log('[TrialBalance] loadFromProcessedData: no processed TB data found');
      return false;
    }

    console.log('[TrialBalance] loadFromProcessedData: found', processedDataList.length, 'processed TB records');

    let mergedAccounts: TrialBalanceAccount[] = [];

    for (const processedData of processedDataList) {
      if (processedData?.data) {
        const dataWithDate = {
          ...(processedData.data as object),
          reportDate: processedData.period_end || processedData.period_start
        };

        console.log('[TrialBalance] loadFromProcessedData processing period:', processedData.period_start, '→', processedData.period_end);

        const newAccounts = transformQbTrialBalanceData(dataWithDate as any, periods);
        if (newAccounts.length > 0) {
          mergedAccounts = mergeAccounts(mergedAccounts, newAccounts);
        }
      }
    }

    // Apply COA cross-referencing ONLY if not already applied at sync time
    const allMatched = mergedAccounts.every(acc => (acc as any)._matchedFromCOA === true);
    if (!allMatched && coaAccounts && coaAccounts.length > 0 && mergedAccounts.length > 0) {
      console.log('[TrialBalance] loadFromProcessedData: applying COA cross-reference');
      const { accounts: enriched } = crossReferenceWithCOA(mergedAccounts, coaAccounts);
      mergedAccounts = enriched;
    }

    if (mergedAccounts.length > 0) {
      console.log('[TrialBalance] loadFromProcessedData: loaded', mergedAccounts.length, 'accounts from', processedDataList.length, 'periods');
      updateDataRef.current({ accounts: mergedAccounts });

      // Count how many periods have any non-zero data
      const regularPeriodIds = regularPeriods.map(p => p.id || `${p.year}-${String(p.month).padStart(2, '0')}`);
      const populatedPeriods = new Set<string>();
      mergedAccounts.forEach(acc => {
        Object.keys(acc.monthlyValues || {}).forEach(pid => {
          if (acc.monthlyValues[pid] !== 0) populatedPeriods.add(pid);
        });
      });
      const populatedCount = populatedPeriods.size;

      if (populatedCount > 0 && populatedCount < regularPeriods.length) {
        toast({
          title: "Partial period coverage",
          description: `Data loaded for ${populatedCount} of ${regularPeriods.length} configured periods. Upload additional files to fill remaining periods.`,
        });
      } else {
        toast({
          title: "Trial Balance loaded",
          description: `Loaded ${mergedAccounts.length} accounts from ${processedDataList.length} period(s).`,
        });
      }
      return true;
    }

    console.warn('[TrialBalance] loadFromProcessedData: processed records exist but produced 0 usable accounts');
    toast({
      title: "Trial balance data issue",
      description: "A trial balance file was processed but contained no usable data. Try re-uploading or check the file format.",
      variant: "destructive",
    });
    return false;
  }, [projectId, periods, coaAccounts]);

  // Auto-import from processed_data on mount if accounts are empty or have partial coverage
  useEffect(() => {
    const shouldRebuild = accountsRef.current.length === 0 || isTBCacheIncomplete(accountsRef.current, periods);
    if (!shouldRebuild) {
      console.log('[TrialBalance] Auto-import skipped, already have', accountsRef.current.length, 'accounts with sufficient coverage');
      return;
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      const loaded = await loadFromProcessedData();
      if (!loaded && accountsRef.current.length === 0) {
        console.log('[TrialBalance] Auto-import: retrying in 3s...');
        retryTimer = setTimeout(async () => {
          if (accountsRef.current.length === 0) {
            await loadFromProcessedData();
          }
        }, 3000);
      }
    };

    run();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, periods.length, coaAccounts?.length]);

  // Subscribe to processed_data changes for realtime updates (multi-document)
  useEffect(() => {
    if (processingDocIds.length === 0) return;

    const completedDocs = new Set<string>();

    const channel = supabase
      .channel(`tb-processing-batch-${projectId}`)
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
          
          if (!processingDocIds.includes(docId) || completedDocs.has(docId)) return;
          
          completedDocs.add(docId);
          console.log('[TrialBalance] Received processed data for doc:', docId, `(${completedDocs.size}/${processingDocIds.length})`);
          
          if (processedData?.data) {
            let newAccounts = transformQbTrialBalanceData(processedData.data as any, periods);
            
            const allMatched = newAccounts.every(acc => (acc as any)._matchedFromCOA === true);
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
              description: `Processed ${completedDocs.size} trial balance file(s)`,
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

          if (processedData?.data) {
            let newAccounts = transformQbTrialBalanceData(processedData.data as any, periods);

            const allMatched = newAccounts.every(acc => (acc as any)._matchedFromCOA === true);
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
            description: `Processed ${completedDocs.size} trial balance file(s)`,
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
          console.log('[TrialBalance] Poll safety net: clearing stuck processing state');
          await loadFromProcessedData();
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
  }, [processingDocIds, periods, projectId, coaAccounts, loadFromProcessedData]);

  // Manual load handler
  const handleManualLoad = useCallback(async () => {
    setIsManualLoading(true);
    try {
      const loaded = await loadFromProcessedData();
      if (!loaded) {
        toast({
          title: "No trial balance found",
          description: "No processed trial balance data available yet. Upload or sync data first.",
        });
      }
    } finally {
      setIsManualLoading(false);
    }
  }, [loadFromProcessedData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileArray = Array.from(files);
    const uploadedDocIds: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of fileArray) {
        const filePath = `${user.id}/${projectId}/trial-balance/${Date.now()}-${file.name}`;
        
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
            category: 'trial_balance',
            account_type: 'trial_balance',
            processing_status: 'pending',
          })
          .select()
          .single();

        if (docError) throw docError;
        uploadedDocIds.push(docData.id);

        supabase.functions.invoke('process-quickbooks-file', {
          body: { documentId: docData.id }
        });
      }

      setProcessingDocIds(uploadedDocIds);
      
      toast({
        title: "Processing files",
        description: `Processing ${fileArray.length} trial balance file(s)...`,
      });

    } catch (error) {
      console.error('[TrialBalance] Upload error:', error);
      setIsUploading(false);
      setProcessingDocIds([]);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportFromDocuments = async () => {
    const regularPeriods = periods.filter(p => !p.isStub);
    if (regularPeriods.length === 0) {
      toast({
        variant: "destructive",
        title: "Periods not configured",
        description: "Please set and save Financial Periods in Project Setup first.",
      });
      return;
    }

    setIsImporting(true);

    try {
      const { data: processedDataList, error } = await supabase
        .from('processed_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('data_type', 'trial_balance')
        .order('created_at', { ascending: true })
        .limit(1000000);

      if (error) throw error;
      
      if (!processedDataList || processedDataList.length === 0) {
        toast({
          title: "No trial balance found",
          description: "Upload a trial balance file first in Document Upload or use the Upload File option.",
        });
        return;
      }

      let mergedAccounts = [...accountsRef.current];
      let importedCount = 0;
      
      for (const processedData of processedDataList) {
        if (processedData?.data) {
          const dataWithDate = {
            ...(processedData.data as object),
            reportDate: processedData.period_end || processedData.period_start
          };
          
          const newAccounts = transformQbTrialBalanceData(dataWithDate as any, periods);
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
            description: `Imported ${importedCount} file(s). ${stats.matched} accounts matched with COA, ${stats.unmatched} unmatched.`,
          });
        }
      } else if (importedCount > 0) {
        updateDataRef.current({ accounts: mergedAccounts });
        toast({
          title: "Import successful",
          description: `Imported ${importedCount} file(s). Upload Chart of Accounts first for auto-classification.`,
        });
      }
      
      if (importedCount === 0) {
        toast({
          title: "No accounts found",
          description: "The trial balance data could not be mapped to your configured periods.",
        });
      }

    } catch (error) {
      console.error('[TrialBalance] Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import trial balance",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const hasNoPeriods = periods.filter(p => !p.isStub).length === 0;
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
  const coaLocked = coaAccounts.length === 0 && !isQBUser;

  const handleDismissGuide = () => {
    onSave?.({
      wizard_data: {
        ...wizardData,
        settings: { ...settings, coreDataGuideComplete: true },
      },
    } as any);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Core Data Guide Banner */}
      <div className="mb-4">
        <CoreDataGuideBanner
          currentStep={2}
          onNavigate={(p, s) => onNavigate?.(p, s)}
          onDismiss={handleDismissGuide}
          isQBUser={isQBUser}
          hasCOA={coaAccounts.length > 0}
          hasTB={accounts.length > 0}
          visible={!coreDataGuideComplete && !!settings.onboardingComplete}
        />
      </div>

      {/* COA-First Gate */}
      {coaLocked ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Chart of Accounts Required</h3>
            <p className="text-muted-foreground text-sm">
              Upload or sync your Chart of Accounts first so Trial Balance accounts can be properly classified with the correct FS Type and Category.
            </p>
            <Button
              variant="default"
              className="gap-2"
              onClick={() => onNavigate?.(2, 1)}
            >
              Go to Chart of Accounts <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Trial Balance</h2>
          <p className="text-muted-foreground">
            Enter account data for each period to build your QoE analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {accounts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </Badge>
          )}
          {matchStats && matchStats.matched > 0 && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {matchStats.matched} matched from COA
            </Badge>
          )}
          {matchStats && matchStats.unmatched > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              {matchStats.unmatched} unmatched
            </Badge>
          )}
          {accounts.length === 0 && !isProcessing && !isImporting && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleManualLoad}
              disabled={isManualLoading}
            >
              {isManualLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Load from processed data
            </Button>
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
                Upload Files (Excel/PDF)
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
            accept=".xlsx,.xls,.pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* AI Assistant Education Banner */}
      {accounts.length > 0 && (
        <Alert className="mb-4 bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">AI-Powered Balance Verification</AlertTitle>
          <AlertDescription className="text-sm">
            The AI Assistant can verify your Trial Balance is balanced (BS + IS = 0) for all periods, 
            identify unusual monthly variances, and flag accounts not found in your Chart of Accounts. 
            Try asking: <strong>"Is my Trial Balance balanced for all periods?"</strong> or 
            <strong>"Which accounts have unusual monthly fluctuations?"</strong>
          </AlertDescription>
        </Alert>
      )}

      {(!coaAccounts || coaAccounts.length === 0) && accounts.length > 0 && (
        <Alert className="mb-4 bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">No Chart of Accounts found</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Upload your Chart of Accounts first for automatic account classification.
            Without it, you'll need to manually set FS Type and Category for each account.
          </AlertDescription>
        </Alert>
      )}

      {/* Out-of-balance alert — only for GL-derived COA */}
      {outOfBalancePeriods.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Trial Balance out of balance</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {outOfBalancePeriods.length} period{outOfBalancePeriods.length > 1 ? 's' : ''} ha{outOfBalancePeriods.length > 1 ? 've' : 's'} BS + IS ≠ 0.
              This likely means one or more accounts have the wrong FS Type (BS vs IS) from heuristic classification.
            </p>
            <p className="font-medium">To fix:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Correct the account category in the{' '}
                <Button variant="link" className="h-auto p-0 text-sm" onClick={() => onNavigate?.(2, 1)}>
                  Chart of Accounts
                </Button>
                {' '}— changes will carry over automatically
              </li>
              <li>Or edit the "FS" column directly in the table below</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}


      <div className="flex-1 min-h-0">
        {hasNoPeriods ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            <p className="mb-2">No periods configured yet.</p>
            <p className="text-sm">Go to <span className="font-medium">Company Info</span> to set up your analysis periods first.</p>
          </div>
        ) : (
          <MultiPeriodTable
            accounts={accounts}
            periods={periods}
            fiscalYearEnd={fiscalYearEnd}
            onAccountsChange={handleAccountsChange}
            onAddAccount={handleAddAccount}
            showMatchIndicators={coaAccounts && coaAccounts.length > 0}
          />
        )}
      </div>

      {/* Document Checklist */}
      <div className="mt-4">
        <DocumentChecklistReference
          projectId={projectId}
          wizardData={wizardData}
          onNavigate={(p, s, docType) => onNavigate?.(p, s)}
        />
      </div>
      </>
      )}
    </div>
  );
};
