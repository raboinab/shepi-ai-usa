/**
 * Browser-side mirror of supabase/functions/_shared/normalized-contracts.ts.
 *
 * This file MUST stay structurally aligned with the Deno copy.
 * src/lib/normalized-contracts.test.ts asserts the canonical field names match.
 *
 * Two responsibilities:
 *   1. Export TypeScript types for v1 normalized payloads.
 *   2. Provide `readNormalized(dataType, row.data)` so client code can read
 *      either a v1 envelope OR a legacy row through the same call path.
 */

// ── Source-type enum ────────────────────────────────────────────────────────
export const EXTRACTION_SOURCES = [
  "ai_document_extraction",
  "ai_document_classification",
  "ai_inline_derivation",
  "upload_parse",
  "user_wizard",
  "qbtojson",
  "quickbooks_api",
  "docuclipper",
] as const;
export type ExtractionSourceT = (typeof EXTRACTION_SOURCES)[number];

const LEGACY_SOURCE_MAP: Record<string, ExtractionSourceT> = {
  ai_extraction: "ai_document_extraction",
  ai_classification: "ai_document_classification",
  ai_fixed_assets_extraction: "ai_document_extraction",
  ai_payroll_extraction: "ai_document_extraction",
  derived_from_gl: "ai_inline_derivation",
  gl_analysis: "ai_inline_derivation",
  je_analysis: "ai_inline_derivation",
  wizard: "user_wizard",
};
export function canonicalSourceType(legacy: string | null | undefined): ExtractionSourceT {
  if (!legacy) return "ai_document_extraction";
  if ((EXTRACTION_SOURCES as readonly string[]).includes(legacy)) return legacy as ExtractionSourceT;
  return LEGACY_SOURCE_MAP[legacy] ?? "ai_document_extraction";
}

// ── Envelope ────────────────────────────────────────────────────────────────
export interface ExtractionMetaV1 {
  confidence: "high" | "medium" | "low" | null;
  warnings: string[];
  rawFindings: string | null;
  documentName: string | null;
  extractedAt: string;
  sourceDocumentId: string | null;
  modelUsed: string | null;
}

export interface EnvelopeV1<T> {
  schemaVersion: 1;
  dataType: string;
  payload: T;
  meta: ExtractionMetaV1;
  raw?: unknown;
}

// ── Per-data_type payload types ─────────────────────────────────────────────

export interface FixedAssetItemV1 {
  category: string;
  description: string;
  acquisitionDate: string | null;
  cost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  usefulLife: string | null;
  method: string | null;
}
export interface FixedAssetsPayloadV1 {
  asOfDate: string | null;
  assets: FixedAssetItemV1[];
  totals: { cost: number; accumulatedDepreciation: number; netBookValue: number };
}

export interface MonthlyItemV1 {
  name: string;
  category?: string;
  monthlyValues: Record<string, number>;
}
export interface PayrollPayloadV1 {
  salaryWages: MonthlyItemV1[];
  ownerCompensation: MonthlyItemV1[];
  payrollTaxes: MonthlyItemV1[];
  benefits: MonthlyItemV1[];
  periodCoverage: string[];
  totals: {
    salaryWages: number;
    payrollTaxes: number;
    benefits: number;
    ownerCompensation: number;
    totalPayroll: number;
  };
}

export interface DebtItemV1 {
  lender: string;
  facilityType: string | null;
  originalAmount: number | null;
  currentBalance: number;
  interestRate: number | null;
  maturityDate: string | null;
  monthlyPayment: number | null;
  collateral: string | null;
  covenants: string[];
}
export interface DebtSchedulePayloadV1 {
  asOfDate: string | null;
  totalOutstanding: number;
  debts: DebtItemV1[];
}

export interface InventoryPayloadV1 {
  asOfDate: string | null;
  totalInventoryValue: number;
  categories: { category: string; value: number; quantity: number | null; method: string | null }[];
  obsoleteReserve: number | null;
  turnoverDays: number | null;
  summary: string | null;
}

export interface LeasePayloadV1 {
  leaseType: string | null;
  premises: string | null;
  landlord: string | null;
  tenant: string | null;
  commencementDate: string | null;
  expirationDate: string | null;
  monthlyRent: number | null;
  annualRent: number | null;
  escalationTerms: string | null;
  camNnn: number | null;
  securityDeposit: number | null;
  renewalOptions: string | null;
  terminationTerms: string | null;
  personalGuarantee: boolean | null;
  relatedParty: boolean | null;
  keyTerms: string[];
  summary: string | null;
}

