import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Split,
  UserX,
  History,
  Eye,
} from "lucide-react";
import type {
  TransferCase,
  ClassifiedTransaction,
  PeriodClassification,
  CaseStatus,
  EvidenceAtom,
} from "@/hooks/useTransferClassification";

type Category = "interbank" | "owner" | "operating";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawData: Record<string, PeriodClassification> | null;
  cases: TransferCase[];
  onSave: (updated: Record<string, PeriodClassification>) => Promise<void>;
}

interface AuditEntry {
  timestamp: number;
  action: string;
}

const SAMPLE_THRESHOLD = 20;

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function confidenceBadge(confidence: number) {
  if (confidence >= 0.8)
    return <Badge variant="default" className="text-[10px]">High</Badge>;
  if (confidence >= 0.6)
    return <Badge variant="secondary" className="text-[10px]">Medium</Badge>;
  return <Badge variant="destructive" className="text-[10px]">Low</Badge>;
}

const EVIDENCE_LABELS: Record<string, string> = {
  amount_match_exact: "Amount match",
  amount_match_near: "Near amount",
  date_within_days: "Date proximity",
  keyword_match: "Keyword",
  name_match: "Name match",
  negative_class: "Operating signal",
  cross_account: "Cross-account",
  round_dollar: "Round dollar",
  recurring_pattern: "Recurring",
  personal_app_keyword: "Personal app",
  llm_classification: "AI classified",
  llm_reasoning: "AI reasoning",
  llm_contradiction: "AI contradiction",
  business_vendor_downweight: "Business vendor",
};

function caseTypeIcon(caseType: TransferCase["case_type"]) {
  switch (caseType) {
    case "internal_transfer":
      return <Shield className="h-4 w-4 text-primary" />;
    case "owner_related":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "ambiguous":
      return <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  }
}

function statusLabel(status: CaseStatus) {
  if (status === "needs_analyst") return "Escalated";
  return status;
}

// ─── Evidence Popover ────────────────────────────────────────────────

