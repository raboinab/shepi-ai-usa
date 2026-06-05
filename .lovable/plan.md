## Goal

Move every AI-extraction edge function to a **shared normalization contract** so frontend code, fallbacks, exports, and analyzers (parse-tax-return, workbook builders, PDF) read one well-known shape per `data_type` — not 11 ad-hoc shapes glued together by per-feature mappers.

## Why now

Today every parser writes its own bespoke JSON under `processed_data.data.extractedData`:

| `data_type` | Parser | Output shape (today) |
|---|---|---|
| `fixed_assets` | `process-fixed-assets` | `{ extractedData: { assets: [{cost\|originalCost, accumDepreciation\|accumulatedDepreciation, …}], totals }, confidence, warnings }` |
| `payroll` | `process-payroll-document` | `{ extractedData: { salaryWages, ownerCompensation, payrollTaxes, benefits } }` |
| `debt_schedule` | `process-debt-schedule` | ad-hoc `{ extractedData: { loans: […] } }` |
| `inventory` | `process-inventory-report` | ad-hoc |
| `lease_agreement` | `process-lease-agreement` | ad-hoc |
| `material_contract` | `process-material-contract` | ad-hoc |
| `cim_insights` | `parse-cim` | ad-hoc |
| `journal_entries` | `process-journal-entries` | ad-hoc |
| `supporting_document` | `process-supporting-document` | ad-hoc |
| `tax_return_analysis` | `extract-document-text` | ad-hoc (detectedType-based) |

Each of those has a sibling `src/lib/<x>Fallback.ts` that re-normalizes on read (`fixedAssetsFallback.ts`, `payrollFallback.ts`, `debtFallback.ts`, etc.). When a parser's output drifts, downstream breaks silently — exactly what happened with `parse-tax-return` for qbtojson shapes.

`source_type` values are also a free-text mess: `ai_extraction`, `ai_classification`, `ai_fixed_assets_extraction`, `ai_payroll_extraction`, `upload_parse`, `derived_from_gl`, `gl_analysis`, `je_analysis`, etc. — no enum, no convention.

## Strategy

Three pieces, shipped in this order. **No DB schema migration is required** for steps 1 and 2 — we use the existing `processed_data.data` JSONB column.

### 1. Normalized contract per data_type — single source of truth

Create `supabase/functions/_shared/normalized-contracts.ts` (Deno-importable) **and** mirror to `src/lib/normalized-contracts.ts` (browser-importable). Both export the same Zod schemas + TypeScript types.

```ts
// One schema per data_type. Field names = canonical, lowerCamelCase.
export const FixedAssetsExtractionV1 = z.object({
  schemaVersion: z.literal(1),
  asOfDate: z.string().nullable(),         // ISO YYYY-MM-DD
  assets: z.array(z.object({
    category: z.string(),
    description: z.string(),
    acquisitionDate: z.string().nullable(),
    cost: z.number(),
    accumulatedDepreciation: z.number(),
    netBookValue: z.number(),
  })),
  totals: z.object({ cost: z.number(), accumulatedDepreciation: z.number(), netBookValue: z.number() }),
  meta: ExtractionMetaV1,   // confidence, warnings, rawFindings, documentName, extractedAt
});

export const PayrollExtractionV1 = z.object({ schemaVersion: z.literal(1), salaryWages: MonthlyItemArray, ownerCompensation: MonthlyItemArray, payrollTaxes: MonthlyItemArray, benefits: MonthlyItemArray, meta: ExtractionMetaV1 });
// …one per existing data_type
```

`ExtractionMetaV1` standardizes the envelope (confidence, warnings, rawFindings string, extractedAt, sourceDocumentId, documentName, modelUsed) so every downstream consumer reads the same metadata fields.

Also export a typed enum for `source_type`:

```ts
export const ExtractionSource = z.enum([
  "ai_document_extraction",  // structured AI extraction from an upload
  "ai_document_classification",
  "ai_inline_derivation",    // derived inside an analyzer (e.g. derived_from_gl)
  "user_wizard",
  "qbtojson",
  "quickbooks_api",
  "docuclipper",
]);
```

Map the legacy free-text values to these on read (one-time translation table in `normalized-contracts.ts`).

### 2. Parser-side normalization (write path)

Every `process-*` / `parse-*` edge function gets the same three-line tail:

