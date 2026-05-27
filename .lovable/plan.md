# Full sweep: "AI-Assisted" → "Intelligent"

Found 17 occurrences across 11 files. They split into two buckets. I recommend rewriting bucket A and leaving bucket B intact — replacing them would break meaning or weaken the legal posture.

## Bucket A — Rewrite (marketing/positioning copy)

These are headline/value-prop uses where "Intelligent Quality of Earnings Analysis" reads cleanly.

- `src/pages/Index.tsx` (2) — homepage hero H1 + secondary CTA section
- `src/pages/ForAiAgents.tsx` (1)
- `src/pages/Pricing.tsx` (1)
- `src/pages/Auth.tsx` (1)
- `src/pages/NotFound.tsx` (1)
- `src/pages/features/AIDueDiligence.tsx` (3) — title, meta, body
- `src/pages/use-cases/PEFirms.tsx` (1)
- `src/pages/use-cases/Lenders.tsx` (1)
- `src/pages/use-cases/DealAdvisors.tsx` (1)
- `src/pages/use-cases/IndependentSearchers.tsx` (2)
- `src/pages/use-cases/AccountantsCPA.tsx` (1)
- `src/pages/guides/DueDiligenceChecklist.tsx` (1)
- `src/pages/guides/SellSideVsBuySideQoE.tsx` (1)
- `src/pages/guides/GeneralLedgerReview.tsx` (1)
- `src/pages/guides/QualityOfEarnings.tsx` (1)
- `src/pages/guides/QoEReportTemplate.tsx` (1)
- `src/pages/compare/ShepiVsExcel.tsx` (1)
- `src/lib/workbook-grid-builders/buildDisclaimerGrid.ts` (1) — workbook disclaimer body prose
- `src/components/pdf-slides/DisclaimerSlide.tsx` (1) — disclaimer body prose
- `src/components/pdf-slides/CoverSlide.tsx` (1) — cover subtitle
- `src/components/cpa/ProviderAgreementContent.tsx` (1)
- `src/components/wizard/sections/PlaceholderSection.tsx` (1)
- `public/og-image.svg` (1) — social share image text
- `public/llms.txt`, `public/llms-full.txt` — LLM discovery files

## Bucket B — Keep "AI-Assisted" (term-of-art / legal)

Swapping these to "Intelligent" loses meaning or weakens the non-attestation posture.

- `src/pages/guides/AIWontDoYourQoE.tsx` (3) — the entire section is titled **"AI-Assisted vs AI-Generated"**; this is the definitional contrast
- `src/pages/guides/CanAIReplaceQoE.tsx` (1) — comparison table header `["Capability", "AI-Assisted", "Traditional CPA"]`
- `src/pages/Resources.tsx` (1) — link label pointing at the AI-QoE-vs-Traditional comparison page
- `src/components/terms/TermsContent.tsx` (1) — ToS section heading "AI-Assisted Workflows" (legal language)
- `src/components/pdf-slides/SlideLayout.tsx` + `src/lib/pdf/pdfWorker.ts` — PDF footer/watermark **"AI-Assisted Analysis · Not an Audit or Attestation"**. This is the legal disclaimer line that protects against UPL/attestation claims; "Intelligent Analysis · Not an Audit" reads like marketing fluff next to a legal warning.

## Rewrite pattern

- "AI-Assisted Quality of Earnings Analysis" → "Intelligent Quality of Earnings Analysis"
- "AI-Assisted QoE" → "Intelligent QoE"
- "AI-Assisted due diligence" → "Intelligent due diligence"
- Standalone "AI-Assisted" used as an adjective for the product → "Intelligent"

I will regenerate `og-image.svg` text in place (no image regeneration needed — it's SVG text).

## Out of scope

- No demo PDF/XLSX regeneration (cover/disclaimer copy changes but the watermark line is bucket B and unchanged; the demo files keep working)
- No changes to routes, slugs, or the `/compare/ai-qoe-vs-traditional` URL
- No changes to memory/index.md (positioning concept unchanged)

Confirm and I'll execute, or tell me to also flip bucket B.
