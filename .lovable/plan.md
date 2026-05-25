# CPAs on DIY — Build Plan (approved)

Same scope as the previously approved plan. Restating so build mode picks it up cleanly.

## 1. Migration: firm branding + storage
- `ALTER TABLE projects` add `firm_name TEXT`, `firm_logo_path TEXT`, `prepared_by_line TEXT`, `professional_use_acknowledged_at TIMESTAMPTZ`.
- Create public `firm-logos` storage bucket.
- RLS: anyone can read; users can insert/update/delete only under `firm-logos/{auth.uid}/...`.

## 2. ToS Professional Use addendum
- Append a Shepi-authored "Professional Use by Licensed Practitioners" section above the Termageddon embed on `/terms` (Termageddon copy can't be edited from the codebase, so addendum sits in our wrapper).
- Stable anchor `#professional-use` for linking from the project-setup acknowledgement.
- Covers: practitioner is service provider; shepi has no privity with end client; shepi output is not attestation; practitioner indemnifies shepi for client claims.
- No insurance language (per core memory).

## 3. `/for-cpas` two-path restructure
- Top chooser with two cards:
  - **Path A — Use shepi for your clients (DIY)** → `/pricing` and signup
  - **Path B — Join the reviewer network (DFY)** → existing `/cpa-partners` application
- Keep all existing non-attestation copy.
- Add a "How CPAs use shepi as a tool" mini-section for Path A.

## 4. Firm branding on PDF + XLSX
- `src/lib/pdf/` cover page: if `firm_name` set, render "Prepared by {firm_name}" + optional logo (top-right); move shepi to "Powered by shepi" footer.
- `src/lib/workbook-grid-builders/` exec-summary header: add "Prepared by" row when set.
- Regenerate `/public/demo/` PDF + XLSX with a sample firm name via existing scripts.

## 5. Project Setup professional mode
- In `ProjectSetupSection.tsx`, replace the vague "Key Contacts" switch with **"I'm a professional running this engagement for a client."**
- When on: auto-expand Key Contacts + show new Firm Branding card (firm name, logo upload to `firm-logos/{uid}/`, prepared-by line) + one-time acknowledgement of the Professional Use ToS section, written to `projects.professional_use_acknowledged_at`.
- Default off → today's behavior unchanged for non-professional users.

## 6. Pricing firm-volume callout
- On `/pricing`, small callout under Monthly card: "Running 4+ client engagements a year? Monthly works out cheaper than per-project." Link to `/for-cpas`.

## Constraints honored
- DIY remains open to everyone. No role gating on purchase.
- All firm branding fields and the toggle are optional.
- No insurance/E&O claims anywhere.
- Non-attestation language preserved everywhere.

## Out of scope (defer)
- Multi-seat firm accounts, consolidated billing.
- Unified dashboard for "my client projects" + DFY review queue.
- Full white-label (we keep "Powered by shepi" footer).
- New pricing tier for firms.
