## Problem

On `/project/fa0768ca-96f9-4ded-b498-f64ca5be3ede`, the DFY banner shows **"Awaiting CPA"** even though the database has an `accepted` `cpa_claims` row assigned to Chris LeBlanc (claimed 2026-05-20). The client sees the wrong status and no reviewer card.

## Root cause

`cpa_claims` SELECT policy only allows `cpa` or `admin` roles:

```sql
USING (has_role(auth.uid(),'cpa') OR has_role(auth.uid(),'admin'))
```

The project owner (Alex) is neither, so `DfyStatusBanner`'s `select … from cpa_claims where project_id = …` returns `null` and the component falls back to `status = 'unclaimed'`. The reviewer-profile read also fails downstream because the `cpa_profiles` policy uses an `EXISTS` against `cpa_claims` that gets filtered by the same RLS.

## Fix

Add one SELECT policy on `cpa_claims` so project members (owner + shared editors/viewers) can read claims tied to their project:

```sql
CREATE POLICY "Project members can view cpa_claims"
ON public.cpa_claims
FOR SELECT
TO authenticated
USING (has_project_access(auth.uid(), project_id));
```

No code changes needed — `DfyStatusBanner` already renders the correct UI ("CPA Confirmed", reviewer card, Message Reviewer button) as soon as the claim row is readable.

## Verification

After the migration, reload the project page. Expected:
- Header changes from "Awaiting CPA" → **"CPA Confirmed"**
- Reviewer card appears with Chris LeBlanc's name/state
- "Message Reviewer" button enabled

## Security notes

- Read-only; doesn't expose claims to anyone outside the project.
- Doesn't grant INSERT/UPDATE — only CPAs and admins can still create/modify claims.
- `has_project_access` is the same security-definer helper used by `documents`, `analysis_jobs`, etc.
