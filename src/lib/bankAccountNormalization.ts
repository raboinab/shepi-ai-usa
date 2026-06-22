/**
 * Normalization helpers for bank-statement document grouping.
 *
 * The `enrich-document` edge function (and historical uploads) sometimes write
 * institution names like:
 *   - "Business Checking"
 *   - "Business Checking - ACME LANDSCAPING CO"
 *   - "ACME LANDSCAPING CO"
 * for what is really the *same* account. We collapse those variants so the
 * coverage UI shows one row per real account.
 *
 * Pure functions, safe to use in both the browser and Deno (edge functions).
 */

const collapseWs = (s: string) => s.replace(/\s+/g, " ").trim();

/** Lower-cased, whitespace-collapsed token for fuzzy contains-checks. */
const tokenize = (s: string) => collapseWs(s).toLowerCase();

/**
 * Strip a company name from an institution string when it appears as a
 * prefix, suffix, or standalone value. Used for both display and grouping.
 *
 *   stripCompany("Business Checking - ACME CO", "ACME Co.") -> "Business Checking"
 *   stripCompany("ACME CO", "ACME Co.") -> "" (caller falls back to "Unknown")
 *   stripCompany("Business Checking", undefined) -> "Business Checking"
 */
export function stripCompanyFromInstitution(
  institution: string | null | undefined,
  targetCompany?: string | null,
): string {
  const raw = collapseWs(institution || "");
  if (!raw) return "";
  if (!targetCompany) return raw;

  // Build a case-insensitive comparator that ignores punctuation noise.
  const co = tokenize(targetCompany).replace(/[.,]/g, "");
  if (!co) return raw;

  const lowered = raw.toLowerCase().replace(/[.,]/g, "");
  if (lowered === co) return "";

  // Suffix: "Business Checking - ACME CO" / "Business Checking ACME CO"
  const suffixPatterns = [
    new RegExp(`\\s*[-–—:]\\s*${escapeRegex(co)}\\s*$`, "i"),
    new RegExp(`\\s+${escapeRegex(co)}\\s*$`, "i"),
  ];
  let out = raw;
  for (const p of suffixPatterns) {
    const candidate = out.replace(p, "");
    if (candidate.trim() && candidate.trim().toLowerCase() !== out.toLowerCase()) {
      out = candidate;
      break;
    }
  }

  // Prefix: "ACME CO Business Checking"
  const prefixPattern = new RegExp(`^${escapeRegex(co)}\\s*[-–—:]?\\s+`, "i");
  const prefixCandidate = out.replace(prefixPattern, "");
  if (prefixCandidate.trim() && prefixCandidate.trim().toLowerCase() !== out.toLowerCase()) {
    out = prefixCandidate;
  }

  return collapseWs(out);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalized institution name for display. Falls back to "Unknown". */
export function normalizeInstitution(
  institution: string | null | undefined,
  targetCompany?: string | null,
): string {
  const stripped = stripCompanyFromInstitution(institution, targetCompany);
  return stripped || "Unknown";
}

/** Normalized account label for display. Empty string means "unlabeled". */
export function normalizeAccountLabel(label: string | null | undefined): string {
  return collapseWs((label || "").toLowerCase());
}

/**
 * Stable grouping key for (institution, account_label) pairs. Two raw rows
 * that should appear as the same account row produce the same key.
 */
export function bankAccountGroupKey(
  institution: string | null | undefined,
  accountLabel: string | null | undefined,
  targetCompany?: string | null,
): string {
  const inst = normalizeInstitution(institution, targetCompany).toLowerCase();
  const label = normalizeAccountLabel(accountLabel);
  return `${inst}::${label}`;
}
