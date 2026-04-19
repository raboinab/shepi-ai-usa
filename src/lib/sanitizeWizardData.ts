/**
 * Truncates large arrays in wizardData before sending to the edge function
 * to prevent oversized payloads and memory issues.
 */
export function sanitizeWizardData(wizardData: any): any {
  if (!wizardData || typeof wizardData !== 'object') return wizardData;

  const sanitized = { ...wizardData };

  // Cap trialBalance.accounts at 50
  if (sanitized.trialBalance?.accounts?.length > 50) {
    sanitized.trialBalance = {
      ...sanitized.trialBalance,
      accounts: sanitized.trialBalance.accounts.slice(0, 50),
      _truncated: true,
      _totalAccounts: sanitized.trialBalance.accounts.length,
    };
  }

  // Cap chartOfAccounts at 50
  if (Array.isArray(sanitized.chartOfAccounts) && sanitized.chartOfAccounts.length > 50) {
    const total = sanitized.chartOfAccounts.length;
    sanitized.chartOfAccounts = sanitized.chartOfAccounts.slice(0, 50);
    sanitized._chartOfAccountsTruncated = true;
    sanitized._chartOfAccountsTotal = total;
  }

  // Strip raw generalLedger transactions (edge function gets this from DB)
  if (sanitized.generalLedger) {
    sanitized.generalLedger = undefined;
  }

  // Cap arAging detail entries at 20
  if (sanitized.arAging) {
    const entries = sanitized.arAging.entries || sanitized.arAging.customers;
    if (Array.isArray(entries) && entries.length > 20) {
      sanitized.arAging = {
        ...sanitized.arAging,
        ...(sanitized.arAging.entries ? { entries: entries.slice(0, 20) } : { customers: entries.slice(0, 20) }),
        _truncated: true,
        _totalEntries: entries.length,
      };
    }
  }

  // Cap apAging detail entries at 20
  if (sanitized.apAging) {
    const entries = sanitized.apAging.entries || sanitized.apAging.vendors;
    if (Array.isArray(entries) && entries.length > 20) {
      sanitized.apAging = {
        ...sanitized.apAging,
        ...(sanitized.apAging.entries ? { entries: entries.slice(0, 20) } : { vendors: entries.slice(0, 20) }),
        _truncated: true,
        _totalEntries: entries.length,
      };
    }
  }

  return sanitized;
}
