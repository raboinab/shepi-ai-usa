## Goal

Strip all insurance/E&O/umbrella claims and commitments from marketing pages and the Provider Agreement. We'll revisit when there's a policy to describe.

## Files to change

### 1. `src/components/cpa/ProviderAgreementContent.tsx` (legal — biggest delta)

- **§16 "Insurance"** — replace the entire section with a minimal "each party maintains its own insurance" clause. No mention of shepi E&O umbrella, no additional-insured naming, no Cyber policy limits, no certificate-on-request. New text, roughly:
  > "16. Insurance. Each party is responsible for maintaining the insurance coverage it deems appropriate for its own business and professional activities. Provider is responsible for maintaining any professional liability (Errors & Omissions) coverage required by Provider's state board, employer, or professional judgment."
- **§15 (Limitation of Liability)** — drop the trailing sentence "shepi's indemnity obligations under §14.A … are limited to the proceeds of shepi's Tech E&O and Cyber insurance under §16." Indemnity simply sits outside the cap (standard).
- **§14.A** — remove the parenthetical "(and Provider's E&O insurer where applicable)".
- **§17 (Survival)** — drop "§16 (insurance, for the duration of any applicable tail)" from the survival list (the new §16 is a simple ongoing obligation, no tail).
- **§19 (Entire Agreement / third-party beneficiaries)** — drop "and Provider's E&O insurer with respect to indemnification under §14.A". Leave the Clients-confidentiality beneficiary clause intact.
- **§7 (Confidentiality permitted disclosures)** — keep "E&O insurer" in the permitted-disclosure list. That's about Provider's own insurer, not a shepi representation, and it's standard. No change.
- Bump `CURRENT_PROVIDER_AGREEMENT_VERSION` in `src/hooks/useProviderAgreement.ts` from `2026-04-13` to today's date (`2026-05-18`) so any future acceptances re-version cleanly. Zero CPAs have accepted, so no amendment flow needed.

### 2. `src/pages/CpaPartners.tsx`

- Hero paragraph: remove "— backed by our $1M+ professional liability umbrella and our software that handles the mechanical heavy lifting." Replace with "— with software that handles the mechanical heavy lifting."
- `useSEO` description: same removal — drop the "backed by our $1M+ professional liability umbrella" tail.
- `whatYouGet` list: delete the bullet `"Professional liability covered by our $1M+ umbrella (no need for your own E&O policy)"`.
- `whatWeAsk` list: add a replacement bullet `"You carry your own professional liability (E&O) coverage as required by your state board or employer"` so the obligation is explicit and accurate.

### 3. `src/pages/Pricing.tsx`

- FAQ answer (line 254, "Matched CPA accountability"): rewrite without insurance claim. New version:
  > "The Matched CPA is a licensed professional accountable for the analytical work they sign off on, and carries their own professional liability coverage. If something material is wrong, you have a real path to resolution — first directly with your CPA, then through shepi's escalation process. This is meaningfully more accountability than software-only analysis."
- DFY tier feature list (line 432): replace `"Backed by shepi's $1M+ professional liability umbrella"` with `"CPA-led review by a licensed, accountable professional"` (or remove the bullet entirely if it duplicates an existing one — I'll check during the edit).
- Leave the line 150 FAQ untouched: it accurately notes that traditional CPA firms have attestation + firm-level liability coverage as a differentiator. That's a true statement about *other* firms, not a shepi claim.

### 4. `src/pages/compare/AIvsTraditional.tsx`

- Comparison table row "Liability coverage" (line 73): change the middle column (shepi DFY) from `"Yes (shepi E&O umbrella + CPA's professional standing)"` to `"CPA's professional standing and own E&O"`. Left column (DIY) stays `"No"`. Right column (Traditional) stays `"Yes (firm's E&O)"`.
- Leave the line 63 description of traditional firms ("firm-level E&O") — accurate statement about competitors.

### 5. `src/data/homepageFaq.ts` and `src/pages/Pricing.tsx` line 150

- The phrase "attestation letter and professional liability coverage" describes what traditional CPA firms offer that shepi does not. It's a factual contrast, not a shepi insurance claim. **Leave as-is.**

## What's explicitly out of scope

- Guide pages (`WorkingCapitalAnalysis`, `RevenueQuality`, `PersonalExpenseDetection`, `OwnerCompensationNormalization`, `QoEReportTemplate`) mention "insurance" as an *accounting category* (insurance expense, insurance proceeds, life insurance add-backs). Untouched.
- `mockWizardData.ts`, `mockDeal.ts`, `chartOfAccountsUtils.ts`, `industryConfig.ts`, `qoeAdjustmentTaxonomy.ts`, `useTransferClassification.ts`, `trialBalanceUtils.ts` — all reference insurance as a chart-of-accounts line item or industry vertical. Untouched.
- No DB changes. No new migration. No edits to `dfy_provider_agreements` rows (zero rows exist).
- Not touching the §14.A Platform-Defect indemnity itself — that survives independently of insurance and is the actual protection mechanism for CPAs against platform errors.

## Memory update

Update `mem://index.md` Core rule about insurance: replace the current insurance/revenue-triggered language with:
> "Marketing and legal docs MUST NOT claim shepi carries E&O, umbrella, cyber, or any other insurance, name CPAs as additional insureds, or promise future coverage. Each party carries its own. Revisit only when a policy is actually bound."

## Verification

After edits, run:
```
rg -n -i "umbrella|additional insured|maintains.*insurance|backed by.*insurance|shepi.*E&O|E&amp;O umbrella" src/
```
Expected matches: only the Provider Agreement's §7 "E&O insurer" permitted-disclosure clause (Provider's own insurer) and guide pages' personal-expense "umbrella policies" examples. Anything else is a miss.
