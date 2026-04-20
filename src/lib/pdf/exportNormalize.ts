/**
 * Shared normalization helpers for the PDF export pipeline.
 *
 * Goal: turn the raw mix of hypotheses, WIP findings, and adjustment proposals
 * into a small, deliberate set of executive-grade items with consistent
 * structure (headline, impact, why-it-matters, what-to-verify-next).
 */

export type Severity = "high" | "medium" | "low" | "info";

export interface NormalizedAttentionItem {
  title: string;
  severity: Severity;
  ebitdaImpact?: number;
  rationale: string;
  followUp: string;
  /** Original description, kept available for renderers that want it */
  description?: string;
}

export interface RawAttentionInput {
  title?: string | null;
  description?: string | null;
  rationale?: string | null;
  followUp?: string | null;
  severity?: string | null;
  ebitdaImpact?: number | null;
}

const SEV_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };

const FILLER_RATIONALE = new Set([
  "this finding may affect reported ebitda and warrants further analysis.",
  "adjustment identified for review.",
  "review supporting detail and confirm adjustment basis.",
]);

const FILLER_FOLLOWUP = new Set([
  "validate with supporting documentation and confirm with management.",
  "review supporting detail and confirm adjustment basis.",
]);

function squash(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function trimToSentence(s: string, max: number): string {
  const t = squash(s);
  if (t.length <= max) return t;
  // Try to cut on a sentence boundary
  const slice = t.slice(0, max);
  const lastPeriod = slice.lastIndexOf(".");
  if (lastPeriod > max * 0.6) return slice.slice(0, lastPeriod + 1);
  // else cut on word boundary
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).replace(/[,;:\-]+$/, "") + "…";
}

export function normalizeSeverity(input?: string | null, fallback: Severity = "medium"): Severity {
  const v = (input || "").toLowerCase();
  if (v === "high" || v === "critical") return "high";
  if (v === "low") return "low";
  if (v === "info" || v === "informational") return "info";
  if (v === "medium" || v === "moderate") return "medium";
  return fallback;
}

/**
 * Drop generic placeholder text and pick the best available rationale source.
 */
function pickRationale(raw: RawAttentionInput): string {
  const candidates = [raw.rationale, raw.description].map(s => squash(s || ""));
  for (const c of candidates) {
    if (!c) continue;
    if (FILLER_RATIONALE.has(c.toLowerCase())) continue;
    return trimToSentence(c, 160);
  }
  return "";
}

function pickFollowUp(raw: RawAttentionInput): string {
  const f = squash(raw.followUp || "");
  if (!f) return "";
  if (FILLER_FOLLOWUP.has(f.toLowerCase())) return "";
  return trimToSentence(f, 110);
}

/**
 * Normalize a list of attention/finding items: clean text, drop boilerplate,
 * de-duplicate by title, rank by severity then |impact|.
 */
export function normalizeAttentionItems(
  raw: RawAttentionInput[],
  limit = 6,
): NormalizedAttentionItem[] {
  const seen = new Set<string>();
  const out: NormalizedAttentionItem[] = [];

  for (const r of raw) {
    const titleRaw = squash(r.title || "");
    if (!titleRaw) continue;
    const dedupeKey = titleRaw.toLowerCase().slice(0, 80);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const severity = normalizeSeverity(r.severity);
    const rationale = pickRationale(r) || "Identified during analysis; review supporting detail to confirm impact.";
    const followUp = pickFollowUp(r) || "Verify against source records and corroborate with management.";

    out.push({
      title: trimToSentence(titleRaw, 110),
      severity,
      ebitdaImpact: r.ebitdaImpact ?? undefined,
      rationale,
      followUp,
      description: r.description ?? undefined,
    });
  }

  out.sort((a, b) => {
    const s = SEV_RANK[a.severity] - SEV_RANK[b.severity];
    if (s !== 0) return s;
    return Math.abs(b.ebitdaImpact || 0) - Math.abs(a.ebitdaImpact || 0);
  });

  return out.slice(0, limit);
}

/* ─────────────── DD Adjustments ─────────────── */

export interface NormalizedAdjustment {
  title: string;
  block: string;
  blockLabel: string;
  category: string;
  amount: number;
  reason: string;
  verificationStatus?: string;
  verificationLabel?: string;
  /** Pass-through original record for renderers that need extra fields */
  original: Record<string, unknown>;
}

const BLOCK_LABELS: Record<string, string> = {
  MA: "Management",
  DD: "Due Diligence",
  PF: "Pro Forma",
  QOE: "QoE",
};

const VERIFICATION_LABELS: Record<string, string> = {
  validated: "Validated",
  supported: "Supported",
  partial: "Partial",
  insufficient: "Insufficient",
  contradictory: "Contradictory",
  pending: "Pending",
};

function blockLabel(block: string): string {
  const key = (block || "DD").toUpperCase();
  return BLOCK_LABELS[key] || key;
}

function categoryLabel(c: string): string {
  if (!c) return "—";
  return c.replace(/[_-]+/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s);
}

function pickAdjustmentReason(input: { description?: string | null; aiRationale?: string | null; keyFindings?: string[] | null }): string {
  const candidates: string[] = [];
  if (input.aiRationale) candidates.push(input.aiRationale);
  if (input.description) candidates.push(input.description);
  if (input.keyFindings && input.keyFindings.length > 0) candidates.push(input.keyFindings.join("; "));
  for (const c of candidates) {
    const cleaned = squash(c);
    if (cleaned && cleaned.length > 8) return trimToSentence(cleaned, 140);
  }
  return "";
}

export interface RawAdjustmentInput {
  title?: string | null;
  description?: string | null;
  block?: string | null;
  adjustmentClass?: string | null;
  amount?: number | null;
  status?: string | null;
  aiRationale?: string | null;
  keyFindings?: string[] | null;
  verificationStatus?: string | null;
  [k: string]: unknown;
}

export function normalizeAdjustments(raw: RawAdjustmentInput[]): NormalizedAdjustment[] {
  const out: NormalizedAdjustment[] = [];
  for (const r of raw) {
    const titleRaw = squash(r.title || "");
    const amount = typeof r.amount === "number" ? r.amount : 0;
    if (!titleRaw && amount === 0) continue;

    const cleanedTitle = !titleRaw || isUuidLike(titleRaw) ? "Untitled Adjustment" : trimToSentence(titleRaw, 90);
    const block = (r.block || "DD").toUpperCase();
    const reason = pickAdjustmentReason({
      description: r.description ?? null,
      aiRationale: r.aiRationale ?? null,
      keyFindings: r.keyFindings ?? null,
    });
    const vStatus = (r.verificationStatus || "").toLowerCase();
    out.push({
      title: cleanedTitle,
      block,
      blockLabel: blockLabel(block),
      category: categoryLabel(r.adjustmentClass || ""),
      amount,
      reason,
      verificationStatus: vStatus || undefined,
      verificationLabel: vStatus ? VERIFICATION_LABELS[vStatus] || vStatus : undefined,
      original: r as Record<string, unknown>,
    });
  }

  // Rank by absolute impact, descending
  out.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  return out;
}

export function formatCompactCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  const abs = Math.abs(n);
  let body: string;
  if (abs >= 1_000_000) body = `$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  else if (abs >= 1_000) body = `$${(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}K`;
  else body = `$${abs.toFixed(0)}`;
  return n < 0 ? `(${body})` : body;
}
