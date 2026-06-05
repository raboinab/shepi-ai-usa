/**
 * Normalized data contracts for AI-extracted documents.
 *
 * Single source of truth for the shape of `processed_data.data` rows written
 * by parser edge functions. Each `data_type` has:
 *   - a Zod schema (schemaVersion 1, canonical envelope + payload)
 *   - a legacy adapter that maps the historical raw AI output into the
 *     normalized shape (so we don't break existing call sites)
 *   - a registration in REGISTRY below
 *
 * The browser-side mirror lives at src/lib/normalized-contracts.ts and MUST
 * stay structurally identical (enforced by src/lib/normalized-contracts.test.ts).
 *
 * Write path:  parser → adapter(raw) → schema.parse → normalizeAndPersist
 * Read path:   row.data.schemaVersion === 1 ? typed read : legacy adapter
 */
import { z } from "npm:zod@3.23.8";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.87.1";

// ── Source-type enum ────────────────────────────────────────────────────────
export const ExtractionSource = z.enum([
  "ai_document_extraction", // AI extraction from an uploaded document
  "ai_document_classification", // AI tagging / type-detection only
  "ai_inline_derivation", // derived inside an analyzer (e.g. derived_from_gl)
  "upload_parse", // deterministic parser (CSV/XLSX → structured rows)
  "user_wizard", // entered by user in the wizard
  "qbtojson", // QuickBooks export via qbtojson
  "quickbooks_api", // direct QBO API
  "docuclipper", // DocuClipper extraction service
]);
export type ExtractionSourceT = z.infer<typeof ExtractionSource>;

/** Map legacy free-text source_type values to the canonical enum. */
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
  if ((ExtractionSource.options as readonly string[]).includes(legacy)) {
    return legacy as ExtractionSourceT;
  }
  return LEGACY_SOURCE_MAP[legacy] ?? "ai_document_extraction";
}

// ── Envelope ────────────────────────────────────────────────────────────────
export const ExtractionMetaV1 = z.object({
  confidence: z.enum(["high", "medium", "low"]).nullable().default(null),
  warnings: z.array(z.string()).default([]),
  rawFindings: z.string().nullable().default(null),
  documentName: z.string().nullable().default(null),
  extractedAt: z.string(), // ISO timestamp
  sourceDocumentId: z.string().nullable().default(null),
  modelUsed: z.string().nullable().default(null),
});
export type ExtractionMetaV1T = z.infer<typeof ExtractionMetaV1>;

const Envelope = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({
    schemaVersion: z.literal(1),
    dataType: z.string(),
    payload,
    meta: ExtractionMetaV1,
    raw: z.unknown().optional(), // original AI output for forensics
  });

// ── Per-data_type payload schemas ───────────────────────────────────────────

// fixed_assets ────────────────────────────────────────────────────────────────
const FixedAssetItem = z.object({
  category: z.string(),
  description: z.string(),
  acquisitionDate: z.string().nullable(),
  cost: z.number(),
  accumulatedDepreciation: z.number(),
  netBookValue: z.number(),
  usefulLife: z.string().nullable().default(null),
  method: z.string().nullable().default(null),
});
const FixedAssetsPayload = z.object({
  asOfDate: z.string().nullable(),
  assets: z.array(FixedAssetItem),
  totals: z.object({
    cost: z.number(),
    accumulatedDepreciation: z.number(),
    netBookValue: z.number(),
  }),
});

// payroll ────────────────────────────────────────────────────────────────────
const MonthlyItem = z.object({
  name: z.string(),
  category: z.string().optional(),
  monthlyValues: z.record(z.string(), z.number()),
});
const PayrollPayload = z.object({
  salaryWages: z.array(MonthlyItem),
  ownerCompensation: z.array(MonthlyItem),
  payrollTaxes: z.array(MonthlyItem),
  benefits: z.array(MonthlyItem),
  periodCoverage: z.array(z.string()).default([]),
  totals: z.object({
    salaryWages: z.number(),
    payrollTaxes: z.number(),
    benefits: z.number(),
    ownerCompensation: z.number(),
    totalPayroll: z.number(),
  }),
});

