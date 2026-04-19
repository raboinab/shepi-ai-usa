/**
 * GL Corroboration Layer
 *
 * Uses General Ledger vendor/payee data from QuickBooks to suppress
 * false-positive "owner" classifications. When a bank memo matches a
 * known GL business vendor, the classification is downgraded from
 * "owner" to "operating".
 *
 * Source hierarchy (strongest → weakest):
 * 1. GL vendor/payee (colData[3].value) — direct vendor match
 * 2. GL account name (header.colData[0].value) — account-family context
 * 3. Trial balance account names — weak fallback
 */

import type { ClassifiedTransaction, EvidenceAtom } from "./types.ts";
import { normalizeDescription } from "./normalize.ts";

// ─── Types ──────────────────────────────────────────────────────────

export interface GLVendorEntry {
  vendorName: string;       // original casing from GL
  accountName: string;      // parent GL account (e.g., "Postage & Shipping")
  txnCount: number;         // how many times this vendor appears in the GL
  sourceType: "general_ledger" | "trial_balance";
}

// Known expense account families that indicate business activity
const EXPENSE_ACCOUNT_FAMILIES: Record<string, string[]> = {
  shipping:   ["shipping", "postage", "freight", "delivery", "courier"],
  utilities:  ["utilities", "utility", "electric", "gas", "water", "power", "energy"],
  telecom:    ["telephone", "telecom", "internet", "communications", "phone", "wireless"],
  insurance:  ["insurance", "liability", "coverage", "premium"],
  supplies:   ["supplies", "office supplies", "materials"],
  rent:       ["rent", "lease", "occupancy"],
  advertising:["advertising", "marketing", "promotion"],
  repairs:    ["repairs", "maintenance", "service"],
  professional:["professional", "legal", "accounting", "consulting"],
  subscriptions:["subscriptions", "software", "saas", "cloud"],
};

function matchesExpenseFamily(accountName: string): string | null {
  const lower = accountName.toLowerCase();
  for (const [family, keywords] of Object.entries(EXPENSE_ACCOUNT_FAMILIES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return family;
    }
  }
  return null;
}

// ─── Registry Builder ───────────────────────────────────────────────

/**
 * Build a vendor registry from the project's General Ledger data.
 * Falls back to trial balance account names if no GL data exists.
 */
export async function buildGLVendorRegistry(
  adminClient: any,
  projectId: string,
): Promise<Map<string, GLVendorEntry>> {
  const registry = new Map<string, GLVendorEntry>();

  // 1. Try GL data first (strongest source) — fetch IDs only to avoid OOM
  const { data: glIds, error: glError } = await adminClient
    .from("processed_data")
    .select("id")
    .eq("project_id", projectId)
    .eq("data_type", "general_ledger")
    .limit(50);

  if (glError) {
    console.error("[GL_CORR] Error fetching GL IDs:", glError);
  }

  if (glIds && glIds.length > 0) {
    // Stream one record at a time to keep peak memory ~17MB instead of ~120MB
    for (const { id } of glIds) {
      const { data: record, error: recErr } = await adminClient
        .from("processed_data")
        .select("data")
        .eq("id", id)
        .single();

      if (recErr || !record) {
        console.warn(`[GL_CORR] Failed to fetch GL record ${id}:`, recErr);
        continue;
      }

      const data = record.data as any;
      if (!data?.rows?.row) continue;

      for (const accountRow of data.rows.row) {
        const accountName = accountRow?.header?.colData?.[0]?.value || "";
        const txnRows = accountRow?.rows?.row;
        if (!Array.isArray(txnRows)) continue;

        for (const txnRow of txnRows) {
          const colData = txnRow?.colData;
          if (!Array.isArray(colData) || colData.length < 4) continue;

          const vendorName = (colData[3]?.value || "").trim();
          if (!vendorName || vendorName.length < 2) continue;

          const normalizedVendor = normalizeDescription(vendorName);
          if (normalizedVendor.length < 2) continue;

          const existing = registry.get(normalizedVendor);
          if (existing) {
            existing.txnCount++;
          } else {
            registry.set(normalizedVendor, {
              vendorName,
              accountName,
              txnCount: 1,
              sourceType: "general_ledger",
            });
          }
        }
      }
      // record goes out of scope here → GC reclaims the ~17MB blob
    }

    // Filter out noise: only keep vendors with 2+ occurrences
    for (const [key, entry] of registry) {
      if (entry.txnCount < 2) {
        registry.delete(key);
      }
    }

    console.log(
      `[GL_CORR] Built GL vendor registry: ${registry.size} vendors from ${glIds.length} GL records (streamed)`,
    );

    if (registry.size > 0) return registry;
  }

  // 2. Fallback: trial balance account names (weaker) — stream one at a time
  const { data: tbIds, error: tbError } = await adminClient
    .from("processed_data")
    .select("id")
    .eq("project_id", projectId)
    .eq("data_type", "trial_balance")
    .limit(200);

  if (tbError) {
    console.error("[GL_CORR] Error fetching TB IDs:", tbError);
    return registry;
  }

  if (tbIds && tbIds.length > 0) {
    for (const { id } of tbIds) {
      const { data: record, error: recErr } = await adminClient
        .from("processed_data")
        .select("data")
        .eq("id", id)
        .single();

      if (recErr || !record) continue;

      const data = record.data as any;
      if (!data?.rows?.row) continue;

      for (const row of data.rows.row) {
        const accountName = row?.colData?.[0]?.value || "";
        if (!accountName || accountName.length < 3) continue;

        const normalized = normalizeDescription(accountName);
        if (!registry.has(normalized)) {
          registry.set(normalized, {
            vendorName: accountName,
            accountName,
            txnCount: 1,
            sourceType: "trial_balance",
          });
        }
      }
      // record goes out of scope → GC reclaims memory
    }

    console.log(
      `[GL_CORR] TB fallback: ${registry.size} account names from ${tbIds.length} TB records (streamed)`,
    );
  }

  return registry;
}

