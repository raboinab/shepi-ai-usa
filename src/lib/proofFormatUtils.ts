/**
 * Shared formatters for proof validation status labels and findings.
 * Used by workbook column and PDF slide.
 */
import type { ProofSummary } from "@/hooks/useAdjustmentProofs";

const STATUS_LABELS: Record<ProofSummary["validation_status"], string> = {
  validated: "Validated",
  supported: "Supported",
  partial: "Partial",
  insufficient: "Insufficient",
  contradictory: "Contradictory",
  pending: "Pending",
};

/**
 * Returns a concise label like "Validated (85)" or "" for pending/missing.
 */
export function formatProofLabel(proof: ProofSummary | undefined): string {
  if (!proof || proof.validation_status === "pending") return "";
  const label = STATUS_LABELS[proof.validation_status] ?? proof.validation_status;
  if (proof.validation_score !== null) {
    return `${label} (${proof.validation_score})`;
  }
  return label;
}

/**
 * Returns a richer label with match/flag counts.
 * e.g. "Validated (90) · 12 matches · 1 flag"
 */
export function formatProofDetailLabel(proof: ProofSummary | undefined): string {
  if (!proof || proof.validation_status === "pending") return "";
  const base = formatProofLabel(proof);
  const parts: string[] = [base];
  if (proof.matchCount > 0) {
    parts.push(`${proof.matchCount} match${proof.matchCount !== 1 ? "es" : ""}`);
  }
  const flagCount = proof.red_flags.length;
  if (flagCount > 0) {
    parts.push(`${flagCount} flag${flagCount !== 1 ? "s" : ""}`);
  }
  return parts.join(" · ");
}


/**
 * Join findings array and truncate to maxChars.
 */
export function formatProofFindings(findings: string[], maxChars = 120): string {
  if (!findings || findings.length === 0) return "";
  const joined = findings.join("; ");
  if (joined.length <= maxChars) return joined;
  return joined.slice(0, maxChars - 1) + "…";
}

/**
 * Returns a CSS-friendly color token name for a given proof status.
 */
export function proofStatusColor(status: ProofSummary["validation_status"]): string {
  switch (status) {
    case "validated":
    case "supported":
      return "green";
    case "partial":
      return "amber";
    case "insufficient":
    case "contradictory":
      return "red";
    default:
      return "gray";
  }
}
