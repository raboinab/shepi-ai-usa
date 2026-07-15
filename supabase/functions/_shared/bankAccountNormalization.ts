/**
 * Canonicalization helpers for bank / credit-card statement documents.
 *
 * Source of truth shared between the browser (`src/lib/bankAccountNormalization.ts`
 * re-exports this) and the `enrich-document` / `normalize-bank-docs` edge functions.
 *
 * All functions are pure and Deno-safe (no imports).
 */

const collapseWs = (s: string) => s.replace(/\s+/g, " ").trim();
const tokenize = (s: string) => collapseWs(s).toLowerCase();

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -------------------------------------------------------------------------- */
/* Institution / issuer                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Strip a company name from an institution string when it appears as a prefix,
 * suffix, or standalone value.
 */
export function stripCompanyFromInstitution(
  institution: string | null | undefined,
  targetCompany?: string | null,
): string {
  const raw = collapseWs(institution || "");
  if (!raw) return "";
  if (!targetCompany) return raw;

  const co = tokenize(targetCompany).replace(/[.,]/g, "");
  if (!co) return raw;

  const lowered = raw.toLowerCase().replace(/[.,]/g, "");
  if (lowered === co) return "";

  let out = raw;
  for (
    const p of [
      new RegExp(`\\s*[-–—:]\\s*${escapeRegex(co)}\\s*$`, "i"),
      new RegExp(`\\s+${escapeRegex(co)}\\s*$`, "i"),
    ]
  ) {
    const candidate = out.replace(p, "");
    if (candidate.trim() && candidate.trim().toLowerCase() !== out.toLowerCase()) {
      out = candidate;
      break;
    }
  }
  const prefixCandidate = out.replace(
    new RegExp(`^${escapeRegex(co)}\\s*[-–—:]?\\s+`, "i"),
    "",
  );
  if (
    prefixCandidate.trim() &&
    prefixCandidate.trim().toLowerCase() !== out.toLowerCase()
  ) {
    out = prefixCandidate;
  }
  return collapseWs(out);
}

/**
 * Canonical issuer table. Generic — matches on brand tokens common to many
 * targets. Order matters: more specific rules first.
 */
const ISSUER_RULES: Array<{ test: RegExp; canonical: string }> = [
  { test: /amazon\s*prime.*visa|chase\s*amazon\s*prime|amazon\s*prime\s*rewards/i, canonical: "Chase Amazon Prime Visa" },
  { test: /united\s*mileageplus/i, canonical: "Chase United MileagePlus" },
  { test: /chase\s*sapphire/i, canonical: "Chase Sapphire" },
  { test: /chase\s*(freedom|slate|ink)/i, canonical: "Chase" },
  { test: /chase/i, canonical: "Chase" },
  { test: /jpmorgan/i, canonical: "Chase" },
  { test: /fidelity.*rewards.*visa|fidelity.*visa.*signature/i, canonical: "Fidelity Rewards Visa" },
  { test: /fidelity/i, canonical: "Fidelity" },
  { test: /wells\s*fargo|optimize\s*business\s*checking|wf\b/i, canonical: "Wells Fargo" },
  { test: /bank\s*of\s*america|\bbofa\b/i, canonical: "Bank of America" },
  { test: /american\s*express|\bamex\b/i, canonical: "American Express" },
  { test: /capital\s*one/i, canonical: "Capital One" },
  { test: /citi(bank|group)?/i, canonical: "Citi" },
  { test: /discover/i, canonical: "Discover" },
  { test: /us\s*bank|u\.s\.\s*bank/i, canonical: "US Bank" },
  { test: /pnc/i, canonical: "PNC" },
  { test: /truist|bb&t|suntrust/i, canonical: "Truist" },
  { test: /td\s*bank/i, canonical: "TD Bank" },
  { test: /huntington/i, canonical: "Huntington" },
  { test: /regions/i, canonical: "Regions" },
  { test: /keybank|key\s*bank/i, canonical: "KeyBank" },
  { test: /fifth\s*third|5\/3/i, canonical: "Fifth Third" },
  { test: /mercury/i, canonical: "Mercury" },
  { test: /brex/i, canonical: "Brex" },
  { test: /ramp/i, canonical: "Ramp" },
  { test: /square|block\s*inc/i, canonical: "Square" },
  { test: /stripe/i, canonical: "Stripe" },
  { test: /paypal/i, canonical: "PayPal" },
  // Generic account-type fallbacks -- only if no brand matched above
  { test: /business\s*checking/i, canonical: "Business Checking" },
  { test: /operating\s*account/i, canonical: "Operating Account" },
  { test: /money\s*market/i, canonical: "Money Market" },
];

