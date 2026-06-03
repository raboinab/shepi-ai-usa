## Why the panel is empty

The file you uploaded yesterday (`Sandbox Company_US_2_Sales by Customer Summary.xlsx`) was routed through the **Customer Concentration** path. That path calls qbToJson's `/api/convert/customer-concentration` endpoint, which only returns **annual totals** — the monthly columns from the Excel are dropped.

The "Monthly Trends & Churn — Customers" panel reads a different `processed_data.data_type` (`sales_by_customer_monthly`), which is only written when a file is uploaded under the **"Sales by Customer (Monthly Columns)"** slot. That row doesn't exist for this project, so the panel shows its empty state.

Confirmed in the DB:
- `documents.parsed_summary.data_type` = `customer_concentration` / `vendor_concentration`
- `processed_data` has `customer_concentration` and `customers`, but no `sales_by_customer_monthly` or `expenses_by_vendor_monthly`.

## Fix

Make the existing Customer/Vendor Concentration upload **also** populate the monthly dataset when the source file has monthly columns. The annual concentration stays unchanged; we add a second `processed_data` row keyed by `sales_by_customer_monthly` / `expenses_by_vendor_monthly`.

### 1. Upload flow (`src/components/wizard/sections/DocumentUploadSection.tsx`)

In the branch that handles `customer_concentration` / `vendor_concentration` uploads, after the existing `process-quickbooks-file` call returns, additionally:

1. Run `parseMonthlySummary(file)` locally (the parser already exists in `src/lib/parsers/parseMonthlySummary.ts` and works on the same QB exports).
2. If parsing succeeds **and** `parsed.months.length >= 2`, insert a second `processed_data` row:
   - `data_type`: `sales_by_customer_monthly` (or `expenses_by_vendor_monthly`)
   - `source_type`: `qbtojson`
   - `source_document_id`: the same document id
   - `period_start` / `period_end` / `data`: from the parser
3. Swallow parser errors silently (annual concentration upload still succeeds; just log to console).
4. Show a small additional toast: *"Monthly trends ready — open Top Customers → Monthly Trends."*

Don't touch any other branch. Don't change the existing `customer_concentration` insertion.

### 2. Backfill the two existing files

Add a small one-off backfill that re-reads the two uploaded files from Supabase Storage, parses them with `parseMonthlySummary`, and writes the matching `sales_by_customer_monthly` / `expenses_by_vendor_monthly` rows for project `fa0768ca-96f9-4ded-b498-f64ca5be3ede`. Affected docs:

```
5059a2b0…  Sandbox Company_US_2_Sales by Customer Summary.xlsx   → sales_by_customer_monthly
8cc4786b…  Sandbox Company_US_2_Expenses by Vendor Summary.xlsx  → expenses_by_vendor_monthly
```

Run via `scripts/` (one-off, executed locally with `bun run`). No migration required — these are plain inserts using the service role key already used by other backfill scripts.

### 3. Out of scope (for this change)

- Modifying the qbToJson edge function or its API.
- Changing the Monthly Trends panel UI.
- Touching the `customer_concentration` shape, COA logic, or the leaf-collision merge fix from earlier.
- Auto-detecting monthly columns inside `process-quickbooks-file` (server-side) — we can do that later if you want server-side parity, but the client-side parse is the lowest-risk fix and avoids re-downloading the file in the edge function.

### Technical notes

- `parseMonthlySummary` already handles both `.xlsx` and `.csv`, detects `Customer` vs `Vendor` header row, and returns `entityType`, `months`, `rows`, `periodStart`, `periodEnd`, `grandTotal`. The panel (`CustomerVendorMonthlyPanel.tsx`) reads exactly this shape — no transform needed.
- Insertion uses the existing supabase client (authenticated user). RLS on `processed_data` already allows insert by `project_id` owner — same path used by the explicit "Sales by Customer (Monthly Columns)" branch in this file.
- Backfill script downloads from `documents` storage bucket using `storage_path` on the document row, parses, and inserts. It will skip if a row of the same `data_type` already exists for that document.

### Verification

After the change:
1. Re-upload (or run backfill for) `Sandbox Company_US_2_Sales by Customer Summary.xlsx`.
2. Query: `select data_type, record_count from processed_data where project_id='fa0768ca…' and data_type in ('sales_by_customer_monthly','expenses_by_vendor_monthly')` — expect two rows.
3. Reload Top Customers → Monthly Trends — panel renders heatmap, churn chart, drift chart.
