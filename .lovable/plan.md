## Scope

Four marketing/legal-adjacent copy updates that align the public site with the now-shipping DFY (CPA-Signed) tier. Frontend/content only — no business logic, pricing, or routing-engine changes beyond registering one new page.

---

## 1. Pricing page — DFY card (`src/pages/Pricing.tsx`, ~lines 381–441)

- Badge: `CPA-Led` → `CPA-Signed`.
- Description: → "A licensed CPA on your deal — without the four-week wait."
- Sub-line above bullets: → "Everything in Per Project, plus a Matched CPA who signs the work:"
- Replace 8 bullets with the 8 new ones (matched in 1–2 days, end-to-end on our software, CPA-signed memo, WC + NWC peg, CPA letterhead, direct comms, 48–72h after match, $1M+ liability umbrella).
- Tagline: → "For when you want a real CPA on the report, fast."

## 2. Comparison page (`src/pages/compare/AIvsTraditional.tsx`)

- Update headline/H1 + SEO title + intro paragraph to reflect three options instead of two ("shepi DIY vs shepi DFY vs Traditional CPA Firm").
- Expand `ComparisonTable` from 2 to 3 data columns:
  - Headers: `["Factor", "shepi DIY", "shepi DFY", "Traditional CPA Firm"]`
  - Rows: Cost ($2k / $4k / $20k+), Timeline (2–4h / 48–72h from match / 4+ weeks), Professional attestation (No / Yes – CPA-signed / Yes), Liability coverage (No / Yes – shepi E&O umbrella + CPA / Yes – firm E&O), Management interviews (Not included / Not included by default, available as upgrade / Included), Lender acceptance (Varies / Generally accepted with CPA signature / Generally accepted).
- Refresh "When to Use Each" benefit grid to mention DFY as the middle option.
- Update `jsonLd.dateModified` to today.
- `ComparisonTable` already accepts arbitrary-width rows; verify by reading the component if needed, otherwise widen its types in the same edit.

## 3. New FAQ entries on Pricing page

- Add a new category to `faqCategories` in `src/pages/Pricing.tsx` (~line 110) titled **"Done-For-You (CPA-Signed)"** containing the 5 Q&A pairs verbatim from the brief (who's the CPA, is it like a Big 4 audit, what if it's wrong, engagement letter timing, state/industry matching).
- Keep wording exactly as supplied — it's been legal-reviewed (SSCS-100 reference, 15-day refund window, $1M+ umbrella).

## 4. New CPA recruiting page

- Create `src/pages/CpaPartners.tsx` using `LegalPageLayout` or a simple `ContentPageLayout` (match existing marketing-page pattern — confirm by glance at neighbors).
- Sections: Hero (headline + sub-line), How it works (3 steps), What you get (6 bullets), What we ask (4 bullets), CTA "Apply to the shepi Network".
- Use the supplied copy verbatim.
- CTA target: `mailto:partners@shepi.ai` placeholder until application form exists (flag for user to confirm).
- Register route in `src/App.tsx`: `lazy(() => import("./pages/CpaPartners"))` and `{ path: "cpa-partners", element: wrap(<CpaPartners />) }` alongside other marketing routes.
- Add `useSEO` tags: title "Join the shepi Network — CPA Partners", canonical `https://shepi.ai/cpa-partners`.

---

## Out of scope (explicitly not touched)

- Pricing amounts in `src/lib/pricing.ts` (unchanged — $2k / $4k).
- DPA / Subprocessors / Terms / Privacy (already updated in prior turns).
- Stripe checkout, CPA matching backend, engagement-letter flow.
- Footer/nav links — call out for user whether to add a footer link to `/cpa-partners`.

## Open question

The brief says "link to application" for the CPA Partners CTA. Should the button be (a) `mailto:partners@shepi.ai`, (b) a Typeform/external URL you'll supply, or (c) a stub `/cpa-partners/apply` route I should also scaffold? Default if no answer: `mailto:partners@shepi.ai`.
