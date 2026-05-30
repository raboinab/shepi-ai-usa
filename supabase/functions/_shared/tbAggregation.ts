// Shared trial-balance aggregation helpers.
//
// Resolves COA matches and dedup keys using a strict priority:
//   1. accountId         (QB Id — most reliable)
//   2. real accountNumber (skip if synthesized from id)
//   3. fullyQualifiedName (preserves Income:Job Materials vs Expense:Job Materials)
//   4. leaf name + type + subtype (only if exactly one COA candidate matches)
//
// Never merges two TB rows on bare leaf name alone — that was the bug that
// silently collapsed accounts like Job Materials (Income) + Job Materials
// (Expense) and the two Unapplied Cash accounts into single rows.

export type CoaAccount = Record<string, unknown>;

export type MatchSource = "id" | "number" | "fqn" | "name+type" | "unmatched";

export interface CoaLookupMaps {
  byId: Map<string, CoaAccount>;
  byRealNumber: Map<string, CoaAccount>;
  byFqn: Map<string, CoaAccount>;
  byName: Map<string, CoaAccount[]>;
}

export interface MatchCounts {
  id: number;
  number: number;
  fqn: number;
  name: number;
  unmatched: number;
  ambiguous: number;
}

export interface RowKeys {
  accountId: string;
  accountNumber: string;
  fullyQualifiedName: string;
  accountName: string;
  accountType: string;
  accountSubtype: string;
}

const normalizeFqn = (fqn: string): string =>
  fqn.toLowerCase().replace(/\s*:\s*/g, ":").trim();

const normalizeName = (name: string): string => name.toLowerCase().trim();

/**
 * An accountNumber is "synthesized" (= just the QB id falling through the
 * `acctNum || qbId` pattern) and must not be used as a match key. We detect
 * this by checking equality with accountId, or an explicit `_autoNumbered`
 * flag if upstream set it.
 */
const isRealAccountNumber = (acct: CoaAccount): boolean => {
  if (acct._autoNumbered === true) return false;
  const num = String(acct.accountNumber || "");
  const id = String(acct.accountId || "");
  if (!num) return false;
  if (id && num === id) return false; // synthesized fallback
  return true;
};

export function buildCoaLookupMaps(accounts: CoaAccount[]): CoaLookupMaps {
  const byId = new Map<string, CoaAccount>();
  const byRealNumber = new Map<string, CoaAccount>();
  const byFqn = new Map<string, CoaAccount>();
  const byName = new Map<string, CoaAccount[]>();

  for (const acct of accounts) {
    const id = String(acct.accountId || "");
    if (id) byId.set(id, acct);

    if (isRealAccountNumber(acct)) {
      byRealNumber.set(String(acct.accountNumber), acct);
    }

    const fqn = String(acct.fullyQualifiedName || "");
    if (fqn) byFqn.set(normalizeFqn(fqn), acct);

    const name = String(acct.accountName || "");
    if (name) {
      const k = normalizeName(name);
      const arr = byName.get(k) ?? [];
      arr.push(acct);
      byName.set(k, arr);
    }
  }

  return { byId, byRealNumber, byFqn, byName };
}

export interface ResolvedMatch {
  match: CoaAccount | undefined;
  source: MatchSource;
  ambiguous: boolean;
}

export function resolveCoaMatch(
  row: RowKeys,
  maps: CoaLookupMaps,
): ResolvedMatch {
  // 1. accountId
  if (row.accountId) {
    const m = maps.byId.get(row.accountId);
    if (m) return { match: m, source: "id", ambiguous: false };
  }

  // 2. real accountNumber (skip if it's just the same as accountId fallback)
  if (row.accountNumber && row.accountNumber !== row.accountId) {
    const m = maps.byRealNumber.get(row.accountNumber);
    if (m) return { match: m, source: "number", ambiguous: false };
  }

  // 3. fullyQualifiedName
  if (row.fullyQualifiedName) {
    const m = maps.byFqn.get(normalizeFqn(row.fullyQualifiedName));
    if (m) return { match: m, source: "fqn", ambiguous: false };
  }

  // 4. leaf name + (type/subtype) tiebreak
  if (row.accountName) {
    const candidates = maps.byName.get(normalizeName(row.accountName)) ?? [];
    if (candidates.length === 1) {
      return { match: candidates[0], source: "name+type", ambiguous: false };
    }
    if (candidates.length > 1) {
      const type = row.accountType.toLowerCase();
      const subtype = row.accountSubtype.toLowerCase();
      const filtered = candidates.filter((c) => {
        const ct = String(c.accountType || c.category || "").toLowerCase();
        const cs = String(c.accountSubtype || "").toLowerCase();
        if (type && ct && ct !== type) return false;
        if (subtype && cs && cs !== subtype) return false;
        return true;
      });
      if (filtered.length === 1) {
        return { match: filtered[0], source: "name+type", ambiguous: false };
      }
      return { match: undefined, source: "unmatched", ambiguous: true };
    }
  }

  return { match: undefined, source: "unmatched", ambiguous: false };
}

/**
 * Dedup key for the per-period accountMap. Same priority as the match
 * resolver, but always returns a stable key for the row (even when COA
 * lookup fails) — falling back to a composite that includes type+subtype+fqn
 * so leaf-name collisions don't merge.
 */
export function buildAccountKey(row: RowKeys): string {
  if (row.accountId) return `id:${row.accountId}`;
  if (row.accountNumber) return `num:${row.accountNumber}`;
  if (row.fullyQualifiedName) {
    return `fqn:${normalizeFqn(row.fullyQualifiedName)}`;
  }
  // Composite fallback — never collapse on bare leaf name.
  return [
    "nm",
    normalizeName(row.accountName),
    row.accountType.toLowerCase(),
    row.accountSubtype.toLowerCase(),
  ].join(":");
}

export function emptyMatchCounts(): MatchCounts {
  return { id: 0, number: 0, fqn: 0, name: 0, unmatched: 0, ambiguous: 0 };
}

export function tallyMatch(counts: MatchCounts, r: ResolvedMatch): void {
  if (r.ambiguous) counts.ambiguous += 1;
  switch (r.source) {
    case "id": counts.id += 1; break;
    case "number": counts.number += 1; break;
    case "fqn": counts.fqn += 1; break;
    case "name+type": counts.name += 1; break;
    case "unmatched": counts.unmatched += 1; break;
  }
}
