# Customer & Vendor Monthly Trends + Churn

Yes — the two files you uploaded are exactly the QuickBooks shape we need. Both are wide matrices: column A = Customer / Vendor name, columns B…N = one column per month (`"January 2023"` … `"December 2025"`), last column = `Total`. First 3 rows are title/company/period; last data row is `TOTAL`; trailing line is the QB "Accrual Basis …" footer. This is the perfect grain for monthly + churn analytics, and we can parse it locally — no DocuClipper, no QB connection required.

This is Option 3 from the previous turn (new upload type), wired through the existing Documents flow.

## Scope

### 1. Two new document types

Add to `DOCUMENT_TYPES` in `DocumentUploadSection.tsx`:
- `sales_by_customer_monthly` — "Sales by Customer (Monthly Columns)"
- `expenses_by_vendor_monthly` — "Expenses by Vendor (Monthly Columns)"

Both are **range-covering** (like P&L by month): use the parsed period from row 3 (`"January 1, 2023-December 31, 2025"`) to populate `period_start` / `period_end` so they flow through the existing coverage timeline.

### 2. Client-side parser (no edge function needed)

New `src/lib/parsers/parseMonthlySummary.ts`:
- Reads `.xlsx` (via existing `xlsx` lib) or `.csv`.
- Detects header row by finding the row whose first cell is `Customer` or `Vendor` and where 2nd+ cells parse as `"<MonthName> <Year>"`.
- Builds `{ entityType: 'customer'|'vendor', periodStart, periodEnd, months: ['2023-01', …], rows: [{ name, monthly: { '2023-01': 1234.56, … }, total }], grandTotal }`.
- Drops the `TOTAL` row and the trailing "Accrual Basis …" line.
- Coerces `null` → 0, keeps signs (refunds/credits stay negative).

Persist parsed JSON into `documents.extracted_data` and a row-per-entity-per-month flattened copy into `processed_data` (data_type = `sales_by_customer_monthly` / `expenses_by_vendor_monthly`) so it's queryable the same way other processed data is.

### 3. New analytics module: "Customers & Vendors — Trends & Churn"

New route/section `src/components/insights/CustomerVendorAnalytics.tsx`, surfaced from the Insights / Customer-Vendor area (replaces today's static yearly concentration when monthly data exists; falls back to the yearly view otherwise).

Tabs: **Customers** | **Vendors**. Each tab shows:

- **Monthly heatmap** — entities (rows) × months (cols), cell shaded by $ amount, sortable by total / last-month / volatility. Top N selector (10 / 25 / 50 / all).
- **Trend chart** — stacked area of top 10 entities + "Other", with toggle for total line.
- **Cohort / churn table** — for each entity compute: `firstMonth`, `lastMonth`, `activeMonths`, `status` (`new` in last 3 mo, `returning`, `lost` = last activity > 3 mo before period end, `one-time` = 1 active month). Summarize counts + $ at top.
- **New / Returning / Lost trend** — per month: # of entities new that month, # returning, # lost (last activity that month). Bar chart.
- **Concentration drift** — top-5 / top-10 share of revenue (or spend) plotted monthly, to show concentration risk changing over time.

All numbers use the same `formatCurrency` and `formatPercent` helpers already in the codebase. Empty state if no monthly data uploaded yet, with a CTA pointing to the new upload types.

### 4. Hook + wizard wiring

- `useAutoLoadProcessedData.ts`: add the two new data_types and wizard targets (`wizardData.customerMonthly`, `wizardData.vendorMonthly`).
- `documentChecklist.ts`: add two new entries under existing customer/vendor items as the "preferred" tier (yearly concentration stays as fallback).
- `embed-project-data`: serialize the new shapes into chat context so insights-chat can answer monthly questions.

### 5. Out of scope

- No change to GL vendor backfill (still nullable).
- No new edge function — parsing is fast and bounded (sample file: 55 rows × 37 cols).
- No QB API call — these are uploads.

## Technical notes

- Parser is pure-TS and runs in the upload handler in `DocumentUploadSection.tsx` right after the file lands in storage, before the `processing_status` flip to `completed`.
- Month key format `YYYY-MM` matches what `periodUtils.ts` already uses for coverage math.
- Negative amounts kept as-is so refund-heavy customers show up correctly in churn (a net-negative customer in the last 3 mo is still "active").
- Sample row from your file — `"Bashirian and Sons", -190.93, 1099.84, null, …` — round-trips through the parser as `{ name: 'Bashirian and Sons', monthly: { '2023-01': -190.93, '2023-02': 1099.84, '2023-03': 0, … }, total: 19027.94 }`.

## Verification

1. Upload `Sandbox_Company_US_2_Sales_by_Customer_Summary.xlsx` → document lands as `sales_by_customer_monthly`, coverage bar shows Jan 2023 – Dec 2025.
2. Open Customers tab → heatmap renders 77 customers × 36 months, totals reconcile to the `TOTAL` row in the file.
3. Upload the vendor file → Vendors tab populates; churn table shows e.g. "Bob's Burger Joint" as `new` (only Dec 2025 activity).
4. Concentration drift line moves over time (sanity check vs. yearly customer_concentration).
5. Yearly-only projects keep seeing the old concentration view (no regression).
