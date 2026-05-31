# Fix Debt Schedule Upload — CSV/text files failing

## What's broken
The Debt Schedule upload for project `fa0768ca…` failed with:
> "I don't see any document attached to your message"

That's the model's reply, not a real failure to attach. `process-debt-schedule` always sends the uploaded file as `image_url: { url: fileBase64 }`. Claude Sonnet can read PDFs/images that way, but a base64 CSV passed through the image channel is opaque to it — so it asks for the file, JSON parse fails, status flips to **Failed**.

The Fixed Asset Register works because `process-fixed-assets` already branches: PDFs/images → `image_url`, CSV/Excel/text → decoded as text in a `text` part. Debt schedule was never updated to match.

## Fix
Mirror the fixed-assets pattern inside `supabase/functions/process-debt-schedule/index.ts`.

1. **Detect file type** from `fileName` extension (`.csv`, `.txt`, `.tsv` → text; `.xlsx`/`.xls` → text via SheetJS decode if needed, else fall back to text; `.pdf`/images → image_url as today).
2. **For text files**, strip the `data:*;base64,` prefix from `fileBase64`, `atob` it, `TextDecoder().decode(...)`, truncate to ~100KB, and send as a single `{ type: "text", text: "<prompt>\n\n<csv contents>" }` user message.
3. **For PDFs/images**, keep the existing `image_url` path unchanged.
4. **Keep** the system prompt, JSON parsing, `processed_data` insert, embed-project-data trigger, and CORS exactly as-is.

No client changes — `DocumentUploadSection.tsx` keeps sending `{ documentId, fileBase64, fileName, projectId }`.

## Validation
1. Redeploy `process-debt-schedule`.
2. On project `fa0768ca…`, click **Retry** on the failed CSV. Expect status → Validated/Pending and a new `processed_data` row with `data_type='debt_schedule'`.
3. Confirm the Workbook **Debt** tab now populates (existing `dealData.debt` pipeline already reads from wizard + processed_data fallback per the payroll/fixed-assets pattern — verify after retry; if Debt has no fallback hook yet we can add one in a follow-up, but that's out of scope for this fix).
4. Re-upload a PDF debt schedule to confirm the image path still works.

## Out of scope
- Adding a `debtFallback` to `loadDealDataWithPriorBalances` (separate task if needed — wizard import already merges debt today).
- Touching `process-fixed-assets` / `process-payroll-document`.
- Changing the AI model or prompt.
