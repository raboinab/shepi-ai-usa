/**
 * 27 tab definitions for the in-app workbook engine.
 * Matches Excel template tab ordering exactly.
 */
import type { TabDef } from "./workbook-types";

export const WORKBOOK_TABS: TabDef[] = [
  // Setup & Input
  { id: "setup", label: "Due Diligence Information", shortLabel: "Setup", tabNumber: 1, type: "input", category: "setup" },
  { id: "trial-balance", label: "Trial Balance", shortLabel: "TB", tabNumber: 2, type: "input", category: "financial" },
  
  // QoE & Adjustments
  { id: "qoe-analysis", label: "QoE Analysis", shortLabel: "QoE", tabNumber: 3, type: "calculated", category: "financial" },
  { id: "is-bs-reconciliation", label: "Reconciling IS & BS", shortLabel: "IS↔BS", tabNumber: 5, type: "calculated", category: "financial" },

  // Financial Statements
  { id: "income-statement", label: "Income Statement", shortLabel: "IS", tabNumber: 6, type: "calculated", category: "financial" },
  { id: "is-detailed", label: "Income Statement - Detailed", shortLabel: "IS Detail", tabNumber: 7, type: "calculated", category: "financial" },
  
  // IS Breakdown
  { id: "sales", label: "Sales", shortLabel: "Sales", tabNumber: 8, type: "calculated", category: "financial" },
  { id: "cogs", label: "Cost of Goods Sold", shortLabel: "COGS", tabNumber: 9, type: "calculated", category: "financial" },
  { id: "opex", label: "Operating Expenses", shortLabel: "OpEx", tabNumber: 10, type: "calculated", category: "financial" },
  { id: "other-expense", label: "Other Expense (Income)", shortLabel: "Other", tabNumber: 11, type: "calculated", category: "financial" },
  { id: "payroll", label: "Payroll & Related", shortLabel: "Payroll", tabNumber: 12, type: "calculated", category: "financial" },
  
  // Working Capital
  { id: "working-capital", label: "Working Capital", shortLabel: "WC", tabNumber: 13, type: "calculated", category: "working-capital" },
  { id: "nwc-analysis", label: "NWC Analysis", shortLabel: "NWC", tabNumber: 14, type: "calculated", category: "working-capital" },

  // Balance Sheet
  { id: "balance-sheet", label: "Balance Sheet", shortLabel: "BS", tabNumber: 15, type: "calculated", category: "financial" },
  { id: "bs-detailed", label: "Balance Sheet - Detailed", shortLabel: "BS Detail", tabNumber: 16, type: "calculated", category: "financial" },
  
  // BS Detail tabs
  { id: "cash", label: "Cash", shortLabel: "Cash", tabNumber: 17, type: "calculated", category: "working-capital" },
  { id: "ar-aging", label: "AR Aging", shortLabel: "AR", tabNumber: 18, type: "input", category: "working-capital" },
  { id: "other-current-assets", label: "Other Current Assets", shortLabel: "OCA", tabNumber: 19, type: "calculated", category: "working-capital" },
  { id: "fixed-assets", label: "Fixed Assets", shortLabel: "FA", tabNumber: 20, type: "input", category: "working-capital" },
  { id: "ap-aging", label: "AP Aging", shortLabel: "AP", tabNumber: 21, type: "input", category: "working-capital" },
  { id: "other-current-liabilities", label: "Other Current Liabilities", shortLabel: "OCL", tabNumber: 22, type: "calculated", category: "working-capital" },
  { id: "wip-schedule", label: "WIP Schedule", shortLabel: "WIP", tabNumber: 23, type: "input", category: "working-capital" },
  
  // Supplementary
  { id: "top-customers", label: "Top Customers by Year", shortLabel: "Customers", tabNumber: 24, type: "input", category: "supplementary" },
  { id: "top-vendors", label: "Top Vendors by Year", shortLabel: "Vendors", tabNumber: 25, type: "input", category: "supplementary" },
  { id: "proof-of-cash", label: "Proof of Cash", shortLabel: "PoC", tabNumber: 26, type: "calculated", category: "supplementary" },
  { id: "free-cash-flow", label: "Free Cash Flow", shortLabel: "FCF", tabNumber: 27, type: "calculated", category: "supplementary" },

  // Disclosure
  { id: "disclaimer", label: "Disclaimer", shortLabel: "Disc.", tabNumber: 28, type: "calculated", category: "supplementary" },
  { id: "data-sources", label: "Data Sources", shortLabel: "Sources", tabNumber: 29, type: "calculated", category: "supplementary" },
];

export const getTabById = (id: string): TabDef | undefined => 
  WORKBOOK_TABS.find(t => t.id === id);

export const getTabsByCategory = (category: TabDef["category"]): TabDef[] =>
  WORKBOOK_TABS.filter(t => t.category === category);
