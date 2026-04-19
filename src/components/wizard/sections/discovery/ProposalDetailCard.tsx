import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { isITDAAnchor } from "@/lib/qoeAdjustmentTaxonomy";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  Clock,
  Pencil,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileText,
  List,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INTENT_TO_SIGN } from "@/lib/qoeAdjustmentTaxonomy";
import type { LedgerIntent } from "@/lib/qoeAdjustmentTaxonomy";
import type { AdjustmentProposal, ProposalEvidence } from "@/hooks/useDiscoveryProposals";

const fmt = (num: number | null | undefined) => {
  if (num == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ── Types ──

interface SkepticData {
  score?: number;
  verdict?: "verified" | "needs_support" | "insufficient";
  challenges?: string[];
}

interface DisplayMetadata {
  impact_type?: "increase_ebitda" | "decrease_ebitda" | "neutral_flag";
  direction_label?: string;
}

interface SupportJson {
  confidence?: string;
  direction?: string;
  reported_amount?: number;
  proposed_adjustment?: number;
  assumptions?: string[];
  skeptic?: SkepticData;
  display?: DisplayMetadata;
}

interface ParsedRationale {
  rationale?: string;
  assumptions?: string[];
  confidence?: string;
  direction?: string;
  reported_amount?: number;
  proposed_adjustment?: number;
  skeptic?: SkepticData;
  key_signals?: string[];
  signals?: string[];
  key_findings?: string[];
}

interface AccountGroup {
  accountNumber: string | null;
  accountName: string | null;
  total: number;
  count: number;
}

// ── Helpers ──

function parseRationaleJson(raw: string | null | undefined): ParsedRationale | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed as ParsedRationale;
  } catch {
    // not JSON — return null
  }
  return null;
}

function groupEvidenceByAccount(evidence: ProposalEvidence[]): AccountGroup[] {
  const map = new Map<string, AccountGroup>();
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
        count: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
}

function verdictVariant(v?: string): "success" | "warning" | "danger" {
  if (v === "verified") return "success";
  if (v === "needs_support") return "warning";
  return "danger";
}

function verdictLabel(v?: string) {
  if (v === "verified") return "Verified";
  if (v === "needs_support") return "Needs Support";
  if (v === "insufficient") return "Insufficient";
  return "Unknown";
}

/**
 * Extract key signals from multiple sources:
 * 1. proposal.ai_key_signals (primary — backend Phase 2)
 * 2. ai_rationale JSON parsed fields (fallback — works now)
 */
function extractKeySignals(
  aiKeySignals: string[] | undefined,
  parsedRationale: ParsedRationale | null,
): string[] {
  if (aiKeySignals && aiKeySignals.length > 0) return aiKeySignals;
  if (!parsedRationale) return [];
  // Try multiple possible field names from the rationale JSON
  return (
    parsedRationale.key_signals ??
    parsedRationale.signals ??
    parsedRationale.key_findings ??
    []
  );
}

// ── Small UI pieces ──

