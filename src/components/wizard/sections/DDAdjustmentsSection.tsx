import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SummaryCard } from "../shared/SummaryCard";
import { ProofValidationBadge } from "../shared/ProofValidationBadge";
import { AttachProofDialog } from "../shared/AttachProofDialog";
import { VerifyAdjustmentDialog } from "../shared/VerifyAdjustmentDialog";
import { useAdjustmentProofs, PROOF_QUERY_KEY } from "@/hooks/useAdjustmentProofs";
import { FlaggedTransactionsSection } from "./FlaggedTransactionsSection";
import { DiscoveryProposalsSection } from "./DiscoveryProposalsSection";
import { useDiscoveryProposals } from "@/hooks/useDiscoveryProposals";
import { 
  Plus, 
  Trash2, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Paperclip, 
  RefreshCw,
  Search, 
  Sparkles, 
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Copy,
  AlertCircle,
  Filter,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FlaggedTransaction } from "@/hooks/useFlaggedTransactions";
import { AccountPicker, type CoaAccount } from "../shared/AccountPicker";
import { IntentSelector } from "../shared/IntentSelector";
import { PeriodValueGrid } from "../shared/PeriodValueGrid";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Period } from "@/lib/periodUtils";
import type { QoeLedgerAdjustment } from "@/types/qoeLedger";
import { createEmptyAdjustment } from "@/types/qoeLedger";
import {
  type QoeAdjustmentType,
  type LedgerIntent,
  TEMPLATES_BY_TYPE,
  computeSign,
  getTemplateById,
  isITDAAnchor,
  getProofHint,
} from "@/lib/qoeAdjustmentTaxonomy";

/* ══════════════════════════════════════════════
   Buffered text input – commits only on blur
   ══════════════════════════════════════════════ */
function BufferedInput({
  value,
  onCommit,
  placeholder,
  className,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onCommit(local); }}
      placeholder={placeholder}
      className={className}
    />
  );
}

function BufferedTextarea({
  value,
  onCommit,
  placeholder,
  rows,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <Textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== value) onCommit(local); }}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

// Block filter type
type BlockFilter = "ALL" | QoeAdjustmentType;

interface DDAdjustmentsData {
  adjustments: QoeLedgerAdjustment[];
}

interface TBAccount {
  accountNumber: string;
  accountName: string;
  fsType?: string;
  balances?: Record<string, number>;
  monthlyValues?: Record<string, number>;
  [key: string]: unknown;
}

interface DDAdjustmentsSectionProps {
  data: DDAdjustmentsData;
  updateData: (data: DDAdjustmentsData) => void;
  projectId?: string;
  periods?: Period[];
  fiscalYearEnd?: number;
  coaAccounts?: CoaAccount[];
  trialBalanceAccounts?: TBAccount[];
  onGuideContextChange?: (patch: Partial<import("@/lib/adjustmentsGuideContent").GuideContext>) => void;
  onOpenGuide?: () => void;
  isDemo?: boolean;
  mockProposals?: import("@/hooks/useDiscoveryProposals").AdjustmentProposal[];
}

// Map AI flag types to adjustment categories
const flagTypeToBlockMap: Record<string, QoeAdjustmentType> = {
  owner_compensation: "MA",
  related_party: "MA",
  non_recurring: "DD",
  discretionary: "DD",
  rent_adjustment: "MA",
  professional_fees: "DD",
  insurance: "DD",
  depreciation: "DD",
  interest: "PF",
};
const flagTypeToIntentMap: Record<string, LedgerIntent> = {
  owner_compensation: "normalize_down_expense",
  related_party: "remove_expense",
  non_recurring: "remove_expense",
  discretionary: "remove_expense",
  rent_adjustment: "normalize_down_expense",
  professional_fees: "remove_expense",
  insurance: "remove_expense",
  depreciation: "remove_expense",
  interest: "remove_expense",
};