export interface ContractItemV1 {
  contractType: string;
  counterparty: string;
  description: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  contractValue: number | null;
  annualValue: number | null;
  renewalTerms: string | null;
  terminationTerms: string | null;
  changeOfControl: string | null;
  keyObligations: string[];
  concerns: string[];
}
export interface MaterialContractPayloadV1 {
  contracts: ContractItemV1[];
  summary: {
    totalContracts: number;
    byType: Record<string, number>;
    upcomingExpirations: number;
    hasChangeOfControlRisk: boolean;
  };
}

export interface CimInsightsPayloadV1 {
  businessOverview: { description: string; foundedYear: string | null; headquarters: string | null; employeeCount: string | null };
  productsAndServices: { name: string; description: string; revenuePercentage: number | null }[];
  marketPosition: { industry: string; competitiveAdvantages: string[]; marketSize: string | null };
  managementTeam: { name: string; title: string; tenure: string | null }[];
  customerInsights: { topCustomerConcentration: string | null; retentionRate: string | null; geographicDistribution: string | null };
  growthDrivers: string[];
  keyRisks: string[];
  financialHighlights: { revenueGrowth: string | null; ebitdaMargin: string | null; notes: string[] };
  dealContext: { reasonForSale: string | null; timeline: string | null; sellerExpectations: string | null };
  rawSummary: string;
}

export interface SupportingDocPayloadV1 {
  documentType: string;
  amounts: { description: string; amount: number }[];
  dates: { label: string; date: string }[];
  parties: { role: string; name: string }[];
  keyTerms: string[];
  summary: string;
  processingMode: string | null;
}

export interface JournalEntryLineV1 {
  accountName: string;
  accountId: string | null;
  debit: number;
  credit: number;
  memo: string | null;
}
export interface JournalEntryItemV1 {
  id: string;
  txnDate: string;
  memo: string | null;
  isAdjustment: boolean;
  line: JournalEntryLineV1[];
}
export interface JournalEntriesPayloadV1 {
  entries: JournalEntryItemV1[];
  count: number;
}

// NOTE: tax_return_analysis is intentionally NOT in this registry. parse-tax-return
// owns its own normalization (analyzer output with extractedData/glMatching/etc).

// ── Data type registry ─────────────────────────────────────────────────────
export interface NormalizedDataTypeMap {
  fixed_assets: FixedAssetsPayloadV1;
  payroll: PayrollPayloadV1;
  debt_schedule: DebtSchedulePayloadV1;
  inventory: InventoryPayloadV1;
  lease_agreement: LeasePayloadV1;
  material_contract: MaterialContractPayloadV1;
  cim_insights: CimInsightsPayloadV1;
  supporting_document: SupportingDocPayloadV1;
  journal_entries: JournalEntriesPayloadV1;
}
export type NormalizedDataType = keyof NormalizedDataTypeMap;
export const NORMALIZED_DATA_TYPES: NormalizedDataType[] = [
  "fixed_assets",
  "payroll",
  "debt_schedule",
  "inventory",
  "lease_agreement",
  "material_contract",
  "cim_insights",
  "supporting_document",
  "journal_entries",
];

// ── Read-side helpers (mirror the Deno adapters for legacy upgrade-on-read) ─
function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function num(v: unknown, fb = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[$,\s]/g, ""));
    return Number.isFinite(n) ? n : fb;
  }
  return fb;
}
function str(v: unknown, fb: string | null = null): string | null {
  if (v === null || v === undefined) return fb;
  return String(v);
}
function strReq(v: unknown, fb = ""): string {
  if (v === null || v === undefined) return fb;
  return String(v);
}

