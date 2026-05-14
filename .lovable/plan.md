## Goal

Rewrite `/guides/sellers-discretionary-earnings` as a **bridge page** that teaches a novice buyer the difference between SDE and Adjusted EBITDA, when each applies, and how to convert between them — so they don't get fooled by a broker quoting one number when the deal really trades on the other.

The page is positioned as education, not as "Shepi produces SDE." Shepi produces Adjusted EBITDA; SDE is the number many novice buyers *arrive* with (from broker CIMs, BizBuySell listings, etc.) and need to translate.

---

## Page structure (top to bottom)

**1. Hero / one-line frame**
> "Brokers quote SDE. Lenders and PE buyers underwrite to Adjusted EBITDA. They are not the same number — and the gap is usually the owner's paycheck."

**2. The 30-second answer (callout box)**
A two-column visual:
- **SDE** = what the business earns *for an owner-operator* (includes one owner's salary as part of the return)
- **Adjusted EBITDA** = what the business earns *as a standalone asset* (owner replaced with a market-rate manager)
- **The bridge:** `Adjusted EBITDA = SDE − market-rate manager compensation`

**3. Why this matters (the trap)**
Concrete worked example a novice can follow:
- Broker lists business at "4× SDE of $500K = $2.0M asking"
- Owner pays themselves $150K; market-rate GM would cost $120K
- Adjusted EBITDA = $500K − $120K = $380K
- At a 4× Adjusted EBITDA multiple → $1.52M, not $2.0M
- **Lesson:** the "multiple" only means something attached to the right earnings number. Mixing them = overpaying.

**4. When SDE is the right number**
- Owner-operator buyer (you'll run it full-time and take a paycheck)
- Single-location Main Street businesses (typically <$1M earnings)
- SBA 7(a) deals where the buyer is the operator
- Broker-listed deals on BizBuySell, BizQuest, etc.

**5. When Adjusted EBITDA is the right number**
- You'll hire a GM and not work in the business
- Lower-middle-market deals (~$1M+ EBITDA)
- PE, search fund (with equity partners), independent sponsor, family office
- Lender underwriting beyond SBA — banks, mezz, unitranche
- Any deal where multiple buyers are competing on a standardized metric

**6. The conversion (step-by-step)**
StepList walking through:
1. Start with reported net income
2. Add back interest, taxes, D&A → EBITDA
3. Add back non-recurring + personal expenses → Adjusted EBITDA
4. Add back owner's W-2 + benefits + payroll taxes → **SDE**
5. To go SDE → Adjusted EBITDA: subtract market-rate replacement comp for the owner's role

Include a small "what counts as market-rate manager comp?" sub-section: BLS data, industry comp surveys, what the role actually does (GM vs technician vs absentee).

**7. Common mistakes novice buyers make**
- Comparing an SDE multiple to an Adjusted EBITDA multiple
- Forgetting the owner's spouse / family member also on payroll
- Using owner's current salary as the "replacement" (often under- or over-market)
- Applying SDE to a business too large for one operator to run
- Letting the broker pick which number to feature

**8. Quick comparison table**
ComparisonTable: SDE vs Adjusted EBITDA across — who uses it, deal size, buyer type, owner comp treatment, typical multiple range, lender acceptance.

**9. FAQ (schema'd)**
- Is SDE the same as cash flow?
- Why do brokers prefer SDE?
- Can a deal be priced on both?
- Does Shepi produce SDE? *(Answer: Shepi produces Adjusted EBITDA — the institutional standard. SDE is derivable as a single line above.)*
- What multiple should I pay on SDE vs Adjusted EBITDA?

**10. Related resources**
Links to: EBITDA Adjustments, Owner Compensation Normalization, EBITDA Bridge, QoE Report.

**11. Soft CTA**
"Shepi's QoE workflow normalizes to Adjusted EBITDA — the number lenders and institutional buyers underwrite. If a broker handed you an SDE figure, [start a deal] to see what it converts to."

---

## Voice & tone

- Novice-friendly: assume the reader has never bought a business before
- No jargon without immediate definition
- Worked numeric examples over abstract definitions
- "You" / "the buyer" — second person
- One opinion stated clearly: **the number that matters is the one your capital stack underwrites to**

---

## Technical implementation

- File: `src/pages/guides/SellersDiscretionaryEarnings.tsx` (recreate the deleted page)
- Use existing `ContentPageLayout` + `src/components/content/*` primitives (HeroCallout, StepList, ComparisonTable, BenefitGrid, AccordionFAQ, RelatedResourceCards) — same pattern as `RunRateEBITDA.tsx`
- TOC anchors for each H2
- JSON-LD: `Article` + `FAQPage` schema
- SEO title targets "seller's discretionary earnings vs ebitda" (bridge intent), not the generic "what is SDE" head term
- Re-add route to `src/App.tsx` and the entry to `src/pages/Resources.tsx` + `public/sitemap.xml`
- Internal links from `EBITDAAdjustments` and `OwnerCompensationNormalization` pages back to this one (reciprocal anchor)

---

## Out of scope

- No claim that Shepi produces SDE as a primary deliverable
- No SDE calculator widget (separate scope if we want it later)
- No homepage copy changes — this guide stands alone
- No Semrush volume check before writing (we already decided the bridge angle is right regardless of volume; this is topical-authority + buyer-education content)