export function canonicalIssuer(raw: string | null | undefined): string {
  const s = collapseWs((raw || "").toString())
    .replace(/[®™©]/g, "")
    .replace(/\s+(business\s+)?card$/i, "")
    .replace(/\s+signature\s+card$/i, "")
    .trim();
  if (!s) return "";
  for (const rule of ISSUER_RULES) {
    if (rule.test.test(s)) return rule.canonical;
  }
  return s;
}

/** Normalized institution for display. Falls back to "Unknown". */
export function normalizeInstitution(
  institution: string | null | undefined,
  targetCompany?: string | null,
): string {
  const stripped = stripCompanyFromInstitution(institution, targetCompany);
  if (!stripped) return "Unknown";
  return canonicalIssuer(stripped) || "Unknown";
}

/* -------------------------------------------------------------------------- */
/* Account label / last-4                                                      */
/* -------------------------------------------------------------------------- */

/** Extract a 3-5 digit account tail from a filename segment (e.g. `-7187-`). */
export function last4FromFilename(name: string | null | undefined): string | null {
  if (!name) return null;
  // Prefer bounded segments (`-7187-`, `_1234.`) — they are almost always
  // the account tail on bank exports. Falls back to any 4-digit run adjacent
  // to non-digits, avoiding date components (YYYYMMDD) by requiring at most 5
  // digits total in the run.
  const bounded = name.match(/[-_](\d{3,5})(?=[-_.])/);
  if (bounded) return bounded[1];
  const tail = name.match(/(?:^|[^0-9])(\d{4})(?![0-9])/);
  return tail ? tail[1] : null;
}

/** Extract last-4 from any freeform string (`****3962`, `xxxx1234`, `#3962`). */
export function extractLast4(...candidates: Array<string | null | undefined>): string | null {
  for (const c of candidates) {
    if (!c) continue;
    const s = String(c);
    const m = s.match(/(\d{3,5})(?!.*\d)/);
    if (m) return m[1];
  }
  return null;
}

/**
 * Normalized account label for grouping/display.
 *
 * Two-argument form:  `normalizeAccountLabel(issuer, last4)` -> "Chase 7187"
 * One-argument form (back-compat with client code): parses issuer+last4 from a
 * single freeform label string.
 */
export function normalizeAccountLabel(
  issuerOrLabel: string | null | undefined,
  last4?: string | null,
): string {
  if (last4 !== undefined) {
    const issuer = canonicalIssuer(issuerOrLabel) || "";
    const l4 = extractLast4(last4);
    if (issuer && l4) return `${issuer} ${l4}`;
    if (l4) return l4;
    return issuer;
  }
  // Single-arg legacy path.
  const raw = collapseWs((issuerOrLabel || "").toString().toLowerCase());
  if (!raw) return "";
  const m = raw.match(/(\d{3,5})(?!.*\d)/);
  if (m) {
    const prefix = raw.replace(/[^a-z ]/g, " ").trim().split(/\s+/)[0] || "";
    const cap = prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : "";
    return cap ? `${cap} ${m[1]}` : m[1];
  }
  return raw;
}