const LEGACY_ADAPTERS: { [K in NormalizedDataType]: (raw: unknown) => NormalizedDataTypeMap[K] } = {
  fixed_assets: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const ed = (r.extractedData ?? r) as Record<string, unknown>;
    const assets = arr<Record<string, unknown>>(ed.assets).map((a) => {
      const cost = num(a.cost ?? a.originalCost);
      const accDep = num(a.accumulatedDepreciation ?? a.accumDepreciation ?? a.accumDepr);
      const nbvRaw = a.netBookValue ?? a.nbv;
      const nbv = nbvRaw !== undefined ? num(nbvRaw) : cost - accDep;
      return {
        category: strReq(a.category, "Other Fixed Assets"),
        description: strReq(a.description ?? a.name, "Unknown Asset"),
        acquisitionDate: str(a.acquisitionDate ?? a.dateAcquired),
        cost,
        accumulatedDepreciation: accDep,
        netBookValue: nbv,
        usefulLife: str(a.usefulLife),
        method: str(a.method),
      };
    });
    return {
      asOfDate: str(ed.asOfDate),
      assets,
      totals: {
        cost: assets.reduce((s, a) => s + a.cost, 0),
        accumulatedDepreciation: assets.reduce((s, a) => s + a.accumulatedDepreciation, 0),
        netBookValue: assets.reduce((s, a) => s + a.netBookValue, 0),
      },
    };
  },

  payroll: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const ed = (r.extractedData ?? r) as Record<string, unknown>;
    const mapItems = (xs: unknown): MonthlyItemV1[] =>
      arr<Record<string, unknown>>(xs).map((x) => ({
        name: strReq(x.name),
        category: x.category ? strReq(x.category) : undefined,
        monthlyValues:
          x.monthlyValues && typeof x.monthlyValues === "object"
            ? Object.fromEntries(
                Object.entries(x.monthlyValues as Record<string, unknown>).map(([k, v]) => [k, num(v)]),
              )
            : {},
      }));
    const salaryWages = mapItems(ed.salaryWages);
    const ownerCompensation = mapItems(ed.ownerCompensation);
    const payrollTaxes = mapItems(ed.payrollTaxes);
    const benefits = mapItems(ed.benefits);
    const sumCat = (items: MonthlyItemV1[]): number =>
      items.reduce((s, it) => s + Object.values(it.monthlyValues).reduce((a, b) => a + b, 0), 0);
    const ts = {
      salaryWages: sumCat(salaryWages),
      payrollTaxes: sumCat(payrollTaxes),
      benefits: sumCat(benefits),
      ownerCompensation: sumCat(ownerCompensation),
      totalPayroll: 0,
    };
    ts.totalPayroll = ts.salaryWages + ts.payrollTaxes + ts.benefits + ts.ownerCompensation;
    return {
      salaryWages,
      ownerCompensation,
      payrollTaxes,
      benefits,
      periodCoverage: arr<string>(r.periodCoverage ?? ed.periodCoverage),
      totals: ts,
    };
  },

  debt_schedule: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const debts = arr<Record<string, unknown>>(r.debts).map((d) => ({
      lender: strReq(d.lender),
      facilityType: str(d.facilityType),
      originalAmount: d.originalAmount !== undefined ? num(d.originalAmount) : null,
      currentBalance: num(d.currentBalance ?? d.balance),
      interestRate: d.interestRate !== undefined ? num(d.interestRate) : null,
      maturityDate: str(d.maturityDate),
      monthlyPayment: d.monthlyPayment !== undefined ? num(d.monthlyPayment) : null,
      collateral: str(d.collateral),
      covenants: arr<string>(d.covenants).map(String),
    }));
    return {
      asOfDate: str(r.asOfDate),
      totalOutstanding:
        r.totalOutstanding !== undefined ? num(r.totalOutstanding) : debts.reduce((s, d) => s + d.currentBalance, 0),
      debts,
    };
  },

  inventory: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const cats = arr<Record<string, unknown>>(r.categories).map((c) => ({
      category: strReq(c.category, "Uncategorized"),
      value: num(c.value),
      quantity: c.quantity !== undefined && c.quantity !== null ? num(c.quantity) : null,
      method: str(c.method),
    }));
    return {
      asOfDate: str(r.asOfDate),
      totalInventoryValue: num(r.totalInventoryValue ?? cats.reduce((s, c) => s + c.value, 0)),
      categories: cats,
      obsoleteReserve: r.obsoleteReserve !== undefined && r.obsoleteReserve !== null ? num(r.obsoleteReserve) : null,
      turnoverDays: r.turnoverDays !== undefined && r.turnoverDays !== null ? num(r.turnoverDays) : null,
      summary: str(r.summary),
    };
  },

  lease_agreement: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    return {
      leaseType: str(r.leaseType),
      premises: str(r.premises),
      landlord: str(r.landlord),
      tenant: str(r.tenant),
      commencementDate: str(r.commencementDate),
      expirationDate: str(r.expirationDate),
      monthlyRent: r.monthlyRent !== undefined && r.monthlyRent !== null ? num(r.monthlyRent) : null,
      annualRent: r.annualRent !== undefined && r.annualRent !== null ? num(r.annualRent) : null,
      escalationTerms: str(r.escalationTerms),
      camNnn:
        r.cam_nnn !== undefined && r.cam_nnn !== null
          ? num(r.cam_nnn)
          : r.camNnn !== undefined && r.camNnn !== null
            ? num(r.camNnn)
            : null,
      securityDeposit:
        r.securityDeposit !== undefined && r.securityDeposit !== null ? num(r.securityDeposit) : null,
      renewalOptions: str(r.renewalOptions),
      terminationTerms: str(r.terminationTerms),
      personalGuarantee: typeof r.personalGuarantee === "boolean" ? r.personalGuarantee : null,
      relatedParty: typeof r.relatedParty === "boolean" ? r.relatedParty : null,
      keyTerms: arr<string>(r.keyTerms).map(String),
      summary: str(r.summary),
    };
  },

  material_contract: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const contracts = arr<Record<string, unknown>>(r.contracts).map((c) => ({
      contractType: strReq(c.contractType, "Other"),
      counterparty: strReq(c.counterparty),
      description: strReq(c.description),
      effectiveDate: str(c.effectiveDate),
      expirationDate: str(c.expirationDate),
      contractValue: c.contractValue !== undefined && c.contractValue !== null ? num(c.contractValue) : null,
      annualValue: c.annualValue !== undefined && c.annualValue !== null ? num(c.annualValue) : null,
      renewalTerms: str(c.renewalTerms),
      terminationTerms: str(c.terminationTerms),
      changeOfControl: str(c.changeOfControl),
      keyObligations: arr<string>(c.keyObligations).map(String),
      concerns: arr<string>(c.concerns).map(String),
    }));
    const byType = contracts.reduce<Record<string, number>>((acc, c) => {
      acc[c.contractType] = (acc[c.contractType] || 0) + 1;
      return acc;
    }, {});
    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    const upcomingExpirations = contracts.filter((c) => {
      if (!c.expirationDate) return false;
      const d = new Date(c.expirationDate);
      return !Number.isNaN(d.getTime()) && d <= oneYear;
    }).length;
    const hasChangeOfControlRisk = contracts.some(
      (c) => c.changeOfControl && c.changeOfControl.toLowerCase() !== "none",
    );
    const summaryIn = (r.summary as Record<string, unknown> | undefined) ?? {};
    return {
      contracts,
      summary: {
        totalContracts: typeof summaryIn.totalContracts === "number" ? summaryIn.totalContracts : contracts.length,
        byType: (summaryIn.byType as Record<string, number>) ?? byType,
        upcomingExpirations:
          typeof summaryIn.upcomingExpirations === "number" ? summaryIn.upcomingExpirations : upcomingExpirations,
        hasChangeOfControlRisk:
          typeof summaryIn.hasChangeOfControlRisk === "boolean"
            ? summaryIn.hasChangeOfControlRisk
            : hasChangeOfControlRisk,
      },
    };
  },

  cim_insights: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const bo = (r.businessOverview as Record<string, unknown>) ?? {};
    const mp = (r.marketPosition as Record<string, unknown>) ?? {};
    const ci = (r.customerInsights as Record<string, unknown>) ?? {};
    const fh = (r.financialHighlights as Record<string, unknown>) ?? {};
    const dc = (r.dealContext as Record<string, unknown>) ?? {};
    return {
      businessOverview: {
        description: strReq(bo.description, ""),
        foundedYear: str(bo.foundedYear),
        headquarters: str(bo.headquarters),
        employeeCount: str(bo.employeeCount),
      },
      productsAndServices: arr<Record<string, unknown>>(r.productsAndServices).map((p) => ({
        name: strReq(p.name),
        description: strReq(p.description),
        revenuePercentage:
          p.revenuePercentage !== undefined && p.revenuePercentage !== null ? num(p.revenuePercentage) : null,
      })),
      marketPosition: {
        industry: strReq(mp.industry, "Unknown"),
        competitiveAdvantages: arr<string>(mp.competitiveAdvantages).map(String),
        marketSize: str(mp.marketSize),
      },
      managementTeam: arr<Record<string, unknown>>(r.managementTeam).map((m) => ({
        name: strReq(m.name),
        title: strReq(m.title),
        tenure: str(m.tenure),
      })),
      customerInsights: {
        topCustomerConcentration: str(ci.topCustomerConcentration),
        retentionRate: str(ci.retentionRate),
        geographicDistribution: str(ci.geographicDistribution),
      },
      growthDrivers: arr<string>(r.growthDrivers).map(String),
      keyRisks: arr<string>(r.keyRisks).map(String),
      financialHighlights: {
        revenueGrowth: str(fh.revenueGrowth),
        ebitdaMargin: str(fh.ebitdaMargin),
        notes: arr<string>(fh.notes).map(String),
      },
      dealContext: {
        reasonForSale: str(dc.reasonForSale),
        timeline: str(dc.timeline),
        sellerExpectations: str(dc.sellerExpectations),
      },
      rawSummary: strReq(r.rawSummary, ""),
    };
  },

  supporting_document: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    return {
      documentType: strReq(r.documentType, "other"),
      amounts: arr<Record<string, unknown>>(r.amounts).map((a) => ({
        description: strReq(a.description),
        amount: num(a.amount),
      })),
      dates: arr<Record<string, unknown>>(r.dates).map((d) => ({
        label: strReq(d.label),
        date: strReq(d.date),
      })),
      parties: arr<Record<string, unknown>>(r.parties).map((p) => ({
        role: strReq(p.role),
        name: strReq(p.name),
      })),
      keyTerms: arr<string>(r.keyTerms).map(String),
      summary: strReq(r.summary, ""),
      processingMode: str(r.processingMode),
    };
  },

  journal_entries: (raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const entriesRaw = arr<Record<string, unknown>>(r.entries ?? r.data);
    const entries = entriesRaw.map((e) => ({
      id: strReq(e.id, (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()))),
      txnDate: strReq(e.txnDate ?? e.date),
      memo: str(e.memo),
      isAdjustment: Boolean(e.isAdjustment ?? e.adjustment ?? false),
      line: arr<Record<string, unknown>>(e.line).map((l) => ({
        accountName: strReq(l.accountName ?? l.account),
        accountId: str(l.accountId),
        debit: num(l.debit),
        credit: num(l.credit),
        memo: str(l.memo),
      })),
    }));
    return { entries, count: entries.length };
  },
};

