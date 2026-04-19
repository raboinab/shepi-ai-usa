// ─── Related Party Registry Builder ─────────────────────────────────

import type { RawTransaction, RelatedPartyEntry } from "./types.ts";
import { hasKeyword, normalizeDescription } from "./normalize.ts";
import { OWNER_KEYWORDS, PERSONAL_APP_KEYWORDS, CONSUMER_CREDIT_KEYWORDS } from "./constants.ts";

export function buildRelatedPartyRegistryFromTransactions(
  allTxns: RawTransaction[],
  targetCompany: string | null,
  clientName: string | null,
  projectName: string | null,
): RelatedPartyEntry[] {
  const entries: RelatedPartyEntry[] = [];

  // 1. Project metadata names as baseline
  for (const name of [targetCompany, clientName, projectName].filter(Boolean) as string[]) {
    const words = name.split(/\s+/).filter(w => w.length >= 2);
    entries.push({
      full_name: name,
      short_names: words.length > 1 ? words : [],
      relationship: "owner",
    });
  }

  // 2. Mine transactions for recurring individual payees
  const PERSON_NAME_RE = /^[A-Z][a-z]+ [A-Z][a-z]+(\s[A-Z]\.?)?$/;
  const BUSINESS_SUFFIXES = /\b(llc|inc|corp|ltd|co|company|services|solutions|group|enterprises|associates|partners|consulting|management)\b/i;

  const nameFreq = new Map<string, { count: number; months: Set<string>; hasPersonalSignal: boolean }>();

  for (const txn of allTxns) {
    const name = (txn.name || "").trim();
    if (!name || name.length < 5) continue;
    if (BUSINESS_SUFFIXES.test(name)) continue;
    if (!PERSON_NAME_RE.test(name)) continue;

    const key = name.toLowerCase();
    let entry = nameFreq.get(key);
    if (!entry) {
      entry = { count: 0, months: new Set(), hasPersonalSignal: false };
      nameFreq.set(key, entry);
    }
    entry.count++;
    if (txn.date) entry.months.add(txn.date.slice(0, 7));

    if (
      hasKeyword(txn.memo, PERSONAL_APP_KEYWORDS) ||
      hasKeyword(txn.memo, OWNER_KEYWORDS) ||
      hasKeyword(txn.memo, CONSUMER_CREDIT_KEYWORDS) ||
      hasKeyword(txn.name || "", PERSONAL_APP_KEYWORDS)
    ) {
      entry.hasPersonalSignal = true;
    }
  }

  // Promote names seen 3+ times across 2+ months with at least one personal signal
  for (const [key, stats] of nameFreq) {
    if (stats.count >= 3 && stats.months.size >= 2 && stats.hasPersonalSignal) {
      const alreadyExists = entries.some(e => e.full_name.toLowerCase() === key);
      if (!alreadyExists) {
        const originalName = allTxns.find(t => (t.name || "").trim().toLowerCase() === key)?.name?.trim() || key;
        entries.push({
          full_name: originalName,
          short_names: originalName.split(/\s+/).filter(w => w.length >= 2),
          relationship: "owner",
        });
      }
    }
  }

  return entries;
}
