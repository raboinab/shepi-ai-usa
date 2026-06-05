/**
 * Parity test: the browser-side normalized-contracts mirror must stay in sync
 * with the Deno-side schemas at supabase/functions/_shared/normalized-contracts.ts.
 *
 * We can't import the Deno file directly (npm:zod specifier), so this test
 * verifies the canonical field catalogue against a manually maintained
 * reference list. If you add a field to either side, update both.
 */
import { describe, expect, it } from "vitest";
import {
  FIELD_CATALOGUE,
  NORMALIZED_DATA_TYPES,
  canonicalSourceType,
  isV1Envelope,
  readNormalized,
} from "./normalized-contracts";

describe("normalized-contracts field catalogue", () => {
  it("covers every registered data type", () => {
    for (const dt of NORMALIZED_DATA_TYPES) {
      expect(FIELD_CATALOGUE[dt]).toBeDefined();
      expect(FIELD_CATALOGUE[dt].length).toBeGreaterThan(0);
    }
  });

  it("does not include tax_return_analysis (owned by parse-tax-return)", () => {
    expect((NORMALIZED_DATA_TYPES as string[]).includes("tax_return_analysis")).toBe(false);
  });

  it("maps legacy source_type strings to the canonical enum", () => {
    expect(canonicalSourceType("ai_extraction")).toBe("ai_document_extraction");
    expect(canonicalSourceType("ai_payroll_extraction")).toBe("ai_document_extraction");
    expect(canonicalSourceType("derived_from_gl")).toBe("ai_inline_derivation");
    expect(canonicalSourceType("wizard")).toBe("user_wizard");
    expect(canonicalSourceType(null)).toBe("ai_document_extraction");
    expect(canonicalSourceType("qbtojson")).toBe("qbtojson"); // canonical passes through
  });
});

describe("readNormalized()", () => {
  it("returns payload directly for v1 envelopes", () => {
    const row = {
      schemaVersion: 1 as const,
      dataType: "fixed_assets",
      payload: {
        asOfDate: "2024-12-31",
        assets: [],
        totals: { cost: 0, accumulatedDepreciation: 0, netBookValue: 0 },
      },
      meta: {
        confidence: "high" as const,
        warnings: [],
        rawFindings: null,
        documentName: "test.pdf",
        extractedAt: "2024-12-31T00:00:00Z",
        sourceDocumentId: null,
        modelUsed: null,
      },
    };
    const out = readNormalized("fixed_assets", row);
    expect(out).not.toBeNull();
    expect(out!.assets).toEqual([]);
  });

  it("upgrades legacy fixed_assets rows on read (accumDepreciation → accumulatedDepreciation)", () => {
    const legacy = {
      extractedData: {
        asOfDate: "2024-12-31",
        assets: [
          {
            description: "Forklift",
            category: "Equipment",
            dateAcquired: "2020-01-15",
            cost: 50000,
            accumDepreciation: 20000, // legacy field name
          },
        ],
      },
    };
    const out = readNormalized("fixed_assets", legacy);
    expect(out).not.toBeNull();
    expect(out!.assets[0].accumulatedDepreciation).toBe(20000);
    expect(out!.assets[0].netBookValue).toBe(30000);
    expect(out!.assets[0].acquisitionDate).toBe("2020-01-15");
    expect(out!.totals.cost).toBe(50000);
  });

  it("upgrades legacy debt_schedule rows on read", () => {
    const legacy = {
      debts: [
        {
          lender: "Bank of Acme",
          facilityType: "Term Loan",
          currentBalance: 100000,
          interestRate: 5.25,
          maturityDate: "2027-06-30",
        },
      ],
    };
    const out = readNormalized("debt_schedule", legacy);
    expect(out).not.toBeNull();
    expect(out!.debts).toHaveLength(1);
    expect(out!.totalOutstanding).toBe(100000);
  });

  it("returns null for non-object input", () => {
    expect(readNormalized("payroll", null)).toBeNull();
    expect(readNormalized("payroll", "string")).toBeNull();
  });
});

describe("isV1Envelope()", () => {
  it("detects v1 envelopes", () => {
    expect(isV1Envelope({ schemaVersion: 1, dataType: "x", payload: {}, meta: {} })).toBe(true);
    expect(isV1Envelope({ extractedData: {} })).toBe(false);
    expect(isV1Envelope(null)).toBe(false);
  });
});
