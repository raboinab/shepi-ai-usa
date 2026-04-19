/**
 * Core types for the workbook engine (server-side copy).
 * Mirrors src/lib/workbook-types.ts — keep in sync.
 */
import type { AddbackMapping, AggregatePeriod } from "./calculations.ts";

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
  balances: Record<string, number>;
}

export interface Adjustment {
  id: string;
  type: "MA" | "DD" | "PF";
  label: string;
  tbAccountNumber: string;
  intent: string;
  notes: string;
  amounts: Record<string, number>;
}

export interface Reclassification {
  id: string;
  label: string;
  fromAccount: string;
  toAccount: string;
  amounts: Record<string, number>;
}

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
  priorPeriodId?: string;
  priorBalances?: Record<string, number>;
}

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
  addbacks: AddbackMapping;
  supplementary?: {
    debtSchedule: SupplementaryDebtItem[];
    leaseObligations: SupplementaryLeaseItem[];
  };
  wipSchedule?: { jobs: WIPJobEntry[] };
}

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
  format?: "currency" | "percent" | "number" | "text";
}

export interface GridData {
  columns: GridColumn[];
  rows: GridRow[];
  frozenColumns?: number;
}