function EvidenceTag({ atom }: { atom: EvidenceAtom }) {
  const label = EVIDENCE_LABELS[atom.type] || atom.type;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className="text-[10px] font-normal cursor-pointer hover:bg-accent"
        >
          {label}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-xs space-y-1" side="top">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground">Type: {atom.type}</p>
        {atom.weight != null && (
          <p className="text-muted-foreground">Weight: {atom.weight.toFixed(2)}</p>
        )}
        {(atom as any).value && (
          <p className="text-muted-foreground italic">"{(atom as any).value}"</p>
        )}
        {(atom as any).paired_with && (
          <p className="text-muted-foreground">Paired: {(atom as any).paired_with}</p>
        )}
        {(atom as any).llm_confidence != null && (
          <p className="text-muted-foreground">
            LLM confidence: {((atom as any).llm_confidence * 100).toFixed(0)}%
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Audit History ───────────────────────────────────────────────────

function AuditHistory({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1 ml-7">
        <History className="h-3 w-3" />
        History ({entries.length})
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-7 mt-1 space-y-0.5">
        {entries.map((e, i) => (
          <p key={i} className="text-[10px] text-muted-foreground">
            {e.action}
          </p>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Case Card ───────────────────────────────────────────────────────

function CaseCard({
  transferCase,
  onStatusChange,
  onTxnCategoryChange,
  onSplitSelected,
  auditHistory,
  exceptions,
}: {
  transferCase: TransferCase;
  onStatusChange: (caseId: string, status: CaseStatus) => void;
  onTxnCategoryChange: (txnId: string, newCategory: Category) => void;
  onSplitSelected: (caseId: string, selectedTxnIds: string[]) => void;
  auditHistory: AuditEntry[];
  exceptions: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState<Set<string>>(new Set());

  const txns = transferCase.transactions;
  const isLargeCase = txns.length >= SAMPLE_THRESHOLD;

  // Sample: representative (high confidence) + edge cases (low confidence)
  const sampledTxnIds = useMemo(() => {
    if (!isLargeCase) return null;
    const repIds = new Set(transferCase.representative_txn_ids || []);
    const edgeIds = new Set(transferCase.edge_case_txn_ids || []);
    return new Set([...repIds, ...edgeIds]);
  }, [isLargeCase, transferCase.representative_txn_ids, transferCase.edge_case_txn_ids]);

  const visibleTxns = useMemo(() => {
    if (!isLargeCase || showAll) return txns;
    return txns.filter((t) => sampledTxnIds?.has(t.id));
  }, [txns, isLargeCase, showAll, sampledTxnIds]);

  const toggleTxn = (txnId: string) => {
    setSelectedTxns((prev) => {
      const next = new Set(prev);
      if (next.has(txnId)) next.delete(txnId);
      else next.add(txnId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTxns.size === visibleTxns.length) {
      setSelectedTxns(new Set());
    } else {
      setSelectedTxns(new Set(visibleTxns.map((t) => t.id)));
    }
  };

  const handleSplit = () => {
    if (selectedTxns.size > 0 && selectedTxns.size < txns.length) {
      onSplitSelected(transferCase.case_id, [...selectedTxns]);
      setSelectedTxns(new Set());
    }
  };

  const exceptionCount = txns.filter((t) => exceptions.has(t.id)).length;

  return (
    <Card className="mb-2">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CollapsibleTrigger className="flex items-center gap-1 hover:text-primary">
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              {caseTypeIcon(transferCase.case_type)}
              <CardTitle className="text-sm font-medium truncate">
                {transferCase.reasoning_label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {confidenceBadge(transferCase.confidence)}
              <span className="text-xs font-mono text-muted-foreground">
                {formatAmount(transferCase.total_dollars)}
              </span>
              <span className="text-xs text-muted-foreground">
                {transferCase.transaction_count} txn
                {transferCase.transaction_count !== 1 ? "s" : ""}
              </span>
              {exceptionCount > 0 && (
                <Badge variant="outline" className="text-[10px] text-destructive border-destructive">
                  {exceptionCount} exception{exceptionCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          {/* Evidence tags with popovers */}
          <div className="flex items-center gap-1 mt-1 ml-7 flex-wrap">
            {transferCase.evidence_summary.slice(0, 4).map((ev, i) => (
              <EvidenceTag key={i} atom={ev} />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 mt-2 ml-7">
            {transferCase.status === "suggested" ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(transferCase.case_id, "accepted");
                  }}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(transferCase.case_id, "rejected");
                  }}
                >
                  <XCircle className="h-3 w-3 mr-1" /> Reject
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2 text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(transferCase.case_id, "needs_analyst");
                        }}
                      >
                        <UserX className="h-3 w-3 mr-1" /> Escalate
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Send to analyst — excludes from totals until resolved
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Badge
                  variant={
                    transferCase.status === "accepted"
                      ? "default"
                      : transferCase.status === "needs_analyst"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[10px]"
                >
                  {statusLabel(transferCase.status)}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 text-[10px] px-1 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(transferCase.case_id, "suggested");
                  }}
                >
                  Undo
                </Button>
              </div>
            )}
          </div>

          <AuditHistory entries={auditHistory} />
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-3">
            {/* Split bar */}
            {selectedTxns.size > 0 && selectedTxns.size < txns.length && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded bg-muted/50 border border-border">
                <span className="text-xs text-muted-foreground">
                  {selectedTxns.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs px-2"
                  onClick={handleSplit}
                >
                  <Split className="h-3 w-3 mr-1" /> Split into new case
                </Button>
              </div>
            )}

            {/* Sample toggle */}
            {isLargeCase && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 mb-2 text-muted-foreground"
                onClick={() => setShowAll(!showAll)}
              >
                <Eye className="h-3 w-3 mr-1" />
                {showAll
                  ? `Show sample (${sampledTxnIds?.size ?? 8} of ${txns.length})`
                  : `Expand all (${txns.length} transactions)`}
              </Button>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[32px]">
                    <Checkbox
                      checked={
                        selectedTxns.size === visibleTxns.length &&
                        visibleTxns.length > 0
                      }
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[80px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[90px] text-right">Amount</TableHead>
                  <TableHead className="w-[130px]">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTxns.map((txn) => {
                  const isException = exceptions.has(txn.id);
                  return (
                    <TableRow
                      key={txn.id}
                      className={isException ? "bg-destructive/5" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedTxns.has(txn.id)}
                          onCheckedChange={() => toggleTxn(txn.id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {txn.date || txn.id.split("_")[0]}
                      </TableCell>
                      <TableCell className="text-xs max-w-[350px] truncate">
                        {txn.memo || txn.id}
                        {isException && (
                          <Badge
                            variant="outline"
                            className="ml-1 text-[9px] text-destructive border-destructive"
                          >
                            exception
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {formatAmount(txn.amount ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={txn.category}
                          onValueChange={(v) =>
                            onTxnCategoryChange(txn.id, v as Category)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interbank">Interbank</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="operating">Operating</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────

export function TransferReviewDialog({
  open,
  onOpenChange,
  rawData,
  cases: initialCases,
  onSave,
}: Props) {
  const [caseStatuses, setCaseStatuses] = useState<Record<string, CaseStatus>>({});
  const [txnOverrides, setTxnOverrides] = useState<Record<string, Category>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("internal");
  const [splitCases, setSplitCases] = useState<TransferCase[]>([]);
  const [auditLog, setAuditLog] = useState<Record<string, AuditEntry[]>>({});

  // Re-init when dialog opens
  useMemo(() => {
    if (open) {
      setCaseStatuses({});
      setTxnOverrides({});
      setSplitCases([]);
      setAuditLog({});
    }
  }, [open]);

  const addAudit = useCallback((caseId: string, action: string) => {
    setAuditLog((prev) => ({
      ...prev,
      [caseId]: [...(prev[caseId] || []), { timestamp: Date.now(), action }],
    }));
  }, []);

  // Track exceptions: txns whose category was changed inside an accepted case
  const exceptions = useMemo(() => {
    const set = new Set<string>();
    for (const [txnId, newCat] of Object.entries(txnOverrides)) {
      // Find the case this txn belongs to
      const parentCase = [...initialCases, ...splitCases].find((c) =>
        c.transactions.some((t) => t.id === txnId)
      );
      if (!parentCase) continue;
      const parentStatus = caseStatuses[parentCase.case_id] || parentCase.status;
      if (parentStatus !== "accepted") continue;
      // If category differs from original, it's an exception
      const origTxn = parentCase.transactions.find((t) => t.id === txnId);
      if (origTxn && origTxn.category !== newCat) {
        set.add(txnId);
      }
    }
    return set;
  }, [txnOverrides, caseStatuses, initialCases, splitCases]);

  // Apply statuses to cases (including split cases)
  const cases = useMemo(() => {
    const allCases = [...initialCases, ...splitCases];
    return allCases.map((c) => ({
      ...c,
      status: caseStatuses[c.case_id] || c.status,
      transactions: c.transactions.map((t) => ({
        ...t,
        category: txnOverrides[t.id] || t.category,
      })),
    }));
  }, [initialCases, splitCases, caseStatuses, txnOverrides]);

  const hasV2Data = initialCases.some(
    (c) => c.case_type !== "excluded_operating" && c.evidence_summary.length > 0
  );

  // Group cases by tab
  const internalCases = cases.filter(
    (c) =>
      c.case_type === "internal_transfer" ||
      c.case_type === "external_transfer_like"
  );
  const ownerCases = cases.filter((c) => c.case_type === "owner_related");
  const ambiguousCases = cases.filter((c) => c.case_type === "ambiguous");
  const escalatedCases = cases.filter(
    (c) => (caseStatuses[c.case_id] || c.status) === "needs_analyst"
  );

  // Count changes
  const changeCount =
    Object.keys(caseStatuses).length +
    Object.keys(txnOverrides).length +
    splitCases.length;

  const handleStatusChange = (caseId: string, status: CaseStatus) => {
    const prevStatus = caseStatuses[caseId] || "suggested";
    setCaseStatuses((prev) => ({ ...prev, [caseId]: status }));
    const exCount = exceptions.size;
    const suffix = exCount > 0 ? ` with ${exCount} exception${exCount !== 1 ? "s" : ""}` : "";
    addAudit(caseId, `${prevStatus} → ${status}${suffix}`);
  };

  const handleAcceptAll = () => {
    const newStatuses: Record<string, CaseStatus> = { ...caseStatuses };
    for (const c of cases) {
      const currentStatus = caseStatuses[c.case_id] || c.status;
      if (currentStatus === "suggested") {
        newStatuses[c.case_id] = "accepted";
        addAudit(c.case_id, "suggested → accepted (bulk)");
      }
    }
    setCaseStatuses(newStatuses);
  };

  const handleTxnCategoryChange = (txnId: string, newCategory: Category) => {
    setTxnOverrides((prev) => ({ ...prev, [txnId]: newCategory }));
  };

  const suggestedCount = cases.filter(c => (caseStatuses[c.case_id] || c.status) === "suggested").length;

  const handleSplitSelected = (caseId: string, selectedTxnIds: string[]) => {
    const sourceCase = cases.find((c) => c.case_id === caseId);
    if (!sourceCase) return;

    const selectedSet = new Set(selectedTxnIds);
    const splitTxns = sourceCase.transactions.filter((t) => selectedSet.has(t.id));
    const remainingTxns = sourceCase.transactions.filter((t) => !selectedSet.has(t.id));

    if (splitTxns.length === 0 || remainingTxns.length === 0) return;

    const newCaseId = `${caseId}_split_${Date.now()}`;
    const newCase: TransferCase = {
      ...sourceCase,
      case_id: newCaseId,
      status: "suggested",
      transactions: splitTxns,
      transaction_count: splitTxns.length,
      total_dollars: splitTxns.reduce((s, t) => s + (t.amount ?? 0), 0),
      reasoning_label: `Split from: ${sourceCase.reasoning_label}`,
      representative_txn_ids: splitTxns.slice(0, 5).map((t) => t.id),
      edge_case_txn_ids: splitTxns.slice(-3).map((t) => t.id),
    };

    // Update the original case's transactions by removing split ones
    // We store the new case and rely on the merge logic
    setSplitCases((prev) => {
      // Remove the split txns from the original via override
      const updatedOriginal: TransferCase = {
        ...sourceCase,
        transactions: remainingTxns,
        transaction_count: remainingTxns.length,
        total_dollars: remainingTxns.reduce((s, t) => s + (t.amount ?? 0), 0),
      };
      // Replace original if already in splits, else add both
      const withoutOld = prev.filter((c) => c.case_id !== caseId);
      return [...withoutOld, updatedOriginal, newCase];
    });

    addAudit(caseId, `Split ${splitTxns.length} txn(s) into new case`);
    addAudit(newCaseId, `Created from split of ${caseId}`);
  };

  const handleSave = async () => {
    if (!rawData) return;
    setIsSaving(true);
    try {
      const updated: Record<string, PeriodClassification> = {};

      for (const c of cases) {
        for (const t of c.transactions) {
          const effectiveCategory = txnOverrides[t.id] || t.category;
          // Rejected & needs_analyst → force operating
          const caseStatus = caseStatuses[c.case_id] || c.status;
          const finalCategory =
            caseStatus === "rejected" || caseStatus === "needs_analyst"
              ? "operating"
              : exceptions.has(t.id)
                ? effectiveCategory // exception: use overridden value (excluded from case aggregate)
                : effectiveCategory;

          const parts = t.id.split("_");
          const periodKey = parts.slice(0, -2).join("_") || "unknown";

          if (!updated[periodKey]) {
            updated[periodKey] = { interbank: 0, owner: 0, transactions: [] };
          }
          const p = updated[periodKey];
          p.transactions.push({ ...t, category: finalCategory });
          if (finalCategory === "interbank") p.interbank += t.amount ?? 0;
          else if (finalCategory === "owner") p.owner += t.amount ?? 0;
        }
      }

      // Persist case statuses in _meta so they survive reload
      const existingMeta = (rawData as any)?._meta ?? {};
      const mergedStatuses: Record<string, CaseStatus> = { ...(existingMeta.caseStatuses ?? {}) };
      for (const c of cases) {
        const status = caseStatuses[c.case_id] || c.status;
        if (status !== "suggested") {
          mergedStatuses[c.case_id] = status;
        } else {
          delete mergedStatuses[c.case_id];
        }
      }
      (updated as any)._meta = { ...existingMeta, caseStatuses: mergedStatuses };

      // Preserve other underscore-prefixed keys (_delta_reconciliation, _cash_to_accrual, etc.)
      for (const [key, val] of Object.entries(rawData)) {
        if (key.startsWith("_") && key !== "_meta") {
          (updated as any)[key] = val;
        }
      }

      await onSave(updated);
      onOpenChange(false);
      
      // Success toast
      const { toast } = await import("@/hooks/use-toast");
      toast({ title: "Classifications saved", description: `${changeCount} change${changeCount !== 1 ? "s" : ""} applied successfully.` });
    } catch (err) {
      console.error("Failed to save classifications:", err);
      const { toast } = await import("@/hooks/use-toast");
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not save classifications.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasV2Data && initialCases.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Transfer Classifications</DialogTitle>
            <DialogDescription>
              No classified transactions to review. Run classification first.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const renderCaseList = (list: TransferCase[], emptyMsg: string) =>
    list.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center py-8">
        {emptyMsg}
      </p>
    ) : (
      list.map((c) => (
        <CaseCard
          key={c.case_id}
          transferCase={c}
          onStatusChange={handleStatusChange}
          onTxnCategoryChange={handleTxnCategoryChange}
          onSplitSelected={handleSplitSelected}
          auditHistory={auditLog[c.case_id] || []}
          exceptions={exceptions}
        />
      ))
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Transfer Classifications</DialogTitle>
          <DialogDescription>
            Review AI-classified transfer groups. Accept or reject each case —
            only accepted classifications flow into Proof of Cash totals.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="w-full justify-start">
            <TabsTrigger value="internal">
              Internal ({internalCases.length})
            </TabsTrigger>
            <TabsTrigger value="owner">
              Owner ({ownerCases.length})
            </TabsTrigger>
            <TabsTrigger value="ambiguous">
              Needs Review ({ambiguousCases.length})
            </TabsTrigger>
            {escalatedCases.length > 0 && (
              <TabsTrigger value="escalated">
                Escalated ({escalatedCases.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent
            value="internal"
            className="flex-1 min-h-0 overflow-auto mt-2"
          >
            {renderCaseList(internalCases, "No internal transfer cases detected.")}
          </TabsContent>

          <TabsContent
            value="owner"
            className="flex-1 min-h-0 overflow-auto mt-2"
          >
            {renderCaseList(ownerCases, "No owner-related cases detected.")}
          </TabsContent>

          <TabsContent
            value="ambiguous"
            className="flex-1 min-h-0 overflow-auto mt-2"
          >
            {renderCaseList(ambiguousCases, "No ambiguous cases to review.")}
          </TabsContent>

          {escalatedCases.length > 0 && (
            <TabsContent
              value="escalated"
              className="flex-1 min-h-0 overflow-auto mt-2"
            >
              {renderCaseList(escalatedCases, "No escalated cases.")}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {changeCount > 0
              ? `${changeCount} change${changeCount > 1 ? "s" : ""} pending`
              : "No changes"}
          </span>
          <div className="flex gap-2">
            {suggestedCount > 0 && (
              <Button variant="secondary" size="sm" onClick={handleAcceptAll}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Accept All ({suggestedCount})
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || changeCount === 0}
            >
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-3 w-3" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
