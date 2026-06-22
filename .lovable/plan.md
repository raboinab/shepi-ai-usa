## Pre-deal readiness pass

Quick, focused checks before the live catering deal with Neal — read-only diagnostics first, fix only if something is actually broken.

### 1. Database sanity sweep (read-only)
- Scan `documents` across **all recent projects** for bank/credit-card fragmentation patterns still in the wild:
  - Multiple `institution` variants per `(project_id, account_label)`
  - Trailing/leading whitespace in `account_label` or `institution`
  - `institution` strings still containing the project's `target_company`
- Check last ~10 active projects for stuck `analysis_jobs`, failed `docuclipper_jobs`, or `upload_errors` from the last 48h.
- Confirm `check-subscription` UncaughtException in logs is benign (it ran successfully — likely a post-response microtask warning, but worth confirming it isn't blocking project creation).

### 2. Upload → enrich → coverage flow (live)
- Drive Playwright against the running preview:
  - Create a throwaway project, upload one of the demo bank PDFs, wait for `enrich-document`, and confirm `PerAccountCoverage` renders one row per real account (no fragmentation).
  - Verify the merged-variants tooltip shows up only when warranted.
- Tail `enrich-document` logs during the test to confirm the new normalization branch is hit.

### 3. Export path
- Trigger the workbook XLSX export and the PDF report on a known-good project; confirm both download and open without errors. This is the deliverable Neal will see — must not break mid-call.

### 4. Catering-specific gotchas to pre-check
- COA / industry classification: confirm `business_profiles` industry options include food service / catering, and that the AI assistant has reasonable defaults for COGS treatment of food + labor.
- Owner comp normalization and tip/cash-handling adjustments: confirm the adjustment proposal flow surfaces these categories (catering deals usually surface both).

### 5. Reporting back
- Single status message: green/yellow/red per area, with any quick fixes already applied called out. No new features added during this pass — only fixes for things that would visibly break in front of Neal.

### Out of scope
- New features, UI redesigns, schema changes, or anything not directly tied to the catering deal going smoothly today.
