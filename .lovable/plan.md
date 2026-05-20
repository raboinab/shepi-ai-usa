# Per-CPA copies of the "Landscaping Biz" sandbox, owned by Annabelle Winterberry

## Goal

Create one independent copy of project `17ba0cb7-abe3-463d-810d-95178429481b` for **each active CPA**, so they can each claim/work/message without colliding. The **client** on every copy is Annabelle Winterberry (`annabellewinterberry@gmail.com` / `894774d8-2d8a-40de-b5ad-a5c8ec6a9d93`) — i.e. the project is **owned** by her account so client↔CPA messaging actually works end-to-end.

## Identities

- **Client (project owner) for every copy:** Annabelle Winterberry — `894774d8-2d8a-40de-b5ad-a5c8ec6a9d93`
- **Active CPAs (one copy each):**
  - Kacy Ora — `411badcb-ea7f-4e0f-95d8-059a3dca0ddb`
  - Mike Feeley — `d57b7352-6189-4f57-982c-6ef70ee17dd0`
  - Chris LeBlanc — `3209cbbf-ca5a-434f-800a-419df42b8828`
  - Alex Raboin — `1cc25ae2-1f2f-43d1-af6a-2b61ef8976a3` (currently owns the source project)

That's 4 final projects, one per CPA, all owned by Annabelle.

## Approach

Do this as a single `supabase--migration` (atomic, reversible via rollback if needed). For each CPA:

1. **Insert a new `projects` row**
   - new `id`, `user_id = Annabelle`, `client_name = 'Annabelle Winterberry'`
   - copy: `name`, `target_company`, `transaction_type`, `industry`, `status`, `fiscal_year_end`, `periods`, `wizard_data`, `current_phase`, `current_section`, `service_tier`
   - Suffix `name` with the CPA's name (e.g. "Landscaping Biz — Kacy Ora") so they're distinguishable in the admin/CPA UI.

2. **Auto-assign the CPA** via `cpa_claims` (`project_id = new`, `cpa_user_id = CPA`, `status = 'accepted'`, `accepted_at = now()`) so the CPA sees it in their queue already claimed by them and Annabelle has a counter-party for messaging.

3. **Deep-clone child data**, remapping `project_id → new`, `user_id → Annabelle`:
   - `documents` (file_path shared — see Storage note)
   - `processed_data`
   - `canonical_transactions` (~25,720 rows × 4 ≈ 103k inserts, single `INSERT … SELECT` each)
   - `analysis_jobs` → then via job_id remap: `adjustment_proposals`, `findings`, `project_narratives`, `detector_runs`, `business_profiles`, `entity_nodes`, `claim_ledger`, `observations`, `tensions`, `hypotheses`
   - `chat_messages` is **not cloned** — each copy starts with an empty thread so you can actually test messaging.

4. **What we don't touch:** the original project `17ba0cb7…` stays as-is (Alex still owns it as his personal sandbox). His per-CPA copy (#4 above) is the new Annabelle-owned one he should use for messaging tests.

## Storage / files note

`documents.file_path` will be copied verbatim — the new rows reference the same physical objects in Supabase Storage. Storage RLS on the `documents` bucket needs to allow Annabelle (and any CPA with project access) to read them. **I'll verify the storage policy as the first step of implementation and flag if a follow-up is needed** (either widen the policy for these paths, or physically copy the files into Annabelle's folder).

## Skipped tables

`cpa_adjustment_reviews`, `project_shares`, `project_payments`, `verification_attempts`, `upload_errors`, `qb_sync_requests`, `reclassification_jobs`, `flagged_transactions`, `adjustment_proofs`, `docuclipper_jobs`, `company_info`, `project_data_chunks`, `workflows`, `cpa_nudges`, `project_document_requirements`, `project_document_reviews` — start clean so per-CPA state isn't polluted.

## Confirm before I implement

- OK to **not** clone chat history (so messaging is a clean test)?
- OK to **leave the original** `17ba0cb7…` untouched (Alex still has his old copy + a fresh Annabelle-owned one)?
- Name suffix "— {CPA name}" OK, or prefer just "Landscaping Biz" on all 4 (and disambiguate only in admin)?