// ─── Suppression Logic ──────────────────────────────────────────────

/**
 * Determine match strength between a bank memo and the GL vendor registry.
 *
 * - strong: memo contains an exact GL vendor name that appeared 3+ times
 * - medium: memo token matches GL vendor AND parent account is a known expense family
 * - weak: only generic account-family overlap (not auto-suppressed)
 */
function evaluateMatch(
  memo: string,
  registry: Map<string, GLVendorEntry>,
): { strength: "strong" | "medium" | "weak" | "none"; entry: GLVendorEntry | null } {
  const normalizedMemo = normalizeDescription(memo);
  const memoTokens = normalizedMemo.split(/\s+/).filter(t => t.length >= 3);

  // Try exact vendor name match (substring in memo)
  for (const [normalizedVendor, entry] of registry) {
    if (entry.sourceType !== "general_ledger") continue;

    // Check if the full vendor name appears in the memo
    if (normalizedMemo.includes(normalizedVendor) && normalizedVendor.length >= 3) {
      if (entry.txnCount >= 3) {
        return { strength: "strong", entry };
      }
      // 2 occurrences + expense account family = medium
      const family = matchesExpenseFamily(entry.accountName);
      if (family) {
        return { strength: "medium", entry };
      }
    }

    // Check individual memo tokens against vendor name tokens
    const vendorTokens = normalizedVendor.split(/\s+/).filter(t => t.length >= 3);
    for (const vToken of vendorTokens) {
      if (vToken.length < 4) continue; // skip very short tokens
      for (const mToken of memoTokens) {
        // Token starts with vendor token (catches "UPSBILLCTR" matching "ups" vendor token)
        if (mToken.startsWith(vToken) || vToken.startsWith(mToken)) {
          if (entry.txnCount >= 3) {
            const family = matchesExpenseFamily(entry.accountName);
            if (family) {
              return { strength: "medium", entry };
            }
          }
        }
      }
    }
  }

  return { strength: "none", entry: null };
}

/**
 * Scan all classified transactions. For any classified as "owner",
 * check if the memo matches a known GL business vendor. If so,
 * downgrade to "operating".
 *
 * Mutates the array in place and returns the count of suppressed txns.
 */
export function suppressGLVendorFalsePositives(
  classified: ClassifiedTransaction[],
  registry: Map<string, GLVendorEntry>,
): number {
  if (registry.size === 0) return 0;

  let suppressed = 0;

  for (const txn of classified) {
    // Only look at owner-classified transactions
    if (txn.category !== "owner") continue;

    const { strength, entry } = evaluateMatch(txn.memo, registry);

    if (strength === "strong" || strength === "medium") {
      // Suppress: downgrade from owner → operating
      txn.category = "operating";
      txn.candidate_type = "operating";
      txn.confidence = 0.92;
      txn.evidence.push({
        type: "gl_corroboration",
        matched_vendor: entry!.vendorName,
        matched_account: entry!.accountName,
        source_type: entry!.sourceType,
        match_strength: strength,
        gl_txn_count: entry!.txnCount,
        weight: strength === "strong" ? 0.45 : 0.35,
      } as EvidenceAtom);
      suppressed++;
    }
    // weak / none → leave as-is for human review
  }

  return suppressed;
}