// debt_schedule ─────────────────────────────────────────────────────────────
const DebtItem = z.object({
  lender: z.string(),
  facilityType: z.string().nullable(),
  originalAmount: z.number().nullable(),
  currentBalance: z.number(),
  interestRate: z.number().nullable(),
  maturityDate: z.string().nullable(),
  monthlyPayment: z.number().nullable().default(null),
  collateral: z.string().nullable().default(null),
  covenants: z.array(z.string()).default([]),
});
const DebtSchedulePayload = z.object({
  asOfDate: z.string().nullable(),
  totalOutstanding: z.number(),
  debts: z.array(DebtItem),
});

// inventory ─────────────────────────────────────────────────────────────────
const InventoryPayload = z.object({
  asOfDate: z.string().nullable(),
  totalInventoryValue: z.number(),
  categories: z.array(
    z.object({
      category: z.string(),
      value: z.number(),
      quantity: z.number().nullable().default(null),
      method: z.string().nullable().default(null),
    }),
  ),
  obsoleteReserve: z.number().nullable().default(null),
  turnoverDays: z.number().nullable().default(null),
  summary: z.string().nullable().default(null),
});

// lease_agreement ───────────────────────────────────────────────────────────
const LeasePayload = z.object({
  leaseType: z.string().nullable(),
  premises: z.string().nullable(),
  landlord: z.string().nullable(),
  tenant: z.string().nullable(),
  commencementDate: z.string().nullable(),
  expirationDate: z.string().nullable(),
  monthlyRent: z.number().nullable(),
  annualRent: z.number().nullable(),
  escalationTerms: z.string().nullable(),
  camNnn: z.number().nullable(),
  securityDeposit: z.number().nullable(),
  renewalOptions: z.string().nullable(),
  terminationTerms: z.string().nullable(),
  personalGuarantee: z.boolean().nullable(),
  relatedParty: z.boolean().nullable(),
  keyTerms: z.array(z.string()).default([]),
  summary: z.string().nullable().default(null),
});

// material_contract ─────────────────────────────────────────────────────────
const ContractItem = z.object({
  contractType: z.string(),
  counterparty: z.string(),
  description: z.string(),
  effectiveDate: z.string().nullable().default(null),
  expirationDate: z.string().nullable().default(null),
  contractValue: z.number().nullable().default(null),
  annualValue: z.number().nullable().default(null),
  renewalTerms: z.string().nullable().default(null),
  terminationTerms: z.string().nullable().default(null),
  changeOfControl: z.string().nullable().default(null),
  keyObligations: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
});
const MaterialContractPayload = z.object({
  contracts: z.array(ContractItem),
  summary: z.object({
    totalContracts: z.number(),
    byType: z.record(z.string(), z.number()),
    upcomingExpirations: z.number(),
    hasChangeOfControlRisk: z.boolean(),
  }),
});

// cim_insights ──────────────────────────────────────────────────────────────
const CimInsightsPayload = z.object({
  businessOverview: z.object({
    description: z.string(),
    foundedYear: z.string().nullable(),
    headquarters: z.string().nullable(),
    employeeCount: z.string().nullable(),
  }),
  productsAndServices: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      revenuePercentage: z.number().nullable(),
    }),
  ),
  marketPosition: z.object({
    industry: z.string(),
    competitiveAdvantages: z.array(z.string()),
    marketSize: z.string().nullable(),
  }),
  managementTeam: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      tenure: z.string().nullable(),
    }),
  ),
  customerInsights: z.object({
    topCustomerConcentration: z.string().nullable(),
    retentionRate: z.string().nullable(),
    geographicDistribution: z.string().nullable(),
  }),
  growthDrivers: z.array(z.string()),
  keyRisks: z.array(z.string()),
  financialHighlights: z.object({
    revenueGrowth: z.string().nullable(),
    ebitdaMargin: z.string().nullable(),
    notes: z.array(z.string()),
  }),
  dealContext: z.object({
    reasonForSale: z.string().nullable(),
    timeline: z.string().nullable(),
    sellerExpectations: z.string().nullable(),
  }),
  rawSummary: z.string(),
});

