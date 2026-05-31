## What's wrong

The CSV uploaded fine (`documents.processing_status = 'completed'`) and `process-payroll-document` produced a `processed_data` row — but with `record_count: 0` and this warning:

> `JSON parse error: SyntaxError: Expected property name or '}' in JSON at position 2640`

Looking at `rawFindings`, the model returned `` ```json\n{...` `` and was **cut off mid-string** ("2023-08": 1 …). So extraction succeeded structurally but the JSON was truncated, the parser failed, and the function wrote empty `salaryWages/payrollTaxes/benefits/ownerCompensation` arrays. That's why the workbook and wizard show nothing.

## Root causes in `supabase/functions/process-payroll-document/index.ts` (lines 252–350)

1. **No `max_tokens`** on the gateway call → model output capped at the default and truncated. A payroll register with ~36 months × multiple employees needs a large output budget.
2. **No `response_format: { type: 'json_object' }`** → model wraps JSON in ```` ```json ```` fences and adds prose.
3. **Greedy `aiContent.match(/\{[\s\S]*\}/)`** → on truncated output there is no closing brace, so the parse fails entirely with no recovery.
4. **No retry / no chunking** when extraction returns 0 items.

## Fix

Edit only `supabase/functions/process-payroll-document/index.ts`:

1. Add to the request body: `response_format: { type: 'json_object' }`, `max_tokens: 16000`, and switch model to `openai/gpt-4o-mini` (or keep `gpt-4o` — both support JSON mode and a larger output budget on the gateway).
2. Update the system prompt to explicitly say "Return ONLY a JSON object — no markdown fences, no prose."
3. Replace the brittle `aiContent.match(/\{[\s\S]*\}/)` with: strip ```` ``` ```` fences, find the first `{`, then `JSON.parse` from there; on failure try a single repair pass (close trailing strings/brackets) before giving up.
4. If the parsed result has 0 line items AND the document looks like a multi-period register (size > ~30 KB), split the CSV into year-batches and call the model once per batch, then merge the arrays. This guarantees we stay under output limits on large registers.
5. After write, if `totalItems === 0`, set `documents.processing_status = 'failed'` and surface the warnings to the UI (so the user sees "extraction failed" instead of silent empty).

## Out of scope

- No DB schema changes.
- No frontend changes (the existing `PayrollTab` fallback already renders `payrollFallback` once extraction populates it).
- No changes to `useProjectDealData`, `payrollFallback.ts`, or `PayrollSection.tsx`.

## How to verify

Re-upload `Sandbox Company_US_2_Payroll Register.csv`, then:
- `processed_data` row for `data_type='payroll'` should have `record_count > 0` and `data.extractedData.salaryWages` populated.
- Workbook → Payroll tab renders the register (TB is empty, so fallback path fires).
- Wizard Payroll section shows summary cards with non-zero totals.
