export interface CoaAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  fsType: "BS" | "IS";
  category: string;
  accountSubtype?: string;   // From qbToJson accountSubType field
  classification?: string;   // QuickBooks classification (REVENUE, EXPENSE, ASSET, etc.)
  accountId?: string;        // QuickBooks Id - primary discriminator
  fullyQualifiedName?: string; // e.g. "Landscaping Services:Job Materials" - parent-aware
  parentRef?: string;        // QuickBooks ParentRef.value
  isUserEdited?: boolean;    // Track if user has modified this account
  originalName?: string;     // Store original name for matching
  _autoNumbered?: boolean;   // Marks accounts whose accountNumber was synthesized
}

export interface MergeResult {
  accounts: CoaAccount[];
  stats: {
    added: number;
    merged: number;
    preserved: number;  // User-edited accounts that weren't overwritten
  };
}

// Common accounting abbreviation mappings
const ABBREVIATION_MAP: Record<string, string[]> = {
  'accounts receivable': ['a/r', 'ar', 'accts rec', 'acct receivable', 'accts receivable'],
  'accounts payable': ['a/p', 'ap', 'accts pay', 'acct payable', 'accts payable'],
  'cash': ['cash on hand', 'cash in bank', 'petty cash'],
  'retained earnings': ['ret earnings', 'r/e', 're', 'retained earn'],
  'cost of goods sold': ['cogs', 'cost of sales', 'cos'],
  'depreciation': ['depr', 'deprec', 'accum depr', 'accumulated depreciation'],
  'prepaid expenses': ['prepaid', 'prepaids', 'prepaid exp'],
  'accrued expenses': ['accrued exp', 'accruals', 'accrued liabilities'],
  'notes payable': ['notes pay', 'n/p'],
  'notes receivable': ['notes rec', 'n/r'],
  'inventory': ['inv', 'merchandise inventory', 'merchandise inv'],
  'payroll expenses': ['payroll', 'payroll exp', 'salaries', 'wages', 'salaries & wages'],
  'office supplies': ['office sup', 'supplies'],
  'rent expense': ['rent', 'rent exp'],
  'utilities expense': ['utilities', 'utilities exp', 'util exp'],
  'insurance expense': ['insurance', 'insurance exp', 'ins exp'],
  'professional fees': ['prof fees', 'legal fees', 'consulting fees'],
};


// Normalize account name for comparison
export function normalizeAccountName(name: string): string {
  const lower = (name || '').toLowerCase().trim();

  // Check if this matches any known abbreviation
  for (const [canonical, variations] of Object.entries(ABBREVIATION_MAP)) {
    if (variations.includes(lower) || lower === canonical) {
      return canonical;
    }
  }

  // Remove common noise words and punctuation for comparison
  return lower
    .replace(/[^\w\s:]/g, '')  // Remove punctuation EXCEPT ':' (preserves FQN parent path)
    .replace(/\s+/g, ' ')
    .trim();
}

// Find a matching account using prioritized discriminators.
// Priority: accountId > real accountNumber > fullyQualifiedName > leaf-name + classification + subtype.
// CRITICAL: bare leaf-name matching is no longer allowed — it incorrectly merged
// distinct QB sub-accounts that share a leaf (e.g. "Job Materials" under both
// Landscaping Services [income] and Job Expenses [expense]).
export function findMatchingAccount(
  account: CoaAccount,
  existingAccounts: CoaAccount[]
): CoaAccount | undefined {
  const acctId = (account.accountId || '').trim();
  const acctNumRaw = (account.accountNumber || '').trim();
  const isAutoNum = !!account._autoNumbered;
  const acctNum = isAutoNum ? '' : acctNumRaw;
  const fqn = normalizeAccountName(account.fullyQualifiedName || '');
  const leaf = normalizeAccountName(account.accountName);
  const classification = (account.classification || '').toLowerCase().trim();
  const subtype = (account.accountSubtype || '').toLowerCase().trim();

  // 1. accountId exact match
  if (acctId) {
    const m = existingAccounts.find(e => (e.accountId || '').trim() === acctId);
    if (m) return m;
  }

  // 2. Real (non-synthesized) accountNumber exact match
  if (acctNum) {
    const m = existingAccounts.find(e => {
      if (e._autoNumbered) return false;
      return (e.accountNumber || '').trim() === acctNum;
    });
    if (m) return m;
  }

  // 3. fullyQualifiedName match (preserves parent path)
  if (fqn) {
    const m = existingAccounts.find(e => {
      const eFqn = normalizeAccountName(e.fullyQualifiedName || '');
      return eFqn && eFqn === fqn;
    });
    if (m) return m;
  }

  // 4. Leaf-name match ONLY if classification AND subtype also match,
  //    AND neither side has a non-empty fullyQualifiedName that disagrees.
  //    This prevents merging "Equipment Rental" (root) with
  //    "Job Expenses:Equipment Rental" (sub-account) — they are distinct
  //    QuickBooks accounts even though leaf + subtype + classification all match.
  if (leaf) {
    const m = existingAccounts.find(e => {
      const eLeaf = normalizeAccountName(e.accountName);
      const eOrig = normalizeAccountName(e.originalName || '');
      const nameHit = eLeaf === leaf || (eOrig && eOrig === leaf);
      if (!nameHit) return false;
      const eClass = (e.classification || '').toLowerCase().trim();
      const eSub = (e.accountSubtype || '').toLowerCase().trim();
      const classOk = classification === eClass;
      const subOk = subtype === eSub;
      if (!classOk || !subOk) return false;
      // If either side carries a fullyQualifiedName, require it to match.
      const eFqn = normalizeAccountName(e.fullyQualifiedName || '');
      if (fqn || eFqn) return fqn === eFqn;
      return true;
    });
    if (m) return m;
  }

  return undefined;
}