// supporting_document ───────────────────────────────────────────────────────
const SupportingDocPayload = z.object({
  documentType: z.string(),
  amounts: z.array(z.object({ description: z.string(), amount: z.number() })),
  dates: z.array(z.object({ label: z.string(), date: z.string() })),
  parties: z.array(z.object({ role: z.string(), name: z.string() })),
  keyTerms: z.array(z.string()).default([]),
  summary: z.string(),
  processingMode: z.string().nullable().default(null),
});

// journal_entries ───────────────────────────────────────────────────────────
const JournalEntryLine = z.object({
  accountName: z.string(),
  accountId: z.string().nullable().default(null),
  debit: z.number(),
  credit: z.number(),
  memo: z.string().nullable().default(null),
});
const JournalEntryItem = z.object({
  id: z.string(),
  txnDate: z.string(),
  memo: z.string().nullable().default(null),
  isAdjustment: z.boolean().default(false),
  line: z.array(JournalEntryLine),
});
const JournalEntriesPayload = z.object({
  entries: z.array(JournalEntryItem),
  count: z.number(),
});

// tax_return_analysis ───────────────────────────────────────────────────────
// Very permissive — the underlying extractor's keyInfo shape varies by form.
const TaxReturnAnalysisPayload = z.object({
  detectedType: z.string(),
  extractedText: z.string().nullable().default(null),
  keyInfo: z.record(z.string(), z.unknown()).default({}),
  summary: z.string().nullable().default(null),
});

// ── Registry: data_type → { schema, adapter } ───────────────────────────────
type RawAdapter = (raw: unknown, ctx: AdapterContext) => unknown;

export interface AdapterContext {
  documentName: string | null;
  sourceDocumentId: string | null;
  modelUsed?: string | null;
}

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

// Adapters: each accepts whatever the parser currently builds (the raw AI
// `extracted` object, or the wrapped `extractionResult` object) and produces
// the canonical payload. They MUST be tolerant of legacy shapes for read-side
// upgrade-on-read.

