# Premium redesign: Workbook + Export

Goal: make the in-app Workbook, the PDF deck, and the XLSX download feel like a $$$ deliverable — one shared visual language built on a refined Navy Trust palette (`#0F1B3D` navy, `#264A66` mid-blue, `#4A7FA3` accent, `#E2D4BE` warm sand, `#C9A84C` gold reserved for emphasis).

## 1. Shared design tokens

**New file:** `src/lib/pdf/theme.ts` and `src/index.css` updated together so screen and PDF use the same numbers.

- Promote palette to true Navy Trust: deepen `darkBlue` to `#0F1B3D`, keep `#264A66` as section header, introduce a single gold accent (`#C9A84C`) used sparingly for KPI emphasis and dividers.
- Typography pair (loaded via `index.html` link tags, no render-block change):
  - **Display / headings:** `Fraunces` (variable serif, optical-sized) — gives the editorial / FT feel without going stuffy.
  - **Body / UI:** `Inter Tight` — tighter than Inter, more refined at small sizes.
  - **Tabular:** `JetBrains Mono` (already loaded) for grid numbers.
- New semantic tokens in `index.css`: `--surface-elevated`, `--rule-strong`, `--rule-soft`, `--kpi-positive`, `--kpi-negative`, `--zebra-row` so both screen + PDF tables key off the same values.

## 2. In-app Workbook UI (`/workbook`)

Files: `WorkbookShell.tsx`, `SpreadsheetGrid.tsx`, `pages/Workbook.tsx`, plus a new `WorkbookToolbar.tsx`.

- **Header bar:** replace the thin grey strip with a navy bar — company name in Fraunces, eyebrow label "QUALITY OF EARNINGS WORKBOOK" in tracked uppercase Inter Tight, right side carries save indicator + Export menu (dropdown: PDF / XLSX) instead of one tiny button.
- **Tab strip:** taller (32px), no more Excel grey — cream `#F5F2EC` rail, active tab with a 2px gold underline + serif label, inactive tabs in `--muted-foreground`. Add visual grouping pills ("Financials", "Adjustments", "Working Capital", "Diligence") so 30+ tabs feel navigable.
- **Grid polish:**
  - Row height 28px (from 24), padding `px-3 py-1` for breathing room.
  - Zebra striping using `--zebra-row` (very subtle warm tint).
  - Sticky header: navy bg, white text, gold 2px bottom border (mirrors PDF table).
  - Frozen-column shadow on horizontal scroll (right edge soft shadow) so it reads as a layered surface.
  - Section-header rows: full-width navy tinted band + serif label, no all-caps.
  - Total / subtotal rows: top hairline rule + bold tabular numerals; remove the double bottom border.
  - Negative numbers in `--kpi-negative` parentheses (already partially there); positives stay foreground.
  - Cell editing: yellow input replaced with a focused gold ring (`ring-2 ring-[--accent-gold]`).
- **Empty / loading states:** centered serif headline + thin gold rule instead of plain spinners.

## 3. PDF deck (`src/components/pdf-slides/*`)

- **Cover slide:** kill the dual circles + teal bar mash-up. New cover:
  - Full-bleed deep navy with a subtle noise/grain texture (SVG data URL) for depth.
  - Top-left: small gold square + "SHEPI · QoE" wordmark in Inter Tight tracked.
  - Center-left aligned (not centered): eyebrow label, company name in Fraunces 96pt with `font-optical-sizing: auto`, prepared-for line, then a 1px gold horizontal rule, then report date + preparer in Inter Tight.
  - Bottom-right: confidential stamp + page count chip.
- **Section dividers:** new `SectionDividerSlide` look — half navy / half cream split, large serif numeral ("01", "02") in gold outline, section title in Fraunces, 2-line intro paragraph.
- **Content slides (`SlideLayout.tsx`):**
  - Header bar shrinks to 56px, navy with a 2px gold accent (was teal).
  - Section title in Fraunces; "CONFIDENTIAL" label in mono caps.
  - Page footer: company · report title left, gold rule + page chip right.
- **Tables (`SlideTable.tsx`):**
  - Header row: navy bg, gold 2px under-rule, Inter Tight semibold (not all caps unless > 8 cols).
  - Zebra rows alternate white / `#FAF7F1`.
  - Highlight / total rows: warm sand bg `#E2D4BE` + serif numerals.
  - First column left-aligned with proper indent scale (12 / 24 / 36 px).
  - Numeric cells: tabular-nums, right-aligned, monospace turned off in favor of `Inter Tight` with `font-variant-numeric: tabular-nums`.
- **KPI / stat callouts:** add a shared `StatCallout` component used on Executive Summary / QoE slides — 84pt serif number in gold, label below in tracked uppercase. Replaces the current generic value cards.

## 4. XLSX export (`exportWorkbookXlsx.ts`)

SheetJS community edition cannot style cells, which is why the current export looks like raw data. Swap to **ExcelJS** (`bun add exceljs`) for real formatting:

- Workbook properties: company, title, "Quality of Earnings — <Company>".
- Per-sheet theming:
  - Frozen header row: navy fill `FF0F1B3D`, white bold Calibri 11, gold bottom border.
  - Section-header rows: warm sand fill `FFE2D4BE`, navy bold.
  - Total / subtotal rows: top double border, bold.
  - Zebra striping every other data row (`FFFAF7F1`).
  - Number formats per column: currency `_($* #,##0_);_($* (#,##0);_($* "-"_)`, percent `0.0%`, multiples `0.00"x"`.
  - Negative numbers in red via format string (no need for conditional fmt).
  - Column widths derived from `col.width` (already there) + auto-fit pass per column based on max content length.
- **Cover sheet:** new first sheet "Cover" rendered programmatically (merged cells, navy fill, Fraunces unavailable → fall back to "Cambria" 36pt for cover title, Calibri body) with company / report date / preparer / confidential notice.
- **TOC sheet:** generated from `WORKBOOK_TABS` with hyperlinks (`HYPERLINK` formula) to each sheet's A1.
- **Tab colors:** color-code tab strip by section (Financials = navy, Adjustments = gold, Working Capital = sand, Diligence = mid-blue).
- **Print setup:** landscape, fit to 1 page wide, repeat header row, footer with page numbers + "Confidential — Shepi QoE".

## 5. Demo previews

Per project memory, the demo PDF and XLSX in `/public/demo/` are generated by `scripts/generate-demo-pdf.ts` and `scripts/generate-demo-workbook.ts` from the real builders. After (3) and (4) land, re-run both scripts so the marketing preview reflects the new look.

## Technical notes

- ExcelJS adds ~250KB gz. Acceptable given the export is a deliberate user action; keep dynamic-imported in `exportWorkbookXlsx`.
- Fraunces + Inter Tight loaded via Google Fonts `<link>` in `index.html`, `font-display: swap`. PDF renderer (`pdfWorker.ts` + html-to-image) must wait for `document.fonts.ready` before snapshotting — confirm `slideRenderer.ts` already does, add if not.
- All new colors enter `index.css` and `tailwind.config.ts` as HSL semantic tokens — no raw hex in components per project rules.
- No business logic changes; this is presentation-only.

## Out of scope

- Restructuring tab list / removing tabs.
- New report sections, narratives, or calculations.
- Dark mode for the workbook (keep current).
- Mobile workbook (already a desktop-only surface).

## Validation

- Visual: re-run `generate-demo-pdf.ts` and `generate-demo-workbook.ts`, open both files, eyeball every page/sheet for overflow, contrast, alignment per the QA checklist.
- Functional: `bun run test` (existing parity + format tests must still pass), manual export of an existing project to confirm numbers unchanged.
