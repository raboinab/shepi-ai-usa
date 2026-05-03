## Goal

In the demo, replace the "sign up to export" toast on the **PDF** and **Excel** buttons with **in-app preview modals** that show a watermarked sample of each deliverable. No file ever lands in the user's Downloads folder via our UI.

## What gets built

### 1. Pre-baked sample assets (committed to `/public/demo/`)
- `public/demo/acme-sample-qoe.pdf` — generated **once** offline by running the existing `buildClientPDF` pipeline against the mock Acme dataset, with a diagonal `DEMO — NOT FOR DISTRIBUTION` watermark stamped on every page.
- `public/demo/acme-sample-workbook.xlsx` — generated **once** offline via `exportWorkbookXlsx` against the same mock data, with a `DEMO` sheet inserted as the first tab and a `[DEMO PREVIEW]` prefix on every sheet name.

A one-shot script `scripts/generate-demo-deliverables.ts` will produce both. Re-runnable when mock data changes; not part of the build.

### 2. New component: `src/components/demo/DeliverablePreviewDialog.tsx`
- Shadcn `<Dialog>` at ~90vw × 90vh.
- **PDF mode**: renders `<iframe src="/demo/acme-sample-qoe.pdf#toolbar=0&navpanes=0&scrollbar=0" />`. The `#toolbar=0` hint hides the built-in download/print buttons in Chrome/Edge.
- **XLSX mode**: we cannot render XLSX in an iframe. Instead, on open we fetch the file, parse it with the existing `xlsx` package (already a dep via `exportWorkbookXlsx`), and render the first 3 sheets as read-only HTML tables in a tabbed view. Reuses the look of `SpreadsheetGrid` styling tokens for consistency.
- Both modes overlay a faint repeating `DEMO PREVIEW` watermark via CSS on top of the content as a second layer of deterrence.
- Footer: "This is a sample. Sign up to generate your own." → CTA button to `/auth?mode=signup`.
- No download button anywhere in the dialog. Right-click is not blocked (pointless — see caveat).

### 3. Wire into `ExportCenterSection.tsx`
- Replace the `if (isDemo) { toast.info(...); return; }` blocks in `handleExportPDF` (line 252) and `handleExportExcel` (line 563) with `if (isDemo) { setPreviewMode("pdf" | "xlsx"); return; }`.
- Add local state `const [previewMode, setPreviewMode] = useState<"pdf" | "xlsx" | null>(null)` and render `<DeliverablePreviewDialog mode={previewMode} onClose={() => setPreviewMode(null)} />`.
- Keep the existing `trackEvent("demo_export_blocked", ...)` calls but rename to `demo_preview_opened` for accurate analytics.

### 4. Memory note
Add to `mem://index.md` Core: "Demo Export Center shows watermarked sample PDF + XLSX previews (view only, no download). Real export only after signup."

## Out of scope

- Watermarking the live workbook UI on `/workbook/demo` — already covered by the previously removed Export button.
- Bulletproof DRM. Browsers leak: Ctrl+P → Save as PDF, DevTools → Network tab can grab `/demo/acme-sample-qoe.pdf` directly. This stops casual downloads via our UI, not determined exfiltration.
- Per-user dynamic sample generation. The sample is static and identical for every demo user.

## Files

- **new** `scripts/generate-demo-deliverables.ts`
- **new** `public/demo/acme-sample-qoe.pdf` (generated artifact)
- **new** `public/demo/acme-sample-workbook.xlsx` (generated artifact)
- **new** `src/components/demo/DeliverablePreviewDialog.tsx`
- **edit** `src/components/wizard/sections/ExportCenterSection.tsx` — replace 2 toast blocks, add dialog state + render
- **edit** `mem://index.md` — add demo deliverables rule