const ADAPTERS = {
  fixed_assets: (raw: unknown): unknown => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const ed = (r.extractedData ?? r.payload ?? r) as Record<string, unknown>;
    const items = arr<Record<string, unknown>>(ed.assets);
    const assets = items.map((a) => {
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
    const totals = {
      cost: assets.reduce((s, a) => s + a.cost, 0),
      accumulatedDepreciation: assets.reduce((s, a) => s + a.accumulatedDepreciation, 0),
      netBookValue: assets.reduce((s, a) => s + a.netBookValue, 0),
    };
    return {
      asOfDate: str(ed.asOfDate),
      assets,
      totals,
    };
  },

  payroll: (raw: unknown): unknown => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const ed = (r.extractedData ?? r.payload ?? r) as Record<string, unknown>;
    const mapItems = (xs: unknown): unknown[] =>
      arr<Record<string, unknown>>(xs).map((x) => ({
        name: strReq(x.name),
        category: x.category ? strReq(x.category) : undefined,
        monthlyValues: (x.monthlyValues && typeof x.monthlyValues === "object"
          ? Object.fromEntries(
              Object.entries(x.monthlyValues as Record<string, unknown>).map(([k, v]) => [k, num(v)]),
            )
          : {}) as Record<string, number>,
      }));
    const salaryWages = mapItems(ed.salaryWages);
    const ownerCompensation = mapItems(ed.ownerCompensation);
    const payrollTaxes = mapItems(ed.payrollTaxes);
    const benefits = mapItems(ed.benefits);
    const sumCat = (items: unknown[]) =>
      items.reduce(
        (s: number, it: unknown) =>
          s + Object.values((it as { monthlyValues: Record<string, number> }).monthlyValues).reduce((a, b) => a + b, 0),
        0,
      );
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

  debt_schedule: (raw: unknown): unknown => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const debtsRaw = arr<Record<string, unknown>>(r.debts ?? (r.payload as { debts?: unknown[] })?.debts);
    const debts = debtsRaw.map((d) => ({
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
    const totalOutstanding =
      r.totalOutstanding !== undefined ? num(r.totalOutstanding) : debts.reduce((s, d) => s + d.currentBalance, 0);
    return {
      asOfDate: str(r.asOfDate),
      totalOutstanding,
      debts,
    };
  },

  inventory: (raw: unknown): unknown => {
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

  lease_agreement: (raw: unknown): unknown => {
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
      camNnn: r.cam_nnn !== undefined && r.cam_nnn !== null ? num(r.cam_nnn) : r.camNnn !== undefined && r.camNnn !== null ? num(r.camNnn) : null,
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

  material_contract: (raw: unknown): unknown => {
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

  cim_insights: (raw: unknown): unknown => {
    // CIM insights already arrive close to canonical; pass through with defaults.
    const r = (raw ?? {}) as Record<string, unknown>;
    return {
      businessOverview: {
        description: strReq((r.businessOverview as Record<string, unknown>)?.description, ""),
        foundedYear: str((r.businessOverview as Record<string, unknown>)?.foundedYear),
        headquarters: str((r.businessOverview as Record<string, unknown>)?.headquarters),
        employeeCount: str((r.businessOverview as Record<string, unknown>)?.employeeCount),
      },
      productsAndServices: arr<Record<string, unknown>>(r.productsAndServices).map((p) => ({
        name: strReq(p.name),
        description: strReq(p.description),
        revenuePercentage: p.revenuePercentage !== undefined && p.revenuePercentage !== null ? num(p.revenuePercentage) : null,
      })),
      marketPosition: {
        industry: strReq((r.marketPosition as Record<string, unknown>)?.industry, "Unknown"),
        competitiveAdvantages: arr<string>(
          (r.marketPosition as Record<string, unknown>)?.competitiveAdvantages,
        ).map(String),
        marketSize: str((r.marketPosition as Record<string, unknown>)?.marketSize),
      },
      managementTeam: arr<Record<string, unknown>>(r.managementTeam).map((m) => ({
        name: strReq(m.name),
        title: strReq(m.title),
        tenure: str(m.tenure),
      })),
      customerInsights: {
        topCustomerConcentration: str((r.customerInsights as Record<string, unknown>)?.topCustomerConcentration),
        retentionRate: str((r.customerInsights as Record<string, unknown>)?.retentionRate),
        geographicDistribution: str((r.customerInsights as Record<string, unknown>)?.geographicDistribution),
      },
      growthDrivers: arr<string>(r.growthDrivers).map(String),
      keyRisks: arr<string>(r.keyRisks).map(String),
      financialHighlights: {
        revenueGrowth: str((r.financialHighlights as Record<string, unknown>)?.revenueGrowth),
        ebitdaMargin: str((r.financialHighlights as Record<string, unknown>)?.ebitdaMargin),
        notes: arr<string>((r.financialHighlights as Record<string, unknown>)?.notes).map(String),
      },
      dealContext: {
        reasonForSale: str((r.dealContext as Record<string, unknown>)?.reasonForSale),
        timeline: str((r.dealContext as Record<string, unknown>)?.timeline),
        sellerExpectations: str((r.dealContext as Record<string, unknown>)?.sellerExpectations),
      },
      rawSummary: strReq(r.rawSummary, ""),
    };
  },

  supporting_document: (raw: unknown): unknown => {
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

  journal_entries: (raw: unknown): unknown => {
    const r = (raw ?? {}) as Record<string, unknown>;
    // Historical shape: { data: entries[], count } — entries here may already
    // be the upload_parse output. New canonical shape uses `entries`.
    const entriesRaw = arr<Record<string, unknown>>(r.entries ?? r.data);
    const entries = entriesRaw.map((e) => ({
      id: strReq(e.id, crypto.randomUUID()),
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

  tax_return_analysis: (raw: unknown): unknown => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const detectedType = strReq(
      r.detectedType ?? (r.keyInfo as Record<string, unknown>)?.documentType ?? "tax_return_analysis",
    );
    return {
      detectedType,
      extractedText: str(r.extractedText),
      keyInfo: (r.keyInfo && typeof r.keyInfo === "object" ? r.keyInfo : {}) as Record<string, unknown>,
      summary: str(r.summary),
    };
  },
} satisfies Record<string, RawAdapter>;

const PAYLOAD_SCHEMAS = {
  fixed_assets: FixedAssetsPayload,
  payroll: PayrollPayload,
  debt_schedule: DebtSchedulePayload,
  inventory: InventoryPayload,
  lease_agreement: LeasePayload,
  material_contract: MaterialContractPayload,
  cim_insights: CimInsightsPayload,
  supporting_document: SupportingDocPayload,
  journal_entries: JournalEntriesPayload,
  tax_return_analysis: TaxReturnAnalysisPayload,
} as const;

export type NormalizedDataType = keyof typeof PAYLOAD_SCHEMAS;
export const NORMALIZED_DATA_TYPES = Object.keys(PAYLOAD_SCHEMAS) as NormalizedDataType[];

export const ENVELOPE_SCHEMAS: { [K in NormalizedDataType]: ReturnType<typeof Envelope<(typeof PAYLOAD_SCHEMAS)[K]>> } = {
  fixed_assets: Envelope(PAYLOAD_SCHEMAS.fixed_assets),
  payroll: Envelope(PAYLOAD_SCHEMAS.payroll),
  debt_schedule: Envelope(PAYLOAD_SCHEMAS.debt_schedule),
  inventory: Envelope(PAYLOAD_SCHEMAS.inventory),
  lease_agreement: Envelope(PAYLOAD_SCHEMAS.lease_agreement),
  material_contract: Envelope(PAYLOAD_SCHEMAS.material_contract),
  cim_insights: Envelope(PAYLOAD_SCHEMAS.cim_insights),
  supporting_document: Envelope(PAYLOAD_SCHEMAS.supporting_document),
  journal_entries: Envelope(PAYLOAD_SCHEMAS.journal_entries),
  tax_return_analysis: Envelope(PAYLOAD_SCHEMAS.tax_return_analysis),
};

// ── normalize + persist ─────────────────────────────────────────────────────

export interface NormalizeAndPersistArgs {
  projectId: string;
  userId: string;
  sourceDocumentId: string | null;
  dataType: NormalizedDataType;
  source: ExtractionSourceT;
  rawAiOutput: unknown;
  documentName?: string | null;
  modelUsed?: string | null;
  confidence?: "high" | "medium" | "low" | null;
  warnings?: string[];
  rawFindings?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface NormalizeAndPersistResult {
  ok: boolean;
  validation_status: "validated" | "pending" | "failed";
  recordCount: number;
  data: unknown;
  errors?: string[];
}

/**
 * Normalize raw AI output, validate against the canonical schema, and insert
 * into processed_data. On schema failure we still persist (validation_status
 * = 'failed') with the raw payload + zod errors so we never lose data.
 */
export async function normalizeAndPersist(
  supabase: SupabaseClient,
  args: NormalizeAndPersistArgs,
): Promise<NormalizeAndPersistResult> {
  const {
    projectId,
    userId,
    sourceDocumentId,
    dataType,
    source,
    rawAiOutput,
    documentName = null,
    modelUsed = null,
    confidence = null,
    warnings = [],
    rawFindings = null,
    periodStart = null,
    periodEnd = null,
  } = args;

  const adapter = ADAPTERS[dataType];
  const schema = ENVELOPE_SCHEMAS[dataType];

  const payload = adapter(rawAiOutput, { documentName, sourceDocumentId, modelUsed });
  const envelope = {
    schemaVersion: 1 as const,
    dataType,
    payload,
    meta: {
      confidence,
      warnings,
      rawFindings,
      documentName,
      extractedAt: new Date().toISOString(),
      sourceDocumentId,
      modelUsed,
    },
    raw: rawAiOutput,
  };

  const parsed = schema.safeParse(envelope);
  const ok = parsed.success;
  const validation_status: "validated" | "pending" | "failed" = !ok
    ? "failed"
    : confidence === "high"
      ? "validated"
      : "pending";

  if (!ok) {
    // Add zod errors to meta.warnings so downstream UI can surface them.
    envelope.meta.warnings = [
      ...envelope.meta.warnings,
      ...parsed.error.issues.map((i) => `schema:${i.path.join(".")}: ${i.message}`),
    ];
  }

  const recordCount = computeRecordCount(dataType, payload);
  const dataToStore = ok ? parsed.data : envelope;

  const { error: insertError } = await supabase.from("processed_data").insert({
    project_id: projectId,
    user_id: userId,
    source_document_id: sourceDocumentId,
    source_type: source,
    data_type: dataType,
    data: dataToStore,
    record_count: recordCount,
    validation_status,
    period_start: periodStart,
    period_end: periodEnd,
  });

  if (insertError) {
    console.error(`[normalizeAndPersist] insert error for ${dataType}:`, insertError);
    return {
      ok: false,
      validation_status: "failed",
      recordCount,
      data: dataToStore,
      errors: [insertError.message],
    };
  }

  return {
    ok,
    validation_status,
    recordCount,
    data: dataToStore,
    errors: ok ? undefined : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

function computeRecordCount(dataType: NormalizedDataType, payload: unknown): number {
  const p = payload as Record<string, unknown>;
  switch (dataType) {
    case "fixed_assets":
      return arr(p.assets).length;
    case "payroll":
      return (
        arr(p.salaryWages).length +
        arr(p.ownerCompensation).length +
        arr(p.payrollTaxes).length +
        arr(p.benefits).length
      );
    case "debt_schedule":
      return arr(p.debts).length;
    case "inventory":
      return arr(p.categories).length;
    case "lease_agreement":
    case "tax_return_analysis":
    case "cim_insights":
    case "supporting_document":
      return 1;
    case "material_contract":
      return arr(p.contracts).length;
    case "journal_entries":
      return arr(p.entries).length;
    default:
      return 1;
  }
}

// ── Read-side helpers (re-used by browser mirror) ───────────────────────────

/**
 * Returns the canonical payload for a stored row. If the row is already a v1
 * envelope, returns its payload directly. Otherwise runs the legacy adapter so
 * old rows still produce a normalized shape on read (lazy upgrade).
 */
export function readNormalized<T extends NormalizedDataType>(
  dataType: T,
  raw: unknown,
): z.infer<(typeof PAYLOAD_SCHEMAS)[T]> | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.schemaVersion === 1 && r.payload) {
    return r.payload as z.infer<(typeof PAYLOAD_SCHEMAS)[T]>;
  }
  // Legacy row — run the adapter.
  const payload = ADAPTERS[dataType](raw, {
    documentName: (r.documentName as string | null) ?? null,
    sourceDocumentId: null,
  });
  const parsed = PAYLOAD_SCHEMAS[dataType].safeParse(payload);
  return parsed.success ? (parsed.data as z.infer<(typeof PAYLOAD_SCHEMAS)[T]>) : null;
}
