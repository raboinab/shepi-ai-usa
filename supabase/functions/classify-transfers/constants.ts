// ─── Constants ───────────────────────────────────────────────────────

export const BATCH_SIZE = 200;
export const MAX_EXECUTION_MS = 45_000;
export const RULES_VERSION = "1.1.0";
export const PROMOTION_THRESHOLD = 0.80;
export const LLM_BATCH_SIZE = 50;
export const MAX_LLM_BATCHES_PER_INVOCATION = 5;

export const TRANSFER_KEYWORDS = [
  "transfer", "xfer", "trnsfr", "trnsf", "online banking", "wire",
  "internal", "sweep", "concentration", "ach", "funds transfer",
  "ext trnsfr", "withdrawal transfer", "deposit transfer",
];

export const OWNER_KEYWORDS = [
  "owner draw", "member draw", "shareholder", "distribution",
  "personal", "reimbursement", "loan to shareholder", "member distribution",
  "partner distribution", "owner capital", "capital contribution",
];

export const PERSONAL_APP_KEYWORDS = [
  "zelle", "venmo", "cash app", "cashapp", "paypal",
];

export const CONSUMER_CREDIT_KEYWORDS = [
  "chase card", "amex", "barclaycard", "discover card", "citi card",
  "auto pay", "mortgage", "student loan", "car payment",
  "personal loan", "home equity",
];

export const NEGATIVE_CLASS_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(payroll|adp|gusto|paychex|justworks|rippling)\b/i, label: "payroll" },
  { pattern: /\b(irs|eftps|state tax|federal tax|tax payment|estimated tax)\b/i, label: "tax_payment" },
  { pattern: /\b(rent|lease payment|landlord)\b/i, label: "rent" },
  { pattern: /\b(stripe|square|shopify|clover|merchant services|merchant processing)\b/i, label: "merchant_processor" },
  { pattern: /\b(sba|loan payment|loan servicing|term loan)\b/i, label: "business_loan" },
  { pattern: /\b(workers comp|business insurance|liability insurance|property insurance)\b/i, label: "business_insurance" },
  { pattern: /\b(utility|electric|gas company|water bill|internet|comcast|att|verizon)\b/i, label: "utility" },
];

// ─── Business Vendor Patterns (downweight owner score) ───────────────

export const BUSINESS_VENDOR_PATTERNS: { pattern: RegExp; label: string; weight: number }[] = [
  // Strong business vendors — very unlikely to be personal owner activity
  { pattern: /\bstamps\.?com\b/i, label: "postage_vendor", weight: -0.35 },
  { pattern: /\b(ups\w*|fedex|usps|dhl)\b/i, label: "shipping_vendor", weight: -0.35 },
  { pattern: /\b(sba|eidl)\b/i, label: "govt_loan", weight: -0.35 },
  { pattern: /\bair\s*mailers?\b/i, label: "shipping_vendor", weight: -0.35 },
  // Moderate business vendors — could be business or personal
  { pattern: /\b(at.t|directv|verizon|comcast|spectrum|cox)\b/i, label: "telecom", weight: -0.25 },
  { pattern: /\b(water|gas|electric|utility|erie county)\b/i, label: "utility", weight: -0.25 },
  { pattern: /\b(workers comp|liability ins|property ins|business ins)\b/i, label: "biz_insurance", weight: -0.25 },
  // Weak/ambiguous — credit cards need review, not auto-exclude
  { pattern: /\b(chase credit|amex|american express|barclaycard|discover card|citi card)\b/i, label: "credit_card", weight: -0.15 },
];

// ─── Vendor Family Patterns (for case grouping & subtypes) ──────────

import type { VendorSubtype } from "./types.ts";

export const VENDOR_FAMILY_PATTERNS: { pattern: RegExp; subtype: VendorSubtype }[] = [
  { pattern: /\b(chase credit|chase card|crd)\b/i, subtype: "credit_card_payment" },
  { pattern: /\b(amex|american express)\b/i, subtype: "credit_card_payment" },
  { pattern: /\bbarclaycard\b/i, subtype: "credit_card_payment" },
  { pattern: /\b(discover card|citi card)\b/i, subtype: "credit_card_payment" },
  { pattern: /\bpaypal\b/i, subtype: "paypal_transfer" },
  { pattern: /\b(stamps\.?com|usps|postage)\b/i, subtype: "postage_shipping" },
  { pattern: /\b(ups\w*|fedex|dhl|air\s*mailers?)\b/i, subtype: "postage_shipping" },
  { pattern: /\b(at.t|directv|verizon|comcast|spectrum|cox|cable|telecom)\b/i, subtype: "utilities_telecom" },
  { pattern: /\b(water|gas|electric|utility|erie county|power)\b/i, subtype: "utilities_telecom" },
  { pattern: /\b(insurance|erie|bcbs|aetna|cigna|united health|anthem|humana)\b/i, subtype: "insurance" },
  { pattern: /\b(sba|eidl|loan payment|term loan|mortgage|loan servicing)\b/i, subtype: "loan_debt_service" },
  { pattern: /\b(online banking|online xfer|online transfer)\b/i, subtype: "online_banking_transfer" },
  { pattern: /\b(owner draw|member draw|distribution|capital contribution|owner capital|partner dist)\b/i, subtype: "owner_draw" },
  { pattern: /\b(zelle|venmo|cash\s*app|cashapp)\b/i, subtype: "personal_app" },
];

/**
 * Detect vendor subtype from memo text.
 */
export function detectVendorSubtype(memo: string): VendorSubtype {
  for (const { pattern, subtype } of VENDOR_FAMILY_PATTERNS) {
    if (pattern.test(memo)) return subtype;
  }
  return "other_owner_related";
}

/**
 * Extract a stable grouping key from memo (e.g., COID for ACH).
 */
export function extractGroupingKey(memo: string): string | null {
  const coidMatch = memo.match(/COID[:\s]*(\d+)/i);
  if (coidMatch) return `COID_${coidMatch[1]}`;
  return null;
}
