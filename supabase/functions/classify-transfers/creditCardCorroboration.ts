/**
 * Credit Card Corroboration Stage
 *
 * Cross-references bank-side credit card payments against uploaded credit card
 * statements in the project.  When a payment to a known business credit card is
 * detected the classification is downgraded from "owner" to "operating" so it
 * drops out of the review queue entirely.
 */

import type { ClassifiedTransaction, EvidenceAtom } from "./types.ts";

// ─── Types ──────────────────────────────────────────────────────────

export interface CreditCardRegistryEntry {
  documentId: string;
  accountLabel: string;        // e.g. "Southwest Chase"
  institution: string | null;  // e.g. "Chase"
  brandKeywords: string[];     // lowered tokens derived from label + institution
  looksPersonal: boolean;      // heuristic: lifestyle / personal card names
}

// ─── Brand extraction helpers ───────────────────────────────────────

const KNOWN_BRANDS: Record<string, string[]> = {
  chase:    ["chase"],
  amex:     ["amex", "american express"],
  discover: ["discover"],
  citi:     ["citi", "citibank"],
  barclay:  ["barclay", "barclaycard"],
  capital_one: ["capital one", "capitalone"],
  mastercard: ["mastercard"],
  visa:     ["visa"],
};

/** Turn a label like "Southwest Chase" into brand keywords ["chase","southwest"] */
function extractBrandKeywords(label: string, institution: string | null): string[] {
  const combined = `${label} ${institution || ""}`.toLowerCase();
  const tokens = combined.split(/[\s,\-\/]+/).filter(Boolean);
  // Also check for multi-word brand matches
  const keywords = new Set<string>(tokens);
  for (const [brand, aliases] of Object.entries(KNOWN_BRANDS)) {
    for (const alias of aliases) {
      if (combined.includes(alias)) {
        keywords.add(brand);
        keywords.add(alias);
      }
    }
  }
  return [...keywords];
}

const PERSONAL_CARD_SIGNALS = [
  "carnival", "royal caribbean", "disney", "marriott bonvoy",
  "hilton", "southwest rapid rewards personal", "delta skymiles personal",
  "coinbase", "crypto", "robinhood",
];

function looksPersonal(label: string, institution: string | null): boolean {
  const combined = `${label} ${institution || ""}`.toLowerCase();
  return PERSONAL_CARD_SIGNALS.some(sig => combined.includes(sig));
}

// ─── Registry builder ───────────────────────────────────────────────

/**
 * Query all credit card documents for the project and build a registry of
 * known business credit cards with their brand keywords.
 */
export async function buildCreditCardRegistry(
  adminClient: any,
  projectId: string,
): Promise<CreditCardRegistryEntry[]> {
  const { data: docs, error } = await adminClient
    .from("documents")
    .select("id, account_label, institution, account_type")
    .eq("project_id", projectId)
    .eq("account_type", "credit_card");

  if (error) {
    console.error("[CC_CORR] Error fetching credit card documents:", error);
    return [];
  }

  if (!docs || docs.length === 0) {
    console.log("[CC_CORR] No credit card documents found for project");
    return [];
  }

  const registry: CreditCardRegistryEntry[] = [];

  for (const doc of docs) {
    const label = (doc.account_label as string) || "";
    const inst = (doc.institution as string) || null;
    if (!label) continue;

    registry.push({
      documentId: doc.id,
      accountLabel: label,
      institution: inst,
      brandKeywords: extractBrandKeywords(label, inst),
      looksPersonal: looksPersonal(label, inst),
    });
  }

  console.log(
    `[CC_CORR] Built registry: ${registry.length} credit cards — ` +
    registry.map(r => `${r.accountLabel} [${r.looksPersonal ? "personal" : "business"}]`).join(", "),
  );

  return registry;
}

// ─── Suppression logic ──────────────────────────────────────────────

/** Extract brand signal from a bank memo like "CHASE CREDIT CRD DES:EPAY..." */
function extractBrandFromMemo(memo: string): string[] {
  const lower = memo.toLowerCase();
  const found: string[] = [];
  for (const [brand, aliases] of Object.entries(KNOWN_BRANDS)) {
    for (const alias of aliases) {
      if (lower.includes(alias)) {
        found.push(brand);
        break;
      }
    }
  }
  return found;
}

/**
 * Scan all classified transactions.  For any classified as "owner" with
 * subtype "credit_card_payment", check if the memo brand matches a known
 * business credit card.  If so, downgrade to "operating".
 *
 * Mutates the array in place and returns the count of suppressed txns.
 */
export function suppressCreditCardFalsePositives(
  classified: ClassifiedTransaction[],
  registry: CreditCardRegistryEntry[],
): number {
  if (registry.length === 0) return 0;

  // Build a quick set of brand keywords from business-only cards
  const businessCards = registry.filter(r => !r.looksPersonal);
  if (businessCards.length === 0) return 0;

  let suppressed = 0;

  for (const txn of classified) {
    // Only look at owner-classified credit card payments
    if (txn.category !== "owner") continue;
    if (txn.subtype !== "credit_card_payment") continue;

    const memoBrands = extractBrandFromMemo(txn.memo);
    if (memoBrands.length === 0) continue;

    // Check if any memo brand matches a business card in the registry
    let matchedCard: CreditCardRegistryEntry | null = null;
    for (const card of businessCards) {
      for (const brand of memoBrands) {
        if (card.brandKeywords.includes(brand)) {
          matchedCard = card;
          break;
        }
      }
      if (matchedCard) break;
    }

    if (matchedCard) {
      // Suppress: downgrade from owner → operating
      txn.category = "operating";
      txn.candidate_type = "operating";
      txn.confidence = 0.90;
      txn.evidence.push({
        type: "credit_card_corroboration",
        card_label: matchedCard.accountLabel,
        card_institution: matchedCard.institution || "",
        weight: 0.40,
      } as EvidenceAtom);
      suppressed++;
    }
  }

  return suppressed;
}
