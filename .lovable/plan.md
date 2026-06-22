## What happened on this project

The coverage widget groups bank statements by `institution :: account_label`. For project `fa0768ca-…`, the `documents` table currently has **four distinct combinations** for what should be two accounts:

| institution                                                  | account_label | # docs |
|--------------------------------------------------------------|---------------|--------|
| `Business Checking`                                          | `checking`    | 23     |
| `Business Checking - SANDBOX LANDSCAPING & MAINTENANCE CO`   | `checking`    | 3      |
| `SANDBOX LANDSCAPING & MAINTENANCE CO`                       | `checking`    | 10     |
| `Business Savings`                                           | `savings ` (trailing space) | 36 |

So there are really only two underlying accounts (one checking, one savings), but the `enrich-document` step has been pulling the **company name** (or a concatenation of bank type + company name) into the `institution` field inconsistently across statements. The savings group also has a trailing space in `account_label`, which would have split it further if any other savings docs lacked the space.

Net effect in the UI: `PerAccountCoverage` renders 4 timeline rows (3 checking + 1 savings) instead of 2 (1 checking + 1 savings), and coverage % per row looks artificially low because each variant only sees a subset of the months.

## Fix plan

Two-part fix: clean up this project now, and prevent the split going forward.

### 1. Data cleanup (this project + any other affected projects)

Migration that runs once:
- For each project, group bank-statement documents by a **normalized key** (lowercase, trim, collapse whitespace, strip the company name when it appears as a suffix/standalone).
- Pick the canonical `institution` per group using a simple rule: shortest non-empty institution string that does **not** equal the project's `target_company` (case-insensitive). Falls back to most common.
- Normalize `account_label` with `lower(trim(regexp_replace(account_label, '\s+', ' ', 'g')))`.
- Update the rows in `documents` so all variants collapse onto the canonical pair.
- Idempotent and reversible-via-backup: write the original `institution` / `account_label` into a JSON column we already have (`extracted_data.original_institution`, `extracted_data.original_account_label`) before overwriting, so we never lose what came out of the PDF.

### 2. Grouping hardening in the UI (defense in depth)

`src/components/wizard/shared/PerAccountCoverage.tsx`:
- Group by a normalized key (lower + trim + collapse whitespace) instead of the raw string.
- When the institution contains the project's target company name (passed in as a new optional prop), strip it for grouping purposes only — display the cleaned label.
- Keep the raw values visible in a tooltip so the user can see what the parser actually extracted.

This way, even if a future statement comes in with `"Business Checking - ACME CO"` while the others are just `"Business Checking"`, they still land in one row.

### 3. Enrichment fix (root cause)

`supabase/functions/enrich-document/` (the function that populates `institution` / `account_label` from PDF text):
- Add a post-processing step: after the LLM returns `institution`, strip a trailing `" - <company>"` or leading `"<company> "` when `<company>` matches the project's `target_company` (fuzzy, case-insensitive).
- Trim and collapse whitespace on `account_label` before saving.
- No prompt rewrite needed — this is a deterministic cleanup on the output.

## Out of scope

- No changes to PDF parsing or DocuClipper itself.
- No changes to other document categories (trial balance, GL, etc.) — only `bank_statement` rows have this UI.
- No new tables, no new RLS.

## Files touched

- New migration: `supabase/migrations/<ts>_normalize_bank_doc_institution.sql` (data backfill only — no schema changes).
- Edit: `src/components/wizard/shared/PerAccountCoverage.tsx` (normalized grouping key, optional `targetCompany` prop, tooltip showing raw value).
- Edit: callers of `PerAccountCoverage` to pass `targetCompany` from the project record.
- Edit: `supabase/functions/enrich-document/index.ts` (strip company name from `institution`, trim `account_label`).

## Verification

- Re-query `documents` for this project: expect exactly 2 `(institution, account_label)` pairs for `account_type='bank_statement'`.
- Reload `/project/fa0768ca-…`: coverage widget shows 2 rows (Business Checking, Business Savings) with realistic coverage %s.
- Upload a fresh bank PDF where the LLM returns `"Business Checking - SANDBOX LANDSCAPING & MAINTENANCE CO"` and confirm it lands in the existing `Business Checking` row instead of creating a new one.
