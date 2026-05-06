
# Finish PDF improvements (4 remaining items)

## 1. Delete the legacy flagged-pages function
`src/lib/pdf/pdfWorker.ts` lines 778–902. Remove `_unusedAddFlaggedPagesLegacy` entirely — `addFlaggedChunkPage` (line 682) replaces it and is already wired in at line 1828.

## 2. Rewrite traceability rationale as prose
`src/lib/pdf/pdfWorker.ts` `addTraceabilityPage` (line 1450). Replace the current rationale block (~lines 1492–1540) with a single justified prose paragraph per adjustment in this shape:

> **Source.** {source} ({detectorType}) flagged this from {evidenceTransactions.length} transactions. **Evidence.** {keyFindings joined / aiRationale trimmed}; supporting {evidence document refs if present}. **Confidence.** {supportTierLabel} (verification score {verificationScore}/100).

Use `boldFont` for the inline "Source." / "Evidence." / "Confidence." labels via separate `drawText` calls at computed x-offsets (pdf-lib has no inline rich text). Wrap at ~120 chars. Keep the existing card frame, header line, and amount column — only the rationale block changes. Skip the labeled section if its underlying field is empty (don't render "Evidence. ").

## 3. Wire exportNormalize.ts
Add three normalizers in `src/lib/pdf/exportNormalize.ts` and surface them on the normalized payload consumed by `pdfWorker`:

- **`monthlyRevenue`** — pull from `processed_data.monthly_revenue` (same source the Revenue workbook tab uses; check `src/components/workbook/tabs/` for the exact path). Shape: `{ month: string; revenue: number }[]`. Skip when <6 points.
- **`plReconciliation`** — `reportedEBITDA` from `data.grids.qoeAnalysis` reported row; `adjustments` from the same grid's adjustment lines (title, amount, optional category). Bridge is Reported → Adjusted (the `brokerEBITDA`/stated bits we already removed).
- **`businessOverview`** — assemble from `projects` row + `wizard_data` JSON: companyName, industry, foundedYear, hqLocation, employeeCount, ownershipType, description, products[], customerProfile, growthDrivers[], keyRisks[]. Render whatever's present; fall back to `cimInsights` for risks/drivers when wizard fields blank.

Then update the call site (search for where `exportNormalize` output is merged into `PDFReportData` — likely in `src/lib/pdf/index.ts` or wherever `buildClientPDF` is invoked) to pass these three new fields through.

## 4. Regenerate demo PDF + visual QA
- Add mock values to `scripts/generate-demo-pdf.ts` (or its `mockDeal` import) for: 12-month revenue series with realistic seasonality, a `plReconciliation` with reported EBITDA + 4–6 adjustments, and a populated `businessOverview`.
- Run `bun run scripts/generate-demo-pdf.ts`.
- `pdftoppm -r 120 public/demo/acme-sample-qoe.pdf /tmp/qa/page` and view every page. Check: no empty dividers remain, P&L reconciliation totals foot, seasonality bars don't clip, business overview wraps cleanly, flagged-tx group subtotals align, traceability prose paragraphs don't overflow card frames.
- Iterate until clean.

## Out of scope
No changes to the XLSX builder, no new wizard fields, no new edge functions.

Approve and I'll execute in order 1 → 2 → 3 → 4.
