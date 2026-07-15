# Durable bank/CC statement normalization

## Why the first run failed on project 621a6c9f

`enrich-document` (the function that runs on every new upload) only did two light-touch cleanups:

1. Stripped the target-company name off `institution` (so "Business Checking - ACME" became "Business Checking").
2. Lowercased/trimmed `account_label`.

It never applied the canonical issuer rules or the "{Issuer} {Last4}" label format that `src/lib/bankAccountNormalization.ts` uses on the client. So the DB stored whatever the parser returned:

- Chase card statements came in as "Amazon Prime Visa" on some months and "Chase Amazon Prime Card" on others → two coverage rows.
- Account labels were raw `xxxx1234` / `****3962` / `3962` variants → collisions and split coverage.
- When the parser failed to detect a period, the doc was left with NULL period and no fallback used the filename (which usually contains the last-4 and statement date).
- Some Chase files had the wrong last-4 baked into `account_label` because the parser trusted a header that mentioned a different card on the combined statement; the filename (`...-7187-...pdf`) was ignored.

The client-side normalization we added masks this at read-time for the current project, but new uploads for the next target would repeat the same fragmentation.

## Fix: push canonicalization into the enricher, keep it generic

### 1. Share one normalization module between client and edge functions

Move the canonical logic out of `src/lib/bankAccountNormalization.ts` into a Deno-compatible module that both sides import:

```text
supabase/functions/_shared/bankAccountNormalization.ts   ← source of truth
src/lib/bankAccountNormalization.ts                       ← re-exports for the app
```

Exports: `canonicalIssuer(raw)`, `extractLast4(...candidates)`, `normalizeAccountLabel(issuer, last4)`, `bankAccountGroupKey(institution, label)`.

Rules stay generic (Chase, Wells Fargo, Fidelity, Amazon/Amex/Capital One/BofA/Citi/US Bank/etc. via regex table). Nothing project-specific.

### 2. Rewrite `cleanInstitution` / `cleanAccountLabel` in `enrich-document`

New flow when a bank or credit-card doc finishes parsing:

1. Collect last-4 candidates in priority order: `parsed.accountNumber` → filename digits (`(?:^|[^0-9])(\d{4})(?=[^0-9]|$)` scoped to segments like `-7187-`) → existing `doc.account_label`.
2. Collect issuer candidates: `parsed.bankName` → `doc.institution` → filename brand tokens (e.g. `chase`, `wellsfargo`, `fidelity`, `amazon`, `amex`).
3. Run both through `canonicalIssuer` / `extractLast4`.
4. Write `institution = canonicalIssuer(...)`, `account_label = normalizeAccountLabel(issuer, last4)` (e.g. `"Chase 7187"`), so every future doc that shares that account groups on the exact same key.
5. Only overwrite an existing `account_label` when the new value has a confident last-4 AND the old value's last-4 disagrees with the filename's last-4 (this is what caused the 7187/3962 mislabels — the parser trusted a header line from a combined statement; the filename is the tiebreaker).

### 3. Period fallback from filename

When `parsed.periodStart` / `parsed.periodEnd` come back null:

- Try filename patterns already common in statements: `YYYYMMDD`, `YYYY-MM`, `MMM-YYYY`, `MM-DD-YYYY`.
- If a single date is found, set `period_end = that date` and `period_start = first day of that month` (statement convention). Store `parsed_summary.period_source = "filename"` so the UI can show a "verify period" hint.
- If nothing resolves, leave nulls but write `processing_status = 'needs_review'` (not `completed`) so it surfaces in the Documents wizard for a one-click re-detect.

### 4. Duplicate detection at upload time

Before insert, `enrich-document` computes a dedupe key: `(project_id, institution_canonical, account_label_canonical, period_start, period_end, file_size)`. If a match already exists with `processing_status = 'completed'`, mark the new row `status = 'duplicate'` and skip processed_data insertion. Prevents the double-row we saw on `20250104-statements-7187-.pdf`.

### 5. One-time backfill for existing projects

A short admin-only edge function `normalize-bank-docs` iterates `documents` where `category IN ('bank_statement','credit_card')` and re-runs steps 1–3 above using only DB fields + filename. Idempotent. Callable per-project from the admin UI.

### 6. UI hooks (small)

- Documents wizard: for any row with `processing_status = 'needs_review'`, show "Re-detect period" and "Fix account #" inline actions (both already exist as one-off flows — just wire them to this status).
- Coverage view keeps using `bankAccountGroupKey` from the shared module, so client and server agree.

## Technical details

Files to add/edit:

- **new** `supabase/functions/_shared/bankAccountNormalization.ts` — canonical issuer table + helpers (Deno).
- **edit** `src/lib/bankAccountNormalization.ts` — thin re-export, drop the duplicated table.
- **edit** `supabase/functions/enrich-document/index.ts` — replace `cleanInstitution` / `cleanAccountLabel` blocks (lines ~374–428) with the shared helpers; add filename-based last-4 and period fallbacks; add dedupe check; set `needs_review` status when applicable.
- **edit** `supabase/functions/detect-financial-statement-period/index.ts` — call the same filename fallback so re-detect on statements is consistent.
- **new** `supabase/functions/normalize-bank-docs/index.ts` — admin backfill, guarded by `has_role(auth.uid(),'admin')`.
- **edit** `src/components/wizard/sections/DocumentUploadSection.tsx` — surface `needs_review` state + wire existing re-detect action.

No schema migration needed; `processing_status` already accepts free-form strings and both `institution` / `account_label` are nullable text.

Verification:

- Unit test the shared module against a fixture list of real filenames and parser outputs (Chase combined statements, Amazon Prime Visa, Fidelity CMA, Wells Fargo business checking).
- Upload one new bank PDF and one new CC PDF to a fresh test project; confirm `institution` = canonical issuer, `account_label` = `"Issuer 1234"`, coverage row appears once.
- Run `normalize-bank-docs` on 621a6c9f as a smoke test; expect 0 changes since it was already fixed manually.
