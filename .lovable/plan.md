## Goal

Export the two in-app legal agreements as clean, print-ready PDFs your lawyer can mark up.

## What gets generated

Both PDFs delivered to `/mnt/documents/`:

1. **`shepi-terms-of-service-2026-04-13.pdf`**
   - Source: `src/components/terms/TermsContent.tsx`
   - Version stamp: `2026-04-13` (matches `CURRENT_TOS_VERSION` in `src/hooks/useTosAcceptance.ts`)
   - Effective Date: April 13, 2026
   - 18 sections, including AI-assisted workflow disclosures, DFY service terms, Virginia governing law

2. **`shepi-dfy-provider-agreement-2026-04-13.pdf`**
   - Source: `src/components/cpa/ProviderAgreementContent.tsx`
   - Version stamp: `2026-04-13` (matches `CURRENT_PROVIDER_AGREEMENT_VERSION` in `src/hooks/useProviderAgreement.ts`)
   - 20 sections, including independent contractor status, no direct client relationship, work-for-hire IP, non-circumvention

## Format

Each PDF will have:
- Cover header: document title, version, effective date, source file path (so the lawyer can map redlines back to code)
- Footer: "shepi / SMB EDGE — Confidential — for legal review" + page number
- US Letter, 1" margins, serif body, numbered section headings, proper smart quotes
- Plain text rendering of the React JSX (lists, headings, bold preserved — no React/Tailwind artifacts)

## Approach

Run a Python script with ReportLab in `/tmp/`:
1. Parse the JSX literally for headings (`<h2>`/`<h3>`), paragraphs (`<p>`), and lists (`<ul><li>`)
2. Convert HTML entities (`&ldquo;`, `&rsquo;`, `&amp;`) to proper Unicode
3. Strip className attributes
4. Emit two PDFs via ReportLab Platypus
5. Visual QA: render each page to JPEG and inspect for clipping, overlap, font issues; fix and re-render until clean
6. Move final PDFs to `/mnt/documents/` and emit `presentation-artifact` tags

No code changes to the app. Output only.