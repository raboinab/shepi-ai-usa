import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INTENT_TO_SIGN } from "@/lib/qoeAdjustmentTaxonomy";
import type { LedgerIntent } from "@/lib/qoeAdjustmentTaxonomy";
import {
  useDiscoveryProposals,
  type AdjustmentProposal,
  type ProposalEvidence,
} from "@/hooks/useDiscoveryProposals";
import type { QoeLedgerAdjustment } from "@/types/qoeLedger";
import { ProposalDetailCard } from "./discovery/ProposalDetailCard";

interface DiscoveryProposalsSectionProps {
  projectId: string;
  onConvertToAdjustment: (adj: QoeLedgerAdjustment) => void;
  isDemo?: boolean;
  mockProposals?: AdjustmentProposal[];
}

// ── Badge helpers ──

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    normal: "bg-primary/10 text-primary border-primary/20",
    low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] capitalize", styles[priority] || styles.normal)}>
      {priority}
    </Badge>
  );
}

function StrengthBadge({ strength }: { strength: string }) {
  const styles: Record<string, string> = {
    strong: "bg-green-500/10 text-green-600 border-green-500/20",
    moderate: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    weak: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] capitalize", styles[strength] || styles.moderate)}>
      <Shield className="w-2.5 h-2.5 mr-1" />
      {strength}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-primary/10 text-primary",
    triaged: "bg-primary/10 text-primary",
    needs_review: "bg-yellow-500/10 text-yellow-600",
    accepted: "bg-green-500/10 text-green-600",
    accepted_with_edits: "bg-green-500/10 text-green-600",
    rejected: "bg-destructive/10 text-destructive",
    deferred: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("text-[10px] capitalize", styles[status] || "")}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