export const DDAdjustmentsSection = ({ 
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
  mockProposals,
}: DDAdjustmentsSectionProps) => {
  // Runtime filter: strip any legacy ITDA adjustments that slipped through
  const rawAdjustments = data.adjustments || [];
  const adjustments = useMemo(() => {
    const clean = rawAdjustments.filter(
      (a) => !isITDAAnchor(a.linkedAccountName || "") && !isITDAAnchor(a.description || "")
    );
    return clean;
  }, [rawAdjustments]);

  // Auto-save if we stripped any ITDA items
  useEffect(() => {
    if (rawAdjustments.length > 0 && adjustments.length < rawAdjustments.length) {
      updateData({ adjustments });
    }
  }, [adjustments.length, rawAdjustments.length]);
  const [activeTab, setActiveTab] = useState<string>("manual");
  const { job, proposals, hasDiscoveryJobs, isRunning } = useDiscoveryProposals(projectId);
  const { proofMap, invalidate: invalidateProofs } = useAdjustmentProofs(projectId);

  // ── Guide context emissions ──
  const lastFocusRef = React.useRef<string | null>(null);
  const clearTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onGuideContextChange?.({
      sectionKey: "3-1",
      hasData: adjustments.length > 0,
      hasAIFlags: Boolean(projectId),
      mode: activeTab === "ai-discovery" ? "ai-discovery" : "ledger",
    });
  }, [adjustments.length, activeTab, projectId]);

  const emitFocus = (control: import("@/lib/adjustmentsGuideContent").FocusedControl) => {
    if (lastFocusRef.current === control) return;
    lastFocusRef.current = control;
    onGuideContextChange?.({ focusedControl: control });
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      lastFocusRef.current = null;
      onGuideContextChange?.({ focusedControl: undefined });
    }, 8000);
  };

  const [blockFilter, setBlockFilter] = useState<BlockFilter>("ALL");
  const [expandedAdjustments, setExpandedAdjustments] = useState<Set<string>>(new Set());
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyViewOnly, setVerifyViewOnly] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<QoeLedgerAdjustment | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  // Group adjustments by block type
  const adjustmentsByType = useMemo(() => ({
    MA: adjustments.filter(a => a.block === "MA"),
    DD: adjustments.filter(a => a.block === "DD"),
    PF: adjustments.filter(a => a.block === "PF"),
  }), [adjustments]);

  // Filtered adjustments based on block filter
  const filteredAdjustments = useMemo(() => {
    if (blockFilter === "ALL") return adjustments;
    return adjustments.filter(a => a.block === blockFilter);
  }, [adjustments, blockFilter]);

  // Calculate totals per block with sign applied
  const calculateBlockTotal = useCallback((blockAdjs: QoeLedgerAdjustment[]) => {
    return blockAdjs.reduce((sum, adj) => {
      const adjTotal = Object.values(adj.periodValues).reduce((s, v) => s + (v || 0), 0);
      const sign = computeSign(adj.intent);
      return sum + (adjTotal * sign);
    }, 0);
  }, []);

  const totals = useMemo(() => ({
    MA: calculateBlockTotal(adjustmentsByType.MA),
    DD: calculateBlockTotal(adjustmentsByType.DD),
    PF: calculateBlockTotal(adjustmentsByType.PF),
    total: calculateBlockTotal(adjustments),
  }), [adjustmentsByType, adjustments, calculateBlockTotal]);

  // CRUD operations
  const addAdjustment = useCallback((block: QoeAdjustmentType, templateId?: string) => {
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
    setExpandedAdjustments(prev => new Set([...prev, newAdj.id]));
  }, [adjustments, updateData]);

  const updateAdjustment = useCallback((id: string, updates: Partial<QoeLedgerAdjustment>) => {
    const newAdjustments = adjustments.map(adj =>
      adj.id === id ? { ...adj, ...updates } : adj
    );
    updateData({ adjustments: newAdjustments });
  }, [adjustments, updateData]);

  const deleteAdjustment = useCallback((id: string) => {
    updateData({ adjustments: adjustments.filter((adj) => adj.id !== id) });
    setExpandedAdjustments(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [adjustments, updateData]);

  const toggleExpanded = (id: string) => {
    setExpandedAdjustments(prev => {
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

  const openProofDialog = (adj: QoeLedgerAdjustment) => {
    setSelectedAdjustment(adj);
    setProofDialogOpen(true);
  };

  const openVerifyDialog = (adj: QoeLedgerAdjustment, viewOnly = false) => {
    setSelectedAdjustment(adj);
    setVerifyViewOnly(viewOnly);
    setVerifyDialogOpen(true);
  };

  // Handle converting AI-discovered transaction to an adjustment
  const handleConvertToAdjustment = (transaction: FlaggedTransaction) => {
    const block = flagTypeToBlockMap[transaction.flag_type] || "DD";
    const intent = flagTypeToIntentMap[transaction.flag_type] || "remove_expense";
    const currentPeriodId = periods.length > 0 ? periods[periods.length - 1].id : new Date().toISOString().slice(0, 7);
    
    const newAdj = createEmptyAdjustment(block);
    newAdj.description = transaction.description;
    newAdj.intent = intent;
    newAdj.linkedAccountNumber = transaction.account_name?.split(' ')[0] || '';
    newAdj.linkedAccountName = transaction.account_name;
    newAdj.periodValues = { [currentPeriodId]: Math.abs(transaction.amount) };
    newAdj.evidenceNotes = `AI-discovered: ${transaction.flag_reason}`;
    newAdj.sourceType = "ai";
    
    updateData({ adjustments: [...adjustments, newAdj] });
    setExpandedAdjustments(prev => new Set([...prev, newAdj.id]));
    setActiveTab("manual");
    setBlockFilter(block);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: "exceptZero",
    }).format(num);
  };

  const getBlockBadgeClass = (block: QoeAdjustmentType) => {
    switch (block) {
      case "MA": return "bg-primary/10 text-primary border-primary/20";
      case "DD": return "bg-secondary text-secondary-foreground border-secondary";
      case "PF": return "bg-accent text-accent-foreground border-accent";
    }
  };

  // Render adjustment row
  const renderAdjustmentRow = (adj: QoeLedgerAdjustment) => {
    const isExpanded = expandedAdjustments.has(adj.id);
    const adjTotal = Object.values(adj.periodValues).reduce((s, v) => s + (v || 0), 0);
    const signedTotal = adjTotal * computeSign(adj.intent);
    const hasAccount = !!adj.linkedAccountNumber;
    const accountInCoa = coaAccounts.some(
      a => a.accountNumber === adj.linkedAccountNumber || a.accountId === adj.linkedAccountNumber
    );

    return (
      <Card key={adj.id} className="overflow-hidden">
        {/* Collapsed header */}
        <div
          className={cn(
            "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
            isExpanded && "border-b"
          )}
          onClick={() => toggleExpanded(adj.id)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          
          <Badge variant="outline" className={cn("text-[10px]", getBlockBadgeClass(adj.block))}>
            {adj.block}
          </Badge>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">
                {adj.description || "Untitled adjustment"}
              </span>
              {adj.templateId && (
                <Badge variant="secondary" className="text-[10px]">Template</Badge>
              )}
              {adj.sourceType === "ai" && (
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  AI
                </Badge>
              )}
              {!hasAccount && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  No Account
                </Badge>
              )}
              {hasAccount && !accountInCoa && coaAccounts.length > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 border-destructive/50 text-destructive">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Unmapped
                </Badge>
              )}
              {(() => {
                const proofSet = proofMap.get(adj.id);
                if (!proofSet || proofSet.bestStatus === "pending") return null;
                const v = proofSet.verification;
                if (!v) return null;
                return (
                  <ProofValidationBadge
                    score={proofSet.bestScore}
                    status={proofSet.bestStatus}
                    keyFindings={v.key_findings}
                    redFlags={v.red_flags}
                    matchCount={v.matchCount}
                    contradictionCount={v.contradictionCount}
                    varianceAmount={v.varianceAmount}
                    onClick={(e?: React.MouseEvent) => {
                      e?.stopPropagation();
                      openVerifyDialog(adj, true);
                    }}
                  />
                );
              })()}
            </div>
            {adj.linkedAccountNumber && (
              <span className="text-xs text-muted-foreground">
                Account: {adj.linkedAccountNumber}
                {adj.linkedAccountName && ` - ${adj.linkedAccountName}`}
              </span>
            )}
          </div>

          <div className={cn(
            "text-sm font-mono font-medium",
            signedTotal > 0 ? "text-primary" : signedTotal < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {formatCurrency(signedTotal)}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              deleteAdjustment(adj.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>

        {/* Expanded content – uses buffered inputs */}
        {isExpanded && (
          <CardContent className="p-4 space-y-4">
            {/* Inline tip for new adjustments */}
            {!dismissedTips.has(adj.id) && !adj.evidenceNotes && adj.status === "proposed" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  💡 <span className="font-medium text-foreground">Tip:</span>{" "}
                  {getProofHint(adj.description).hint}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissedTips(prev => new Set([...prev, adj.id]));
                  }}
                >
                  Dismiss
                </Button>
              </div>
            )}
            {/* Description – buffered */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <BufferedInput
                value={adj.description}
                onCommit={(v) => updateAdjustment(adj.id, { description: v })}
                placeholder="Enter adjustment description..."
              />
            </div>

            {/* Block Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Type</label>
              <Select
                value={adj.block}
                onValueChange={(block: QoeAdjustmentType) => updateAdjustment(adj.id, { block })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MA">MA - Management Adjustments</SelectItem>
                  <SelectItem value="DD">DD - Due Diligence</SelectItem>
                  <SelectItem value="PF">PF - Pro Forma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Picker */}
            <div className="space-y-2" onPointerDown={() => emitFocus("tbAccount")}>
              <label className="text-sm font-medium">
                Trial Balance Account <span className="text-destructive">*</span>
              </label>
              <AccountPicker
                accounts={coaAccounts}
                value={adj.linkedAccountNumber}
                onChange={(accNum, accName) => {
                  if (isITDAAnchor(accName || "")) {
                    toast.error("Interest, Taxes, Depreciation, and Amortization are already excluded from EBITDA by definition. Adjustments to these accounts are not permitted.");
                    return;
                  }
                  updateAdjustment(adj.id, { 
                    linkedAccountNumber: accNum,
                    linkedAccountName: accName,
                  });
                }}
                placeholder="Select TB account..."
                required
              />
            </div>

            {/* Intent Selector */}
            <div className="space-y-2" onPointerDown={() => emitFocus("intent")}>
              <label className="text-sm font-medium">
                Adjustment Effect <span className="text-destructive">*</span>
              </label>
              <IntentSelector
                value={adj.intent}
                onChange={(intent) => updateAdjustment(adj.id, { intent })}
                compact
              />
            </div>

            {/* Period Values */}
            <div className="space-y-2" onPointerDown={() => emitFocus("periodValues")}>
              <label className="text-sm font-medium">Monthly Values</label>
              <PeriodValueGrid
                periods={periods}
                values={adj.periodValues}
                onChange={(periodValues) => updateAdjustment(adj.id, { periodValues })}
              />
            </div>

            {/* Evidence Notes – buffered */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Evidence / Notes</label>
              <BufferedTextarea
                value={adj.evidenceNotes || ""}
                onCommit={(v) => updateAdjustment(adj.id, { evidenceNotes: v })}
                placeholder="Add supporting documentation notes..."
                rows={2}
              />
            </div>

            {/* Status and Proof */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2" onPointerDown={() => emitFocus("status")}>
                <label className="text-sm font-medium">Status:</label>
                <Select
                  value={adj.status}
                  onValueChange={(status: "proposed" | "accepted" | "rejected") => 
                    updateAdjustment(adj.id, { status })
                  }
                >
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDismissedTips(prev => new Set([...prev, adj.id]));
                    openVerifyDialog(adj);
                  }}
                  onPointerDown={() => emitFocus("verify")}
                  className="gap-1.5"
                  disabled={!projectId}
                >
                  <Search className="w-3.5 h-3.5" />
                  Verify
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDismissedTips(prev => new Set([...prev, adj.id]));
                    openProofDialog(adj);
                  }}
                  onPointerDown={() => emitFocus("proof")}
                  className="gap-1.5"
                  disabled={!projectId}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Attach Proof
                </Button>
                <span className="text-xs text-muted-foreground">
                  ID: {adj.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  // Determine which block to use when adding
  const getDefaultBlock = (): QoeAdjustmentType => {
    if (blockFilter !== "ALL") return blockFilter;
    return "DD";
  };

  // Get templates for the current block filter or all
  const availableTemplates = useMemo(() => {
    if (blockFilter === "ALL") {
      return [...TEMPLATES_BY_TYPE.MA, ...TEMPLATES_BY_TYPE.DD, ...TEMPLATES_BY_TYPE.PF];
    }
    return TEMPLATES_BY_TYPE[blockFilter];
  }, [blockFilter]);

  // Summary stats
  const acceptedCount = adjustments.filter((adj) => adj.status === "accepted").length;
  const aiDiscoveredCount = adjustments.filter((adj) => adj.sourceType === "ai").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Due Diligence Adjustments</h2>
        <p className="text-muted-foreground">Track and manage all earnings adjustments with AI-powered discovery and proof validation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Management Adjustments"
          value={adjustmentsByType.MA.length}
          icon={TrendingUp}
          subtitle={formatCurrency(totals.MA)}
          isCurrency={false}
        />
        <SummaryCard
          title="Due Diligence Adjustments"
          value={adjustmentsByType.DD.length}
          icon={TrendingUp}
          subtitle={formatCurrency(totals.DD)}
          isCurrency={false}
        />
        <SummaryCard
          title="Pro Forma Adjustments"
          value={adjustmentsByType.PF.length}
          icon={TrendingDown}
          subtitle={formatCurrency(totals.PF)}
          isCurrency={false}
        />
        <SummaryCard
          title="Net Adjustment"
          value={formatCurrency(totals.total)}
          icon={FileText}
          subtitle={`${adjustments.length} total • ${acceptedCount} accepted`}
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); onGuideContextChange?.({ mode: v === "ai-discovery" ? "ai-discovery" : "ledger" }); }}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Adjustment Ledger
            {adjustments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {adjustments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai-discovery" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Discovery
            {(isRunning || proposals.length > 0 || hasDiscoveryJobs) && (
              <Badge variant="secondary" className="ml-1">
                {isRunning ? "…" : proposals.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <Card className="mb-4">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Adjustment Ledger</CardTitle>
                  {aiDiscoveredCount > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {aiDiscoveredCount} adjustment{aiDiscoveredCount > 1 ? 's' : ''} from AI Discovery
                    </p>
                  )}
                </div>
                
                {/* Filter chips */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <ToggleGroup 
                    type="single" 
                    value={blockFilter}
                    onValueChange={(value) => value && setBlockFilter(value as BlockFilter)}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="ALL" size="sm" className="text-xs">
                      All
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {adjustments.length}
                      </Badge>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="MA" size="sm" className="text-xs">
                      MA
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {adjustmentsByType.MA.length}
                      </Badge>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="DD" size="sm" className="text-xs">
                      DD
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {adjustmentsByType.DD.length}
                      </Badge>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="PF" size="sm" className="text-xs">
                      PF
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {adjustmentsByType.PF.length}
                      </Badge>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Add buttons */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <Button onClick={() => addAdjustment(getDefaultBlock())} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add {blockFilter === "ALL" ? "DD" : blockFilter} Adjustment
                </Button>

                {/* Quick Add by Account */}
                {coaAccounts.length > 0 && (
                  <Button variant="outline" onClick={() => setQuickAddOpen(true)} className="gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Add
                  </Button>
                )}
                
                <Select onValueChange={(templateId) => {
                  const template = getTemplateById(templateId);
                  if (template) addAdjustment(template.type, templateId);
                }}>
                  <SelectTrigger className="w-[220px]">
                    <Copy className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="From template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] py-0">{t.type}</Badge>
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="ml-auto text-sm">
                  <span className="text-muted-foreground">Filtered Total: </span>
                  <span className={cn(
                    "font-mono font-medium",
                    calculateBlockTotal(filteredAdjustments) > 0 ? "text-primary" : 
                    calculateBlockTotal(filteredAdjustments) < 0 ? "text-destructive" : ""
                  )}>
                    {formatCurrency(calculateBlockTotal(filteredAdjustments))}
                  </span>
                </div>
              </div>

              {/* Adjustment list */}
              {filteredAdjustments.length === 0 ? (
                <div>
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-center text-muted-foreground">
                    {blockFilter !== "ALL" 
                      ? `No ${blockFilter} adjustments yet`
                      : "No adjustments recorded yet"}
                  </p>
                  <p className="text-sm text-center text-muted-foreground mt-1">
                    Click "Add Adjustment" to begin, or use AI Discovery to find potential adjustments automatically
                  </p>
                  {onOpenGuide && (
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline mt-2 block mx-auto"
                      onClick={() => onOpenGuide()}
                    >
                      Not sure where to start? Open the guide →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAdjustments.map(renderAdjustmentRow)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-discovery" className="mt-6">
          {projectId ? (
            <DiscoveryProposalsSection
              key={`${projectId}:${job?.id ?? 'none'}:${proposals.length}:${hasDiscoveryJobs ? 'jobs' : 'empty'}`}
              projectId={projectId}
              isDemo={isDemo}
              mockProposals={isDemo ? mockProposals : undefined}
              onConvertToAdjustment={(adj) => {
                if (isITDAAnchor(adj.linkedAccountName || "") || isITDAAnchor(adj.description || "")) {
                  toast.error("Interest, Taxes, Depreciation, and Amortization are already excluded from EBITDA by definition. Adjustments to these accounts are not permitted.");
                  return;
                }
                updateData({ adjustments: [...adjustments, adj] });
                setExpandedAdjustments(prev => new Set([...prev, adj.id]));
                setActiveTab("manual");
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Save your project to enable AI-powered adjustment discovery</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Add by Account Dialog */}
      <QuickAddDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        coaAccounts={coaAccounts}
        trialBalanceAccounts={trialBalanceAccounts}
        periods={periods}
        fiscalYearEnd={fiscalYearEnd}
        defaultBlock={getDefaultBlock()}
        onAdd={(newAdj) => {
          updateData({ adjustments: [...adjustments, newAdj] });
          setExpandedAdjustments(prev => new Set([...prev, newAdj.id]));
        }}
      />

      {/* Attach Proof Dialog */}
      {selectedAdjustment && projectId && (
        <>
          <AttachProofDialog
            open={proofDialogOpen}
            onOpenChange={setProofDialogOpen}
            projectId={projectId}
            adjustmentId={selectedAdjustment.id}
            adjustment={{
              description: selectedAdjustment.description,
              category: selectedAdjustment.block,
              amount: Object.values(selectedAdjustment.periodValues).reduce((s, v) => s + (v || 0), 0),
              status: selectedAdjustment.status,
              notes: selectedAdjustment.evidenceNotes || ""
            }}
            onProofInvalidate={invalidateProofs}
          />
          <VerifyAdjustmentDialog
            open={verifyDialogOpen}
            onOpenChange={setVerifyDialogOpen}
            viewOnly={verifyViewOnly}
            projectId={projectId}
            adjustmentId={selectedAdjustment.id}
            jobId={job?.id}
            adjustment={{
              description: selectedAdjustment.description,
              category: selectedAdjustment.block,
              intent: selectedAdjustment.intent,
              linkedAccountName: selectedAdjustment.linkedAccountName,
              amount: Object.values(selectedAdjustment.periodValues).reduce((s, v) => s + (v || 0), 0),
              periodRange: periods.length
                ? `${periods[0].id} to ${periods[periods.length - 1].id}`
                : undefined,
              periodValues: selectedAdjustment.periodValues,
            }}
            onVerificationComplete={(action, notes, verifiedAmount) => {
              if (selectedAdjustment) {
                const updates: Partial<QoeLedgerAdjustment> = { status: action };
                if (notes) {
                  updates.evidenceNotes = selectedAdjustment.evidenceNotes
                    ? `${selectedAdjustment.evidenceNotes}\n${notes}`
                    : notes;
                }
                // Proportionally redistribute verified amount across periods
                if (verifiedAmount != null) {
                  const currentTotal = Object.values(selectedAdjustment.periodValues).reduce((s, v) => s + (v || 0), 0);
                  if (currentTotal !== 0) {
                    const ratio = verifiedAmount / currentTotal;
                    const newPeriodValues: Record<string, number> = {};
                    for (const [period, val] of Object.entries(selectedAdjustment.periodValues)) {
                      newPeriodValues[period] = Math.round(((val || 0) * ratio) * 100) / 100;
                    }
                    updates.periodValues = newPeriodValues;
                  }
                }
                updateAdjustment(selectedAdjustment.id, updates);
                // Refresh proof badges/variance after re-verify so UI reflects latest result
                invalidateProofs();
              }
            }}
            onAttachProof={() => {
              setVerifyDialogOpen(false);
              if (selectedAdjustment) {
                setDismissedTips(prev => new Set([...prev, selectedAdjustment.id]));
                openProofDialog(selectedAdjustment);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   Quick Add by Account Dialog
   ══════════════════════════════════════════════ */
function QuickAddDialog({
  open,
  onOpenChange,
  coaAccounts,
  trialBalanceAccounts = [],
  periods,
  fiscalYearEnd = 12,
  defaultBlock,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coaAccounts: CoaAccount[];
  trialBalanceAccounts?: TBAccount[];
  periods: Period[];
  fiscalYearEnd?: number;
  defaultBlock: QoeAdjustmentType;
  onAdd: (adj: QoeLedgerAdjustment) => void;
}) {
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");
  const [block, setBlock] = useState<QoeAdjustmentType>(defaultBlock);
  const [intent, setIntent] = useState<LedgerIntent>("remove_expense");
  const [totalAmount, setTotalAmount] = useState("");
  const [distribution, setDistribution] = useState<"even" | "last_period">("even");

  // TB lookup for selected account
  const tbMatch = useMemo(() => {
    if (!selectedAccount || trialBalanceAccounts.length === 0) return null;
    return trialBalanceAccounts.find(
      (a) => a.accountNumber === selectedAccount
          || a.accountName === selectedAccountName
    ) || null;
  }, [selectedAccount, selectedAccountName, trialBalanceAccounts]);

  const tbTotal = useMemo(() => {
    if (!tbMatch) return null;
    const balances = (tbMatch.monthlyValues || tbMatch.balances) as Record<string, number> | undefined;
    if (!balances) return null;
    const entries = Object.entries(balances).filter(([, v]) => typeof v === "number");
    if (entries.length === 0) return null;

    // For IS accounts, convert cumulative YTD → monthly activity before summing
    if (tbMatch.fsType === "IS") {
      const sortedKeys = entries.map(([k]) => k).sort();
      const fyStartMonth = (fiscalYearEnd % 12) + 1;
      const monthly: Record<string, number> = {};
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
      periodCount: entries.length,
    };
  }, [tbMatch, fiscalYearEnd]);

  // Reset when dialog opens
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

    // Distribute across periods
    const periodValues: Record<string, number> = {};
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Add Adjustment
          </DialogTitle>
          <DialogDescription>
            Select an account and enter a total — amounts will be distributed automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Account */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Trial Balance Account <span className="text-destructive">*</span>
            </label>
            <AccountPicker
              accounts={coaAccounts}
              value={selectedAccount}
              onChange={(accNum, accName) => {
                setSelectedAccount(accNum);
                setSelectedAccountName(accName || "");
              }}
              placeholder="Select account..."
              required
            />
            {/* TB total banner */}
            {selectedAccount && tbTotal !== null && (
              <div className="rounded-md bg-accent/50 border border-accent px-3 py-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  TB Total:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(tbTotal.sum)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    across {tbTotal.periodCount} {tbTotal.periodCount === 1 ? "period" : "periods"}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setTotalAmount(String(Math.abs(tbTotal.sum)))}
                >
                  Use this amount
                </Button>
              </div>
            )}
            {selectedAccount && tbTotal === null && trialBalanceAccounts.length > 0 && (
              <p className="text-xs text-muted-foreground">No trial balance data for this account</p>
            )}
          </div>

          {/* Block type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select value={block} onValueChange={(v) => setBlock(v as QoeAdjustmentType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MA">MA - Management</SelectItem>
                <SelectItem value="DD">DD - Due Diligence</SelectItem>
                <SelectItem value="PF">PF - Pro Forma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Intent */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Adjustment Effect <span className="text-destructive">*</span>
            </label>
            <IntentSelector value={intent} onChange={setIntent} compact />
          </div>

          {/* Amount + Distribution */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Total Amount <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="120000"
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Distribution</label>
              <Select value={distribution} onValueChange={(v) => setDistribution(v as "even" | "last_period")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="even">Even split ({periods.length} periods)</SelectItem>
                  <SelectItem value="last_period">Last period only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {totalAmount && parseFloat(totalAmount) !== 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="text-muted-foreground">EBITDA Impact: </span>
              <span className={cn(
                "font-mono font-semibold",
                signedPreview > 0 ? "text-primary" : "text-destructive"
              )}>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  signDisplay: "exceptZero",
                }).format(signedPreview)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAccount || !totalAmount || parseFloat(totalAmount) === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