// Transform qbToJson COA data to our Account format
export function transformCoaData(data: any): CoaAccount[] {
  // Handle multiple data formats:
  // 1. Direct array: [...accounts...] (qbtojson format)
  // 2. Wrapped object: { accounts: [...] } or { Accounts: [...] }
  let accounts: any[];

  if (Array.isArray(data)) {
    accounts = data;
  } else {
    accounts = data?.accounts || data?.Accounts || [];
  }

  if (!Array.isArray(accounts)) return [];

  const result: CoaAccount[] = accounts.map((acc: any, index: number) => {
    const accountName = acc.Name || acc.name || acc.accountName || '';
    const fullyQualifiedName = acc.FullyQualifiedName || acc.fullyQualifiedName || '';
    const displayName = accountName || fullyQualifiedName || '';
    const accountNumber = acc.AcctNum || acc.acctNum || acc.accountNumber || acc.number || '';
    const accountId = String(acc.Id || acc.id || acc.accountId || '');
    const parentRef = String(
      acc?.ParentRef?.value || acc?.parentRef?.value || acc?.parentRef || acc?.parentId || ''
    );

    const accountSubtype = acc.accountSubType || acc.accountSubtype || acc.subtype || acc.AccountSubType || '';
    const classification = acc.classification || acc.Classification || '';

    const hasPreprocessedData = acc.fsType && acc.category;

    if (hasPreprocessedData) {
      return {
        id: index + 1,
        accountNumber,
        accountName: displayName,
        fsType: acc.fsType as "BS" | "IS",
        category: acc.category,
        accountSubtype,
        classification,
        accountId,
        fullyQualifiedName,
        parentRef,
        originalName: displayName,
      };
    }

    return {
      id: index + 1,
      accountNumber,
      accountName: displayName,
      fsType: acc.fsType || 'BS',
      category: acc.category || '',
      accountSubtype,
      classification,
      accountId,
      fullyQualifiedName,
      parentRef,
      originalName: displayName,
    };
  });

  // Auto-assign account numbers to accounts missing them, but mark them as
  // synthesized so the matcher won't collide on them.
  let nextAutoNum = 90000;
  const usedNumbers = new Set(result.map(a => a.accountNumber).filter(Boolean));
  for (const acc of result) {
    if (!acc.accountNumber) {
      while (usedNumbers.has(String(nextAutoNum))) nextAutoNum++;
      acc.accountNumber = String(nextAutoNum);
      acc._autoNumbered = true;
      usedNumbers.add(acc.accountNumber);
      nextAutoNum++;
    }
  }

  if (typeof console !== 'undefined') {
    console.log(`[transformCoaData] in=${accounts.length} out=${result.length}`);
  }

  return result;
}

// Merge accounts with smart matching, preserving user edits
export function mergeCoaAccounts(
  existing: CoaAccount[],
  incoming: CoaAccount[]
): MergeResult {
  const result: CoaAccount[] = [...existing];
  const stats = { added: 0, merged: 0, preserved: 0 };

  for (const incomingAcc of incoming) {
    const match = findMatchingAccount(incomingAcc, result);

    if (match) {
      const matchIndex = result.findIndex(a => a.id === match.id);

      if (match.isUserEdited) {
        stats.preserved++;
        result[matchIndex] = {
          ...match,
          originalName: match.originalName || incomingAcc.accountName,
        };
      } else {
        stats.merged++;
        result[matchIndex] = {
          ...incomingAcc,
          id: match.id,
          originalName: match.accountName,
        };
      }
    } else {
      stats.added++;
      result.push({
        ...incomingAcc,
        id: result.length + 1,
        originalName: incomingAcc.accountName,
      });
    }
  }

  // Reassign sequential IDs
  const finalAccounts = result.map((acc, index) => ({
    ...acc,
    id: index + 1,
  }));

  if (typeof console !== 'undefined') {
    console.log(
      `[mergeCoaAccounts] existing=${existing.length} incoming=${incoming.length} ` +
      `result=${finalAccounts.length} (+${stats.added} new, ${stats.merged} updated, ${stats.preserved} preserved)`
    );
  }

  return { accounts: finalAccounts, stats };
}
