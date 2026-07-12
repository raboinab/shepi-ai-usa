# Vampire Freaks project — current state

Checked James's project (`621a6c9f`) in the DB. Two separate problems:

## Problem 1 — Balance Sheet period is wrong

| Doc | Detected period |
|---|---|
| P&L (`VampireFreaks_Profit and Loss (4).xlsx`) | ✅ 2023-01-01 → 2026-05-31 |
| Balance Sheet (`VampireFreaks_Balance Sheet.xlsx`) | ❌ 2026-05-01 → 2026-05-31 only |

The P&L now spans correctly after the last fix. The BS still collapses to a single month because comparative Balance Sheets from QuickBooks typically show column headers like `May 31, 2026 | May 31, 2025 | May 31, 2024` — only the **first** column is prefixed with "As of". The `as of` regex therefore matches once, and the widest-span logic returns only that one month.

## Problem 2 — Project is stuck at Phase 2 / Section 1

Even with documents dated, nothing downstream has happened:

- `canonical_transactions`: **0**
- `analysis_jobs`: **0**
- `adjustment_proposals`: **0**
- `findings`: **0**
- `docuclipper_jobs`: 25 completed (credit-card statements were parsed fine)

Project status: `in-progress`, `current_phase: 2`, `current_section: 1`, `service_tier: diy`. Credit card transactions extracted by DocuClipper never made it into `canonical_transactions`, and no analysis job was ever created. This is not a period-detection problem — it's an orchestration problem. Either:

- (a) the wizard is gating on a user click (e.g., "Start analysis") that James hasn't pressed, or
- (b) code that normalizes `processed_data → canonical_transactions` is missing/broken for this project.

I need to read the Phase 2 section components before I know which.

---

# Plan

### 1. Improve BS multi-period detection (edge function)

In `supabase/functions/detect-financial-statement-period/index.ts`:

- Add a new regex pass for **bare header dates** like `May 31, 2026` / `May 31 2025` / `12/31/2024`, not just "As of" prefixed dates.
- Only apply this pass when `account_type = 'balance_sheet'` (avoid false positives on P&L transaction dates).
- Restrict to dates found in the **first ~15 rows** of any sheet (header region) so we don't pick up transactional dates.
- Collect all matches, return earliest start-of-month → latest end-of-month.
- Increase XLSX row scan from 40 → 60 rows per sheet to capture wider comparative tables.
- Tighten the LLM prompt to explicitly note "comparative BS often only says 'As of' once; treat every date column header as an 'as of' date."

### 2. Backfill James's Balance Sheet immediately

After deploy, re-run the detector on document `e8a24dbf-0e46-47af-a2cb-59618a80ebe4` so BS spans the same window as P&L (assumed 2023-01-01 → 2026-05-31 pending detection result).

### 3. Diagnose the "no analysis" gap

Read the Phase 2 wizard components to find:
- Where `canonical_transactions` is populated from `processed_data` (probably a normalizer edge function or client-side transform).
- Whether it needs a manual "Continue" or "Start analysis" click, and whether the UI is showing that button.
- Whether there's a validation blocker (e.g., "BS period doesn't cover all periods").

Then either:
- Fix the orchestration/normalizer bug, or
- Surface a clear next-step button in the UI (if the flow is just waiting on a click), or
- Manually kick off the missing job for James so his project unsticks.

### 4. Verify

- Re-query DB: BS should have full span; `canonical_transactions` should have rows for all 25 CC statements.
- Take a Playwright screenshot of James's project page as admin to confirm the wizard advances.

---

## What I won't touch

- The "Detect" / "Set dates" buttons and manual-fallback dialog already added — those stay as escape hatches.
- Any other project or the period-detection heuristics for non-balance-sheet docs.
