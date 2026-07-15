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

/**
 * Canonicalize issuer/brand names. Different parses of the same card produce
 * strings like "Amazon Prime Visa", "Chase Amazon Prime Card", "Amazon Prime
 * Rewards Visa Signature Card" — all the same underlying account. We collapse
 * them so the coverage UI shows one row per real account.
 */
const ISSUER_RULES: Array<{ test: RegExp; canonical: string }> = [
  { test: /amazon\s*prime.*visa|chase\s*amazon\s*prime|amazon\s*prime\s*rewards/i, canonical: "Chase Amazon Prime Visa" },
  { test: /united\s*mileageplus/i, canonical: "Chase United MileagePlus" },
  { test: /fidelity.*rewards.*visa|fidelity.*visa.*signature/i, canonical: "Fidelity Rewards Visa" },
  { test: /wells\s*fargo|optimize\s*business\s*checking|business\s*checking/i, canonical: "Wells Fargo Business Checking" },
  { test: /bank\s*of\s*america|bofa/i, canonical: "Bank of America" },
  { test: /chase\s*(business|ink|sapphire|freedom|slate)/i, canonical: "Chase" },
];

function canonicalizeIssuer(raw: string): string {
  const cleaned = raw
    .replace(/[®™©]/g, "")
    .replace(/\s+(business\s+)?card$/i, "")
    .replace(/\s+signature\s+card$/i, "")
    .trim();
  for (const rule of ISSUER_RULES) {
    if (rule.test.test(cleaned)) return rule.canonical;
  }
  return collapseWs(cleaned);
}

/** Normalized institution name for display. Falls back to "Unknown". */
export function normalizeInstitution(
  institution: string | null | undefined,
  targetCompany?: string | null,
): string {
  const stripped = stripCompanyFromInstitution(institution, targetCompany);
  if (!stripped) return "Unknown";
  return canonicalizeIssuer(stripped) || "Unknown";
}

/**
 * Normalized account label for grouping and display. Reduces to
 * "{prefix} {last4}" when a 3-5 digit tail is present so that "Chase 3962",
 * "chase  3962", and "…3962" all collapse.
 */
export function normalizeAccountLabel(label: string | null | undefined): string {
  const raw = collapseWs((label || "").toLowerCase());
  if (!raw) return "";
  const m = raw.match(/(\d{3,5})(?!.*\d)/);
  if (m) {
    const prefix = raw.replace(/[^a-z ]/g, " ").trim().split(/\s+/)[0] || "";
    return prefix ? `${prefix} ${m[1]}` : m[1];
  }
  return raw;
}

/**
 * Stable grouping key for (institution, account_label) pairs. Prefers the
 * last-4 digits from the account label so institution-string drift never
 * splits a single real account across rows.
 */
export function bankAccountGroupKey(
  institution: string | null | undefined,
  accountLabel: string | null | undefined,
  targetCompany?: string | null,
): string {
  const inst = normalizeInstitution(institution, targetCompany).toLowerCase();
  const label = normalizeAccountLabel(accountLabel);
  const last4 = label.match(/(\d{3,5})(?!.*\d)/)?.[1] || "";
  return last4 ? `${inst}::${last4}` : `${inst}::${label}`;
}

/** Extract 3-5 digit account tail from a filename like `20240111-statements-7187-.pdf`. */
export function last4FromFilename(name: string | null | undefined): string | null {
  if (!name) return null;
  const m = name.match(/[-_](\d{3,5})[-_.]/);
  return m ? m[1] : null;
}
