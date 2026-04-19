export interface CoaAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  fsType: "BS" | "IS";
  category: string;
  accountSubtype?: string;   // From qbToJson accountSubType field
  classification?: string;   // QuickBooks classification (REVENUE, EXPENSE, ASSET, etc.)
  isUserEdited?: boolean;    // Track if user has modified this account
  originalName?: string;     // Store original name for matching
}

export interface MergeResult {
  accounts: CoaAccount[];
  stats: {
    added: number;
    merged: number;
    preserved: number;  // User-edited accounts that weren't overwritten
  };
}

// Balance Sheet account types from QuickBooks
const BS_TYPES = [
  'asset', 'bank', 'accounts receivable', 'other current asset', 
  'fixed asset', 'other asset',
  'liability', 'accounts payable', 'credit card', 'other current liability', 
  'long term liability', 'other liability',
  'equity'
];

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
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
}

// Find a matching account using multiple criteria
export function findMatchingAccount(
  account: CoaAccount, 
  existingAccounts: CoaAccount[]
): CoaAccount | undefined {
  const normalizedName = normalizeAccountName(account.accountName);
  const accountNum = (account.accountNumber || '').trim();
  
  return existingAccounts.find(existing => {
    const existingNum = (existing.accountNumber || '').trim();
    
    // Match by account number (exact match, if both have numbers)
    if (accountNum && existingNum && accountNum === existingNum) {
      return true;
    }
    
    // Match by normalized name
    const existingNormalized = normalizeAccountName(existing.accountName);
    if (normalizedName && existingNormalized && normalizedName === existingNormalized) {
      return true;
    }
    
    // Match by original name (if stored)
    if (existing.originalName) {
      const originalNormalized = normalizeAccountName(existing.originalName);
      if (normalizedName && originalNormalized && normalizedName === originalNormalized) {
        return true;
      }
    }
    
    return false;
  });
}

// Transform qbToJson COA data to our Account format
export function transformCoaData(data: any): CoaAccount[] {
  // Handle multiple data formats:
  // 1. Direct array: [...accounts...] (qbtojson format)
  // 2. Wrapped object: { accounts: [...] } or { Accounts: [...] }
  let accounts: any[];
  
  if (Array.isArray(data)) {
    // Data is already an array (qbtojson format)
    accounts = data;
  } else {
    // Data is wrapped in an object
    accounts = data?.accounts || data?.Accounts || [];
  }
  
  if (!Array.isArray(accounts)) return [];
  
  const result = accounts.map((acc: any, index: number) => {
    const accountName = acc.Name || acc.name || acc.accountName || acc.fullyQualifiedName || '';
    const accountNumber = acc.AcctNum || acc.acctNum || acc.accountNumber || acc.number || acc.id?.toString() || '';
    
    // Extract accountSubtype from qbToJson (accountSubType) or other formats
    const accountSubtype = acc.accountSubType || acc.accountSubtype || acc.subtype || '';
    
    // Extract classification (QB uses uppercase: REVENUE, EXPENSE, ASSET, etc.)
    const classification = acc.classification || acc.Classification || '';
    
    // Check if fsType and category are already provided (pre-processed data from edge function)
    const hasPreprocessedData = acc.fsType && acc.category;
    
    if (hasPreprocessedData) {
      // Data is already in our format from the edge function - use it directly
      return {
        id: index + 1,
        accountNumber,
        accountName,
        fsType: acc.fsType as "BS" | "IS",
        category: acc.category,
        accountSubtype,
        classification,
        originalName: accountName,
      };
    }
    
    // Raw data without backend enrichment - use simple defaults, empty = bug visible
    return {
      id: index + 1,
      accountNumber,
      accountName,
      fsType: acc.fsType || 'BS',  // Simple default, not derived
      category: acc.category || '',  // Empty = bug visible
      accountSubtype,
      classification,
      originalName: accountName,  // Store for future matching
    };
  });

  // Auto-assign account numbers to accounts missing them (belt-and-suspenders)
  let nextAutoNum = 10000;
  const usedNumbers = new Set(result.map(a => a.accountNumber).filter(Boolean));
  for (const acc of result) {
    if (!acc.accountNumber) {
      while (usedNumbers.has(String(nextAutoNum))) nextAutoNum++;
      acc.accountNumber = String(nextAutoNum);
      usedNumbers.add(acc.accountNumber);
      nextAutoNum++;
    }
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
      // Found a match - decide whether to update
      const matchIndex = result.findIndex(a => a.id === match.id);
      
      if (match.isUserEdited) {
        // User has edited this account - preserve their changes
        stats.preserved++;
        // Optionally update the original name for future matching
        result[matchIndex] = {
          ...match,
          originalName: match.originalName || incomingAcc.accountName,
        };
      } else {
        // No user edits - update with incoming data
        stats.merged++;
        result[matchIndex] = {
          ...incomingAcc,
          id: match.id,  // Keep the original ID
          originalName: match.accountName,  // Store for future matching
        };
      }
    } else {
      // No match - add as new account
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
  
  return { accounts: finalAccounts, stats };
}