/**
 * Returns the canonical payload for a stored processed_data.data row.
 * - If row is a v1 envelope, returns its `payload` directly.
 * - Otherwise runs the legacy adapter (lazy upgrade-on-read).
 */
export function readNormalized<K extends NormalizedDataType>(
  dataType: K,
  raw: unknown,
): NormalizedDataTypeMap[K] | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.schemaVersion === 1 && r.payload && typeof r.payload === "object") {
    return r.payload as NormalizedDataTypeMap[K];
  }
  try {
    return LEGACY_ADAPTERS[dataType](raw);
  } catch {
    return null;
  }
}

/** True when the row is already a v1 envelope. */
export function isV1Envelope(raw: unknown): raw is EnvelopeV1<unknown> {
  return Boolean(
    raw && typeof raw === "object" && (raw as Record<string, unknown>).schemaVersion === 1 && (raw as Record<string, unknown>).payload,
  );
}

/** Canonical field-name catalogue, exported so the parity test can compare runtimes. */
export const FIELD_CATALOGUE = {
  fixed_assets: ["asOfDate", "assets", "totals"] as const,
  payroll: ["salaryWages", "ownerCompensation", "payrollTaxes", "benefits", "periodCoverage", "totals"] as const,
  debt_schedule: ["asOfDate", "totalOutstanding", "debts"] as const,
  inventory: ["asOfDate", "totalInventoryValue", "categories", "obsoleteReserve", "turnoverDays", "summary"] as const,
  lease_agreement: [
    "leaseType",
    "premises",
    "landlord",
    "tenant",
    "commencementDate",
    "expirationDate",
    "monthlyRent",
    "annualRent",
    "escalationTerms",
    "camNnn",
    "securityDeposit",
    "renewalOptions",
    "terminationTerms",
    "personalGuarantee",
    "relatedParty",
    "keyTerms",
    "summary",
  ] as const,
  material_contract: ["contracts", "summary"] as const,
  cim_insights: [
    "businessOverview",
    "productsAndServices",
    "marketPosition",
    "managementTeam",
    "customerInsights",
    "growthDrivers",
    "keyRisks",
    "financialHighlights",
    "dealContext",
    "rawSummary",
  ] as const,
  supporting_document: ["documentType", "amounts", "dates", "parties", "keyTerms", "summary", "processingMode"] as const,
  journal_entries: ["entries", "count"] as const,
  tax_return_analysis: ["detectedType", "extractedText", "keyInfo", "summary"] as const,
};
