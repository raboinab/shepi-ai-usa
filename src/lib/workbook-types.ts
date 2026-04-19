/**
 * Core types for the in-app workbook engine.
 */
import type { AddbackMapping, AggregatePeriod } from "./calculations";

// ============================================
// Account & Trial Balance Types
// ============================================

export interface Account {
  accountId: string;
  accountName: string;
  fsType: "BS" | "IS";
  fsLineItem: string;
  subAccount1: string;
  subAccount2: string;
  subAccount3: string;
}

export interface TrialBalanceEntry {
  accountId: string;
  accountName: string;
  fsType: "BS" | "IS";
  fsLineItem: string;
  subAccount1: string;
  subAccount2: string;
  subAccount3: string;
  /** Monthly balances keyed by period id (e.g. "2023-01") */
  balances: Record<string, number>;
}

// ============================================
// Adjustment Types
// ============================================

export interface Adjustment {
  id: string;
  type: "MA" | "DD" | "PF";
  label: string;
  tbAccountNumber: string;
  intent: string;
  notes: string;
  /** Period amounts keyed by period id */
  amounts: Record<string, number>;
  /** Effect type — "NonQoE" items are excluded from Adjusted EBITDA */
  effectType?: "EBITDA" | "NonQoE" | "PresentationOnly";
}

export interface Reclassification {
  id: string;
  label: string;
  fromAccount: string;
  toAccount: string;
  amounts: Record<string, number>;
}

// ============================================
// Period Types
// ============================================

export interface PeriodDef {
  id: string;
  label: string;
  shortLabel: string;
  year: number;
  month: number;
  isStub?: boolean;
  startDate?: string;
  endDate?: string;
  date: Date;
}

export interface FiscalYear {
  label: string;
  periods: PeriodDef[];
}

// ============================================
// Deal / Project Metadata
// ============================================

export interface DealInfo {
  projectId: string;
  projectName: string;
  clientName: string;
  targetCompany: string;
  industry: string;
  transactionType: string;
  fiscalYearEnd: number;
  periods: PeriodDef[];
  fiscalYears: FiscalYear[];
  aggregatePeriods: AggregatePeriod[];
  /** Period ID for the month before the first visible period (e.g. "2023-12" when review starts Jan 2024) */
  priorPeriodId?: string;
  /** Derived ending balances for the prior period, keyed by accountId. Computed as TB[first] − GL activity[first]. */
  priorBalances?: Record<string, number>;
}

// ============================================
// DealData
// ============================================

export interface SupplementaryDebtItem {
  lender: string;
  balance: number;
  interestRate: number;
  maturityDate: string;
  type?: string;
}

export interface SupplementaryLeaseItem {
  description: string;
  leaseType: string;
  annualPayment: number;
  remainingTerm?: number;
  expirationDate?: string;
}

/** Payroll fallback data from processed_data when TB has no Payroll & Related line items */
export interface PayrollFallbackData {
  salaryWages: Array<{ name: string; monthlyValues: Record<string, number> }>;
  ownerCompensation: Array<{ name: string; monthlyValues: Record<string, number> }>;
  payrollTaxes: Array<{ name: string; monthlyValues: Record<string, number> }>;
  benefits: Array<{ name: string; monthlyValues: Record<string, number> }>;
}

/** WIP Schedule job entry for construction/project-based businesses */
export interface WIPJobEntry {
  id: string;
  jobName: string;
  contractValue: number;
  costsToDate: number;
  billingsToDate: number;
  status?: "active" | "completed" | "on-hold";
  notes?: string;
}

export interface DealData {
  deal: DealInfo;
  accounts: Account[];
  trialBalance: TrialBalanceEntry[];
  adjustments: Adjustment[];
  reclassifications: Reclassification[];
  tbIndex: Map<string, TrialBalanceEntry>;
  monthDates: Date[];
  arAging: Record<string, AgingEntry[]>;
  apAging: Record<string, AgingEntry[]>;
  fixedAssets: FixedAssetEntry[];
  topCustomers: Record<string, CustomerEntry[]>;
  topVendors: Record<string, VendorEntry[]>;
  /** EBITDA addback account mappings from deal setup */
  addbacks: AddbackMapping;
  /** Supplementary financial data: debt schedule, leases */
  supplementary?: {
    debtSchedule: SupplementaryDebtItem[];
    leaseObligations: SupplementaryLeaseItem[];
  };
  /** Payroll register data fallback when TB mapping is empty */
  payrollFallback?: PayrollFallbackData;
  /** WIP Schedule for construction/project-based businesses */
  wipSchedule?: { jobs: WIPJobEntry[] };
  /** WIP account mapping (COA accountNumber/Name) per slot — set in wizard */
  wipAccountMapping?: {
    contractAssets?: string;
    contractLiabilities?: string;
    jobCostsInProcess?: string;
  };
  /** Persisted result from analyze-wip edge function (surfaced in Attention Areas / PDF) */
  wipAnalysis?: {
    findings: Array<{
      category: string;
      severity: "high" | "medium" | "low";
      title: string;
      narrative: string;
      affectedJobIds: string[];
      estimatedImpact: number;
    }>;
    summary: string;
    portfolioMetrics?: {
      totalContract: number;
      totalOverBilled: number;
      totalUnderBilled: number;
      netOverUnder: number;
      jobCount: number;
    };
    analyzedAt: string;
  };
}

// ============================================
// Supplementary Data Types
// ============================================

export interface AgingEntry {
  name: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

export interface FixedAssetEntry {
  category: string;
  description: string;
  acquisitionDate: string;
  cost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
}

export interface CustomerEntry {
  name: string;
  revenue: number;
  percentage: number;
}

export interface VendorEntry {
  name: string;
  spend: number;
  percentage: number;
}

// ============================================
// Grid Row Types for SpreadsheetGrid
// ============================================

export type RowType = 
  | "header"
  | "section-header"
  | "data"
  | "subtotal"
  | "total"
  | "check"
  | "spacer"
  | "editable";

export interface GridColumn {
  key: string;
  label: string;
  width?: number;
  frozen?: boolean;
  align?: "left" | "center" | "right";
  format?: "currency" | "percent" | "number" | "text";
}

export interface GridRow {
  id: string;
  type: RowType;
  label?: string;
  cells: Record<string, string | number | null>;
  indent?: number;
  editable?: boolean;
  checkPassed?: boolean;
  /** Override column format for this specific row (e.g. "percent" for margin rows) */
  format?: "currency" | "percent" | "number" | "text";
}

export interface GridData {
  columns: GridColumn[];
  rows: GridRow[];
  frozenColumns?: number;
}

// ============================================
// Tab Definition
// ============================================

export interface TabDef {
  id: string;
  label: string;
  shortLabel: string;
  tabNumber: number;
  type: "input" | "calculated";
  category: "setup" | "financial" | "working-capital" | "supplementary";
}
