
# Shepi PDF — Six high-leverage additions

All six items render data we already collect. Scope is `src/lib/pdf/pdfWorker.ts` (the production builder used for both real exports and the demo PDF) plus a small data-pull update in `src/lib/pdf/exportNormalize.ts`. After changes I'll regenerate `public/demo/acme-sample-qoe.pdf` via `bun run scripts/generate-demo-pdf.ts` and visually QA every page.

## 1. P&L Reconciliation page (Broker → Shepi)

New page inserted in Section II right after the EBITDA Bridge.

Source: `data.grids.qoeAnalysis` already has Reported EBITDA + per-adjustment lines. The "broker" column comes from the intake form's owner-stated EBITDA (already captured in `wizard_data.broker_ebitda` / SIM figure, otherwise fall back to "Reported (per books)").

Layout (one landscape page):
```
Broker / Owner-Stated EBITDA          $X,XXX,XXX
  (-) Items not supported by GL       (xxx)
  (-) Reclasses                       (xxx)
  (+) Normalizing add-backs           xxx
  ───────────────────────────────────────────
Shepi Reported EBITDA                 $X,XXX,XXX
  (+) Owner comp normalization        xxx
  (+) Non-recurring                   xxx
  (+) Personal expenses               xxx
  ...
Shepi Adjusted EBITDA                 $X,XXX,XXX
```
Two-column: amount + % of revenue. Bold totals, teal rule above each subtotal. Skipped silently if no broker figure exists (don't fabricate).

## 2. Per-adjustment narrative paragraph

The traceability appendix already prints AI rationale + key signals + evidence per adjustment, but in a dense tabular block. Replace the rationale block on each traceability card with a true prose paragraph in this format:

> **Source.** AI Discovery (owner_compensation_detector) flagged this from 14 transactions in 2023. **Evidence.** Three salary entries totaling $480k vs. industry comp of $180k for same role; supporting payroll register and W-2. **Confidence.** Tier 1 — Multiple Source Support (verification score 87/100).

Pull from existing fields on `DDAdjustment`: `source`, `detectorType`, `aiRationale`, `evidenceTransactions.length`, `supportTier`, `supportTierLabel`, `verificationScore`. No new data needed — wizard already collects this.

## 3. Seasonality + MoM growth (charts)

Two stacked charts on one page in the Income Statement section, after Revenue Detail.

Data: monthly revenue series exists in `processed_data` (and is rendered in the workbook's Revenue tab). `exportNormalize` will pull it into `data.monthlyRevenue: { month: string; revenue: number }[]`.

pdf-lib has no chart primitives, so I'll draw them with `page.drawRectangle` / `drawLine`:
- **Seasonality**: 12 vertical bars (Jan–Dec), height = avg revenue for that month across years; teal bars, gold reference line for annual avg.
- **MoM growth**: bar chart of month-over-month % change; positive = teal, negative = red. Zero baseline drawn.

Both charts use the existing `C` palette + `boldFont` for axis labels. Skip the page if fewer than 6 months of data.

## 4. One-page Business Overview from intake

Already partially exists as `addCIMOverviewPage` (only renders if `cimInsights` is set, which is rare). Replace with a richer page that pulls directly from the wizard intake (`projects` row + `wizard_data` JSON), not from CIM AI:

- Company name, industry, founded year, HQ, employee count, ownership type
- One-paragraph business description (intake "what does the business do" field)
- Products/services bullets
- Customer profile (B2B/B2C, segments)
- Key risks + growth drivers (use `cimInsights` if present, otherwise wizard intake fields)

`exportNormalize` will assemble a `businessOverview` object from `projects` and `wizard_data` so the page always renders when intake is filled in.

## 5. Expanded Flagged Transactions detail

Current page caps at 12 rows in a flat table. Restructure to lean into the moat:

- **Header KPI strip**: Total flagged / High priority / By detector type counts.
- **Group rows by `flag_category`** with subtotal lines (Personal Expense, Round-Number, Duplicate, Off-Cycle, etc.).
- **Per-row evidence column**: short reason snippet (truncated `description` is not enough; pull from `flag_reason` if available on the row).
- Spill to a 2nd / 3rd page when >25 rows; cap at 50 total then summarize remainder.

Same data already in `data.flaggedItems`.

## 6. Kill empty section dividers

Current builder unconditionally pushes a divider page for each of Sections I–VI even when the section has zero content (the contact-sheet teardown showed 6 near-empty pages). Fix:

For each section, only push the divider when at least one downstream page in that section will render. Concretely: collect the section's pages first, then conditionally prepend the divider. This drops the dead pages and shrinks the deck from 20→~14–16 dense pages.

## Technical details

**Files to edit**
- `src/lib/pdf/pdfWorker.ts` — add `addPLReconciliationPage`, `addSeasonalityPage`, `addBusinessOverviewPage`; rewrite `addFlaggedTransactionsPage`; rewrite traceability rationale block; gate dividers behind section-has-content check.
- `src/lib/pdf/exportNormalize.ts` — add `monthlyRevenue`, `brokerEBITDA`, `businessOverview` to the normalized payload.
- `src/lib/pdf/pdfWorker.ts` `PDFReportData` type — add the new optional fields.
- `scripts/generate-demo-pdf.ts` — re-run after changes; ensure `mockDeal.ts` has plausible broker EBITDA + monthly revenue so the demo PDF showcases the new pages.

**Out of scope**
- No new edge functions, no new DB tables, no new wizard fields.
- The XLSX workbook is unchanged.
- Marketing site copy unchanged.

**QA**
After regenerating the demo PDF I'll `pdftoppm -r 120` it, inspect every page, list any layout/overflow issues, and iterate until clean.

Approve and I'll implement.
