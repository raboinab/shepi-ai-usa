## Goal

Update `src/components/terms/TermsContent.tsx` to replace §7 and §10 with the new DFY-aware text, with all "shepi-maintained professional-liability umbrella" phrases stripped. Bring the public ToS (shown in `TermsAcceptanceModal` at checkout) into alignment with the live Provider Agreement and the standing rule: no shepi insurance claims.

## Changes

### 1. `src/components/terms/TermsContent.tsx`

**Effective Date (line 5)** — `April 13, 2026` → `May 18, 2026`.

**§7 Service Providers (lines 101–110)** — replace with:

> shepi may use employees, contractors, affiliates, subprocessors, and other service providers to help deliver the Service. You authorize shepi to share Customer Data with those service providers as reasonably necessary to provide, maintain, support, and secure the Service, subject to confidentiality and data-protection obligations.
>
> For Done-For-You projects, the licensed CPA who performs the professional services (the "Matched CPA") is not shepi's service provider. The Matched CPA is an independent licensed professional who performs the professional services in their professional capacity under §10 of these Terms and the Matched CPA's professional license. The Matched CPA's involvement creates a direct professional relationship between you and the Matched CPA, governed by the Matched CPA's professional standards and applicable state rules.

**§10 Done-For-You Services (lines 141–165)** — full replacement. Heading changes from "Done-For-You and Assisted Services" → "Done-For-You Services". Seven subsections, with the two umbrella references removed:

**10.1 What Done-For-You is.** When you purchase a Done-For-You ("DFY") project, shepi matches you with a licensed CPA from the shepi Network (the "Matched CPA") who performs the Quality of Earnings analysis for you. shepi provides the software, matching, billing, and operational infrastructure. The Matched CPA performs the professional services in their professional capacity as a licensed CPA. The final Work Product carries the Matched CPA's name, state of licensure, and CPA license number. The Matched CPA is professionally responsible for the Work Product as a licensed CPA; shepi is not a CPA firm and does not provide accountancy services.

**10.2 Pricing and billing.** *(cleaned — umbrella parenthetical removed)* The DFY price is shown at checkout. You pay shepi via the Platform's billing system. shepi retains a Network Fee for the platform, matching, billing, and operational services and remits the balance — the Matched CPA's professional fee — to the Matched CPA. Standard milestones, unless otherwise agreed: 20% on engagement acceptance, 40% on first reviewable draft, 40% on final delivery.

**10.3 What DFY is and isn't.** A DFY project is a consulting engagement under AICPA Statements on Standards for Consulting Services (CS Section 100). It is not an audit, review, compilation, or other attestation engagement. The Matched CPA does not provide legal advice, tax advice, valuation opinions, underwriting opinions, or third-party reliance letters unless expressly agreed in writing. The Work Product is the Matched CPA's professional opinion, not a certification of facts or conclusions.

**10.4 Your responsibilities.** You agree to: provide accurate, complete information for the target company and the proposed transaction; respond to information requests within a reasonable time; review draft deliverables and provide comments within five (5) business days; and make timely payment of milestone fees. The Work Product depends on the materials you provide; neither shepi nor the Matched CPA independently audits or verifies your records, and neither is responsible for fraud, intentional misstatement, or omission by target-company personnel.

**10.5 Timelines.** Any timelines or turnaround estimates published on the site (including the 48–72 hour estimate associated with the DFY tier) are good-faith estimates depending on timely receipt of complete, accurate materials, Platform availability, and Matched CPA availability. shepi does not guarantee a specific delivery date and is not liable for delays caused by incomplete, inconsistent, delayed, or inaccessible materials you provide.

**10.6 Refunds and disputes.** *(cleaned — umbrella parenthetical removed)* If shepi is unable to match you with a Matched CPA within fifteen (15) days, or if the Matched CPA withdraws before completion of the engagement, shepi will re-match you or refund the unused portion of your fee. Complaints about the substance of the Matched CPA's professional work are between you and the Matched CPA, whose own professional-liability coverage covers professional malpractice claims; shepi will help facilitate resolution. shepi's direct refund obligation under these Terms is limited to the Network Fee portion of your payment.

**10.7 Engagement commencement and refundability.** A DFY project is deemed commenced when the Matched CPA claims the project through the Platform and begins professional work. Once commenced, the Matched CPA's portion of the fee is non-refundable except as the Matched CPA agrees in writing. shepi's portion (the Network Fee) is refundable on a pro-rata basis if shepi terminates the DFY service or fails to deliver. Additional revisions, updated datasets, expanded procedures, or changed assumptions beyond the initial deliverable may require additional fees as the Matched CPA reasonably determines.

### 2. `src/hooks/useTosAcceptance.ts`

Bump `CURRENT_TOS_VERSION` to `'2026-05-18'` so existing Clients get re-prompted via the existing clickwrap modal on next session. This matches the Effective Date and keeps the acceptance audit trail clean.

### 3. Out of scope

- §§1–6, 8–9, 11–18 untouched.
- No DB migration, no edits to `tos_acceptances` rows.
- No Provider Agreement changes (already done last pass).
- Counsel sign-off items in the drop-in (Network Fee tax characterization, Stripe refund flow) are operational/legal review, not code.

### 4. Verification

```
rg -n -i "umbrella|maintained.*insurance|shepi.*E&O|backed by.*insurance" src/components/terms/TermsContent.tsx
```
Expected: zero matches.

```
rg -n -i "umbrella" src/
```
Expected: only the unchanged guide-page personal-expense "umbrella policies" examples.
