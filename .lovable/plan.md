# CPAs on DIY — Readiness Plan

Goal: A licensed CPA can buy DIY, run a QoE for their own client, and deliver a deliverable branded by their firm — with clean legal posture and clear marketing.

Sequenced lowest-risk → highest-touch. Each step ships independently.

---

## 1. Professional Use addendum in Terms

Add a short section to `src/pages/Terms.tsx` titled **"Professional Use by Licensed Practitioners"** covering:

- When a CPA, accountant, or advisor uses shepi to perform work for a third-party client, the practitioner is the service provider to that client. Shepi has no engagement with, and no privity to, the end client.
- The practitioner is solely responsible for any professional judgment, attestation language, or firm-branded report layered on top of shepi output.
- Shepi remains analytical software. Shepi output is not an audit, review, attestation, or other CPA-firm work product, and the practitioner must not represent it as such.
- The practitioner indemnifies shepi against claims brought by their clients arising from the practitioner's use or re-delivery of shepi output.

Reinforces the existing core "not a CPA firm" rule without claiming insurance.

## 2. Restructure `/for-cpas` into two paths

Today the page only sells the DFY reviewer marketplace. Restructure into a top-level chooser:

- **Path A — Use shepi for your clients (DIY).** $2K/project or Monthly. Run the analysis yourself, deliver under your firm's brand. Links to `/pricing` and signup.
- **Path B — Join the reviewer network (DFY).** Existing content. Links to `/cpa-partners` application.

Keep all existing non-attestation language. Add a "How CPAs use shepi as a tool" mini-section: ingest GL → AI surfaces adjustments → CPA applies judgment → export deliverable with firm branding.

## 3. Firm branding on PDF + XLSX deliverables

Add three optional project-level fields (new columns on `projects`): `firm_name`, `firm_logo_path`, `prepared_by_line`.

- **PDF cover page** (`src/lib/pdf/`): if `firm_name` is set, render "Prepared by {firm_name}" under the target company name and optionally place firm logo top-right. Shepi attribution moves to a small "Powered by shepi" footer.
- **XLSX Executive Summary tab**: same "Prepared by" line in header rows.
- **Demo files regenerated** via existing scripts (`generate-demo-pdf.ts`, `generate-demo-workbook.ts`) — show a sample firm name so CPAs see the branded version in the demo center.

## 4. "Running this for a client" mode in project setup

In `ProjectSetupSection.tsx`, replace the current vague "Key Contacts" switch with a clearer toggle: **"I'm a professional running this engagement for a client."**

When on:
- Auto-expand Key Contacts.
- Show new Firm Branding card (firm name, logo upload, prepared-by line) wired to step 3 fields.
- Show a one-time inline acknowledgement: "I have read the Professional Use section of the Terms and accept it for this engagement." Record acceptance on `projects` (`professional_use_acknowledged_at`).

When off: hide all of the above, keep today's behavior.

## 5. Pricing page firm-volume callout

On `/pricing`, add a small callout under the Monthly card: **"Running 4+ client engagements a year? Monthly works out cheaper than per-project."** Math: $5K/mo × 12 = $60K for 36 projects vs. $2K × 36 = $72K. Link to `/for-cpas` Path A.

No new pricing tier yet — defer multi-seat / white-label / consolidated billing until there's demand signal.

---

## Out of scope (defer)

- True multi-seat firm accounts and consolidated billing.
- Switching between "my client projects" and DFY review queue in one sidebar — current dual-dashboard works.
- White-label removal of all shepi attribution (keep "Powered by shepi" footer; full white-label is a future Firm tier feature).
- Any insurance/E&O claims in marketing or ToS (per core memory).

## Technical notes

- Migration: `ALTER TABLE projects ADD COLUMN firm_name TEXT, firm_logo_path TEXT, prepared_by_line TEXT, professional_use_acknowledged_at TIMESTAMPTZ`. No RLS changes (covered by existing project policies).
- Firm logo storage: reuse existing `documents` bucket with a `firm-logos/{user_id}/` prefix, or add a new public `firm-logos` bucket. Recommend the latter so logos can render in PDFs without signed URLs.
- PDF builder change is the riskiest piece — `buildPDFReport` in `src/lib/pdf/pdfWorker.ts` needs a conditional cover-page variant. Demo PDF must be regenerated to prove the branded path works end-to-end.
- ToS addendum is a content-only edit; no schema or routing change.
