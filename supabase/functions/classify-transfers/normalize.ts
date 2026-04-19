// ─── Normalization Utilities ─────────────────────────────────────────

export function normalizeDescription(memo: string): string {
  return memo
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** FNV-1a 32-bit content hash for stable transaction IDs */
export function contentHash(amount: number, date: string, memo: string, accountKey: string): string {
  const input = `${amount}|${(date || "").trim()}|${(memo || "").substring(0, 100).trim().toLowerCase()}|${accountKey}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return `txn_${hash.toString(16).padStart(8, "0")}`;
}

/** Derive a stable account fingerprint from bank statement metadata */
export function deriveAccountKey(record: { id: string; data: Record<string, unknown> }): string {
  const d = record.data || {};
  const acctNum = ((d.accountNumber as string) || (d.account_number as string) || "").replace(/\D/g, "").slice(-4);
  const bankName = normalizeDescription((d.bankName as string) || (d.bank_name as string) || (d.institutionName as string) || (d.institution_name as string) || "");
  const acctName = normalizeDescription((d.accountName as string) || (d.account_name as string) || (d.accountLabel as string) || (d.account_label as string) || "");

  if (acctNum && bankName) return `${bankName}_${acctNum}`;
  if (acctNum) return `acct_${acctNum}`;
  if (acctName) return acctName;
  return record.id;
}

export function hasKeyword(text: string, keywords: string[]): string | null {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

export function dateDiffDays(a: string, b: string): number {
  try {
    const da = new Date(a);
    const db = new Date(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return 999;
    return Math.round((da.getTime() - db.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}
