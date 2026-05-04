## Assessment

I checked both demo deliverables against the real export pipeline:

| File | Real pipeline | Demo file | Match? |
|---|---|---|---|
| `acme-sample-workbook.xlsx` | `TAB_GRID_BUILDERS` + `gridDataToRawData` + SheetJS (`exportWorkbookXlsx.ts`) | `scripts/generate-demo-workbook.ts` uses the **same** builders + `createMockDealData` | **Yes** — structurally identical (29 tabs, same layout, same number formats). Only diff is the prepended "DEMO" cover sheet. |
| `acme-sample-qoe.pdf` | `src/lib/pdf/pdfWorker.ts` (pdf-lib, ~1400 lines, Web Worker) — Cover → TOC → Attention Areas → QoE Analysis → IS Analysis → BS Analysis → Supplementary → AI Analysis, with traceability per adjustment, ratios, flagged txns, GL/JE findings | `scripts/generate-demo-deliverables.py` is a **hand-written ReportLab document** with completely different sections, fonts, table styling, and content | **No** — it's a marketing mockup, not the real deliverable. |

So: workbook is fine. **PDF needs to be regenerated from the real pipeline.**

## Plan

Replace the Python-based demo PDF with one produced by the real worker code, fed mock deal data — analogous to what we already did for the workbook.

### 1. New script: `scripts/generate-demo-pdf.ts`

- Use `createMockDealData()` for the deal.
- Build all the same inputs `ExportCenterSection.handleExportPDF` assembles:
  - `metadata: ReportMeta` (Acme Industrial Supply Co., demo dates, `serviceTier: 'diy'`)
  - `execSummary` via `computeExecSummary(dealData)`
  - `ddAdjustments` via `buildDDAdjustments(dealData)` (no DB proof/proposal maps — fine, those are optional)
  - `ratios` via `computeRatios(dealData)`
  - `grids` for every tab via `TAB_GRID_BUILDERS`
  - Synthetic `attentionItems`, `flaggedItems`, `glFindings`, `jeFindings` from mock data (small representative samples — keeps the report honest as a demo)
- Refactor `pdfWorker.ts`: extract the pure `buildPDFReport(reportData): Promise<Uint8Array>` function into a separate module (`pdf-builder.ts`) that the worker re-exports. The script imports `buildPDFReport` directly — no Worker, no `self`, runs in Bun.
- Reuse `_preload-browser-shims.ts` for any transitive client imports.
- After generating, overlay a watermark + "DEMO — NOT FOR DISTRIBUTION" footer on every page using `pdf-lib` (drawn after the report builds).
- Output: `public/demo/acme-sample-qoe.pdf`.

### 2. Refactor `pdfWorker.ts`

- Move `buildPDFReport` and all helper functions (`addCoverPage`, `addTOCPage`, table builders, etc.) into `src/lib/pdf/pdfBuilder.ts`.
- Keep `pdfWorker.ts` as a thin shim: import `buildPDFReport`, wire `self.onmessage` → `postMessage`. No behavior change for the live app.

### 3. Cleanup

- Delete `scripts/generate-demo-deliverables.py` (the workbook half is already replaced; PDF half is now replaced).
- Update `mem://index.md` line about demo regeneration to point to `bun run scripts/generate-demo-pdf.ts`.

### 4. QA

After generation, convert the new PDF to per-page PNGs and visually inspect — verify cover, TOC page numbers, every section renders, no clipped tables, watermark visible but not blocking content. Re-run until clean. (QA images deleted, not shipped.)

## Files

- **New**: `scripts/generate-demo-pdf.ts`
- **New**: `src/lib/pdf/pdfBuilder.ts` (extracted from worker)
- **Modified**: `src/lib/pdf/pdfWorker.ts` (becomes a thin re-export shim)
- **Regenerated**: `public/demo/acme-sample-qoe.pdf`
- **Deleted**: `scripts/generate-demo-deliverables.py`
- **Updated**: `mem://index.md`

## Risk

The pdf-lib code is browser-targeted but pdf-lib itself runs fine in Node/Bun. The risk is transitive imports from `@/lib/calculations`, `@/lib/qoeMetrics`, `@/lib/reclassHelpers`, etc., pulling in client-only modules. The `_preload-browser-shims.ts` from the workbook script already handles `localStorage` / Supabase fallout — same approach applies here.

Approve and I'll implement.