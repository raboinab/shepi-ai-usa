## Goal

Stop forcing users to pick a Month + Year every time they upload a Balance Sheet, P&L, or Cash Flow. Auto-detect the reporting period from the file itself. Anything we can't confidently detect drops into a "Needs period" tray they can clear in one click — same pattern as the existing bank-statement label backfill.

## Behavior

**Upload flow (BS / P&L / Cash Flow)**
- Reporting Period dropdown becomes optional. Help text: *"We'll detect the period from the file. Set it manually only if you already know it."*
- User can upload multiple files at once without labeling.
- After upload, a period-detection job runs per file in the background.
- Detected periods populate `documents.period_start` / `period_end` and the coverage timeline updates automatically.
- If detection returns a range spanning multiple months (e.g., annual P&L, comparative statements), we store the full range on that one document row — no row-splitting.

**Backfill tray**
- New "Needs reporting period" card appears at the top of the Documents section whenever any BS/IS/CF doc has `period_start IS NULL` after detection ran.
- Each row: filename, doc type, `[Detect again]` and `[Set manually]` buttons.
- Manual button reuses the existing `fsBackfillDoc` dialog.

## Technical Details

**New edge function: `detect-financial-statement-period`**
- Input: `{ documentId }`. Auth via user JWT.
- Downloads the file from `documents` storage bucket.
- Extracts text from page 1 (PDF: `unpdf`; XLSX: parse first sheet header rows).
- Regex pass for common patterns:
  - `For the (Year|Period|Month) Ended? <date>`
  - `As of <date>`
  - `<Month> <YYYY>` / `<MM>/<DD>/<YYYY>`
  - Comparative year columns (`2022  2023  2024`)
- If regex confidence low, fall back to Lovable AI (`google/gemini-2.5-flash`) with a strict JSON schema: `{ period_start, period_end, confidence }`.
- Writes `period_start` / `period_end` back to the `documents` row. Returns detection result to caller.
- Confidence threshold: only auto-apply if `confidence >= 0.7`; otherwise leave NULL so the tray shows it.

**`DocumentUploadSection.tsx`**
- Remove the `<span className="text-destructive">*</span>` from Reporting Period label; loosen the upload-button gate so FS types don't require `selectedFsPeriod`.
- After each successful FS upload where the user didn't set a period, fire-and-forget invoke of `detect-financial-statement-period`.
- Refresh `documents` list on detection completion.
- New `NeedsPeriodBackfill` sub-component (top of the section) that lists FS docs with `period_start IS NULL` and wires to the existing manual dialog + a "Detect again" action.
- Update help copy on the period dropdown to mark it optional.

**No schema changes.** `documents.period_start` / `period_end` already exist and are already nullable.

## Files touched

- `supabase/functions/detect-financial-statement-period/index.ts` (new)
- `src/components/wizard/sections/DocumentUploadSection.tsx` (upload gate, help copy, new backfill tray section, detection invocation)

## Out of scope

- Bank statement / credit card period detection (already handled by DocuClipper).
- Splitting a multi-period file into multiple document rows.
- Retroactive detection for existing uploaded FS docs — the "Detect again" button in the tray covers this on demand.
