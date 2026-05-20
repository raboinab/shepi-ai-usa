## Goal

Make project `17ba0cb7-abe3-463d-810d-95178429481b` ("Landscaping Biz") visible and claimable by every CPA in the CPA queue.

## How CPA access works (for context)

- CPA queue (`src/pages/cpa/CpaQueue.tsx`) lists every project where `projects.service_tier = 'done_for_you'`.
- Any user with the `cpa` role can claim a listed project; claiming inserts a `cpa_claims` row, which grants full project access via `has_project_access()`.
- There is no per-CPA grant — it's gated entirely by `service_tier`.

## Change

Single data update (no schema change, no code change):

```sql
UPDATE projects
SET service_tier = 'done_for_you'
WHERE id = '17ba0cb7-abe3-463d-810d-95178429481b';
```

## Side-effects to expect

- The project will appear for all CPAs at `/cpa/queue` immediately.
- The project owner's view at `/project/17ba0cb7…` will start rendering the `DocumentIntakePanel` (DFY document checklist) and `DfyStatusBanner`.
- No billing is triggered by this flip — this manually grants DFY benefits without a DFY purchase. Confirm that's intended (e.g., comp, internal test).

## Out of scope

- No changes to RLS, roles, or `cpa_claims`.
- No way to limit visibility to a specific CPA — that would be a new feature.

## Verification

1. Re-run `SELECT id, service_tier FROM projects WHERE id = '17ba0cb7…'` and confirm `done_for_you`.
2. Log in as a CPA (or check as admin) and confirm the project shows up in `/cpa/queue` as unclaimed.
3. Load `/project/17ba0cb7…` as the owner and confirm the Document Intake panel appears.
