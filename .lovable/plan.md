## Full system readiness sweep

Broader pre-deal check across the whole product surface. Read-only diagnostics first; only fix things that would visibly break the Neal call.

### 1. Data integrity (all tables, last 60 days)
- **Documents:** fragmentation, NULL `category` vs populated `account_type`, orphaned rows, stuck `processing_status='processing'` older than 1 hour.
- **processed_data / canonical_transactions:** orphaned rows (no parent document/project), suspiciously empty result sets, duplicate period rows.
- **adjustment_proposals / flagged_transactions:** projects with proposals but no evidence rows, NULL sign/amount issues.
- **workflows / analysis_jobs / docuclipper_jobs / reclassification_jobs:** anything stuck in `running`/`pending` >2h, recent failure clusters.
- **company_info:** rows with NULL `user_id` (trigger should prevent, but verify).
- **project_data_chunks:** projects with chunks whose `chunk_key` references a different project_id (the duplicate-project bug class).

### 2. Edge function health
- Pull recent logs for the hot path: `enrich-document`, `process-document`, `complete-qb-sync`, `analyze-transactions`, `generate-report`, `check-subscription`, `cpa-notify`, `notify-admin`.
- Flag any function with 5xx in the last 24h or repeated UncaughtException patterns.
- Confirm all required secrets present (LOVABLE_API_KEY, OPENAI_API_KEY, LLM_EXTRACTOR, QB_*, STRIPE_*, RESEND, DOCUCLIPPER if applicable).

### 3. Live pipeline smoke test (Playwright, headless)
- Create throwaway project as the logged-in preview user.
- Upload one demo bank PDF + one demo trial-balance file.
- Wait for enrichment, confirm `PerAccountCoverage` renders cleanly and document validation completes.
- Open the Workbook tab and confirm grid renders without console errors.
- Trigger XLSX export and PDF report; verify download succeeds.
- Tear down the throwaway project.

### 4. UI surface check
- Check console + network for errors on key routes via Playwright screenshots:
  - `/projects` (list)
  - a real in-progress project: `/project/fa0768ca-…` wizard, workbook, insights, exports
  - `/cpa` dashboard (DFY tier matters for Neal if it's done_for_you)
  - `/admin` (just to confirm no regressions)

### 5. Catering-specific pre-stage
- Confirm the wizard flows accept "Restaurants & Food Service" and that downstream COA seeding + adjustment categories aren't industry-gated in a way that excludes food service.
- Confirm AI assistant has the catering/restaurant guide content in `rag_chunks` (or at least food-service-relevant entries) so Neal gets useful in-call suggestions.

### 6. Auth + access
- Confirm Neal's user (if known) has a working session path; if he's a CPA, confirm `cpa_profiles` + `user_roles` are set so the project share will land.
- If unknown, skip this and surface a checklist for you to verify in the moment.

### 7. Report-back format
- Single status table: **area → green/yellow/red → one-line evidence → fix-now? y/n.**
- Apply only fixes that block the live call. Anything cosmetic/non-blocking goes into a "post-deal followup" list, not shipped today.

### Out of scope
- New features, refactors, schema migrations, UI redesign, performance tuning. Strictly diagnostic + critical-fix-only.

### Estimated time
~5-8 minutes of tool calls, mostly parallel SQL + log pulls + one Playwright run.
