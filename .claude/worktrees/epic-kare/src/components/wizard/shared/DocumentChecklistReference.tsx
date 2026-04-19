import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  ClipboardList,
  AlertCircle,
  Minus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  getFilteredChecklist, 
  getItemsByTier, 
  TIER_CONFIG,
  isChecklistItemComplete,
  type DocumentTier,
  type ChecklistItem 
} from "@/lib/documentChecklist";

interface DocumentChecklistReferenceProps {
  projectId: string;
  inventoryEnabled?: boolean;
  currentDocType?: string | null;
  wizardData?: Record<string, unknown>;
  notApplicable?: Record<string, boolean>;
  onNavigate?: (phase: number, section: number, docType?: string) => void;
}

interface Document {
  id: string;
  account_type: string | null;
  processing_status: string | null;
}

export function DocumentChecklistReference({
  projectId,
  inventoryEnabled = false,
  currentDocType,
  wizardData = {},
  notApplicable = {},
  onNavigate,
}: DocumentChecklistReferenceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [processedDataTypes, setProcessedDataTypes] = useState<Set<string>>(new Set());
  const [qbSyncedDataTypes, setQbSyncedDataTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Get filtered checklist based on inventory setting
  const checklist = useMemo(
    () => getFilteredChecklist(inventoryEnabled),
    [inventoryEnabled]
  );

  // Fetch documents and processed_data types for status calculation
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [docsResult, pdResult] = await Promise.all([
          supabase
            .from("documents")
            .select("id, account_type, processing_status")
            .eq("project_id", projectId),
          supabase
            .from("processed_data")
            .select("data_type, source_type")
            .eq("project_id", projectId),
        ]);

        if (docsResult.error) throw docsResult.error;
        setDocuments(docsResult.data || []);

        if (!pdResult.error && pdResult.data) {
          setProcessedDataTypes(new Set(pdResult.data.map(r => r.data_type)));
          setQbSyncedDataTypes(new Set(
            pdResult.data
              .filter(r => r.source_type === 'quickbooks_api')
              .map(r => r.data_type)
          ));
        }
      } catch (error) {
        console.error("Error fetching checklist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to document changes
    const channel = supabase
      .channel(`checklist-docs-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Check if a checklist item is complete (uses shared logic)
  const isItemComplete = (item: ChecklistItem): boolean => {
    return isChecklistItemComplete(item, wizardData, documents, notApplicable, processedDataTypes);
  };

  // Check if item is marked as N/A
  const isItemNA = (item: ChecklistItem): boolean => {
    return notApplicable[item.id] || false;
  };

  // Check if item was synced from QuickBooks
  const getQBSyncInfo = (item: ChecklistItem): { synced: boolean; lastSyncDate?: string } => {
    // First check wizardData for sync metadata
    const sectionKey = item.checkWizardSection;
    if (sectionKey && wizardData[sectionKey]) {
      const sectionData = wizardData[sectionKey] as Record<string, unknown>;
      const synced = sectionData.syncSource === "quickbooks" || !!sectionData.lastSyncDate;
      if (synced) {
        return { synced: true, lastSyncDate: sectionData.lastSyncDate as string | undefined };
      }
    }
    
    // Fallback: check qbSyncedDataTypes (only actual QB API syncs, not file conversions)
    if (item.docType && qbSyncedDataTypes.has(item.docType)) {
      return { synced: true };
    }
    
    return { synced: false };
  };

  // Calculate tier stats
  const getTierStats = (tier: DocumentTier) => {
    const items = getItemsByTier(checklist, tier);
    const completed = items.filter(item => isItemComplete(item)).length;
    return { total: items.length, completed };
  };

  const requiredStats = getTierStats('required');
  const recommendedStats = getTierStats('recommended');
  const optionalStats = getTierStats('optional');

  // Check if current doc type matches an item
  const isCurrentItem = (item: ChecklistItem): boolean => {
    return currentDocType !== null && item.docType === currentDocType;
  };

  const renderTierSection = (tier: DocumentTier) => {
    const items = getItemsByTier(checklist, tier);
    const config = TIER_CONFIG[tier];
    const stats = getTierStats(tier);

    return (
      <div key={tier} className="space-y-1">
        <div className={cn("text-xs font-medium flex items-center gap-2", config.color)}>
          <span>{config.label.toUpperCase()}</span>
          <span className="text-muted-foreground">
            ({stats.completed}/{stats.total})
          </span>
        </div>
        <div className="space-y-0.5 pl-1">
          {items.map(item => {
            const complete = isItemComplete(item);
            const isNA = isItemNA(item);
            const isCurrent = isCurrentItem(item);
            const qbInfo = getQBSyncInfo(item);
            
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (onNavigate && item.sectionNav) {
                    onNavigate(item.sectionNav.phase, item.sectionNav.section, item.docType || undefined);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 text-sm py-0.5 px-2 rounded-sm transition-colors",
                  isCurrent && "bg-primary/10 font-medium",
                  !isCurrent && "hover:bg-muted/50",
                  onNavigate && item.sectionNav && "cursor-pointer"
                )}
              >
                {isNA ? (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : complete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                )}
                <span className={cn(
                  "truncate",
                  complete && !isNA && "text-muted-foreground",
                  isNA && "text-muted-foreground line-through"
                )}>
                  {item.label}
                </span>
                {qbInfo.synced && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0 ml-1"
                        >
                          QB
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">
                          {qbInfo.lastSyncDate 
                            ? `Synced from QuickBooks on ${format(new Date(qbInfo.lastSyncDate), "MMM d, yyyy 'at' h:mm a")}`
                            : "Synced from QuickBooks"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isCurrent && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                    Current
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Summary badges for collapsed view
  const renderSummaryBadges = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge 
        variant={requiredStats.completed === requiredStats.total ? "default" : "destructive"}
        className="text-xs"
      >
        {requiredStats.completed === requiredStats.total ? (
          <CheckCircle2 className="h-3 w-3 mr-1" />
        ) : (
          <AlertCircle className="h-3 w-3 mr-1" />
        )}
        Required: {requiredStats.completed}/{requiredStats.total}
      </Badge>
      <Badge 
        variant="secondary"
        className={cn(
          "text-xs",
          recommendedStats.completed === recommendedStats.total && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        )}
      >
        Recommended: {recommendedStats.completed}/{recommendedStats.total}
      </Badge>
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Optional: {optionalStats.completed}/{optionalStats.total}
      </Badge>
    </div>
  );

  if (loading) {
    return (
      <div className="border rounded-lg p-3 bg-muted/30 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg bg-card">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Document Checklist</span>
            </div>
            <div className="flex items-center gap-3">
              {!isOpen && renderSummaryBadges()}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t space-y-3">
            {renderSummaryBadges()}
            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              {renderTierSection('required')}
              {renderTierSection('recommended')}
              {renderTierSection('optional')}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