/** Stable grouping key for (institution, account_label). */
export function bankAccountGroupKey(
  institution: string | null | undefined,
  accountLabel: string | null | undefined,
  targetCompany?: string | null,
): string {
  const inst = normalizeInstitution(institution, targetCompany).toLowerCase();
  const last4 = extractLast4(accountLabel) || "";
  if (last4) return `${inst}::${last4}`;
  const label = normalizeAccountLabel(accountLabel);
  return `${inst}::${label}`;
}

/* -------------------------------------------------------------------------- */
/* Period fallback from filename                                               */
/* -------------------------------------------------------------------------- */

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function lastDayOfMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function iso(y: number, m: number, d: number): string {
  return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}

/**
 * Best-effort statement period from a filename. Returns { start, end } spanning
 * the calendar month when only one date is present (bank/CC convention).
 */
export function parsePeriodFromFilename(
  name: string | null | undefined,
): { periodStart: string; periodEnd: string; source: "filename" } | null {
  if (!name) return null;
  const s = name;

  // 1. YYYYMMDD or YYYY-MM-DD
  const iso8 = s.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})/);
  if (iso8) {
    const y = +iso8[1], m = +iso8[2], d = +iso8[3];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { periodStart: iso(y, m, 1), periodEnd: iso(y, m, lastDayOfMonth(y, m)), source: "filename" };
    }
  }

  // 2. MM-DD-YYYY / MM_DD_YYYY / MM.DD.YYYY
  const us = s.match(/(?:^|[^0-9])(\d{1,2})[-_./](\d{1,2})[-_./](20\d{2})/);
  if (us) {
    const m = +us[1], d = +us[2], y = +us[3];
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { periodStart: iso(y, m, 1), periodEnd: iso(y, m, lastDayOfMonth(y, m)), source: "filename" };
    }
  }

  // 3. MMM-YYYY / MMM YYYY / MMMYYYY
  const mmm = s.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*[-_ ]?(20\d{2})/);
  if (mmm) {
    const m = MONTHS[mmm[1] as keyof typeof MONTHS];
    const y = +mmm[2];
    if (m) return { periodStart: iso(y, m, 1), periodEnd: iso(y, m, lastDayOfMonth(y, m)), source: "filename" };
  }

  // 4. YYYY-MM alone
  const ym = s.match(/(20\d{2})[-_](\d{2})(?!\d)/);
  if (ym) {
    const y = +ym[1], m = +ym[2];
    if (m >= 1 && m <= 12) {
      return { periodStart: iso(y, m, 1), periodEnd: iso(y, m, lastDayOfMonth(y, m)), source: "filename" };
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Filename issuer hint                                                        */
/* -------------------------------------------------------------------------- */

const FILENAME_ISSUER_TOKENS: Array<{ test: RegExp; issuer: string }> = [
  { test: /amazon.?prime|chase.?amazon/i, issuer: "Chase Amazon Prime Visa" },
  { test: /mileageplus|united.?chase/i, issuer: "Chase United MileagePlus" },
  { test: /sapphire/i, issuer: "Chase Sapphire" },
  { test: /chase|jpmc/i, issuer: "Chase" },
  { test: /wells.?fargo|wf[-_]/i, issuer: "Wells Fargo" },
  { test: /fidelity/i, issuer: "Fidelity" },
  { test: /bofa|bank.?of.?america/i, issuer: "Bank of America" },
  { test: /amex|american.?express/i, issuer: "American Express" },
  { test: /capital.?one/i, issuer: "Capital One" },
  { test: /citi/i, issuer: "Citi" },
  { test: /discover/i, issuer: "Discover" },
  { test: /mercury/i, issuer: "Mercury" },
  { test: /brex/i, issuer: "Brex" },
];

export function issuerFromFilename(name: string | null | undefined): string | null {
  if (!name) return null;
  for (const rule of FILENAME_ISSUER_TOKENS) {
    if (rule.test.test(name)) return rule.issuer;
  }
  return null;
}
