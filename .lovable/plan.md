## Changes

### `src/pages/Index.tsx` (homepage Scope-of-Work section)
- Delete the caption line `<p className="text-xs text-muted-foreground italic">Delivered as a 27-tab workbook.</p>` (line 696). Keep the 9-item Deliverables list as-is.
- On the Done-For-You card, prepend a new first bullet: **"CPA-led review of every adjustment"**.

### `src/pages/ScopeOfWork.tsx`
- Replace the 9-item BenefitGrid in the Deliverables section with **4 named artifacts**:
  - **QoE Workbook** — Excel, 27 tabs covering Executive Summary, EBITDA Bridge, Revenue Quality, Working Capital, Proof of Cash, GL Findings, Customer/Vendor Concentration.
  - **Executive Summary** — PDF, lender- and LP-ready.
  - **Source-Cited Audit Trail** — every adjustment traceable to the underlying transaction.
  - **Bank Reconciliation Pack** — proof of cash from the processed bank statements.
- ComparisonTable: change the "CPA review" row value from "Included where applicable" → **"CPA-led review"**, and reorder rows so CPA review sits directly under "Who runs the analysis" (before Turnaround).

### `src/data/homepageFaq.ts`
- Append "(includes CPA-led review)" to the Done-For-You half of the `what-is-3` FAQ answer.

## Out of scope
No new files, no new components, no schema or dependency changes.