```ts
import { normalizeAndPersist } from "../_shared/normalized-contracts.ts";
await normalizeAndPersist(supabase, {
  projectId, userId, sourceDocumentId,
  dataType: "fixed_assets",
  source: "ai_document_extraction",
  rawAiOutput,                       // whatever the LLM returned
});
```

`normalizeAndPersist` does, in order:

1. Maps the raw AI output to the canonical schema using a per-data_type adapter (the logic currently in each fallback mapper, moved server-side once).
2. Validates with the Zod schema. On failure: stores `validation_status='failed'` + the Zod error in `meta.warnings`, still writes the raw payload under `data.raw` so we can debug, returns 200 to the caller so the document doesn't get stuck.
3. Inserts `{ data: { ...normalized, raw }, source_type, data_type, validation_status, record_count }`.

Per-parser changes are mechanical — each one currently builds an `extractionResult` object and calls `.from("processed_data").insert(...)`. Replace the insert with `normalizeAndPersist`. Parser file sizes shrink ~15–30 lines each.

### 3. Read-side cleanup (lazy)

Each `src/lib/*Fallback.ts` becomes a thin pass-through that:
- Tries `NormalizedSchema.safeParse(record.data)` first → return as-is.
- On failure (legacy row), applies the **same** adapter the edge function uses (re-exported from `src/lib/normalized-contracts.ts`) to upgrade in-memory.
- Optionally writes the upgraded shape back to the row on next save (no migration script needed).

Net result: fallback files drop from ~50 lines of field-juggling to ~10 lines of schema check + delegation.

## Out of scope (explicit)

- DB schema changes. No new columns; `processed_data.data` stays JSONB.
- One-shot data migration. Legacy rows auto-upgrade on read.
- Touching ingestion shapes the extractor service controls (Cloud Run extraction proxy, DocuClipper) — those are already normalized server-side and stored under different `source_type`s.
- Changing the contract for `qbtojson` / `quickbooks_api` data — `parse-tax-return` just got its normalizers; we'll fold those into the contract module but won't re-derive.
- Embeddings / RAG (`embed-project-data`) — already keys off `data_type` strings; contract enums make this safer but no logic change.

## Risk & verification

- **Risk: silent shape drift between client and edge normalizers.** Mitigated by sharing one Zod source — the `_shared/normalized-contracts.ts` file is the contract; both runtimes import the same field definitions. Add a vitest that imports both modules and asserts schema parity (`expect(serverSchema.shape).toEqual(clientSchema.shape)`).
- **Risk: existing rows break.** Mitigated by `safeParse` + legacy adapter on read. We never throw on legacy data.
- **Verification:** For each parser, write one fixture test that runs raw LLM output → `normalizeAndPersist` → schema parse → matches expected `FixedAssetsExtractionV1` (or equivalent). Run via `supabase--test_edge_functions`. Spot-check one real upload per data_type in the preview before sign-off.

## Rollout

Phase 1 (small): ship `_shared/normalized-contracts.ts` + the client mirror, with schemas only for `fixed_assets`, `payroll`, `debt_schedule`. Migrate those 3 parsers + their 3 fallbacks. Verify against existing uploads.

Phase 2: `inventory`, `lease_agreement`, `material_contract`, `cim_insights`, `supporting_document`.

Phase 3: `journal_entries`, `tax_return_analysis`, `transfer_classification` — the analyzer-derived shapes. These deserve their own pass because they're outputs of other analyzers, not raw extractions.

Phase 4 (optional, only if needed): a one-time backfill script that walks `processed_data`, runs each row through the legacy adapter, and writes the normalized shape back so reads stop paying the upgrade cost.

## Files touched

- New: `supabase/functions/_shared/normalized-contracts.ts`, `src/lib/normalized-contracts.ts`, `src/lib/normalized-contracts.test.ts`.
- Modified parsers (per phase): `process-fixed-assets`, `process-payroll-document`, `process-debt-schedule`, then phases 2/3.
- Slimmed fallbacks: `src/lib/fixedAssetsFallback.ts`, `src/lib/payrollFallback.ts`, `src/lib/debtFallback.ts`, then phases 2/3.

## Open question before I start coding

Do you want **Phase 1 only** in the first PR (3 data_types, low risk, proves the pattern), or **the full normalized-contracts module + all 10 data_types** in one bigger PR? Phase 1 is the safer ship.
