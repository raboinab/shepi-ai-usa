# Fix: Parent accounts with direct postings dropped from TB totals

## The bug

In this project's Trial Balance, `Maintenance and Repair` is a parent row that has **both** direct postings (~$19,172 of YTD-converted activity over 2023-2025) **and** three child accounts (`:Building Repairs`, `:Computer Repairs`, `:Equipment Repairs`).

- The uploaded QuickBooks P&L correctly includes the parent's direct postings as a separate line ($19,171.98).
- The TB-derived calculation drops them, producing the $19,172 Operating Expenses gap and the false "missing account" callout.

The parent row is present in the TB CSV — so the bug is in either (a) the TB parser zeroing parents that have children, or (b) `classifyISAccount` returning `null` for the parent row's `accountName`/`accountType` combination.

## Diagnose first (one short script, no code changes)

1. Query the parsed `trial_balance_accounts` (or equivalent) rows for this project where `account_name ILIKE '%maintenance and repair%'`. Confirm:
   - Does a row exist for the parent (`Maintenance and Repair`, no colon)?
   - If yes, are its `monthlyValues` populated or zeroed?
   - What's its `accountType` / `fsType`?
2. Pipe that exact `accountName` + `accountType` into `classifyISAccount` and see what bucket comes back.

This tells us whether the fix belongs in the parser or the classifier.

## Fix path A — parser drops parents that have children

If the parent row exists but its `monthlyValues` are empty/zero, update the TB ingestion to keep parent direct postings even when child accounts share the path prefix. The display layer can still nest them; the numeric totals must include the parent's own line.

## Fix path B — classifier returns null for the parent

If the parent's `accountType` (e.g. `Expense` / `Expenses`) is what's failing the classifier, broaden `classifyISAccount` so a row with `accountType` matching `/expense/i` and no override falls through to the `expense` bucket, instead of returning `null`. Same treatment for revenue/COGS parents.

## Adjust the "missing accounts" detector

Currently it flags any uploaded P&L row whose label doesn't appear in `tbBreakdown`. After the fix above, `Maintenance and Repair` will appear in the breakdown and will stop showing as missing. Also tighten the matcher so a parent label matches a TB row whose `accountName` ends with that exact segment (already partly there — verify it works once the parent is in the breakdown).

## Verify

Re-run validation on this project. Expected:
- Operating Expenses TB-derived: $774,058 (matches uploaded).
- Net Operating Income variance: $0.
- Net Income variance: $0.
- "Why don't these match?" panel: no missing accounts.

## Out of scope

- No schema migrations.
- No changes to the AI prompt or `lineDetails` extraction.
- No Balance Sheet path changes.