function MetricCard({
  label, value, sub, icon, variant = "default",
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const bg = {
    default: "bg-muted/50 border-border",
    success: "bg-green-500/5 border-green-500/20",
    warning: "bg-yellow-500/5 border-yellow-500/20",
    danger: "bg-destructive/5 border-destructive/20",
  };
  const text = {
    default: "text-foreground",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-destructive",
  };
  return (
    <div className={cn("rounded-lg border p-3 space-y-1", bg[variant])}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={cn("text-lg font-semibold font-mono", text[variant])}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
      {children}
    </h4>
  );
}

function CollapsibleSection({
  title, icon, count, defaultOpen = false, variant, children,
}: {
  title: string; icon: React.ReactNode; count?: number;
  defaultOpen?: boolean; variant?: "warning" | "danger"; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const wrapperCn = variant === "warning"
    ? "rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3"
    : variant === "danger"
    ? "rounded-md border border-destructive/30 bg-destructive/5 p-3"
    : "";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={wrapperCn}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full">
          <SectionHeader>
            {icon}
            {title}{count != null ? ` (${count})` : ""}
          </SectionHeader>
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ── Main ──

interface ProposalDetailCardProps {
  proposal: AdjustmentProposal;
  evidence: ProposalEvidence[];
  onAccept: () => void;
  onAcceptWithEdits: () => void;
  onReject: () => void;
  onDefer: () => void;
}

export function ProposalDetailCard({
  proposal, evidence, onAccept, onAcceptWithEdits, onReject, onDefer,
}: ProposalDetailCardProps) {
  // Parse ai_rationale as JSON to extract structured fields
  const parsedRationale = useMemo(
    () => parseRationaleJson(proposal.ai_rationale),
    [proposal.ai_rationale],
  );

  // Merge support_json with parsed rationale fallbacks
  const rawSupport: SupportJson = (proposal.support_json as SupportJson) ?? {};
  const support: SupportJson = useMemo(() => ({
    confidence: rawSupport.confidence ?? parsedRationale?.confidence,
    direction: rawSupport.direction ?? parsedRationale?.direction,
    reported_amount: rawSupport.reported_amount ?? parsedRationale?.reported_amount,
    proposed_adjustment: rawSupport.proposed_adjustment ?? parsedRationale?.proposed_adjustment,
    assumptions: rawSupport.assumptions?.length ? rawSupport.assumptions : parsedRationale?.assumptions,
    skeptic: rawSupport.skeptic?.score != null ? rawSupport.skeptic : parsedRationale?.skeptic,
    display: rawSupport.display,
  }), [rawSupport, parsedRationale]);

   const skeptic = support.skeptic;
   const isActioned = ["accepted", "accepted_with_edits", "rejected", "deferred"].includes(proposal.status);
   const isITDA = isITDAAnchor(proposal.linked_account_name || "") || isITDAAnchor(proposal.title || "");

  const reportedAmt = support.reported_amount;
  const proposedAmt = support.proposed_adjustment ?? proposal.proposed_amount;
  const pctOfGL = reportedAmt && proposedAmt ? Math.round((proposedAmt / reportedAmt) * 100) : null;

  // Resolve direction label: prefer backend display metadata, fall back to intent heuristics
  const displayMeta = support.display;
  const DIR_LABEL_MAP: Record<string, string> = {
    add_back: "Add-Back",
    deduction: "Deduction",
    remove_expense: "Add-Back",
    remove_revenue: "Haircut",
    add_expense: "Missing Cost",
    add_revenue: "Revenue Add",
    normalize_up_expense: "Normalize ↑",
    normalize_down_expense: "Normalize ↓",
    other: "Flag for Review",
  };
  const dirKey = support.direction || proposal.intent || "other";
  const dirLabel = displayMeta?.direction_label ?? DIR_LABEL_MAP[dirKey] ?? "Adjustment";

  // EBITDA direction: prefer backend impact_type, fall back to intent sign
  const isNeutralFlag = displayMeta?.impact_type === "neutral_flag" || dirKey === "other";
  const ebitdaSign = isNeutralFlag
    ? 0
    : displayMeta?.impact_type === "increase_ebitda"
    ? 1
    : displayMeta?.impact_type === "decrease_ebitda"
    ? -1
    : (INTENT_TO_SIGN[(dirKey as LedgerIntent)] ?? 0);
  const ebitdaPositive = ebitdaSign > 0;
  const ebitdaNegative = ebitdaSign < 0;

  const accountGroups = useMemo(() => groupEvidenceByAccount(evidence), [evidence]);

  // Extract key signals with fallback to ai_rationale
  const keySignals = useMemo(
    () => extractKeySignals(proposal.ai_key_signals, parsedRationale),
    [proposal.ai_key_signals, parsedRationale],
  );

  // Extract rationale text for the collapsible
  const rationaleText = parsedRationale?.rationale ?? (
    // If ai_rationale wasn't JSON, use it as plain text
    parsedRationale === null ? proposal.ai_rationale : null
  );

  // Choose icon and variant based on direction
  const directionIcon = isNeutralFlag
    ? <Flag className="h-3.5 w-3.5" />
    : ebitdaPositive
    ? <TrendingUp className="h-3.5 w-3.5" />
    : <TrendingDown className="h-3.5 w-3.5" />;

  const metricVariant = isNeutralFlag
    ? "default" as const
    : ebitdaPositive
    ? "success" as const
    : ebitdaNegative
    ? "warning" as const
    : "default" as const;

  const metricLabel = isNeutralFlag ? "Flagged Amount" : dirLabel;

  return (
    <div className="p-4 pt-0 space-y-4 border-t">
      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-3 gap-3 pt-4">
        {reportedAmt != null && (
          <MetricCard label="GL Amount" value={fmt(reportedAmt)} icon={<FileText className="h-3 w-3" />} />
        )}
        <MetricCard
          label={metricLabel}
          value={fmt(proposedAmt)}
          sub={pctOfGL != null ? `${pctOfGL}% of GL` : undefined}
          icon={directionIcon}
          variant={metricVariant}
        />
      </div>

      {/* ── Period Breakdown (compact badges below metrics) ── */}
      {Object.keys(proposal.proposed_period_values || {}).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(proposal.proposed_period_values).map(([period, amount]) => (
            <Badge key={period} variant="outline" className="text-xs font-mono">
              {period}: {fmt(amount)}
            </Badge>
          ))}
        </div>
      )}

      {/* ── Account Breakdown Table (PRIMARY content) ── */}
      {accountGroups.length > 0 && (
        <div className="space-y-2">
          <SectionHeader><List className="h-3.5 w-3.5" />Account Breakdown</SectionHeader>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-[60px]">Acct</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs text-right w-[90px]">Amount</TableHead>
                  <TableHead className="text-xs w-[50px] text-center">Txns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountGroups.map((g) => (
                  <TableRow key={`${g.accountNumber}-${g.accountName}`}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {g.accountNumber ? `#${g.accountNumber}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{g.accountName ?? "—"}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{fmt(g.total)}</TableCell>
                    <TableCell className="text-xs text-center text-muted-foreground">{g.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Key Signals (with ai_rationale fallback) ── */}
      {keySignals.length > 0 && (
        <div className="space-y-2">
          <SectionHeader><Lightbulb className="h-3.5 w-3.5" />Key Signals</SectionHeader>
          <ul className="space-y-1.5">
            {keySignals.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Assumptions (collapsible) ── */}
      {support.assumptions && support.assumptions.length > 0 && (
        <CollapsibleSection title="Assumptions" icon={<FileText className="h-3.5 w-3.5" />} count={support.assumptions.length}>
          <ul className="mt-2 space-y-1.5">
            {support.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* ── Warnings ── */}
      {proposal.ai_warnings?.length > 0 && (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-medium text-yellow-600">
            <AlertTriangle className="h-3.5 w-3.5" />Warnings
          </div>
          <ul className="space-y-1">
            {proposal.ai_warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-yellow-600/80">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-500/50 shrink-0" />{w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Skeptic Challenges ── */}
      {skeptic?.challenges && skeptic.challenges.length > 0 && (
        <CollapsibleSection title="Lender Challenges" icon={<ShieldAlert className="h-3.5 w-3.5" />} count={skeptic.challenges.length} defaultOpen variant="danger">
          <ul className="mt-2 space-y-1">
            {skeptic.challenges.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-destructive/80">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" />{c}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* ── Evidence Transactions (collapsible) ── */}
      {evidence.length > 0 && (
        <CollapsibleSection title="Evidence Transactions" icon={<FileText className="h-3.5 w-3.5" />} count={evidence.length}>
          <div className="rounded-md border overflow-auto max-h-48 mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Vendor</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidence.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="text-xs">{ev.txn_date ?? "—"}</TableCell>
                    <TableCell className="text-xs">{ev.vendor ?? "—"}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{fmt(ev.amount)}</TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate">{ev.description ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px]",
                        ev.match_quality === "strong" && "text-green-600",
                        ev.match_quality === "moderate" && "text-yellow-600",
                        ev.match_quality === "weak" && "text-muted-foreground",
                      )}>{ev.match_quality}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CollapsibleSection>
      )}

      {/* ── Full AI Analysis (collapsible, supplementary — renders extracted rationale text) ── */}
      {rationaleText && (
        <CollapsibleSection title="Full AI Analysis" icon={<Lightbulb className="h-3.5 w-3.5" />}>
          <div className="rounded-md border bg-muted/30 p-3 mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed max-h-64 overflow-auto">
            {rationaleText}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Actions ── */}
      {!isActioned && isITDA && (
        <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Interest, Taxes, Depreciation & Amortization are already excluded from EBITDA — this cannot be added as an adjustment.</span>
        </div>
      )}
      {!isActioned && !isITDA && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button size="sm" className="gap-1.5" onClick={onAccept}><Check className="h-3.5 w-3.5" />Accept</Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAcceptWithEdits}><Pencil className="h-3.5 w-3.5" />Accept with Edits</Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onReject}><X className="h-3.5 w-3.5" />Reject</Button>
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={onDefer}><Clock className="h-3.5 w-3.5" />Defer</Button>
        </div>
      )}
    </div>
  );
}