const formatCurrency = (num: number | null) => {
  if (num == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ── EBITDA direction helpers ──

type GroupMode = "direction" | "strength" | "block";

function getProposalSign(p: AdjustmentProposal): number {
  // Check support_json.display.impact_type first (backend Phase 2)
  const display = (p.support_json as any)?.display;
  if (display?.impact_type === "increase_ebitda") return 1;
  if (display?.impact_type === "decrease_ebitda") return -1;
  if (display?.impact_type === "neutral_flag") return 0;
  // Fall back to intent
  const intent = (p.intent as LedgerIntent) || "other";
  return INTENT_TO_SIGN[intent] ?? 0;
}

function DirectionIndicator({ proposal }: { proposal: AdjustmentProposal }) {
  const sign = getProposalSign(proposal);
  if (sign === 0) return <Flag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  if (sign > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-600 shrink-0" />;
  return <TrendingDown className="h-3.5 w-3.5 text-yellow-600 shrink-0" />;
}

// ── Main Component ──

export function DiscoveryProposalsSection({
  projectId,
  onConvertToAdjustment,
  isDemo,
  mockProposals,
}: DiscoveryProposalsSectionProps) {
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
    getProposalDetail,
  } = useDiscoveryProposals(projectId);

  // Use mock proposals in demo mode
  const proposals = isDemo && mockProposals ? mockProposals : hookProposals;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [evidenceMap, setEvidenceMap] = useState<Record<string, ProposalEvidence[]>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<AdjustmentProposal | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("direction");

  // ── Compute EBITDA bridge stats ──
  const bridgeStats = useMemo(() => {
    // Prefer backend bridge summary if available (Phase 3)
    const detectorSummary = job?.detector_summary as any;
    const bridge = detectorSummary?.ebitda_bridge ?? detectorSummary;
    if (bridge?.add_backs_total != null) {
      return {
        addBacks: bridge.add_backs_total as number,
        haircuts: bridge.haircuts_total as number,
        net: bridge.net_ebitda_impact as number,
        flagCount: detectorSummary.flag_count as number,
        fromBackend: true,
      };
    }
    // Client-side computation
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

  // ── Grouping logic ──
  const grouped = useMemo(() => {
    if (groupMode === "strength") {
      return {
        groups: [
          { label: "Strong Evidence", items: proposals.filter(p => p.evidence_strength === "strong") },
          { label: "Moderate Evidence", items: proposals.filter(p => p.evidence_strength === "moderate") },
          { label: "Weak Evidence", items: proposals.filter(p => p.evidence_strength === "weak") },
        ],
      };
    }
    if (groupMode === "block") {
      return {
        groups: [
          { label: "Management Adjustments", items: proposals.filter(p => p.block === "MA") },
          { label: "Due Diligence Adjustments", items: proposals.filter(p => p.block === "DD") },
          { label: "Pro Forma Adjustments", items: proposals.filter(p => p.block === "PF") },
        ],
      };
    }
    // Default: direction
    return {
      groups: [
        { label: "Add-Backs (↑ EBITDA)", items: proposals.filter(p => getProposalSign(p) > 0) },
        { label: "Haircuts (↓ EBITDA)", items: proposals.filter(p => getProposalSign(p) < 0) },
        { label: "Flags for Review", items: proposals.filter(p => getProposalSign(p) === 0) },
      ],
    };
  }, [proposals, groupMode]);

  // Fetch evidence for a proposal if not already cached
  const fetchEvidence = async (proposalId: string) => {
    if (evidenceMap[proposalId]) return;
    if (isDemo) {
      setEvidenceMap((prev) => ({ ...prev, [proposalId]: [] }));
      return;
    }
    const detail = await getProposalDetail(proposalId);
    setEvidenceMap((prev) => ({ ...prev, [proposalId]: detail.evidence }));
  };

  // Toggle expand and fetch evidence
  const handleToggle = async (proposalId: string) => {
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

  // Expand / Collapse all
  const allExpanded = proposals.length > 0 && expandedIds.size === proposals.length;
  const handleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      const allIds = new Set(proposals.map((p) => p.id));
      setExpandedIds(allIds);
      // Batch-fetch evidence for any not yet loaded
      proposals.forEach((p) => fetchEvidence(p.id));
    }
  };

  // Accept
  const handleAccept = async (proposal: AdjustmentProposal) => {
    if (isDemo) {
      toast.info("Preview mode", { description: "Sign up to accept proposals on a real project." });
      return;
    }
    const adj = await acceptProposal(proposal.id);
    if (adj) onConvertToAdjustment(adj);
  };

  // Accept with edits
  const openEditDialog = (proposal: AdjustmentProposal) => {
    setEditingProposal(proposal);
    setEditAmount(String(proposal.proposed_amount ?? 0));
    setEditNotes("");
    setEditDialogOpen(true);
  };

  const handleAcceptWithEdits = async () => {
    if (!editingProposal) return;
    const adj = await acceptProposal(editingProposal.id, {
      edited_amount: parseFloat(editAmount) || undefined,
      reviewer_notes: editNotes || undefined,
    });
    if (adj) {
      const editedAmt = parseFloat(editAmount);
      if (!isNaN(editedAmt) && editedAmt !== editingProposal.proposed_amount) {
        adj.periodValues = { ...adj.periodValues };
        const periods = Object.keys(adj.periodValues);
        if (periods.length > 0) {
          const perPeriod = editedAmt / periods.length;
          periods.forEach((p) => (adj.periodValues[p] = perPeriod));
        }
      }
      onConvertToAdjustment(adj);
    }
    setEditDialogOpen(false);
  };

  // Reject
  const openRejectDialog = (proposalId: string) => {
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
    await rejectProposal(rejectingId, rejectNotes || undefined);
    setRejectDialogOpen(false);
  };

  // ── Render ──

  const renderProposalCard = (proposal: AdjustmentProposal) => {
    const isExpanded = expandedIds.has(proposal.id);
    const evidence = evidenceMap[proposal.id] ?? [];
    const isActioned = ["accepted", "accepted_with_edits", "rejected", "deferred"].includes(
      proposal.status
    );
    const sign = getProposalSign(proposal);

    return (
      <Card key={proposal.id} className={cn("overflow-hidden", isActioned && "opacity-60")}>
        <div
          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleToggle(proposal.id)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}

          <PriorityBadge priority={proposal.review_priority} />
          <StrengthBadge strength={proposal.evidence_strength} />

          <div className="flex-1 min-w-0">
            <span className="font-medium truncate block">{proposal.title}</span>
            {proposal.linked_account_name && (
              <span className="text-xs text-muted-foreground">
                {proposal.linked_account_number} — {proposal.linked_account_name}
              </span>
            )}
          </div>

          <DirectionIndicator proposal={proposal} />
          <div className={cn(
            "text-sm font-mono font-medium",
            sign > 0 && "text-green-600",
            sign < 0 && "text-yellow-600",
            sign === 0 && "text-muted-foreground",
          )}>
            {sign > 0 && "+"}
            {sign === 0 ? "—" : formatCurrency(proposal.proposed_amount)}
          </div>

          <StatusBadge status={proposal.status} />
        </div>

        {isExpanded && (
          <ProposalDetailCard
            proposal={proposal}
            evidence={evidence}
            onAccept={() => handleAccept(proposal)}
            onAcceptWithEdits={() => openEditDialog(proposal)}
            onReject={() => openRejectDialog(proposal.id)}
            onDefer={() => deferProposal(proposal.id)}
          />
        )}
      </Card>
    );
  };

  const renderGroup = (label: string, items: AdjustmentProposal[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          {label} ({items.length})
        </h4>
        {items.map(renderProposalCard)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header + Run button */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Adjustment Discovery
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered analysis of your financial data and documents to identify potential adjustments
              </p>
            </div>
            <Button
              onClick={() => {
                if (isDemo) {
                  toast.info("AI Discovery requires real financial data", {
                    description: "Sign up to use this feature on a real project.",
                  });
                  return;
                }
                runDiscovery();
              }}
              disabled={isRunning}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              {isRunning ? "Running..." : proposals.length > 0 ? "Re-run Discovery" : "Run Discovery"}
            </Button>
          </div>
        </CardHeader>

        {/* Progress bar */}
        {isRunning && (
          <CardContent className="pt-0 pb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {job?.status === "queued" ? "Queued..." : "Analyzing..."}
                </span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              {job?.id && (
                <p className="text-[10px] text-muted-foreground font-mono mt-1">
                  Job: {job.id.slice(0, 8)}… | Status: {job.status} | Attempt: {(job as any).attempt_number ?? 1}
                </p>
              )}
            </div>
          </CardContent>
        )}

        {/* Error */}
        {error && (
          <CardContent className="pt-0 pb-4">
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          </CardContent>
        )}

        {/* EBITDA Bridge Summary */}
        {proposals.length > 0 && !isRunning && (
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Proposals</div>
                <div className="text-lg font-bold">{proposals.length}</div>
              </div>
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Add-Backs
                </div>
                <div className="text-lg font-bold font-mono text-green-600">
                  +{formatCurrency(bridgeStats.addBacks)}
                </div>
              </div>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Haircuts
                </div>
                <div className="text-lg font-bold font-mono text-yellow-600">
                  −{formatCurrency(bridgeStats.haircuts)}
                </div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="text-xs text-muted-foreground">Net EBITDA Impact</div>
                <div className={cn(
                  "text-lg font-bold font-mono",
                  bridgeStats.net >= 0 ? "text-green-600" : "text-destructive",
                )}>
                  {bridgeStats.net >= 0 ? "+" : ""}{formatCurrency(bridgeStats.net)}
                </div>
                {bridgeStats.flagCount > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Flag className="h-2.5 w-2.5" /> {bridgeStats.flagCount} flags excluded
                  </div>
                )}
              </div>
            </div>
            {job?.id && (
              <p className="text-[10px] text-muted-foreground font-mono">
                Job: {job.id.slice(0, 8)}… | Completed: {job.completed_at ? new Date(job.completed_at).toLocaleTimeString() : "—"}
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Grouping Controls + Proposals */}
      {proposals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExpandAll} className="text-xs gap-1.5">
              {allExpanded ? (
                <><ChevronDown className="h-3.5 w-3.5" /> Collapse All</>
              ) : (
                <><ChevronRight className="h-3.5 w-3.5" /> Expand All</>
              )}
            </Button>
            <span className="text-xs text-muted-foreground font-medium">Group by:</span>
            <ToggleGroup
              type="single"
              value={groupMode}
              onValueChange={(v) => v && setGroupMode(v as GroupMode)}
              size="sm"
            >
              <ToggleGroupItem value="direction" className="text-xs">Direction</ToggleGroupItem>
              <ToggleGroupItem value="strength" className="text-xs">Evidence</ToggleGroupItem>
              <ToggleGroupItem value="block" className="text-xs">Block</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {grouped.groups.map((g) => renderGroup(g.label, g.items))}
        </div>
      )}

      {/* Empty state */}
      {!isRunning && proposals.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Click "Run Discovery" to analyze your financial data for potential adjustments</p>
          </CardContent>
        </Card>
      )}

      {/* Accept with Edits Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept with Edits</DialogTitle>
            <DialogDescription>
              Modify the proposed amount before accepting this adjustment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Adjusted Amount</label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Enter adjusted amount..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Reason for edit..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptWithEdits}>Accept with Edits</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>Optionally provide a reason for rejecting.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
