
# Bank & credit card coverage — diagnosis and fix

## What's happening on project 621a6c9f

Coverage looks fragmented because documents that belong to the **same account** are being split across multiple "institution" strings coming out of the parser, and a handful of last-4 collisions cause the wrong `account_label`. Every doc has `coverage_validated = false`.

Groups the UI is currently showing as distinct (but are actually one account each):

| Real account | Split into |
|---|---|
| WF 7179 operating checking | "DESTRUKTURE CORP DBA VAMPIREFREAKS" (5 mo) + "Optimize Business Checking" (36 mo) |
| Chase Amazon Visa …3962 | "Amazon Prime Rewards Visa Signature Card" + "Amazon Prime Visa" + "Chase Amazon Prime Card" |
| Chase Amazon Visa …7187 | Correctly-labeled 12 docs + ~7 docs whose files are `*-7187-.pdf` but got tagged `Chase 3962` |
| Fidelity …4161 | "Fidelity Rewards Visa Signature Card" + "Fidelity® Rewards Visa Signature® Card" |
| Fidelity …9831 | Same two variants as 4161 |
| Chase United …0472 | 4 variants of "United MileagePlus …" |
| Fidelity 4161 | 1 doc with NULL period_start/period_end |

## Fix plan (generic, applies to every project)

### 1. Normalize institution + account_label at read time (frontend)
`src/lib/bankAccountNormalization.ts` and `PerAccountCoverage.tsx` already group by a normalized key. Extend the normalizer:
- Strip `®`, `™`, trailing " Card" / " Business Card" / " Signature Card" / " Rewards" / " Award".
- Collapse "Amazon Prime * Visa*" → "Chase Amazon Prime Visa".
- Collapse "Fidelity* Rewards Visa*" → "Fidelity Rewards Visa".
- Collapse "United MileagePlus*" → "Chase United MileagePlus".
- Collapse "*Optimize Business Checking*" and any legal-entity DBA string to a canonical "Wells Fargo Business Checking" when `account_label` starts with `WF `.

Grouping key stays `{normalized institution} + {last-4 from account_label}` so 3962 and 7187 stay separate even under the same institution.

### 2. Backend: normalize on write in the parser/enricher
`supabase/functions/enrich-document/` (and the DocuClipper parse path) should apply the same normalization before writing `institution`, so newly uploaded docs land in the right bucket without frontend reshaping.

### 3. Re-detect period for docs with NULL periods
Trigger the existing `detect-financial-statement-period` (or the statement-specific extractor) for any bank/credit-card doc where `period_start IS NULL AND processing_status='completed'`. Add a small "Re-detect period" button on the doc row plus a project-level "Re-detect missing periods" action.

### 4. Fix the 7187 vs 3962 mislabels
Add a heuristic in the enricher: when the filename contains `-<4digits>-` and it disagrees with the parsed `account_label` last-4, prefer the filename digits and re-run classification. This is generic — filename last-4 is the most reliable signal on Chase PDFs. Provide a one-time admin action to re-enrich the 6–7 affected docs on this project.

### 5. Backfill this project
After deploying (1)–(4):
- Run a one-shot rewrite (edge function or SQL migration) that recomputes `institution` and `account_label` from the new normalizer for all docs where `account_type IN ('bank_statement','credit_card')`.
- Kick period re-detection for the 1 NULL Fidelity doc.
- Mark `coverage_validated = true` for groups whose per-month coverage reaches 100% over the project's fiscal periods.

### 6. UI: show the merged variants
`PerAccountCoverage` already surfaces "Merged from N parsed variants" via tooltip — keep that. Add a small warning row above the grid when any doc in the project has `period_start IS NULL` linking to the "Re-detect" action.

## Technical notes

- No schema changes required. `institution`, `account_label`, `period_start`, `period_end`, `coverage_validated` already exist on `documents`.
- All changes are in:
  - `src/lib/bankAccountNormalization.ts` (extend regex table)
  - `supabase/functions/enrich-document/index.ts` (apply same normalization + filename-last-4 override)
  - `supabase/functions/detect-financial-statement-period/index.ts` (already handles statements — just needs a "single-doc" trigger endpoint we can call from the UI)
  - `src/components/wizard/shared/PerAccountCoverage.tsx` (period-null warning)
  - `src/components/wizard/sections/DocumentUploadSection.tsx` (add "Re-detect missing periods" action)
- One-shot backfill runs through a new admin-only edge function `renormalize-bank-docs` that reads all bank/CC docs for a `project_id`, applies the new normalizer, and updates rows.

## Expected outcome on 621a6c9f

- WF 7179: single row, 41-month bar, 100% covered.
- Chase Amazon 3962: single row, filename-corrected, ~36 mo covered.
- Chase Amazon 7187: single row, docs previously tagged 3962 move here.
- Fidelity 4161 & 9831: one row each, 36–39 mo covered, NULL doc re-dated.
- Chase United 0472: single row, ~10 mo covered.
