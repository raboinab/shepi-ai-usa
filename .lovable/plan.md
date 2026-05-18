## Audit findings — /for-cpas

### 1. Memory violation (must fix)
Line 150–152 says: *"This keeps the work inside what the **platform's professional liability** and terms of service cover…"*

This implies shepi carries professional liability insurance covering CPAs — directly violates the Core memory rule: shepi must not claim it carries E&O / professional liability or extend coverage to CPAs. Each party carries its own.

**Fix:** Reword to drop the platform-insurance claim:
> "This keeps the work inside the scope defined by Shepi's terms of service and your own professional liability coverage, and keeps you clear of unauthorized-practice and scope-creep risk."

### 2. DFY framing alignment
Per memory, DFY tier is "CPA-led *review* of adjustments (confirmed accurate)". The page says "reviews the AI-generated adjustments before delivery" — already aligned. No change.

But hero/lede could foreground that reviewer judgment is what makes the DFY deliverable trustworthy. Minor tightening to the intro paragraph (line 44–49) to emphasize "your review is what the buyer is paying for in DFY" — strengthens recruitment pitch without overclaiming.

### 3. FAQ review — gaps to add
Current 6 FAQs cover time, E&O, day-job, opinion scope, response SLA, state coverage. Missing recruiter-blocking questions:

- **Payment timing / 1099 status** — "How and when do I get paid?" (per-engagement, paid X days after completion, 1099-NEC at year end).
- **Independence / conflicts** — "What if I have a conflict with the target or buyer?" (disclose before claiming; pass on the match).
- **Confidentiality & data handling** — "How is target data handled?" (NDA on file, data stays in Shepi, no local download required).
- **What if I disagree with the AI's adjustment?** — "Modify or reject with a note; the buyer sees your judgment, not the AI's draft, on the final deliverable." (Reinforces value of CPA's role.)
- **Can I lose access to the queue?** — Quality bar / removal grounds (license lapse, missed SLAs, repeated low-quality reviews).

Recommend adding these 5, keeping the existing 6 — total 11 FAQ items. Order: time → payment → opinion scope → E&O → day-job → conflicts → confidentiality → disagreement → response SLA → state coverage → removal.

### 4. SEO — switch JSON-LD to FAQPage
Page has 6+ FAQs but uses generic `WebPage` schema. Replace `jsonLd` with combined `WebPage` + `FAQPage` (or just `FAQPage` mainEntity) so Google can surface the FAQs as rich results. Use the final FAQ list from item 3.

### 5. Page-role overlap with /cpa-partners
`/for-cpas` and `/cpa-partners` are both recruiting pages with applications. `/for-cpas` ends with a CTA to `/cpa-partners` ("Start your application"). They cover overlapping ground (how it works, what we ask, FAQ). Two options — flagging, not deciding:

- **A. Keep both, sharpen roles:** `/for-cpas` = SEO-targeted ("for CPAs" search intent) marketing page that funnels to `/cpa-partners`; `/cpa-partners` = the application page. Keep distinct H1s and copy.
- **B. Consolidate** to one page and 301 the other.

Out of scope unless you want it tackled now — defaulting to A (no structural change).

### 6. Minor copy nits
- CTA button label "Start your application →" is fine; consistent with target page.
- "Compensation" section is vague ("rates shared during onboarding"). Acceptable for recruiting page but a range ("typically $X–$Y per engagement") would convert better. Leaving as-is unless you have a number to publish.

---

## Proposed edits (scoped to /for-cpas)

1. Rewrite the paragraph at lines 149–153 to remove the platform-insurance claim.
2. Expand the FAQ array from 6 → 11 items with the additions in section 3.
3. Replace `jsonLd` with a `FAQPage`-bearing structure built from the final FAQ list.
4. (Optional) Light tightening of the intro paragraph (44–49) to foreground reviewer judgment as the DFY value driver.

No changes to `/cpa-partners`, routing, sitemap, or other pages.