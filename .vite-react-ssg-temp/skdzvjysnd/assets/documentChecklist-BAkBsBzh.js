const DD_CHECKLIST_BASE = [
  // TIER 1: REQUIRED (4) - Core foundation, cannot proceed without
  { id: "chartOfAccounts", label: "Chart of Accounts", tier: "required", docType: "chart_of_accounts", needsPeriodCoverage: false, canBeNA: false, checkWizardSection: "chartOfAccounts", sectionNav: { phase: 2, section: 1, label: "Chart of Accounts" } },
  { id: "trialBalance", label: "Detailed Trial Balance", tier: "required", docType: null, needsPeriodCoverage: false, canBeNA: false, checkWizardSection: "trialBalance", sectionNav: { phase: 2, section: 2, label: "Trial Balance" } },
  { id: "generalLedger", label: "General Ledger (full review period)", tier: "required", docType: "general_ledger", needsPeriodCoverage: true, canBeNA: false, checkWizardSection: "generalLedger", sectionNav: { phase: 2, section: 3, label: "Documents" } },
  { id: "bankStatements", label: "Bank Statements (full review period)", tier: "required", docType: "bank_statement", needsPeriodCoverage: true, canBeNA: false, checkWizardSection: "bankStatements", sectionNav: { phase: 2, section: 3, label: "Documents" } },
  // TIER 2: RECOMMENDED (15) - Standard professional QoE analysis
  { id: "arAging", label: "AR Aging Report", tier: "recommended", docType: "ar_aging", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "arAging", sectionNav: { phase: 3, section: 4, label: "AR Aging" } },
  { id: "apAging", label: "AP Aging Report", tier: "recommended", docType: "ap_aging", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "apAging", sectionNav: { phase: 3, section: 5, label: "AP Aging" } },
  { id: "payrollReports", label: "Payroll Reports/Registers", tier: "recommended", docType: "payroll", needsPeriodCoverage: true, canBeNA: true, checkWizardSection: "payroll", sectionNav: { phase: 3, section: 8, label: "Payroll" } },
  { id: "fixedAssets", label: "Depreciation Schedule / Fixed Assets", tier: "recommended", docType: "depreciation_schedule", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "fixedAssets", sectionNav: { phase: 3, section: 6, label: "Fixed Assets" } },
  { id: "taxReturns", label: "Tax Returns (3 years)", tier: "recommended", docType: "tax_return", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: null, sectionNav: { phase: 2, section: 3, label: "Documents" } },
  { id: "journalEntries", label: "Journal Entries", tier: "recommended", docType: "journal_entries", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "journalEntries", sectionNav: { phase: 3, section: 3, label: "Journal Entries" } },
  { id: "creditCardStatements", label: "Credit Card Statements", tier: "recommended", docType: "credit_card", needsPeriodCoverage: true, canBeNA: true, checkWizardSection: null, sectionNav: { phase: 2, section: 3, label: "Documents" } },
  { id: "customerList", label: "Top Customers List", tier: "recommended", docType: "customer_concentration", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "topCustomers", sectionNav: { phase: 4, section: 1, label: "Top Customers" } },
  { id: "vendorList", label: "Top Vendors List", tier: "recommended", docType: "vendor_concentration", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "topVendors", sectionNav: { phase: 4, section: 2, label: "Top Vendors" } },
  { id: "inventory", label: "Inventory Listing", tier: "recommended", docType: "inventory", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "inventory", sectionNav: { phase: 3, section: 7, label: "Inventory" }, conditional: true },
  { id: "debtSchedule", label: "Debt Schedule", tier: "recommended", docType: "debt_schedule", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "supplementary", sectionNav: { phase: 3, section: 9, label: "Supplementary" } },
  { id: "contracts", label: "Material Contracts", tier: "recommended", docType: "material_contract", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "materialContracts", sectionNav: { phase: 3, section: 10, label: "Material Contracts" } },
  { id: "leaseAgreements", label: "Lease Agreements", tier: "recommended", docType: "lease_agreement", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: null, sectionNav: null },
  { id: "supportingDocs", label: "Supporting Documents", tier: "recommended", docType: "supporting_documents", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: null, sectionNav: null },
  // WIP / Construction conditional items
  { id: "jobCostReports", label: "Job Cost Reports", tier: "recommended", docType: "job_cost_reports", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: null, sectionNav: null, conditional: true },
  { id: "wipSchedule", label: "WIP Schedule", tier: "recommended", docType: "wip_schedule", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "wipSchedule", sectionNav: { phase: 3, section: 11, label: "WIP Schedule" }, conditional: true },
  // TIER 3: OPTIONAL (4) - Verification / nice-to-have
  { id: "incomeStatement", label: "Income Statement (for verification)", tier: "optional", docType: "income_statement", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "incomeStatement", sectionNav: { phase: 5, section: 1, label: "Income Statement Report" } },
  { id: "balanceSheet", label: "Balance Sheet (for verification)", tier: "optional", docType: "balance_sheet", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "balanceSheet", sectionNav: { phase: 5, section: 2, label: "Balance Sheet Report" } },
  { id: "cashFlow", label: "Cash Flow Statement", tier: "optional", docType: "cash_flow", needsPeriodCoverage: false, canBeNA: true, checkWizardSection: "cashFlow", sectionNav: { phase: 6, section: 2, label: "Financial Reports" } }
];
function getFilteredChecklist(inventoryEnabled, wipEnabled = false) {
  return DD_CHECKLIST_BASE.filter(
    (item) => !item.conditional || item.id === "inventory" && inventoryEnabled || (item.id === "jobCostReports" || item.id === "wipSchedule") && wipEnabled
  );
}
function getItemsByTier(items, tier) {
  return items.filter((item) => item.tier === tier);
}
function hasMeaningfulSectionData(sectionKey, sectionData) {
  if (sectionKey === "payroll") {
    if (Array.isArray(sectionData.rawData) && sectionData.rawData.length > 1) return true;
    const categories = ["salaryWages", "payrollTaxes", "benefits", "ownerCompensation"];
    return categories.some((cat) => {
      const accounts = sectionData[cat];
      if (Array.isArray(accounts) && accounts.length > 0) {
        return accounts.some((acc) => {
          const values = acc.monthlyValues || {};
          return Object.values(values).some((v) => v > 0);
        });
      }
      return false;
    });
  }
  if (sectionKey === "journalEntries") {
    return Array.isArray(sectionData.entries) && sectionData.entries.length > 0;
  }
  if (sectionKey === "arAging") {
    if (Array.isArray(sectionData.periodData) && sectionData.periodData.length > 0) {
      const pd = sectionData.periodData;
      if (pd.some((p) => Array.isArray(p.entries) && p.entries.length > 0)) return true;
    }
    const invoices = sectionData.invoices;
    if (Array.isArray(invoices) && invoices.length > 0) {
      return invoices.some((inv) => inv.customer || inv.invoiceNumber);
    }
    return false;
  }
  if (sectionKey === "apAging") {
    if (Array.isArray(sectionData.periodData) && sectionData.periodData.length > 0) {
      const pd = sectionData.periodData;
      if (pd.some((p) => Array.isArray(p.entries) && p.entries.length > 0)) return true;
    }
    const bills = sectionData.bills;
    if (Array.isArray(bills) && bills.length > 0) {
      return bills.some((bill) => bill.vendor || bill.billNumber);
    }
    return false;
  }
  if (sectionKey === "supplementary") {
    const ds = sectionData.debtSchedule;
    if (Array.isArray(ds) && ds.length > 0) return true;
    if (ds && typeof ds === "object" && !Array.isArray(ds)) {
      const items = ds.items;
      if (Array.isArray(items) && items.length > 0) return true;
    }
    return false;
  }
  if (sectionKey === "topCustomers") {
    const customers = sectionData.customers;
    if (Array.isArray(customers) && customers.length > 0) {
      return customers.some((c) => c.name || c.currentYear);
    }
    return false;
  }
  if (sectionKey === "topVendors") {
    const vendors = sectionData.vendors;
    if (Array.isArray(vendors) && vendors.length > 0) {
      return vendors.some((v) => v.name || v.currentYear);
    }
    return false;
  }
  if (sectionKey === "fixedAssets") {
    const assets = sectionData.assets;
    if (Array.isArray(assets) && assets.length > 0) {
      return assets.some((a) => a.cost > 0 || a.description);
    }
    return false;
  }
  if (sectionKey === "materialContracts") {
    const contracts = sectionData.contracts;
    if (Array.isArray(contracts) && contracts.length > 0) {
      return contracts.some((c) => c.counterparty || c.contractType);
    }
    return false;
  }
  if (sectionKey === "inventory") {
    const items = sectionData.items;
    if (Array.isArray(items) && items.length > 0) {
      return items.some((i) => i.quantity > 0 || i.category);
    }
    return false;
  }
  if (Array.isArray(sectionData.rows) && sectionData.rows.length > 0) return true;
  if (Array.isArray(sectionData.accounts) && sectionData.accounts.length > 0) {
    return sectionData.accounts.some(
      (account) => account.accountNumber || account.accountName
    );
  }
  if (Array.isArray(sectionData.periods) && sectionData.periods.length > 0) return true;
  if (Array.isArray(sectionData.entries) && sectionData.entries.length > 0) return true;
  if (sectionData.periodData && typeof sectionData.periodData === "object") return true;
  if (sectionData.hasData === true) return true;
  return false;
}
function isChecklistItemComplete(item, wizardData, documents, notApplicable, processedDataTypes) {
  if (notApplicable?.[item.id]) return true;
  if (item.checkWizardSection && wizardData[item.checkWizardSection]) {
    const sectionData = wizardData[item.checkWizardSection];
    if (sectionData && typeof sectionData === "object" && Object.keys(sectionData).length > 0) {
      if (sectionData.syncSource === "quickbooks" || sectionData.lastSyncDate) return true;
      if (hasMeaningfulSectionData(item.checkWizardSection, sectionData)) return true;
    }
  }
  if (item.docType) {
    const hasCompletedDoc = documents.some((d) => d.account_type === item.docType && d.processing_status === "completed");
    if (hasCompletedDoc) return true;
    if (processedDataTypes?.has(item.docType)) return true;
    if (item.needsPeriodCoverage && item.checkWizardSection) {
      const sd = wizardData[item.checkWizardSection];
      if (sd?.hasData === true && sd?.coverageComplete === true) return true;
    }
  }
  return false;
}
const TIER_CONFIG = {
  required: {
    label: "Required",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800"
  },
  recommended: {
    label: "Recommended",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800"
  },
  optional: {
    label: "Optional",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    borderColor: "border-border"
  }
};
export {
  TIER_CONFIG as T,
  getItemsByTier as a,
  getFilteredChecklist as g,
  isChecklistItemComplete as i
};
