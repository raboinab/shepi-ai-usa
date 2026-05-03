## What I found

The demo already shows everything users need — the only "download" surface is a single **Export** button on the workbook toolbar. Insights/Workbook views are already fully on-screen with no other download paths.

- `src/pages/WorkbookDemo.tsx` line 33–36, 98 — defines `handleExport` and passes it to `WorkbookShell` as `onExport`
- `src/components/workbook/WorkbookShell.tsx` line 152–153 — only renders the Export button when `onExport` is provided (`{onExport && ...}`)

So the fix is: don't pass `onExport` from the demo page. The button disappears, the rest of the workbook (data, narratives, insights) stays fully viewable.

## Change

**`src/pages/WorkbookDemo.tsx`**
1. Delete the `handleExport` callback (lines 33–36)
2. Remove the `onExport={handleExport}` prop on `<WorkbookShell>` (line 98)
3. Remove now-unused imports: `useCallback`, `exportWorkbookXlsx`

That's it. No watermarks, no iframes, no server rendering, no lead-capture form. Real workbook + real AI narratives + real insights — just no XLSX file to walk away with.

## Out of scope

- Right-click / view-source / DOM scraping prevention — anything rendered in a browser can theoretically be copied. This change handles the 99% case (the obvious "Export" button). Hardening beyond that is a separate conversation if/when it matters.
- The real `/workbook` (non-demo) route keeps its export button — paid users still get downloads.