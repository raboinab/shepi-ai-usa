// ─── Case Builder: post-classification vendor-family grouping ────────

import type { ClassifiedTransaction, VendorSubtype } from "./types.ts";
import { detectVendorSubtype, extractGroupingKey } from "./constants.ts";

/**
 * Assigns case_ids and subtypes to owner-category transactions based on
 * vendor family detection. Interbank and operating transactions keep their
 * existing case_ids. Owner transactions are grouped by vendor family +
 * optional COID for sub-grouping.
 *
 * Mutates transactions in place for efficiency.
 */
export function buildVendorFamilyCases(
  transactions: ClassifiedTransaction[],
): void {
  // Group owner transactions by vendor family + grouping key
  const ownerGroups = new Map<string, ClassifiedTransaction[]>();
  let interbankCaseCounter = 0;
  let operatingCaseCounter = 0;

  for (const txn of transactions) {
    if (txn.category === "interbank") {
      // Keep existing pair-based case_id or assign one
      if (!txn.case_id || txn.case_id.startsWith("case_internal_")) {
        // Already has a good case_id from pair matching
      }
      continue;
    }

    if (txn.category === "operating") {
      // Operating transactions don't need case grouping
      continue;
    }

    // Owner category: detect vendor family
    const subtype = detectVendorSubtype(txn.memo);
    txn.subtype = subtype;

    // Build grouping key: subtype + optional COID
    const coid = extractGroupingKey(txn.memo);
    const groupKey = coid ? `${subtype}_${coid}` : subtype;

    if (!ownerGroups.has(groupKey)) {
      ownerGroups.set(groupKey, []);
    }
    ownerGroups.get(groupKey)!.push(txn);
  }

  // Assign case_ids to owner groups
  for (const [groupKey, txns] of ownerGroups) {
    const caseId = `case_owner_${groupKey}`;
    for (const txn of txns) {
      txn.case_id = caseId;
    }
  }
}

/**
 * Human-readable label for a vendor subtype.
 */
export const SUBTYPE_LABELS: Record<VendorSubtype, string> = {
  credit_card_payment: "Credit Card Payments",
  paypal_transfer: "PayPal Transfers",
  postage_shipping: "Postage & Shipping",
  utilities_telecom: "Utilities & Telecom",
  insurance: "Insurance Payments",
  loan_debt_service: "Loan & Debt Service",
  online_banking_transfer: "Online Banking Transfers",
  owner_draw: "Owner Draws & Distributions",
  personal_app: "Personal App Transfers",
  other_owner_related: "Other Owner-Related",
};
